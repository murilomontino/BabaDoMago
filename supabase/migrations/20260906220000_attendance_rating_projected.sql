-- Congela a projeção Gap-neutro na presença (imutável depois do 1º fill).
-- Espelha performanceMapProjectRating / eventRatingRate (last5, min 3 jogos).

alter table public.championship_event_attendance
	add column if not exists rating_projected numeric null;

comment on column public.championship_event_attendance.rating_projected is
	'Projeção (1 passo Gap neutro) congelada ao gravar a presença; não recalcula.';

create or replace function public.championship_event_rating_rate(
	wins integer,
	draws integer,
	losses integer,
	matches integer
)
returns numeric
language sql
immutable
set search_path = public
as $$
	select case
		when matches is null or matches <= 0 then 0::numeric
		else (
			(3 * coalesce(wins, 0)
				+ coalesce(draws, 0) * case
					when coalesce(draws, 0) > coalesce(losses, 0) then 1.5
					else 1
				end)::numeric
		) / (3 * matches)::numeric
	end;
$$;

revoke all on function public.championship_event_rating_rate(
	integer,
	integer,
	integer,
	integer
) from public;

create or replace function public.championship_rating_projected_next(
	rating numeric,
	rate numeric,
	matches integer,
	ceiling numeric
)
returns numeric
language plpgsql
immutable
set search_path = public
as $$
declare
	safe_ceiling numeric;
	gap numeric;
	target numeric;
	distance numeric;
	step numeric := 0.3;
	aligned numeric := 0.08;
	floor_rating numeric := 0.1;
	max_rating numeric := 100;
	direction numeric;
	next_step numeric;
	projected numeric;
begin
	if matches is null or matches < 3 then
		return null;
	end if;

	safe_ceiling := greatest(coalesce(ceiling, 5), floor_rating);
	gap := coalesce(rate, 0) - coalesce(rating, 0) / safe_ceiling;
	target := round((coalesce(rate, 0) * safe_ceiling)::numeric, 1);
	target := least(max_rating, greatest(floor_rating, target));

	if abs(gap) <= aligned then
		return round(coalesce(rating, 0)::numeric, 1);
	end if;

	distance := target - coalesce(rating, 0);
	if distance = 0 then
		return round(coalesce(rating, 0)::numeric, 1);
	end if;

	direction := sign(distance);
	next_step := least(step, abs(distance));
	projected := coalesce(rating, 0) + direction * next_step;
	projected := round(projected::numeric, 1);
	return least(max_rating, greatest(floor_rating, projected));
end;
$$;

revoke all on function public.championship_rating_projected_next(
	numeric,
	numeric,
	integer,
	numeric
) from public;

create or replace function public.championship_attendance_rating_projected_fill(
	p_event_id bigint,
	p_player_id bigint,
	p_rating numeric
)
returns numeric
language plpgsql
stable
set search_path = public
as $$
declare
	event_row public.championship_events%rowtype;
	form_wins integer := 0;
	form_draws integer := 0;
	form_losses integer := 0;
	form_matches integer := 0;
	rate numeric;
	ceiling numeric;
begin
	select e.*
	into event_row
	from public.championship_events e
	where e.id = p_event_id
		and e.deleted_at is null;

	if event_row.id is null then
		return null;
	end if;

	select
		coalesce(sum(prior.wins), 0)::integer,
		coalesce(sum(prior.draws), 0)::integer,
		coalesce(sum(prior.losses), 0)::integer,
		coalesce(sum(prior.matches), 0)::integer
	into form_wins, form_draws, form_losses, form_matches
	from (
		select
			a.wins,
			a.draws,
			a.losses,
			a.matches
		from public.championship_event_attendance a
		join public.championship_events e
			on e.id = a.event_id
		where a.player_id = p_player_id
			and e.championship_id = event_row.championship_id
			and e.deleted_at is null
			and e.ended_at is not null
			and a.matches > 0
			and (
				e.starts_at < event_row.starts_at
				or (e.starts_at = event_row.starts_at and e.id < event_row.id)
			)
		order by e.starts_at desc, e.id desc
		limit 5
	) prior;

	if form_matches < 3 then
		return null;
	end if;

	rate := public.championship_event_rating_rate(
		form_wins,
		form_draws,
		form_losses,
		form_matches
	);

	select least(
		100,
		greatest(
			coalesce((
				select max(a.rating)
				from public.championship_event_attendance a
				where a.event_id = p_event_id
			), 0),
			coalesce(p_rating, 0),
			5
		)
	)
	into ceiling;

	return public.championship_rating_projected_next(
		p_rating,
		rate,
		form_matches,
		ceiling
	);
end;
$$;

revoke all on function public.championship_attendance_rating_projected_fill(
	bigint,
	bigint,
	numeric
) from public;

create or replace function public.championship_event_attendance_rating_projected_trg()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	if new.rating_projected is not null then
		return new;
	end if;

	new.rating_projected := public.championship_attendance_rating_projected_fill(
		new.event_id,
		new.player_id,
		new.rating
	);

	return new;
end;
$$;

drop trigger if exists championship_event_attendance_rating_projected_biu
	on public.championship_event_attendance;

create trigger championship_event_attendance_rating_projected_biu
before insert or update of rating
on public.championship_event_attendance
for each row
execute function public.championship_event_attendance_rating_projected_trg();

-- Backfill rodadas já encerradas (só onde ainda null).
update public.championship_event_attendance a
set rating_projected = public.championship_attendance_rating_projected_fill(
	a.event_id,
	a.player_id,
	a.rating
)
where a.rating_projected is null
	and exists (
		select 1
		from public.championship_events e
		where e.id = a.event_id
			and e.deleted_at is null
			and e.ended_at is not null
	);
