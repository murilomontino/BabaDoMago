create or replace function public.add_championship_event_team(
	event_id bigint,
	team_color text,
	player_ids jsonb,
	goalkeeper_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	event public.championship_events%rowtype;
	normalized_color text;
	ids bigint[];
	player_id bigint;
	seen_players bigint[] := '{}';
	player public.championship_players%rowtype;
	new_team public.championship_event_teams%rowtype;
	next_sort smallint;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	normalized_color := lower(team_color);
	if normalized_color is null or normalized_color !~ '^#[0-9a-f]{6}$' then
		raise exception 'invalid team color' using errcode = '23514';
	end if;

	if jsonb_typeof(player_ids) is distinct from 'array' then
		raise exception 'invalid teams' using errcode = '23514';
	end if;

	if exists (
		select 1
		from jsonb_array_elements(player_ids) elem
		where jsonb_typeof(elem) is distinct from 'number'
	) then
		raise exception 'invalid teams' using errcode = '23514';
	end if;

	select coalesce(array_agg(elem::bigint), '{}')
	into ids
	from jsonb_array_elements_text(player_ids) as elem;

	select *
	into event
	from public.championship_events e
	where e.id = add_championship_event_team.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(event.championship_id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if cardinality(ids) is null
		or cardinality(ids) = 0
		or cardinality(ids) > event.players_per_team then
		raise exception 'invalid team size' using errcode = '23514';
	end if;

	if add_championship_event_team.goalkeeper_id <> all (ids) then
		raise exception 'invalid goalkeeper' using errcode = '23514';
	end if;

	if exists (
		select 1
		from public.championship_event_teams t
		where t.event_id = event.id
			and t.color = normalized_color
	) then
		raise exception 'duplicate team color' using errcode = '23505';
	end if;

	foreach player_id in array ids loop
		if player_id = any (seen_players) then
			raise exception 'duplicate player' using errcode = '23505';
		end if;

		seen_players := seen_players || player_id;

		if not exists (
			select 1
			from public.championship_event_attendance a
			where a.event_id = event.id
				and a.player_id = player_id
		) then
			raise exception 'player not present' using errcode = '23514';
		end if;

		if exists (
			select 1
			from public.championship_event_team_players tp
			where tp.event_id = event.id
				and tp.player_id = player_id
		) then
			raise exception 'duplicate player' using errcode = '23505';
		end if;

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

	select coalesce(max(t.sort_order), -1) + 1
	into next_sort
	from public.championship_event_teams t
	where t.event_id = event.id;

	insert into public.championship_event_teams (
		event_id,
		color,
		sort_order
	)
	values (
		event.id,
		normalized_color,
		next_sort
	)
	returning * into new_team;

	foreach player_id in array ids loop
		select *
		into player
		from public.championship_players p
		where p.id = player_id;

		insert into public.championship_event_team_players (
			event_id,
			team_id,
			player_id,
			display_name,
			is_goalkeeper
		)
		values (
			event.id,
			new_team.id,
			player.id,
			coalesce(nullif(btrim(player.nickname), ''), player.display_name),
			player_id = add_championship_event_team.goalkeeper_id
		);
	end loop;

	return jsonb_build_object(
		'id', new_team.id,
		'event_id', new_team.event_id,
		'color', new_team.color,
		'sort_order', new_team.sort_order
	);
end;
$$;

revoke all on function public.add_championship_event_team(bigint, text, jsonb, bigint) from public;
grant execute on function public.add_championship_event_team(bigint, text, jsonb, bigint) to authenticated;

notify pgrst, 'reload schema';
