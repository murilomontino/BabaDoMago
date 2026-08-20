create or replace function public.delete_championship_event_match(match_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	event public.championship_events%rowtype;
	match public.championship_event_matches%rowtype;
	player_ids bigint[];
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into match
	from public.championship_event_matches m
	where m.id = delete_championship_event_match.match_id;

	if match.id is null then
		raise exception 'event not found' using errcode = 'P0002';
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

	if match.ended_at is not null
		and public.championship_actor_role(event.championship_id) is distinct from 'owner'
	then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	select coalesce(array_agg(mp.player_id), '{}')
	into player_ids
	from public.championship_event_match_players mp
	where mp.match_id = match.id;

	delete from public.championship_event_goals g
	where g.match_id = match.id;

	delete from public.championship_event_match_players mp
	where mp.match_id = match.id;

	delete from public.championship_event_matches
	where id = match.id;

	perform public.refresh_championship_event_attendance_stats(event.id);
	perform public.sync_championship_players_from_attendance(player_ids);

	return public.championship_event_match_json(match);
end;
$$;

revoke all on function public.delete_championship_event_match(bigint) from public;
grant execute on function public.delete_championship_event_match(bigint) to authenticated;

notify pgrst, 'reload schema';
