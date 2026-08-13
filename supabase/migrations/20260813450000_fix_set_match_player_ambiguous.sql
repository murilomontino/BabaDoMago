create or replace function public.set_championship_event_match_player(
	match_id bigint,
	team_id bigint,
	slot smallint,
	player_id bigint
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
	player public.championship_players%rowtype;
	outgoing_player_id bigint;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into match
	from public.championship_event_matches m
	where m.id = set_championship_event_match_player.match_id;

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

	if set_championship_event_match_player.team_id not in (match.team_a_id, match.team_b_id) then
		raise exception 'team not in match' using errcode = '23514';
	end if;

	if set_championship_event_match_player.slot < 0
		or set_championship_event_match_player.slot >= event.players_per_team then
		raise exception 'invalid slot' using errcode = '23514';
	end if;

	select mp.player_id
	into outgoing_player_id
	from public.championship_event_match_players mp
	where mp.match_id = match.id
		and mp.team_id = set_championship_event_match_player.team_id
		and mp.slot = set_championship_event_match_player.slot;

	if set_championship_event_match_player.player_id is null then
		if outgoing_player_id is not null
			and exists (
				select 1
				from public.championship_event_goals g
				where g.match_id = match.id
					and (
						g.scorer_player_id = outgoing_player_id
						or g.assist_player_id = outgoing_player_id
					)
			) then
			raise exception 'player has goals' using errcode = '23514';
		end if;

		delete from public.championship_event_match_players mp
		where mp.match_id = match.id
			and mp.team_id = set_championship_event_match_player.team_id
			and mp.slot = set_championship_event_match_player.slot;

		return public.championship_event_match_json(match);
	end if;

	if not exists (
		select 1
		from public.championship_event_attendance a
		where a.event_id = event.id
			and a.player_id = set_championship_event_match_player.player_id
	) then
		raise exception 'player not present' using errcode = '23514';
	end if;

	if exists (
		select 1
		from public.championship_event_match_players mp
		where mp.match_id = match.id
			and mp.player_id = set_championship_event_match_player.player_id
			and (
				mp.team_id is distinct from set_championship_event_match_player.team_id
				or mp.slot is distinct from set_championship_event_match_player.slot
			)
	) then
		raise exception 'duplicate player' using errcode = '23505';
	end if;

	select *
	into player
	from public.championship_players p
	where p.id = set_championship_event_match_player.player_id
		and p.championship_id = event.championship_id
		and p.deleted_at is null;

	if player.id is null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	if outgoing_player_id is not null
		and outgoing_player_id is distinct from set_championship_event_match_player.player_id
		and exists (
			select 1
			from public.championship_event_goals g
			where g.match_id = match.id
				and (
					g.scorer_player_id = outgoing_player_id
					or g.assist_player_id = outgoing_player_id
				)
		) then
		raise exception 'player has goals' using errcode = '23514';
	end if;

	insert into public.championship_event_match_players (
		match_id,
		event_id,
		team_id,
		player_id,
		display_name,
		is_goalkeeper,
		slot
	)
	values (
		match.id,
		event.id,
		set_championship_event_match_player.team_id,
		player.id,
		coalesce(nullif(btrim(player.nickname), ''), player.display_name),
		set_championship_event_match_player.slot = 0,
		set_championship_event_match_player.slot
	)
	on conflict (match_id, team_id, slot)
	do update set
		player_id = excluded.player_id,
		display_name = excluded.display_name,
		is_goalkeeper = excluded.is_goalkeeper;

	return public.championship_event_match_json(match);
end;
$$;
