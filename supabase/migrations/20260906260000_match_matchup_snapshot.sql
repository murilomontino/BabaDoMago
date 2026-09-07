-- Freeze matchup analysis at match start; score favorite hit on end.

alter table public.championship_event_matches
	add column if not exists matchup_snapshot jsonb,
	add column if not exists favorite_team_id bigint,
	add column if not exists favorite_won boolean;

do $$
begin
	if not exists (
		select 1
		from pg_constraint
		where conname = 'championship_event_matches_favorite_team_id_fkey'
	) then
		alter table public.championship_event_matches
			add constraint championship_event_matches_favorite_team_id_fkey
			foreign key (favorite_team_id)
			references public.championship_event_teams (id)
			on delete set null;
	end if;
end;
$$;

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
		'pause_accumulated_seconds', match.pause_accumulated_seconds,
		'matchup_snapshot', match.matchup_snapshot,
		'favorite_team_id', match.favorite_team_id,
		'favorite_won', match.favorite_won
	);
$$;

drop function if exists public.start_championship_event_match(
	bigint,
	bigint,
	bigint,
	integer
);

create function public.start_championship_event_match(
	event_id bigint,
	team_a_id bigint,
	team_b_id bigint,
	duration_seconds integer,
	p_matchup_snapshot jsonb default null,
	p_favorite_team_id bigint default null
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

	if p_favorite_team_id is not null
		and p_favorite_team_id is distinct from start_championship_event_match.team_a_id
		and p_favorite_team_id is distinct from start_championship_event_match.team_b_id
	then
		raise exception 'favorite team not in match' using errcode = '23514';
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

	if exists (
		select 1
		from public.championship_event_team_players a
		join public.championship_event_team_players b
			on b.player_id = a.player_id
		where a.team_id = team_a.id
			and b.team_id = team_b.id
	) then
		raise exception 'shared player' using errcode = '23514';
	end if;

	insert into public.championship_event_matches (
		event_id,
		team_a_id,
		team_b_id,
		duration_seconds,
		matchup_snapshot,
		favorite_team_id
	)
	values (
		event.id,
		team_a.id,
		team_b.id,
		start_championship_event_match.duration_seconds,
		p_matchup_snapshot,
		p_favorite_team_id
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

revoke all on function public.start_championship_event_match(
	bigint,
	bigint,
	bigint,
	integer,
	jsonb,
	bigint
) from public;

grant execute on function public.start_championship_event_match(
	bigint,
	bigint,
	bigint,
	integer,
	jsonb,
	bigint
) to authenticated;

create or replace function public.end_championship_event_match(match_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	event public.championship_events%rowtype;
	match public.championship_event_matches%rowtype;
	score_a integer;
	score_b integer;
	winner_id bigint;
	favorite_hit boolean;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into match
	from public.championship_event_matches m
	where m.id = end_championship_event_match.match_id;

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
		return public.championship_event_match_json(match);
	end if;

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
		ended_at = now(),
		winner_team_id = winner_id,
		favorite_won = favorite_hit
	where id = match.id
	returning * into match;

	perform public.apply_championship_event_match_stats(match.id, 1);

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
		ended_at = null,
		winner_team_id = null,
		favorite_won = null
	where id = match.id
	returning * into match;

	perform public.apply_championship_event_match_stats(match.id, -1);

	return public.championship_event_match_json(match);
end;
$$;

notify pgrst, 'reload schema';
