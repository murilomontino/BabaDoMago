do $$
declare
	existing_name text;
	is_deferrable boolean;
begin
	select c.conname, c.condeferrable
	into existing_name, is_deferrable
	from pg_constraint c
	join pg_attribute a1
		on a1.attrelid = c.conrelid
		and a1.attnum = c.conkey[1]
	join pg_attribute a2
		on a2.attrelid = c.conrelid
		and a2.attnum = c.conkey[2]
	join pg_attribute a3
		on a3.attrelid = c.conrelid
		and a3.attnum = c.conkey[3]
	where c.conrelid = 'public.championship_event_match_players'::regclass
		and c.contype = 'u'
		and c.conkey[4] is null
		and a1.attname = 'match_id'
		and a2.attname = 'team_id'
		and a3.attname = 'slot';

	if is_deferrable then
		return;
	end if;

	if existing_name is not null then
		execute format(
			'alter table public.championship_event_match_players drop constraint %I',
			existing_name
		);
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
		update public.championship_event_match_players
		set
			slot = 0,
			is_goalkeeper = true
		where id = promoted.id;

		return public.championship_event_match_json(match);
	end if;

	set constraints championship_event_match_players_match_id_team_id_slot_key deferred;

	update public.championship_event_match_players
	set
		slot = case id
			when promoted.id then 0
			when keeper.id then promoted.slot
		end,
		is_goalkeeper = (id = promoted.id)
	where id in (promoted.id, keeper.id);

	return public.championship_event_match_json(match);
end;
$$;

revoke all on function public.set_championship_event_match_goalkeeper(bigint, bigint, bigint) from public;
grant execute on function public.set_championship_event_match_goalkeeper(bigint, bigint, bigint) to authenticated;

notify pgrst, 'reload schema';
