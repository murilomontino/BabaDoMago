alter table public.championship_event_match_players
	add column if not exists is_substituted boolean not null default false,
	add column if not exists include_stats boolean not null default true;

alter table public.championship_event_match_players
	alter column slot drop not null;

do $$
begin
	if exists (
		select 1
		from pg_constraint
		where conname = 'championship_event_match_players_slot_check'
			and conrelid = 'public.championship_event_match_players'::regclass
	) then
		alter table public.championship_event_match_players
			drop constraint championship_event_match_players_slot_check;
	end if;
end $$;

alter table public.championship_event_match_players
	add constraint championship_event_match_players_slot_check
	check (slot is null or (slot >= 0 and slot < 11));

do $$
begin
	if not exists (
		select 1
		from pg_constraint
		where conname = 'championship_event_match_players_substituted_slot_check'
			and conrelid = 'public.championship_event_match_players'::regclass
	) then
		alter table public.championship_event_match_players
			add constraint championship_event_match_players_substituted_slot_check
			check (is_substituted = (slot is null));
	end if;
end $$;

do $$
begin
	if not exists (
		select 1
		from pg_constraint
		where conname = 'championship_event_match_players_include_stats_check'
			and conrelid = 'public.championship_event_match_players'::regclass
	) then
		alter table public.championship_event_match_players
			add constraint championship_event_match_players_include_stats_check
			check (is_substituted or include_stats);
	end if;
end $$;

drop function if exists public.set_championship_event_match_player(bigint, bigint, smallint, bigint);

