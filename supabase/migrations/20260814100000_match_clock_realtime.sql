alter table public.championship_event_matches
	add column if not exists duration_seconds integer,
	add column if not exists started_at timestamptz,
	add column if not exists paused_at timestamptz,
	add column if not exists pause_accumulated_seconds integer not null default 0;

update public.championship_event_matches
set
	duration_seconds = coalesce(duration_seconds, 420),
	started_at = coalesce(started_at, created_at)
where duration_seconds is null
	or started_at is null;

alter table public.championship_event_matches
	alter column duration_seconds set not null,
	alter column started_at set not null;

do $$
begin
	if not exists (
		select 1
		from pg_constraint
		where conname = 'championship_event_matches_duration_seconds_check'
			and conrelid = 'public.championship_event_matches'::regclass
	) then
		alter table public.championship_event_matches
			add constraint championship_event_matches_duration_seconds_check
			check (duration_seconds between 60 and 5400);
	end if;
end $$;

do $$
begin
	if not exists (
		select 1
		from pg_constraint
		where conname = 'championship_event_matches_pause_accumulated_seconds_check'
			and conrelid = 'public.championship_event_matches'::regclass
	) then
		alter table public.championship_event_matches
			add constraint championship_event_matches_pause_accumulated_seconds_check
			check (pause_accumulated_seconds >= 0);
	end if;
end $$;

create or replace function public.championship_event_match_json(
	match public.championship_event_matches
)
returns jsonb
language sql
immutable
as $$
	select jsonb_build_object(
		'id', match.id,
		'event_id', match.event_id,
		'team_a_id', match.team_a_id,
		'team_b_id', match.team_b_id,
		'created_at', match.created_at,
		'ended_at', match.ended_at,
		'winner_team_id', match.winner_team_id,
		'duration_seconds', match.duration_seconds,
		'started_at', match.started_at,
		'paused_at', match.paused_at,
		'pause_accumulated_seconds', match.pause_accumulated_seconds
	);
$$;

drop function if exists public.add_championship_event_match(bigint, bigint, bigint);
drop function if exists public.start_championship_event_match(bigint, bigint, bigint);

create function public.start_championship_event_match(
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
		duration_seconds,
		started_at
	)
	values (
		event.id,
		team_a.id,
		team_b.id,
		start_championship_event_match.duration_seconds,
		now()
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

create function public.add_championship_event_match(
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
begin
	return public.start_championship_event_match(
		add_championship_event_match.event_id,
		add_championship_event_match.team_a_id,
		add_championship_event_match.team_b_id,
		add_championship_event_match.duration_seconds
	);
end;
$$;

create function public.pause_championship_event_match(match_id bigint)
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

	if match.paused_at is not null then
		return public.championship_event_match_json(match);
	end if;

	update public.championship_event_matches
	set paused_at = now()
	where id = match.id
	returning * into match;

	return public.championship_event_match_json(match);
end;
$$;

create function public.resume_championship_event_match(match_id bigint)
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
	where m.id = resume_championship_event_match.match_id;

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

	if match.paused_at is null then
		return public.championship_event_match_json(match);
	end if;

	update public.championship_event_matches
	set
		pause_accumulated_seconds = pause_accumulated_seconds
			+ greatest(
				0,
				round(extract(epoch from (now() - paused_at)))::integer
			),
		paused_at = null
	where id = match.id
	returning * into match;

	return public.championship_event_match_json(match);
end;
$$;

create or replace function public.reopen_championship_event_match(match_id bigint)
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
	where m.id = reopen_championship_event_match.match_id;

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

	if event.ended_at is not null then
		raise exception 'event already ended' using errcode = '23514';
	end if;

	if match.ended_at is null then
		return public.championship_event_match_json(match);
	end if;

	if exists (
		select 1
		from public.championship_event_matches m
		where m.event_id = event.id
			and m.ended_at is null
	) then
		raise exception 'match already open' using errcode = '23505';
	end if;

	update public.championship_event_matches
	set
		paused_at = coalesce(paused_at, ended_at),
		ended_at = null,
		winner_team_id = null
	where id = match.id
	returning * into match;

	perform public.apply_championship_event_match_stats(match.id, -1);

	return public.championship_event_match_json(match);
end;
$$;

alter table public.championship_event_matches replica identity full;
alter table public.championship_event_match_players replica identity full;
alter table public.championship_event_goals replica identity full;

alter publication supabase_realtime add table only public.championship_event_matches;
alter publication supabase_realtime add table only public.championship_event_match_players;
alter publication supabase_realtime add table only public.championship_event_goals;

revoke all on function public.start_championship_event_match(bigint, bigint, bigint, integer) from public;
revoke all on function public.add_championship_event_match(bigint, bigint, bigint, integer) from public;
revoke all on function public.pause_championship_event_match(bigint) from public;
revoke all on function public.resume_championship_event_match(bigint) from public;

grant execute on function public.start_championship_event_match(bigint, bigint, bigint, integer) to authenticated;
grant execute on function public.add_championship_event_match(bigint, bigint, bigint, integer) to authenticated;
grant execute on function public.pause_championship_event_match(bigint) to authenticated;
grant execute on function public.resume_championship_event_match(bigint) to authenticated;

notify pgrst, 'reload schema';
