create function public.update_championship_event_goal_players(
	goal_id bigint,
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
	goal public.championship_event_goals%rowtype;
	old_scorer public.championship_event_match_players%rowtype;
	new_scorer public.championship_event_match_players%rowtype;
	assist public.championship_event_match_players%rowtype;
	own_goal boolean;
	old_credited_team_id bigint;
	new_credited_team_id bigint;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	own_goal := coalesce(update_championship_event_goal_players.is_own_goal, false);

	select *
	into goal
	from public.championship_event_goals g
	where g.id = update_championship_event_goal_players.goal_id;

	if goal.id is null then
		raise exception 'goal not found' using errcode = 'P0002';
	end if;

	select *
	into match
	from public.championship_event_matches m
	where m.id = goal.match_id;

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

	if match.ended_at is null then
		raise exception 'match still open' using errcode = '23514';
	end if;

	select *
	into old_scorer
	from public.championship_event_match_players mp
	where mp.match_id = match.id
		and mp.player_id = goal.scorer_player_id;

	if old_scorer.id is null then
		raise exception 'player not in match' using errcode = '23514';
	end if;

	select *
	into new_scorer
	from public.championship_event_match_players mp
	where mp.match_id = match.id
		and mp.player_id = update_championship_event_goal_players.scorer_player_id;

	if new_scorer.id is null then
		raise exception 'player not in match' using errcode = '23514';
	end if;

	if goal.is_own_goal then
		if old_scorer.team_id = match.team_a_id then
			old_credited_team_id := match.team_b_id;
		else
			old_credited_team_id := match.team_a_id;
		end if;
	else
		old_credited_team_id := old_scorer.team_id;
	end if;

	if own_goal then
		if new_scorer.team_id = match.team_a_id then
			new_credited_team_id := match.team_b_id;
		else
			new_credited_team_id := match.team_a_id;
		end if;
	else
		new_credited_team_id := new_scorer.team_id;
	end if;

	if new_credited_team_id is distinct from old_credited_team_id then
		raise exception 'goal team locked' using errcode = '23514';
	end if;

	if own_goal then
		assist_player_id := null;
	end if;

	if update_championship_event_goal_players.assist_player_id is not null then
		select *
		into assist
		from public.championship_event_match_players mp
		where mp.match_id = match.id
			and mp.player_id = update_championship_event_goal_players.assist_player_id;

		if assist.id is null then
			raise exception 'player not in match' using errcode = '23514';
		end if;

		if assist.team_id is distinct from new_scorer.team_id then
			raise exception 'assist not in team' using errcode = '23514';
		end if;
	end if;

	update public.championship_event_goals
	set
		scorer_player_id = new_scorer.player_id,
		assist_player_id = update_championship_event_goal_players.assist_player_id,
		is_own_goal = own_goal
	where id = goal.id
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

revoke all on function public.update_championship_event_goal_players(
	bigint,
	bigint,
	bigint,
	boolean
) from public;
grant execute on function public.update_championship_event_goal_players(
	bigint,
	bigint,
	bigint,
	boolean
) to authenticated;

notify pgrst, 'reload schema';
