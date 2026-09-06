-- Nota oculta 1–100: um rescale inicial da nota pública (teto = maior nota
-- do campeonato). Daí em diante só delta por rodada, clamp 1–100.

alter table public.championship_players
	add column if not exists hidden_strength numeric(4,1) not null default 0,
	add column if not exists hidden_goalkeeper_strength numeric(4,1) not null default 0;

do $$
begin
	if not exists (
		select 1
		from pg_constraint
		where conname = 'championship_players_hidden_strength_check'
			and conrelid = 'public.championship_players'::regclass
	) then
		alter table public.championship_players
			add constraint championship_players_hidden_strength_check
			check (hidden_strength >= 0 and hidden_strength <= 100);
	end if;

	if not exists (
		select 1
		from pg_constraint
		where conname = 'championship_players_hidden_goalkeeper_strength_check'
			and conrelid = 'public.championship_players'::regclass
	) then
		alter table public.championship_players
			add constraint championship_players_hidden_goalkeeper_strength_check
			check (
				hidden_goalkeeper_strength >= 0
				and hidden_goalkeeper_strength <= 100
			);
	end if;
end $$;

alter table public.championship_event_attendance
	add column if not exists hidden_strength numeric(4,1) not null default 0,
	add column if not exists hidden_strength_delta numeric not null default 0,
	add column if not exists hidden_goalkeeper_strength numeric(4,1) not null default 0,
	add column if not exists hidden_goalkeeper_strength_delta numeric not null default 0;

do $$
begin
	if not exists (
		select 1
		from pg_constraint
		where conname = 'championship_event_attendance_hidden_strength_check'
			and conrelid = 'public.championship_event_attendance'::regclass
	) then
		alter table public.championship_event_attendance
			add constraint championship_event_attendance_hidden_strength_check
			check (hidden_strength >= 0 and hidden_strength <= 100);
	end if;

	if not exists (
		select 1
		from pg_constraint
		where conname = 'championship_event_attendance_hidden_gk_strength_check'
			and conrelid = 'public.championship_event_attendance'::regclass
	) then
		alter table public.championship_event_attendance
			add constraint championship_event_attendance_hidden_gk_strength_check
			check (
				hidden_goalkeeper_strength >= 0
				and hidden_goalkeeper_strength <= 100
			);
	end if;
end $$;

create or replace function public.championship_hidden_strength_seed(
	snapshot numeric,
	ceiling numeric
)
returns numeric
language sql
immutable
set search_path = public
as $$
	select case
		when snapshot = 0 then 0
		when ceiling is null or ceiling <= 0 then 0
		else least(
			100,
			greatest(
				1,
				round((snapshot / ceiling) * 100, 1)
			)
		)
	end;
$$;

