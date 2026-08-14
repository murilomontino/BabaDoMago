alter table public.championship_players
	add column if not exists losses integer not null default 0,
	add column if not exists draws integer not null default 0;

alter table public.championship_event_attendance
	add column if not exists losses integer not null default 0,
	add column if not exists draws integer not null default 0;

alter table public.championship_players
	drop constraint if exists championship_players_stats_check;

alter table public.championship_event_attendance
	drop constraint if exists championship_event_attendance_stats_check;

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
		'avatar_url', player.avatar_url,
		'rating', player.rating,
		'role', player.role,
		'deleted_at', player.deleted_at,
		'goals', player.goals,
		'assists', player.assists,
		'own_goals', player.own_goals,
		'wins', player.wins,
		'losses', player.losses,
		'draws', player.draws,
		'matches', player.matches,
		'mvps', player.mvps
	);
$$;

create or replace function public.refresh_championship_event_attendance_stats(
	event_id bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
	update public.championship_event_attendance a
	set
		event_date = s.event_date,
		matches = s.matches,
		wins = s.wins,
		losses = s.losses,
		draws = s.draws,
		goals = s.goals,
		assists = s.assists,
		own_goals = s.own_goals
	from (
		select
			a2.id,
			(e.starts_at at time zone 'America/Sao_Paulo')::date as event_date,
			coalesce(played.matches, 0) as matches,
			coalesce(played.wins, 0) as wins,
			coalesce(played.losses, 0) as losses,
			coalesce(played.draws, 0) as draws,
			coalesce(scored.goals, 0) as goals,
			coalesce(assisted.assists, 0) as assists,
			coalesce(own_scored.own_goals, 0) as own_goals
		from public.championship_event_attendance a2
		join public.championship_events e
			on e.id = a2.event_id
		left join lateral (
			select
				count(*)::integer as matches,
				count(*) filter (
					where m.winner_team_id is not distinct from mp.team_id
				)::integer as wins,
				count(*) filter (
					where m.winner_team_id is not null
						and m.winner_team_id is distinct from mp.team_id
				)::integer as losses,
				count(*) filter (
					where m.winner_team_id is null
				)::integer as draws
			from public.championship_event_match_players mp
			join public.championship_event_matches m
				on m.id = mp.match_id
			left join public.championship_event_team_players tp
				on tp.event_id = mp.event_id
				and tp.player_id = mp.player_id
			where mp.event_id = a2.event_id
				and mp.player_id = a2.player_id
				and mp.include_stats
				and m.ended_at is not null
				and (
					not e.skip_guest_goalkeeper_matches
					or not mp.is_goalkeeper
					or tp.team_id is not distinct from mp.team_id
					or m.winner_team_id is not distinct from mp.team_id
				)
		) played on true
		left join lateral (
			select count(*)::integer as goals
			from public.championship_event_goals g
			join public.championship_event_match_players mp
				on mp.match_id = g.match_id
				and mp.player_id = g.scorer_player_id
			where g.event_id = a2.event_id
				and g.scorer_player_id = a2.player_id
				and not g.is_own_goal
				and mp.include_stats
		) scored on true
		left join lateral (
			select count(*)::integer as assists
			from public.championship_event_goals g
			join public.championship_event_match_players mp
				on mp.match_id = g.match_id
				and mp.player_id = g.assist_player_id
			where g.event_id = a2.event_id
				and g.assist_player_id = a2.player_id
				and mp.include_stats
		) assisted on true
		left join lateral (
			select count(*)::integer as own_goals
			from public.championship_event_goals g
			join public.championship_event_match_players mp
				on mp.match_id = g.match_id
				and mp.player_id = g.scorer_player_id
			where g.event_id = a2.event_id
				and g.scorer_player_id = a2.player_id
				and g.is_own_goal
				and mp.include_stats
		) own_scored on true
		where a2.event_id = refresh_championship_event_attendance_stats.event_id
	) s
	where a.id = s.id;
end;
$$;

create or replace function public.sync_championship_players_from_attendance(
	player_ids bigint[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
	if player_ids is null or cardinality(player_ids) is null then
		return;
	end if;

	update public.championship_players p
	set
		goals = coalesce(totals.goals, 0),
		assists = coalesce(totals.assists, 0),
		own_goals = coalesce(totals.own_goals, 0),
		wins = coalesce(totals.wins, 0),
		losses = coalesce(totals.losses, 0),
		draws = coalesce(totals.draws, 0),
		matches = coalesce(totals.matches, 0),
		mvps = coalesce(totals.mvps, 0)
	from unnest(player_ids) as u(player_id)
	left join (
		select
			a.player_id,
			sum(
				case
					when open_match.event_id is null then a.goals
					else coalesce(ended_goals.n, 0)
				end
			)::integer as goals,
			sum(
				case
					when open_match.event_id is null then a.assists
					else coalesce(ended_assists.n, 0)
				end
			)::integer as assists,
			sum(
				case
					when open_match.event_id is null then a.own_goals
					else coalesce(ended_own_goals.n, 0)
				end
			)::integer as own_goals,
			sum(a.wins)::integer as wins,
			sum(a.losses)::integer as losses,
			sum(a.draws)::integer as draws,
			sum(a.matches)::integer as matches,
			sum(case when a.is_mvp then 1 else 0 end)::integer as mvps
		from public.championship_event_attendance a
		join public.championship_events e
			on e.id = a.event_id
		left join lateral (
			select m.event_id
			from public.championship_event_matches m
			where m.event_id = a.event_id
				and m.ended_at is null
			limit 1
		) open_match on true
		left join lateral (
			select count(*)::integer as n
			from public.championship_event_goals g
			join public.championship_event_matches m
				on m.id = g.match_id
			where g.event_id = a.event_id
				and g.scorer_player_id = a.player_id
				and not g.is_own_goal
				and m.ended_at is not null
		) ended_goals on true
		left join lateral (
			select count(*)::integer as n
			from public.championship_event_goals g
			join public.championship_event_matches m
				on m.id = g.match_id
			where g.event_id = a.event_id
				and g.assist_player_id = a.player_id
				and m.ended_at is not null
		) ended_assists on true
		left join lateral (
			select count(*)::integer as n
			from public.championship_event_goals g
			join public.championship_event_matches m
				on m.id = g.match_id
			where g.event_id = a.event_id
				and g.scorer_player_id = a.player_id
				and g.is_own_goal
				and m.ended_at is not null
		) ended_own_goals on true
		where a.player_id = any (player_ids)
			and e.deleted_at is null
		group by a.player_id
	) totals on totals.player_id = u.player_id
	where p.id = u.player_id;
end;
$$;

drop function if exists public.save_championship_player_event_stats(
	bigint,
	bigint,
	integer,
	integer,
	integer,
	integer
);

create function public.save_championship_player_event_stats(
	player_id bigint,
	event_id bigint,
	goals integer,
	assists integer,
	wins integer,
	losses integer,
	draws integer,
	matches integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
	event public.championship_events%rowtype;
	player public.championship_players%rowtype;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if goals < 0
		or assists < 0
		or wins < 0
		or losses < 0
		or draws < 0
		or matches < 0
	then
		raise exception 'invalid attendance stats' using errcode = '23514';
	end if;

	if wins + losses + draws is distinct from matches then
		raise exception 'result stats mismatch' using errcode = '23514';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = save_championship_player_event_stats.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if event.ended_at is null then
		raise exception 'event still open' using errcode = '23514';
	end if;

	if public.championship_actor_role(event.championship_id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	select *
	into player
	from public.championship_players p
	where p.id = save_championship_player_event_stats.player_id
		and p.championship_id = event.championship_id
		and p.deleted_at is null
	for update;

	if player.id is null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	insert into public.championship_event_attendance (
		event_id,
		player_id,
		display_name,
		goals,
		assists,
		wins,
		losses,
		draws,
		matches
	)
	values (
		event.id,
		player.id,
		coalesce(nullif(btrim(player.nickname), ''), player.display_name),
		save_championship_player_event_stats.goals,
		save_championship_player_event_stats.assists,
		save_championship_player_event_stats.wins,
		save_championship_player_event_stats.losses,
		save_championship_player_event_stats.draws,
		save_championship_player_event_stats.matches
	)
	on conflict (event_id, player_id) do update
	set
		goals = excluded.goals,
		assists = excluded.assists,
		wins = excluded.wins,
		losses = excluded.losses,
		draws = excluded.draws,
		matches = excluded.matches;

	perform public.assign_championship_event_mvps(event.id);
	perform public.adjust_championship_player_ratings_for_event(event.id);

	return jsonb_build_object(
		'id', event.id,
		'championship_id', event.championship_id,
		'starts_at', event.starts_at,
		'players_per_team', event.players_per_team,
		'ended_at', event.ended_at
	);
end;
$$;

create or replace function public.save_championship_event_attendance_stats(
	event_id bigint,
	stats jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	event public.championship_events%rowtype;
	player_ids bigint[];
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if jsonb_typeof(stats) is distinct from 'array' then
		raise exception 'invalid attendance stats' using errcode = '23514';
	end if;

	if exists (
		select 1
		from jsonb_array_elements(stats) elem
		where jsonb_typeof(elem) is distinct from 'object'
			or jsonb_typeof(elem -> 'player_id') is distinct from 'number'
			or jsonb_typeof(elem -> 'goals') is distinct from 'number'
			or jsonb_typeof(elem -> 'assists') is distinct from 'number'
			or jsonb_typeof(elem -> 'own_goals') is distinct from 'number'
			or jsonb_typeof(elem -> 'wins') is distinct from 'number'
			or jsonb_typeof(elem -> 'losses') is distinct from 'number'
			or jsonb_typeof(elem -> 'draws') is distinct from 'number'
			or jsonb_typeof(elem -> 'matches') is distinct from 'number'
	) then
		raise exception 'invalid attendance stats' using errcode = '23514';
	end if;

	if exists (
		select 1
		from jsonb_array_elements(stats) elem
		where (elem ->> 'player_id')::numeric <> trunc((elem ->> 'player_id')::numeric)
			or (elem ->> 'goals')::numeric <> trunc((elem ->> 'goals')::numeric)
			or (elem ->> 'assists')::numeric <> trunc((elem ->> 'assists')::numeric)
			or (elem ->> 'own_goals')::numeric <> trunc((elem ->> 'own_goals')::numeric)
			or (elem ->> 'wins')::numeric <> trunc((elem ->> 'wins')::numeric)
			or (elem ->> 'losses')::numeric <> trunc((elem ->> 'losses')::numeric)
			or (elem ->> 'draws')::numeric <> trunc((elem ->> 'draws')::numeric)
			or (elem ->> 'matches')::numeric <> trunc((elem ->> 'matches')::numeric)
			or (elem ->> 'player_id')::bigint <= 0
			or (elem ->> 'goals')::integer < 0
			or (elem ->> 'assists')::integer < 0
			or (elem ->> 'own_goals')::integer < 0
			or (elem ->> 'wins')::integer < 0
			or (elem ->> 'losses')::integer < 0
			or (elem ->> 'draws')::integer < 0
			or (elem ->> 'matches')::integer < 0
	) then
		raise exception 'invalid attendance stats' using errcode = '23514';
	end if;

	if exists (
		select 1
		from jsonb_array_elements(stats) elem
		where (elem ->> 'wins')::integer
			+ (elem ->> 'losses')::integer
			+ (elem ->> 'draws')::integer
			is distinct from (elem ->> 'matches')::integer
	) then
		raise exception 'result stats mismatch' using errcode = '23514';
	end if;

	select coalesce(array_agg((elem ->> 'player_id')::bigint), '{}')
	into player_ids
	from jsonb_array_elements(stats) elem;

	if (
		select count(*) <> count(distinct (elem ->> 'player_id')::bigint)
		from jsonb_array_elements(stats) elem
	) then
		raise exception 'duplicate attendance' using errcode = '23505';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = save_championship_event_attendance_stats.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(event.championship_id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if not exists (
		select 1
		from public.championship_event_attendance a
		where a.event_id = event.id
	) then
		raise exception 'invalid attendance' using errcode = '23514';
	end if;

	if exists (
		select 1
		from public.championship_event_attendance a
		where a.event_id = event.id
			and a.player_id <> all (player_ids)
	) then
		raise exception 'invalid attendance stats' using errcode = '23514';
	end if;

	if exists (
		select 1
		from unnest(player_ids) as u(player_id)
		where not exists (
			select 1
			from public.championship_event_attendance a
			where a.event_id = event.id
				and a.player_id = u.player_id
		)
	) then
		raise exception 'player not present' using errcode = '23514';
	end if;

	update public.championship_event_attendance a
	set
		goals = s.goals,
		assists = s.assists,
		own_goals = s.own_goals,
		wins = s.wins,
		losses = s.losses,
		draws = s.draws,
		matches = s.matches
	from (
		select
			(elem ->> 'player_id')::bigint as player_id,
			(elem ->> 'goals')::integer as goals,
			(elem ->> 'assists')::integer as assists,
			(elem ->> 'own_goals')::integer as own_goals,
			(elem ->> 'wins')::integer as wins,
			(elem ->> 'losses')::integer as losses,
			(elem ->> 'draws')::integer as draws,
			(elem ->> 'matches')::integer as matches
		from jsonb_array_elements(stats) elem
	) s
	where a.event_id = event.id
		and a.player_id = s.player_id;

	perform public.assign_championship_event_mvps(event.id);
	perform public.adjust_championship_player_ratings_for_event(event.id);

	return jsonb_build_object(
		'id', event.id,
		'championship_id', event.championship_id,
		'starts_at', event.starts_at,
		'players_per_team', event.players_per_team,
		'ended_at', event.ended_at
	);
end;
$$;

do $$
declare
	target_event_id bigint;
	player_ids bigint[];
begin
	for target_event_id in
		select e.id
		from public.championship_events e
	loop
		perform public.refresh_championship_event_attendance_stats(target_event_id);
	end loop;

	select coalesce(array_agg(p.id), '{}')
	into player_ids
	from public.championship_players p;

	perform public.sync_championship_players_from_attendance(player_ids);
end $$;

do $$
begin
	if not exists (
		select 1
		from pg_constraint
		where conname = 'championship_players_stats_check'
			and conrelid = 'public.championship_players'::regclass
	) then
		alter table public.championship_players
			add constraint championship_players_stats_check
			check (
				goals >= 0
				and assists >= 0
				and own_goals >= 0
				and wins >= 0
				and losses >= 0
				and draws >= 0
				and matches >= 0
				and mvps >= 0
				and wins + losses + draws = matches
			);
	end if;
end $$;

do $$
begin
	if not exists (
		select 1
		from pg_constraint
		where conname = 'championship_event_attendance_stats_check'
			and conrelid = 'public.championship_event_attendance'::regclass
	) then
		alter table public.championship_event_attendance
			add constraint championship_event_attendance_stats_check
			check (
				goals >= 0
				and assists >= 0
				and own_goals >= 0
				and wins >= 0
				and losses >= 0
				and draws >= 0
				and matches >= 0
				and wins + losses + draws = matches
			);
	end if;
end $$;

revoke all on function public.refresh_championship_event_attendance_stats(bigint) from public;
revoke all on function public.sync_championship_players_from_attendance(bigint[]) from public;
revoke all on function public.save_championship_player_event_stats(
	bigint,
	bigint,
	integer,
	integer,
	integer,
	integer,
	integer,
	integer
) from public;
revoke all on function public.save_championship_event_attendance_stats(bigint, jsonb) from public;
revoke all on function public.championship_player_json(public.championship_players) from public;

grant execute on function public.save_championship_player_event_stats(
	bigint,
	bigint,
	integer,
	integer,
	integer,
	integer,
	integer,
	integer
) to authenticated;
grant execute on function public.save_championship_event_attendance_stats(bigint, jsonb) to authenticated;
grant execute on function public.championship_player_json(public.championship_players) to authenticated;

notify pgrst, 'reload schema';