create function public.set_championship_event_match_player(
	match_id bigint,
	team_id bigint,
	slot smallint,
	player_id bigint,
	include_stats boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
	event public.championship_events%rowtype;
	match public.championship_event_matches%rowtype;
	player public.championship_players%rowtype;
	outgoing_player_id bigint;
	count_stats boolean;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into match
	from public.championship_event_matches m
	where m.id = set_championship_event_match_player.match_id;

	if match.id is null then
		raise exception 'match not found' using errcode = 'P0002';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = match.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if not public.is_championship_member(event.championship_id) then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if match.ended_at is not null then
		raise exception 'match already ended' using errcode = '23514';
	end if;

	if set_championship_event_match_player.team_id not in (match.team_a_id, match.team_b_id) then
		raise exception 'team not in match' using errcode = '23514';
	end if;

	if set_championship_event_match_player.slot < 0
		or set_championship_event_match_player.slot >= event.players_per_team then
		raise exception 'invalid slot' using errcode = '23514';
	end if;

	select mp.player_id
	into outgoing_player_id
	from public.championship_event_match_players mp
	where mp.match_id = match.id
		and mp.team_id = set_championship_event_match_player.team_id
		and mp.slot = set_championship_event_match_player.slot
		and not mp.is_substituted;

	if set_championship_event_match_player.player_id is null then
		if outgoing_player_id is not null
			and exists (
				select 1
				from public.championship_event_goals g
				where g.match_id = match.id
					and (
						g.scorer_player_id = outgoing_player_id
						or g.assist_player_id = outgoing_player_id
					)
			) then
			raise exception 'player has goals' using errcode = '23514';
		end if;

		delete from public.championship_event_match_players mp
		where mp.match_id = match.id
			and mp.team_id = set_championship_event_match_player.team_id
			and mp.slot = set_championship_event_match_player.slot
			and not mp.is_substituted;

		return public.championship_event_match_json(match);
	end if;

	if not exists (
		select 1
		from public.championship_event_attendance a
		where a.event_id = event.id
			and a.player_id = set_championship_event_match_player.player_id
	) then
		raise exception 'player not present' using errcode = '23514';
	end if;

	select *
	into player
	from public.championship_players p
	where p.id = set_championship_event_match_player.player_id
		and p.championship_id = event.championship_id
		and p.deleted_at is null;

	if player.id is null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	if outgoing_player_id is not distinct from player.id then
		return public.championship_event_match_json(match);
	end if;

	if exists (
		select 1
		from public.championship_event_match_players mp
		where mp.match_id = match.id
			and mp.player_id = player.id
	) then
		raise exception 'duplicate player' using errcode = '23505';
	end if;

	if outgoing_player_id is not null then
		count_stats := coalesce(set_championship_event_match_player.include_stats, false);

		update public.championship_event_match_players mp
		set
			is_substituted = true,
			include_stats = count_stats,
			is_goalkeeper = false,
			slot = null
		where mp.match_id = match.id
			and mp.team_id = set_championship_event_match_player.team_id
			and mp.slot = set_championship_event_match_player.slot
			and not mp.is_substituted;
	end if;

	insert into public.championship_event_match_players (
		match_id,
		event_id,
		team_id,
		player_id,
		display_name,
		is_goalkeeper,
		slot,
		is_substituted,
		include_stats
	)
	values (
		match.id,
		event.id,
		set_championship_event_match_player.team_id,
		player.id,
		coalesce(nullif(btrim(player.nickname), ''), player.display_name),
		set_championship_event_match_player.slot = 0,
		set_championship_event_match_player.slot,
		false,
		true
	);

	return public.championship_event_match_json(match);
end;
$$;

create or replace function public.set_championship_event_match_goalkeeper(
	match_id bigint,
	team_id bigint,
	player_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
	event public.championship_events%rowtype;
	match public.championship_event_matches%rowtype;
	promoted public.championship_event_match_players%rowtype;
	keeper public.championship_event_match_players%rowtype;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into match
	from public.championship_event_matches m
	where m.id = set_championship_event_match_goalkeeper.match_id;

	if match.id is null then
		raise exception 'match not found' using errcode = 'P0002';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = match.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if not public.is_championship_member(event.championship_id) then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if match.ended_at is not null then
		raise exception 'match already ended' using errcode = '23514';
	end if;

	if set_championship_event_match_goalkeeper.team_id not in (match.team_a_id, match.team_b_id) then
		raise exception 'team not in match' using errcode = '23514';
	end if;

	select *
	into promoted
	from public.championship_event_match_players mp
	where mp.match_id = match.id
		and mp.team_id = set_championship_event_match_goalkeeper.team_id
		and mp.player_id = set_championship_event_match_goalkeeper.player_id
		and not mp.is_substituted;

	if promoted.id is null then
		raise exception 'player not in match' using errcode = '23514';
	end if;

	if promoted.slot = 0 then
		return public.championship_event_match_json(match);
	end if;

	select *
	into keeper
	from public.championship_event_match_players mp
	where mp.match_id = match.id
		and mp.team_id = set_championship_event_match_goalkeeper.team_id
		and mp.slot = 0
		and not mp.is_substituted;

	if keeper.id is null then
		update public.championship_event_match_players mp
		set
			slot = 0,
			is_goalkeeper = true
		where mp.id = promoted.id;

		return public.championship_event_match_json(match);
	end if;

	set constraints championship_event_match_players_match_id_team_id_slot_key deferred;

	update public.championship_event_match_players mp
	set
		slot = case
			when mp.id = promoted.id then 0
			else promoted.slot
		end,
		is_goalkeeper = (mp.id = promoted.id)
	where mp.id in (promoted.id, keeper.id);

	return public.championship_event_match_json(match);
end;
$$;

create or replace function public.add_championship_event_goal(
	match_id bigint,
	scorer_player_id bigint,
	assist_player_id bigint,
	is_own_goal boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	event public.championship_events%rowtype;
	match public.championship_event_matches%rowtype;
	scorer public.championship_event_match_players%rowtype;
	assist public.championship_event_match_players%rowtype;
	goal public.championship_event_goals%rowtype;
	own_goal boolean;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	own_goal := coalesce(add_championship_event_goal.is_own_goal, false);

	select *
	into match
	from public.championship_event_matches m
	where m.id = add_championship_event_goal.match_id;

	if match.id is null then
		raise exception 'match not found' using errcode = 'P0002';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = match.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if not public.is_championship_member(event.championship_id) then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if match.ended_at is not null then
		raise exception 'match already ended' using errcode = '23514';
	end if;

	select *
	into scorer
	from public.championship_event_match_players mp
	where mp.match_id = match.id
		and mp.player_id = add_championship_event_goal.scorer_player_id
		and not mp.is_substituted;

	if scorer.id is null then
		raise exception 'player not in match' using errcode = '23514';
	end if;

	if own_goal then
		assist_player_id := null;
	end if;

	if add_championship_event_goal.assist_player_id is not null then
		select *
		into assist
		from public.championship_event_match_players mp
		where mp.match_id = match.id
			and mp.player_id = add_championship_event_goal.assist_player_id
			and not mp.is_substituted;

		if assist.id is null then
			raise exception 'player not in match' using errcode = '23514';
		end if;

		if assist.team_id is distinct from scorer.team_id then
			raise exception 'assist not in team' using errcode = '23514';
		end if;
	end if;

	insert into public.championship_event_goals (
		match_id,
		event_id,
		scorer_player_id,
		assist_player_id,
		is_own_goal
	)
	values (
		match.id,
		event.id,
		scorer.player_id,
		add_championship_event_goal.assist_player_id,
		own_goal
	)
	returning * into goal;

	perform public.refresh_championship_event_attendance_stats(event.id);

	return jsonb_build_object(
		'id', goal.id,
		'match_id', goal.match_id,
		'event_id', goal.event_id,
		'scorer_player_id', goal.scorer_player_id,
		'assist_player_id', goal.assist_player_id,
		'is_own_goal', goal.is_own_goal,
		'created_at', goal.created_at
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

revoke all on function public.set_championship_event_match_player(bigint, bigint, smallint, bigint, boolean) from public;
grant execute on function public.set_championship_event_match_player(bigint, bigint, smallint, bigint, boolean) to authenticated;

notify pgrst, 'reload schema';