create or replace function public.championship_hidden_strength_delta(
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
	with pts as (
		select
			(3 * wins
				+ draws * case
					when draws > losses then 1.5
					else 1
				end)::numeric as points,
			(3 * matches)::numeric as max_points
	),
	rated as (
		select
			case
				when matches <= 0 then 0::numeric
				else pts.points / pts.max_points
			end as rate
		from pts
	)
	select case
		when matches < 3 then 0
		when round(rated.rate * 1000) between 495 and 505 then 0
		else round((rated.rate - 0.5) * 50, 1)
	end
	from rated;
$$;

create or replace function public.championship_hidden_strength_apply(
	hidden numeric,
	delta numeric
)
returns numeric
language sql
immutable
set search_path = public
as $$
	select case
		when hidden = 0 and round((hidden + delta)::numeric, 1) <= 0 then 0
		else least(100, greatest(1, round((hidden + delta)::numeric, 1)))
	end;
$$;

create or replace function public.championship_event_attendance_set_rating()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
	select
		p.rating,
		p.goalkeeper_rating,
		p.hidden_strength,
		p.hidden_goalkeeper_strength
	into
		new.rating,
		new.goalkeeper_rating,
		new.hidden_strength,
		new.hidden_goalkeeper_strength
	from public.championship_players p
	where p.id = new.player_id;

	if new.rating is null then
		new.rating := 0;
	end if;

	if new.goalkeeper_rating is null then
		new.goalkeeper_rating := 0;
	end if;

	if new.hidden_strength is null then
		new.hidden_strength := 0;
	end if;

	if new.hidden_goalkeeper_strength is null then
		new.hidden_goalkeeper_strength := 0;
	end if;

	return new;
end;
$$;

create or replace function public.rebuild_championship_hidden_strength(
	p_championship_id bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	ceiling numeric;
begin
	select greatest(
		coalesce(max(p.rating) filter (where p.rating <> 0), 0),
		coalesce(max(p.goalkeeper_rating) filter (where p.goalkeeper_rating <> 0), 0)
	)
	into ceiling
	from public.championship_players p
	where p.championship_id = p_championship_id
		and p.deleted_at is null;

	if ceiling is null then
		ceiling := 0;
	end if;

	update public.championship_players p
	set hidden_strength = public.championship_hidden_strength_seed(
			p.rating,
			ceiling
		),
		hidden_goalkeeper_strength = public.championship_hidden_strength_seed(
			p.goalkeeper_rating,
			ceiling
		)
	where p.championship_id = p_championship_id;
end;
$$;

create or replace function public.adjust_championship_player_hidden_strength_for_event(
	event_id bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	event public.championship_events%rowtype;
	ceiling numeric;
begin
	select e.*
	into event
	from public.championship_events e
	where e.id = adjust_championship_player_hidden_strength_for_event.event_id
		and e.deleted_at is null;

	if event.id is null then
		return;
	end if;

	select greatest(
		coalesce(max(p.rating) filter (where p.rating <> 0), 0),
		coalesce(max(p.goalkeeper_rating) filter (where p.goalkeeper_rating <> 0), 0)
	)
	into ceiling
	from public.championship_players p
	where p.championship_id = event.championship_id
		and p.deleted_at is null;

	if ceiling is null then
		ceiling := 0;
	end if;

	with prepared as (
		select
			a.id as attendance_id,
			a.player_id,
			a.is_goalkeeper,
			case
				when a.is_goalkeeper then a.hidden_goalkeeper_strength
				else a.hidden_strength
			end as attendance_hidden,
			case
				when a.is_goalkeeper then a.hidden_goalkeeper_strength_delta
				else a.hidden_strength_delta
			end as old_delta,
			case
				when a.is_goalkeeper then p.hidden_goalkeeper_strength
				else p.hidden_strength
			end as player_hidden,
			case
				when a.is_goalkeeper then a.goalkeeper_rating
				else a.rating
			end as snapshot,
			public.championship_hidden_strength_delta(
				a.wins,
				a.draws,
				a.losses,
				a.matches
			) as new_delta
		from public.championship_event_attendance a
		join public.championship_players p
			on p.id = a.player_id
		where a.event_id = event.id
	),
	seeded as (
		select
			prepared.*,
			case
				when prepared.player_hidden <> 0
					and prepared.attendance_hidden <> 0 then prepared.attendance_hidden
				when prepared.player_hidden <> 0 then
					public.championship_hidden_strength_apply(
						prepared.player_hidden,
						-prepared.old_delta
					)
				when prepared.snapshot = 0 then 0
				else public.championship_hidden_strength_seed(
					prepared.snapshot,
					ceiling
				)
			end as before_hidden
		from prepared
	),
	updated_line as (
		update public.championship_players p
		set hidden_strength = public.championship_hidden_strength_apply(
			s.before_hidden,
			s.new_delta
		)
		from seeded s
		where p.id = s.player_id
			and s.is_goalkeeper = false
			and s.before_hidden <> 0
			and (
				p.hidden_strength is distinct from
					public.championship_hidden_strength_apply(s.before_hidden, s.new_delta)
			)
		returning p.id
	),
	updated_gk as (
		update public.championship_players p
		set hidden_goalkeeper_strength = public.championship_hidden_strength_apply(
			s.before_hidden,
			s.new_delta
		)
		from seeded s
		where p.id = s.player_id
			and s.is_goalkeeper = true
			and s.before_hidden <> 0
			and (
				p.hidden_goalkeeper_strength is distinct from
					public.championship_hidden_strength_apply(s.before_hidden, s.new_delta)
			)
		returning p.id
	),
	updated_att_line as (
		update public.championship_event_attendance a
		set hidden_strength = s.before_hidden,
			hidden_strength_delta = s.new_delta
		from seeded s
		where a.id = s.attendance_id
			and s.is_goalkeeper = false
			and (
				a.hidden_strength is distinct from s.before_hidden
				or a.hidden_strength_delta is distinct from s.new_delta
			)
		returning a.id
	)
	update public.championship_event_attendance a
	set hidden_goalkeeper_strength = s.before_hidden,
		hidden_goalkeeper_strength_delta = s.new_delta
	from seeded s
	where a.id = s.attendance_id
		and s.is_goalkeeper = true
		and (
			a.hidden_goalkeeper_strength is distinct from s.before_hidden
			or a.hidden_goalkeeper_strength_delta is distinct from s.new_delta
		);
end;
$$;

create or replace function public.adjust_championship_player_ratings_for_event(
	event_id bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	event public.championship_events%rowtype;
	drop_share_enabled boolean := false;
	exclude_top_enabled boolean := false;
	line_ceiling numeric;
	gk_ceiling numeric;
	player_ids bigint[];
	attendance_ids bigint[];
begin
	select e.*
	into event
	from public.championship_events e
	where e.id = adjust_championship_player_ratings_for_event.event_id
		and e.deleted_at is null;

	if event.id is null then
		return;
	end if;

	select
		coalesce(c.rating_drop_goal_share, false),
		coalesce(c.rating_drop_share_exclude_top, false)
	into drop_share_enabled, exclude_top_enabled
	from public.championships c
	where c.id = event.championship_id;

	select least(100, greatest(coalesce(max(a.rating), 0), 5))
	into line_ceiling
	from public.championship_event_attendance a
	where a.event_id = event.id
		and a.is_goalkeeper = false;

	select least(100, greatest(coalesce(max(a.goalkeeper_rating), 0), 5))
	into gk_ceiling
	from public.championship_event_attendance a
	where a.event_id = event.id
		and a.is_goalkeeper = true;

	if line_ceiling is null then
		line_ceiling := 5;
	end if;

	if gk_ceiling is null then
		gk_ceiling := 5;
	end if;

	with team_involvement as (
		select
			tp.team_id,
			coalesce(sum(a.goals + a.assists), 0)::numeric as involvement
		from public.championship_event_team_players tp
		join public.championship_event_attendance a
			on a.event_id = tp.event_id
			and a.player_id = tp.player_id
		where tp.event_id = adjust_championship_player_ratings_for_event.event_id
		group by tp.team_id
	),
	excluded_top_line as (
		select p.id
		from public.championship_players p
		where p.championship_id = event.championship_id
			and p.deleted_at is null
			and p.removed_at is null
			and p.rating > 0
		order by p.rating desc, p.id asc
		limit 10
	),
	excluded_top_gk as (
		select p.id
		from public.championship_players p
		where p.championship_id = event.championship_id
			and p.deleted_at is null
			and p.removed_at is null
			and p.goalkeeper_rating > 0
		order by p.goalkeeper_rating desc, p.id asc
		limit 10
	),
	deltas as (
		select
			a.id as attendance_id,
			a.player_id,
			a.is_goalkeeper,
			case
				when a.is_goalkeeper then a.goalkeeper_rating_delta
				else a.rating_delta
			end as old_delta,
			public.championship_event_rating_apply_drop_share(
				case
					when a.is_goalkeeper then
						case
							when a.goalkeeper_rating = 0
								and p.goalkeeper_rating <> 0
								and a.goalkeeper_rating_delta = 0 then 0
							else public.championship_event_rating_delta(
								a.wins,
								a.draws,
								a.losses,
								a.matches,
								a.goalkeeper_rating,
								gk_ceiling
							)
						end + case
							when a.is_mvp then public.championship_event_mvp_bonus(a.goalkeeper_rating)
							else 0
						end
					else
						case
							when a.rating = 0
								and p.rating <> 0
								and a.rating_delta = 0 then 0
							else public.championship_event_rating_delta(
								a.wins,
								a.draws,
								a.losses,
								a.matches,
								a.rating,
								line_ceiling
							)
						end + case
							when a.is_mvp then public.championship_event_mvp_bonus(a.rating)
							else 0
						end
				end,
				case
					when drop_share_enabled
						and not (
							exclude_top_enabled
							and (
								(
									a.is_goalkeeper = false
									and exists (
										select 1
										from excluded_top_line xt
										where xt.id = a.player_id
									)
								)
								or (
									a.is_goalkeeper = true
									and exists (
										select 1
										from excluded_top_gk xt
										where xt.id = a.player_id
									)
								)
							)
						)
					then public.championship_event_rating_team_goal_share(
						(a.goals + a.assists)::numeric,
						coalesce(ti.involvement, 0)
					)
					else 0
				end
			) as new_delta
		from public.championship_event_attendance a
		join public.championship_players p
			on p.id = a.player_id
		left join public.championship_event_team_players tp
			on tp.event_id = a.event_id
			and tp.player_id = a.player_id
		left join team_involvement ti
			on ti.team_id = tp.team_id
		where a.event_id = adjust_championship_player_ratings_for_event.event_id
	),
	updated_line as (
		update public.championship_players p
		set rating = public.championship_player_rating_apply(
			p.rating,
			-d.old_delta + d.new_delta
		)
		from deltas d
		where p.id = d.player_id
			and d.is_goalkeeper = false
			and d.new_delta <> d.old_delta
		returning p.id
	),
	updated_gk as (
		update public.championship_players p
		set goalkeeper_rating = public.championship_player_rating_apply(
			p.goalkeeper_rating,
			-d.old_delta + d.new_delta
		)
		from deltas d
		where p.id = d.player_id
			and d.is_goalkeeper = true
			and d.new_delta <> d.old_delta
		returning p.id
	),
	updated_attendance_line as (
		update public.championship_event_attendance a
		set rating_delta = d.new_delta
		from deltas d
		where a.id = d.attendance_id
			and d.is_goalkeeper = false
			and a.rating_delta <> d.new_delta
		returning a.id
	)
	update public.championship_event_attendance a
	set goalkeeper_rating_delta = d.new_delta
	from deltas d
	where a.id = d.attendance_id
		and d.is_goalkeeper = true
		and a.goalkeeper_rating_delta <> d.new_delta;

	select coalesce(array_agg(a.id), '{}')
	into attendance_ids
	from public.championship_event_attendance a
	where a.event_id = event.id
		and (
			(
				a.is_goalkeeper = false
				and a.vote_rating_delta <> a.vote_rating_applied
			)
			or (
				a.is_goalkeeper = true
				and a.vote_rating_delta <> a.goalkeeper_vote_rating_applied
			)
		);

	if attendance_ids is not null then
		perform public.sync_championship_event_attendance_vote_rating(aid)
		from unnest(attendance_ids) as aid;
	end if;

	perform public.adjust_championship_player_hidden_strength_for_event(event.id);

	select coalesce(array_agg(a.player_id), '{}')
	into player_ids
	from public.championship_event_attendance a
	where a.event_id = event.id;

	perform public.sync_championship_players_from_attendance(player_ids);
end;
$$;

create or replace function public.championship_player_json(
	player public.championship_players
)
returns jsonb
language sql
immutable
as $$
	select jsonb_build_object(
		'id', player.id,
		'championship_id', player.championship_id,
		'user_id', player.user_id,
		'display_name', player.display_name,
		'nickname', player.nickname,
		'nickname_tags', player.nickname_tags,
		'avatar_url', player.avatar_url,
		'rating', player.rating,
		'goalkeeper_rating', player.goalkeeper_rating,
		'hidden_strength', player.hidden_strength,
		'hidden_goalkeeper_strength', player.hidden_goalkeeper_strength,
		'role', player.role,
		'deleted_at', player.deleted_at,
		'is_goalkeeper', player.is_goalkeeper,
		'is_monthly', player.is_monthly,
		'goals', player.goals,
		'assists', player.assists,
		'assisted_goals', player.assisted_goals,
		'own_goals', player.own_goals,
		'wins', player.wins,
		'losses', player.losses,
		'draws', player.draws,
		'matches', player.matches,
		'mvps', player.mvps
	);
$$;

-- Reconstrói pela nota pública atual. Teto = maior nota do campeonato.
select public.rebuild_championship_hidden_strength(c.id)
from public.championships c
where c.deleted_at is null;

update public.championship_event_attendance a
set hidden_strength = public.championship_hidden_strength_seed(
		a.rating,
		c.ceiling
	),
	hidden_strength_delta = 0,
	hidden_goalkeeper_strength = public.championship_hidden_strength_seed(
		a.goalkeeper_rating,
		c.ceiling
	),
	hidden_goalkeeper_strength_delta = 0
from public.championship_events e
join (
	select
		p.championship_id,
		greatest(
			coalesce(max(p.rating) filter (where p.rating <> 0), 0),
			coalesce(
				max(p.goalkeeper_rating) filter (where p.goalkeeper_rating <> 0),
				0
			)
		) as ceiling
	from public.championship_players p
	where p.deleted_at is null
	group by p.championship_id
) c
	on c.championship_id = e.championship_id
where a.event_id = e.id;

revoke all on function public.championship_hidden_strength_seed(numeric, numeric) from public;
revoke all on function public.championship_hidden_strength_delta(integer, integer, integer, integer) from public;
revoke all on function public.championship_hidden_strength_apply(numeric, numeric) from public;
revoke all on function public.rebuild_championship_hidden_strength(bigint) from public;
revoke all on function public.adjust_championship_player_hidden_strength_for_event(bigint) from public;
revoke all on function public.adjust_championship_player_ratings_for_event(bigint) from public;

notify pgrst, 'reload schema';
