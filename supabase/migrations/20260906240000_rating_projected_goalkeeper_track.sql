-- Projeção usa nota de goleiro quando is_goalkeeper; forma só no mesmo posto.

drop function if exists public.championship_attendance_rating_projected_fill(
	bigint,
	bigint,
	numeric
);

drop function if exists public.championship_player_next_rating_projected_fill(
	bigint,
	bigint,
	numeric
);

create or replace function public.championship_attendance_rating_projected_fill(
	p_event_id bigint,
	p_player_id bigint,
	p_rating numeric,
	p_is_goalkeeper boolean default false
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
			and a.is_goalkeeper = coalesce(p_is_goalkeeper, false)
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

	if coalesce(p_is_goalkeeper, false) then
		select least(
			100,
			greatest(
				coalesce((
					select max(a.goalkeeper_rating)
					from public.championship_event_attendance a
					where a.event_id = p_event_id
						and a.is_goalkeeper = true
				), 0),
				coalesce(p_rating, 0),
				5
			)
		)
		into ceiling;
	else
		select least(
			100,
			greatest(
				coalesce((
					select max(a.rating)
					from public.championship_event_attendance a
					where a.event_id = p_event_id
						and a.is_goalkeeper = false
				), 0),
				coalesce(p_rating, 0),
				5
			)
		)
		into ceiling;
	end if;

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
	numeric,
	boolean
) from public;

create or replace function public.championship_player_next_rating_projected_fill(
	p_championship_id bigint,
	p_player_id bigint,
	p_rating numeric,
	p_is_goalkeeper boolean default false
)
returns numeric
language plpgsql
stable
set search_path = public
as $$
declare
	form_wins integer := 0;
	form_draws integer := 0;
	form_losses integer := 0;
	form_matches integer := 0;
	rate numeric;
	ceiling numeric;
begin
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
			and e.championship_id = p_championship_id
			and e.deleted_at is null
			and e.ended_at is not null
			and a.matches > 0
			and a.is_goalkeeper = coalesce(p_is_goalkeeper, false)
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

	if coalesce(p_is_goalkeeper, false) then
		select least(
			100,
			greatest(coalesce(max(p.goalkeeper_rating), 0), coalesce(p_rating, 0), 5)
		)
		into ceiling
		from public.championship_players p
		where p.championship_id = p_championship_id
			and p.deleted_at is null
			and p.removed_at is null;
	else
		select least(
			100,
			greatest(coalesce(max(p.rating), 0), coalesce(p_rating, 0), 5)
		)
		into ceiling
		from public.championship_players p
		where p.championship_id = p_championship_id
			and p.deleted_at is null
			and p.removed_at is null;
	end if;

	if ceiling is null then
		ceiling := least(100, greatest(coalesce(p_rating, 0), 5));
	end if;

	return public.championship_rating_projected_next(
		p_rating,
		rate,
		form_matches,
		ceiling
	);
end;
$$;

revoke all on function public.championship_player_next_rating_projected_fill(
	bigint,
	bigint,
	numeric,
	boolean
) from public;

create or replace function public.championship_event_attendance_rating_projected_trg()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	pending numeric;
	player_is_gk boolean;
	track_rating numeric;
begin
	if new.rating_projected is not null then
		return new;
	end if;

	select p.rating_projected_next, p.is_goalkeeper
	into pending, player_is_gk
	from public.championship_players p
	where p.id = new.player_id;

	if pending is not null and player_is_gk is not distinct from new.is_goalkeeper then
		new.rating_projected := pending;
		update public.championship_players
		set rating_projected_next = null
		where id = new.player_id
			and rating_projected_next is not null;
		return new;
	end if;

	if new.is_goalkeeper then
		track_rating := new.goalkeeper_rating;
	else
		track_rating := new.rating;
	end if;

	new.rating_projected := public.championship_attendance_rating_projected_fill(
		new.event_id,
		new.player_id,
		track_rating,
		new.is_goalkeeper
	);

	return new;
