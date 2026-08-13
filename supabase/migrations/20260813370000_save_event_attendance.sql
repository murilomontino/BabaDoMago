create or replace function public.save_championship_event_attendance(
	event_id bigint,
	present_player_ids jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	event public.championship_events%rowtype;
	present_ids bigint[];
	player_id bigint;
	seen_present bigint[] := '{}';
	player public.championship_players%rowtype;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if jsonb_typeof(present_player_ids) is distinct from 'array' then
		raise exception 'invalid attendance' using errcode = '23514';
	end if;

	if exists (
		select 1
		from jsonb_array_elements(present_player_ids) elem
		where jsonb_typeof(elem) is distinct from 'number'
	) then
		raise exception 'invalid attendance' using errcode = '23514';
	end if;

	select coalesce(array_agg(elem::bigint), '{}')
	into present_ids
	from jsonb_array_elements_text(present_player_ids) as elem;

	if cardinality(present_ids) is null or cardinality(present_ids) < 2 then
		raise exception 'invalid attendance' using errcode = '23514';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = save_championship_event_attendance.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(event.championship_id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	foreach player_id in array present_ids loop
		if player_id = any (seen_present) then
			raise exception 'duplicate attendance' using errcode = '23505';
		end if;

		seen_present := seen_present || player_id;

		select *
		into player
		from public.championship_players p
		where p.id = player_id
			and p.championship_id = event.championship_id
			and p.deleted_at is null;

		if player.id is null then
			raise exception 'player not found' using errcode = 'P0002';
		end if;
	end loop;

	if exists (
		select 1
		from public.championship_event_team_players tp
		where tp.event_id = event.id
			and tp.player_id <> all (present_ids)
	) then
		raise exception 'player not present' using errcode = '23514';
	end if;

	delete from public.championship_event_attendance a
	where a.event_id = event.id
		and a.player_id <> all (present_ids);

	insert into public.championship_event_attendance (
		event_id,
		player_id,
		display_name
	)
	select
		event.id,
		p.id,
		coalesce(nullif(btrim(p.nickname), ''), p.display_name)
	from unnest(present_ids) as u(pid)
	join public.championship_players p on p.id = u.pid
	where not exists (
		select 1
		from public.championship_event_attendance existing
		where existing.event_id = event.id
			and existing.player_id = p.id
	);

	return jsonb_build_object(
		'id', event.id,
		'championship_id', event.championship_id,
		'starts_at', event.starts_at,
		'players_per_team', event.players_per_team,
		'ended_at', event.ended_at
	);
end;
$$;

create or replace function public.delete_championship_event_match(match_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	event public.championship_events%rowtype;
	match public.championship_event_matches%rowtype;
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

	if public.championship_actor_role(event.championship_id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	delete from public.championship_event_matches
	where id = match.id;

	return jsonb_build_object(
		'id', match.id,
		'event_id', match.event_id,
		'team_a_id', match.team_a_id,
		'team_b_id', match.team_b_id,
		'created_at', match.created_at
	);
end;
$$;

create or replace function public.add_championship_event_match(
	event_id bigint,
	team_a_id bigint,
	team_b_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	event public.championship_events%rowtype;
	match public.championship_event_matches%rowtype;
	team_a public.championship_event_teams%rowtype;
	team_b public.championship_event_teams%rowtype;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if add_championship_event_match.team_a_id = add_championship_event_match.team_b_id then
		raise exception 'same team' using errcode = '23514';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = add_championship_event_match.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(event.championship_id) not in ('owner', 'captain', 'admin') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if event.ended_at is not null
		and public.championship_actor_role(event.championship_id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	select *
	into team_a
	from public.championship_event_teams t
	where t.id = add_championship_event_match.team_a_id
		and t.event_id = event.id;

	select *
	into team_b
	from public.championship_event_teams t
	where t.id = add_championship_event_match.team_b_id
		and t.event_id = event.id;

	if team_a.id is null or team_b.id is null then
		raise exception 'team not in event' using errcode = '23514';
	end if;

	insert into public.championship_event_matches (
		event_id,
		team_a_id,
		team_b_id
	)
	values (
		event.id,
		team_a.id,
		team_b.id
	)
	returning * into match;

	return jsonb_build_object(
		'id', match.id,
		'event_id', match.event_id,
		'team_a_id', match.team_a_id,
		'team_b_id', match.team_b_id,
		'created_at', match.created_at
	);
end;
$$;

revoke all on function public.save_championship_event_attendance(bigint, jsonb) from public;
revoke all on function public.delete_championship_event_match(bigint) from public;

grant execute on function public.save_championship_event_attendance(bigint, jsonb) to authenticated;
grant execute on function public.delete_championship_event_match(bigint) to authenticated;

notify pgrst, 'reload schema';
