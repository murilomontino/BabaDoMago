drop function if exists public.undo_championship_event_goal(bigint);

create function public.undo_championship_event_goal(
	match_id bigint,
	goal_id bigint
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
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into match
	from public.championship_event_matches m
	where m.id = undo_championship_event_goal.match_id;

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
	into goal
	from public.championship_event_goals g
	where g.id = undo_championship_event_goal.goal_id
		and g.match_id = match.id;

	if goal.id is null then
		raise exception 'goal not found' using errcode = 'P0002';
	end if;

	delete from public.championship_event_goals
	where id = goal.id;

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

revoke all on function public.undo_championship_event_goal(bigint, bigint) from public;
grant execute on function public.undo_championship_event_goal(bigint, bigint) to authenticated;