end;
$$;

drop trigger if exists championship_event_attendance_rating_projected_biu
	on public.championship_event_attendance;

create trigger championship_event_attendance_rating_projected_biu
before insert or update of rating, goalkeeper_rating, is_goalkeeper
on public.championship_event_attendance
for each row
execute function public.championship_event_attendance_rating_projected_trg();

create or replace function public.ensure_championship_player_next_rating_projected(
	p_championship_id bigint,
	p_player_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	viewer uuid := (select auth.uid());
	player public.championship_players%rowtype;
	open_event public.championship_events%rowtype;
	attendance public.championship_event_attendance%rowtype;
	projected numeric;
	track_rating numeric;
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if not public.is_championship_member(p_championship_id) then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	select *
	into player
	from public.championship_players p
	where p.id = p_player_id
		and p.championship_id = p_championship_id
		and p.deleted_at is null
	for update;

	if player.id is null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	select e.*
	into open_event
	from public.championship_events e
	where e.championship_id = p_championship_id
		and e.deleted_at is null
		and e.ended_at is null
	order by e.starts_at desc, e.id desc
	limit 1;

	if open_event.id is not null then
		select a.*
		into attendance
		from public.championship_event_attendance a
		where a.event_id = open_event.id
			and a.player_id = player.id
		for update;

		if attendance.id is not null then
			if attendance.rating_projected is not null then
				return jsonb_build_object(
					'projected', attendance.rating_projected,
					'source', 'attendance',
					'event_id', open_event.id,
					'created', false
				);
			end if;

			if attendance.is_goalkeeper then
				track_rating := attendance.goalkeeper_rating;
			else
				track_rating := attendance.rating;
			end if;

			projected := case
				when player.rating_projected_next is not null
					and player.is_goalkeeper is not distinct from attendance.is_goalkeeper
				then player.rating_projected_next
				else public.championship_attendance_rating_projected_fill(
					open_event.id,
					player.id,
					track_rating,
					attendance.is_goalkeeper
				)
			end;

			if projected is null then
				return jsonb_build_object(
					'projected', null,
					'source', 'attendance',
					'event_id', open_event.id,
					'created', false
				);
			end if;

			update public.championship_event_attendance
			set rating_projected = projected
			where id = attendance.id
				and rating_projected is null;

			if player.rating_projected_next is not null
				and player.is_goalkeeper is not distinct from attendance.is_goalkeeper
			then
				update public.championship_players
				set rating_projected_next = null
				where id = player.id
					and rating_projected_next is not null;
			end if;

			return jsonb_build_object(
				'projected', projected,
				'source', 'attendance',
				'event_id', open_event.id,
				'created', true
			);
		end if;
	end if;

	if player.rating_projected_next is not null then
		return jsonb_build_object(
			'projected', player.rating_projected_next,
			'source', 'player',
			'event_id', open_event.id,
			'created', false
		);
	end if;

	if player.is_goalkeeper then
		track_rating := player.goalkeeper_rating;
	else
		track_rating := player.rating;
	end if;

	projected := public.championship_player_next_rating_projected_fill(
		p_championship_id,
		player.id,
		track_rating,
		player.is_goalkeeper
	);

	if projected is null then
		return jsonb_build_object(
			'projected', null,
			'source', 'player',
			'event_id', open_event.id,
			'created', false
		);
	end if;

	update public.championship_players
	set rating_projected_next = projected
	where id = player.id
		and rating_projected_next is null;

	return jsonb_build_object(
		'projected', projected,
		'source', 'player',
		'event_id', open_event.id,
		'created', true
	);
end;
$$;

revoke all on function public.ensure_championship_player_next_rating_projected(
	bigint,
	bigint
) from public;

grant execute on function public.ensure_championship_player_next_rating_projected(
	bigint,
	bigint
) to authenticated;
