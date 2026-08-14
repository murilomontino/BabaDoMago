alter table public.championships
	add column if not exists skip_guest_goalkeeper_matches boolean not null default true;

alter table public.championship_events
	add column if not exists skip_guest_goalkeeper_matches boolean not null default true;

create or replace function public.create_championship_event(
	championship_id bigint,
	event_date date,
	event_time time default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	viewer uuid := (select auth.uid());
	championship public.championships%rowtype;
	new_event public.championship_events%rowtype;
	resolved_time time;
	starts_at timestamptz;
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if event_date is null then
		raise exception 'invalid event date' using errcode = '23514';
	end if;

	select *
	into championship
	from public.championships c
	where c.id = create_championship_event.championship_id
		and c.deleted_at is null
	for update;

	if championship.id is null then
		raise exception 'championship not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(championship.id) not in ('owner', 'captain', 'admin') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if exists (
		select 1
		from public.championship_events e
		where e.championship_id = championship.id
			and e.deleted_at is null
			and (e.starts_at at time zone 'America/Sao_Paulo')::date = event_date
	) then
		raise exception 'event already exists' using errcode = '23505';
	end if;

	resolved_time := coalesce(
		create_championship_event.event_time,
		championship.event_time
	);

	if resolved_time is null then
		raise exception 'invalid event time' using errcode = '23514';
	end if;

	starts_at :=
		(event_date::timestamp + resolved_time)
		at time zone 'America/Sao_Paulo';

	insert into public.championship_events (
		championship_id,
		starts_at,
		players_per_team,
		skip_guest_goalkeeper_matches,
		created_by
	)
	values (
		championship.id,
		starts_at,
		championship.players_per_team,
		championship.skip_guest_goalkeeper_matches,
		viewer
	)
	returning * into new_event;

	return jsonb_build_object(
		'id', new_event.id,
		'championship_id', new_event.championship_id,
		'starts_at', new_event.starts_at,
		'players_per_team', new_event.players_per_team,
		'ended_at', new_event.ended_at
	);
end;
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
		goals = s.goals,
		assists = s.assists,
		own_goals = s.own_goals
	from (
		select
			a2.id,
			(e.starts_at at time zone 'America/Sao_Paulo')::date as event_date,
			coalesce(played.matches, 0) as matches,
			coalesce(played.wins, 0) as wins,
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
				)::integer as wins
			from public.championship_event_match_players mp
			join public.championship_event_matches m
				on m.id = mp.match_id
			left join public.championship_event_team_players tp
				on tp.event_id = mp.event_id
				and tp.player_id = mp.player_id
			where mp.event_id = a2.event_id
				and mp.player_id = a2.player_id
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
			where g.event_id = a2.event_id
				and g.scorer_player_id = a2.player_id
				and not g.is_own_goal
		) scored on true
		left join lateral (
			select count(*)::integer as assists
			from public.championship_event_goals g
			where g.event_id = a2.event_id
				and g.assist_player_id = a2.player_id
		) assisted on true
		left join lateral (
			select count(*)::integer as own_goals
			from public.championship_event_goals g
			where g.event_id = a2.event_id
				and g.scorer_player_id = a2.player_id
				and g.is_own_goal
		) own_scored on true
		where a2.event_id = refresh_championship_event_attendance_stats.event_id
	) s
	where a.id = s.id;
end;
$$;

drop function if exists public.update_championship_event_config(bigint, time, smallint);

create or replace function public.update_championship_event_config(
	championship_id bigint,
	event_time time,
	players_per_team smallint,
	skip_guest_goalkeeper_matches boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	championship public.championships%rowtype;
	open_event_ids bigint[];
	player_ids bigint[];
	open_event_id bigint;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if update_championship_event_config.players_per_team < 3
		or update_championship_event_config.players_per_team > 11 then
		raise exception 'invalid players per team' using errcode = '23514';
	end if;

	select *
	into championship
	from public.championships c
	where c.id = update_championship_event_config.championship_id
		and c.deleted_at is null
	for update;

	if championship.id is null then
		raise exception 'championship not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(championship.id) not in ('owner', 'captain') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	update public.championships
	set
		event_time = update_championship_event_config.event_time,
		players_per_team = update_championship_event_config.players_per_team,
		skip_guest_goalkeeper_matches = coalesce(
			update_championship_event_config.skip_guest_goalkeeper_matches,
			true
		)
	where id = championship.id
	returning * into championship;

	select coalesce(array_agg(e.id), '{}')
	into open_event_ids
	from public.championship_events e
	where e.championship_id = championship.id
		and e.ended_at is null
		and e.deleted_at is null;

	update public.championship_events
	set skip_guest_goalkeeper_matches = championship.skip_guest_goalkeeper_matches
	where id = any (open_event_ids);

	foreach open_event_id in array open_event_ids loop
		perform public.refresh_championship_event_attendance_stats(open_event_id);
	end loop;

	select coalesce(array_agg(distinct a.player_id), '{}')
	into player_ids
	from public.championship_event_attendance a
	where a.event_id = any (open_event_ids);

	perform public.sync_championship_players_from_attendance(player_ids);

	return jsonb_build_object(
		'id', championship.id,
		'name', championship.name,
		'invite_code', championship.invite_code,
		'created_by', championship.created_by,
		'logo_path', championship.logo_path,
		'event_time', championship.event_time,
		'players_per_team', championship.players_per_team,
		'skip_guest_goalkeeper_matches', championship.skip_guest_goalkeeper_matches
	);
end;
$$;

revoke all on function public.update_championship_event_config(bigint, time, smallint, boolean) from public;
grant execute on function public.update_championship_event_config(bigint, time, smallint, boolean) to authenticated;

notify pgrst, 'reload schema';
