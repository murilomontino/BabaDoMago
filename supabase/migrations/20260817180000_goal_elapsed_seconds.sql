alter table public.championship_event_goals
	add column if not exists elapsed_seconds integer;

do $$
begin
	if not exists (
		select 1
		from pg_constraint
		where conname = 'championship_event_goals_elapsed_seconds_check'
			and conrelid = 'public.championship_event_goals'::regclass
	) then
		alter table public.championship_event_goals
			add constraint championship_event_goals_elapsed_seconds_check
			check (elapsed_seconds is null or elapsed_seconds >= 0);
	end if;
end $$;

drop function if exists public.add_championship_event_goal(bigint, bigint, bigint, boolean);

create function public.add_championship_event_goal(
	match_id bigint,
	scorer_player_id bigint,
	assist_player_id bigint,
	is_own_goal boolean,
	elapsed_seconds integer default null
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
	elapsed integer;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	own_goal := coalesce(add_championship_event_goal.is_own_goal, false);
	elapsed := add_championship_event_goal.elapsed_seconds;

	if elapsed is not null and elapsed < 0 then
		raise exception 'invalid elapsed' using errcode = '23514';
	end if;

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
		is_own_goal,
		elapsed_seconds
	)
	values (
		match.id,
		event.id,
		scorer.player_id,
		add_championship_event_goal.assist_player_id,
		own_goal,
		elapsed
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
		'elapsed_seconds', goal.elapsed_seconds,
		'created_at', goal.created_at
	);
end;
$$;

revoke all on function public.add_championship_event_goal(bigint, bigint, bigint, boolean, integer)
	from public;
grant execute on function public.add_championship_event_goal(bigint, bigint, bigint, boolean, integer)
	to authenticated;

notify pgrst, 'reload schema';
