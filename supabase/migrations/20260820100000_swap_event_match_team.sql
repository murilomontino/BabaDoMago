create function public.swap_championship_event_match_team(
	match_id bigint,
	outgoing_team_id bigint,
	incoming_team_id bigint
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
	incoming public.championship_event_teams%rowtype;
	staying_team_id bigint;
	next_team_a_id bigint;
	next_team_b_id bigint;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if swap_championship_event_match_team.outgoing_team_id
		= swap_championship_event_match_team.incoming_team_id
	then
		raise exception 'same team' using errcode = '23514';
	end if;

	select *
	into match
	from public.championship_event_matches m
	where m.id = swap_championship_event_match_team.match_id
	for update;

	if match.id is null then
		raise exception 'match not found' using errcode = 'P0002';
	end if;

	if match.ended_at is not null then
		raise exception 'match already ended' using errcode = '23514';
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

	if swap_championship_event_match_team.outgoing_team_id not in (
		match.team_a_id,
		match.team_b_id
	) then
		raise exception 'team not in match' using errcode = '23514';
	end if;

	if match.team_a_id = swap_championship_event_match_team.outgoing_team_id then
		staying_team_id := match.team_b_id;
	end if;

	if match.team_b_id = swap_championship_event_match_team.outgoing_team_id then
		staying_team_id := match.team_a_id;
	end if;

	if staying_team_id is null then
		raise exception 'team not in match' using errcode = '23514';
	end if;

	if swap_championship_event_match_team.incoming_team_id = staying_team_id then
		raise exception 'same team' using errcode = '23514';
	end if;

	select *
	into incoming
	from public.championship_event_teams t
	where t.id = swap_championship_event_match_team.incoming_team_id
		and t.event_id = event.id;

	if incoming.id is null then
		raise exception 'team not in event' using errcode = '23514';
	end if;

	if exists (
		select 1
		from public.championship_event_team_players a
		join public.championship_event_team_players b
			on b.player_id = a.player_id
		where a.team_id = incoming.id
			and b.team_id = staying_team_id
	) then
		raise exception 'shared player' using errcode = '23514';
	end if;

	if exists (
		select 1
		from public.championship_event_match_players mp
		join public.championship_event_team_players tp
			on tp.player_id = mp.player_id
		where mp.match_id = match.id
			and mp.team_id = staying_team_id
			and tp.team_id = incoming.id
	) then
		raise exception 'player already in match' using errcode = '23514';
	end if;

	delete from public.championship_event_goals g
	where g.match_id = match.id;

	delete from public.championship_event_match_players mp
	where mp.match_id = match.id
		and mp.team_id = swap_championship_event_match_team.outgoing_team_id;

	next_team_a_id := match.team_a_id;
	next_team_b_id := match.team_b_id;

	if match.team_a_id = swap_championship_event_match_team.outgoing_team_id then
		next_team_a_id := incoming.id;
	end if;

	if match.team_b_id = swap_championship_event_match_team.outgoing_team_id then
		next_team_b_id := incoming.id;
	end if;

	update public.championship_event_matches m
	set
		team_a_id = next_team_a_id,
		team_b_id = next_team_b_id
	where m.id = match.id
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
	where tp.team_id = incoming.id;

	return public.championship_event_match_json(match);
end;
$$;

revoke all on function public.swap_championship_event_match_team(bigint, bigint, bigint) from public;
grant execute on function public.swap_championship_event_match_team(bigint, bigint, bigint) to authenticated;

notify pgrst, 'reload schema';
