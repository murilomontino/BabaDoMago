do $$
begin
	if exists (
		select 1
		from pg_constraint
		where conname = 'championship_event_match_players_match_id_team_id_slot_key'
			and conrelid = 'public.championship_event_match_players'::regclass
			and condeferrable
	) then
		return;
	end if;

	if exists (
		select 1
		from pg_constraint
		where conname = 'championship_event_match_players_match_id_team_id_slot_key'
			and conrelid = 'public.championship_event_match_players'::regclass
	) then
		alter table public.championship_event_match_players
			drop constraint championship_event_match_players_match_id_team_id_slot_key;
	end if;

	alter table public.championship_event_match_players
		add constraint championship_event_match_players_match_id_team_id_slot_key
		unique (match_id, team_id, slot)
		deferrable initially immediate;
end $$;

create or replace function public.set_championship_event_match_goalkeeper(
	match_id bigint,
	team_id bigint,
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
	promoted public.championship_event_match_players%rowtype;
	keeper public.championship_event_match_players%rowtype;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into match
	from public.championship_event_matches m
	where m.id = set_championship_event_match_goalkeeper.match_id;

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

	if set_championship_event_match_goalkeeper.team_id not in (match.team_a_id, match.team_b_id) then
		raise exception 'team not in match' using errcode = '23514';
	end if;

	select *
	into promoted
	from public.championship_event_match_players mp
	where mp.match_id = match.id
		and mp.team_id = set_championship_event_match_goalkeeper.team_id
		and mp.player_id = set_championship_event_match_goalkeeper.player_id;

	if promoted.id is null then
		raise exception 'player not in match' using errcode = '23514';
	end if;

	if promoted.slot = 0 then
		return public.championship_event_match_json(match);
	end if;

	select *
	into keeper
	from public.championship_event_match_players mp
	where mp.match_id = match.id
		and mp.team_id = set_championship_event_match_goalkeeper.team_id
		and mp.slot = 0;

	if keeper.id is null then
		update public.championship_event_match_players mp
		set
			slot = 0,
			is_goalkeeper = true
		where mp.id = promoted.id;

		return public.championship_event_match_json(match);
	end if;

	set constraints championship_event_match_players_match_id_team_id_slot_key deferred;

	update public.championship_event_match_players mp
	set
		slot = case
			when mp.id = promoted.id then 0
			else promoted.slot
		end,
		is_goalkeeper = (mp.id = promoted.id)
	where mp.id in (promoted.id, keeper.id);

	return public.championship_event_match_json(match);
end;
$$;
