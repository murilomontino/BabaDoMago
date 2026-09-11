create function public.add_championship_event_ended_match_goal(
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
	score_a integer;
	score_b integer;
	winner_id bigint;
	favorite_hit boolean;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	own_goal := coalesce(add_championship_event_ended_match_goal.is_own_goal, false);
	elapsed := add_championship_event_ended_match_goal.elapsed_seconds;

	if elapsed is not null and elapsed < 0 then
		raise exception 'invalid elapsed' using errcode = '23514';
	end if;

	select *
	into match
	from public.championship_event_matches m
	where m.id = add_championship_event_ended_match_goal.match_id;

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

	if public.championship_actor_role(event.championship_id) not in (
		'owner',
		'captain',
		'admin'
	) then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if match.ended_at is null then
		raise exception 'match still open' using errcode = '23514';
	end if;

	select *
	into scorer
	from public.championship_event_match_players mp
	where mp.match_id = match.id
		and mp.player_id = add_championship_event_ended_match_goal.scorer_player_id;

	if scorer.id is null then
		raise exception 'player not in match' using errcode = '23514';
	end if;

	if own_goal then
		assist_player_id := null;
	end if;

	if add_championship_event_ended_match_goal.assist_player_id is not null then
		select *
		into assist
		from public.championship_event_match_players mp
		where mp.match_id = match.id
			and mp.player_id = add_championship_event_ended_match_goal.assist_player_id;

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
		add_championship_event_ended_match_goal.assist_player_id,
		own_goal,
		elapsed
	)
	returning * into goal;

	score_a := public.championship_event_match_score(match, match.team_a_id);
	score_b := public.championship_event_match_score(match, match.team_b_id);

	if score_a > score_b then
		winner_id := match.team_a_id;
	elsif score_b > score_a then
		winner_id := match.team_b_id;
	else
		winner_id := null;
	end if;

	if match.favorite_team_id is null or winner_id is null then
		favorite_hit := null;
	else
		favorite_hit := winner_id = match.favorite_team_id;
	end if;

	update public.championship_event_matches
	set
		winner_team_id = winner_id,
		favorite_won = favorite_hit
	where id = match.id
	returning * into match;

	perform public.apply_championship_event_match_stats(match.id, 1);

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

revoke all on function public.add_championship_event_ended_match_goal(
	bigint,
	bigint,
	bigint,
	boolean,
	integer
) from public;
grant execute on function public.add_championship_event_ended_match_goal(
	bigint,
	bigint,
	bigint,
	boolean,
	integer
) to authenticated;

notify pgrst, 'reload schema';
