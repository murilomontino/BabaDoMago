alter table public.championship_event_matches
	alter column started_at drop not null;

update public.championship_event_matches
set started_at = null
where ended_at is null
	and started_at = created_at;

create or replace function public.start_championship_event_match(
	event_id bigint,
	team_a_id bigint,
	team_b_id bigint,
	duration_seconds integer
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

	if start_championship_event_match.duration_seconds is null
		or start_championship_event_match.duration_seconds < 60
		or start_championship_event_match.duration_seconds > 5400
	then
		raise exception 'invalid duration' using errcode = '23514';
	end if;

	if start_championship_event_match.team_a_id = start_championship_event_match.team_b_id then
		raise exception 'same team' using errcode = '23514';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = start_championship_event_match.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if not public.is_championship_member(event.championship_id) then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if event.ended_at is not null then
		raise exception 'event already ended' using errcode = '23514';
	end if;

	if exists (
		select 1
		from public.championship_event_matches m
		where m.event_id = event.id
			and m.ended_at is null
	) then
		raise exception 'match already open' using errcode = '23505';
	end if;

	select *
	into team_a
	from public.championship_event_teams t
	where t.id = start_championship_event_match.team_a_id
		and t.event_id = event.id;

	select *
	into team_b
	from public.championship_event_teams t
	where t.id = start_championship_event_match.team_b_id
		and t.event_id = event.id;

	if team_a.id is null or team_b.id is null then
		raise exception 'team not in event' using errcode = '23514';
	end if;

	insert into public.championship_event_matches (
		event_id,
		team_a_id,
		team_b_id,
		duration_seconds
	)
	values (
		event.id,
		team_a.id,
		team_b.id,
		start_championship_event_match.duration_seconds
	)
	returning * into match;

	insert into public.championship_event_match_players (
		match_id,
		event_id,
		team_id,
		player_id,
		display_name,
		is_goalkeeper,
		slot
	)
	select
		match.id,
		event.id,
		tp.team_id,
		tp.player_id,
		tp.display_name,
		tp.is_goalkeeper,
		case
			when tp.is_goalkeeper then 0
			else row_number() over (
				partition by tp.team_id, tp.is_goalkeeper
				order by tp.id
			)
		end
	from public.championship_event_team_players tp
	where tp.team_id in (team_a.id, team_b.id);

	return public.championship_event_match_json(match);
end;
$$;

create function public.start_championship_event_clock(match_id bigint)
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
	where m.id = start_championship_event_clock.match_id;

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

	if match.started_at is not null then
		return public.championship_event_match_json(match);
	end if;

	update public.championship_event_matches
	set started_at = now()
	where id = match.id
	returning * into match;

	return public.championship_event_match_json(match);
end;
$$;

create or replace function public.pause_championship_event_match(match_id bigint)
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
	where m.id = pause_championship_event_match.match_id;

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

	if match.started_at is null or match.paused_at is not null then
		return public.championship_event_match_json(match);
	end if;

	update public.championship_event_matches
	set paused_at = now()
	where id = match.id
	returning * into match;

	return public.championship_event_match_json(match);
end;
$$;

revoke all on function public.start_championship_event_clock(bigint) from public;
grant execute on function public.start_championship_event_clock(bigint) to authenticated;

notify pgrst, 'reload schema';
