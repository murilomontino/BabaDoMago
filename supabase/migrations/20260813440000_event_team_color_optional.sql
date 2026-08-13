alter table public.championship_event_teams
	alter column color drop not null;

alter table public.championship_event_teams
	drop constraint if exists championship_event_teams_color_check;

do $$
begin
	if not exists (
		select 1
		from pg_constraint
		where conname = 'championship_event_teams_color_check'
			and conrelid = 'public.championship_event_teams'::regclass
	) then
		alter table public.championship_event_teams
			add constraint championship_event_teams_color_check
			check (color is null or color ~ '^#[0-9a-f]{6}$');
	end if;
end $$;

create or replace function public.save_championship_event_teams(
	event_id bigint,
	present_player_ids jsonb,
	teams jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	viewer uuid := (select auth.uid());
	event public.championship_events%rowtype;
	team_item jsonb;
	team_color text;
	player_ids bigint[];
	present_ids bigint[];
	player_id bigint;
	goalkeeper_id bigint;
	seen_colors text[] := '{}';
	seen_players bigint[] := '{}';
	seen_present bigint[] := '{}';
	team_count integer;
	i integer;
	new_team public.championship_event_teams%rowtype;
	player public.championship_players%rowtype;
begin
	if viewer is null then
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

	if jsonb_typeof(teams) is distinct from 'array' then
		raise exception 'invalid teams' using errcode = '23514';
	end if;

	team_count := jsonb_array_length(teams);
	if team_count < 2 then
		raise exception 'invalid teams' using errcode = '23514';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = save_championship_event_teams.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(event.championship_id) not in ('owner', 'captain', 'admin') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if not exists (
		select 1
		from public.championships c
		where c.id = event.championship_id
			and c.deleted_at is null
	) then
		raise exception 'championship not found' using errcode = 'P0002';
	end if;

	if event.ended_at is not null
		and public.championship_actor_role(event.championship_id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if exists (
		select 1
		from public.championship_event_matches m
		where m.event_id = event.id
	) then
		raise exception 'event has matches' using errcode = '23514';
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

	for i in 0 .. team_count - 1 loop
		team_item := teams -> i;
		if jsonb_typeof(team_item) is distinct from 'object' then
			raise exception 'invalid teams' using errcode = '23514';
		end if;

		team_color := lower(team_item ->> 'color');
		if team_color is not null and team_color !~ '^#[0-9a-f]{6}$' then
			raise exception 'invalid team color' using errcode = '23514';
		end if;

		if team_color is not null then
			if team_color = any (seen_colors) then
				raise exception 'duplicate team color' using errcode = '23505';
			end if;

			seen_colors := seen_colors || team_color;
		end if;

		if jsonb_typeof(team_item -> 'player_ids') is distinct from 'array' then
			raise exception 'invalid teams' using errcode = '23514';
		end if;

		if exists (
			select 1
			from jsonb_array_elements(team_item -> 'player_ids') elem
			where jsonb_typeof(elem) is distinct from 'number'
		) then
			raise exception 'invalid teams' using errcode = '23514';
		end if;

		select coalesce(array_agg(elem::bigint), '{}')
		into player_ids
		from jsonb_array_elements_text(team_item -> 'player_ids') as elem;

		if cardinality(player_ids) is null
			or cardinality(player_ids) = 0
			or cardinality(player_ids) > event.players_per_team then
			raise exception 'invalid team size' using errcode = '23514';
		end if;

		if jsonb_typeof(team_item -> 'goalkeeper_id') is distinct from 'number' then
			raise exception 'invalid goalkeeper' using errcode = '23514';
		end if;

		goalkeeper_id := (team_item ->> 'goalkeeper_id')::bigint;
		if goalkeeper_id <> all (player_ids) then
			raise exception 'invalid goalkeeper' using errcode = '23514';
		end if;

		foreach player_id in array player_ids loop
			if player_id = any (seen_players) then
				raise exception 'duplicate player' using errcode = '23505';
			end if;

			if player_id <> all (present_ids) then
				raise exception 'player not present' using errcode = '23514';
			end if;

			seen_players := seen_players || player_id;
		end loop;
	end loop;

	delete from public.championship_event_team_players
	where championship_event_team_players.event_id = event.id;

	delete from public.championship_event_teams
	where championship_event_teams.event_id = event.id;

	delete from public.championship_event_attendance
	where championship_event_attendance.event_id = event.id;

	insert into public.championship_event_attendance (
		event_id,
		player_id,
		display_name
	)
	select
		event.id,
		p.id,
		coalesce(nullif(btrim(p.nickname), ''), p.display_name)
	from unnest(present_ids) as pid
	join public.championship_players p on p.id = pid;

	for i in 0 .. team_count - 1 loop
		team_item := teams -> i;
		team_color := lower(team_item ->> 'color');
		goalkeeper_id := (team_item ->> 'goalkeeper_id')::bigint;

		select coalesce(array_agg(elem::bigint), '{}')
		into player_ids
		from jsonb_array_elements_text(team_item -> 'player_ids') as elem;

		insert into public.championship_event_teams (
			event_id,
			color,
			sort_order
		)
		values (
			event.id,
			team_color,
			i::smallint
		)
		returning * into new_team;

		foreach player_id in array player_ids loop
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
				player_id = goalkeeper_id
			);
		end loop;
	end loop;

	return jsonb_build_object(
		'id', event.id,
		'championship_id', event.championship_id,
		'starts_at', event.starts_at,
		'players_per_team', event.players_per_team,
		'ended_at', event.ended_at
	);
end;
$$;

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
	current_player_id bigint;
	seen_players bigint[] := '{}';
	player public.championship_players%rowtype;
	new_team public.championship_event_teams%rowtype;
	next_sort smallint;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	normalized_color := lower(team_color);
	if normalized_color is not null and normalized_color !~ '^#[0-9a-f]{6}$' then
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

	if normalized_color is not null and exists (
		select 1
		from public.championship_event_teams t
		where t.event_id = event.id
			and t.color = normalized_color
	) then
		raise exception 'duplicate team color' using errcode = '23505';
	end if;

	foreach current_player_id in array ids loop
		if current_player_id = any (seen_players) then
			raise exception 'duplicate player' using errcode = '23505';
		end if;

		seen_players := seen_players || current_player_id;

		if not exists (
			select 1
			from public.championship_event_attendance a
			where a.event_id = event.id
				and a.player_id = current_player_id
		) then
			raise exception 'player not present' using errcode = '23514';
		end if;

		if exists (
			select 1
			from public.championship_event_team_players tp
			where tp.event_id = event.id
				and tp.player_id = current_player_id
		) then
			raise exception 'duplicate player' using errcode = '23505';
		end if;

		select *
		into player
		from public.championship_players p
		where p.id = current_player_id
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

	foreach current_player_id in array ids loop
		select *
		into player
		from public.championship_players p
		where p.id = current_player_id;

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
			current_player_id = add_championship_event_team.goalkeeper_id
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

create or replace function public.update_championship_event_team(
	team_id bigint,
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
	target_team public.championship_event_teams%rowtype;
	normalized_color text;
	ids bigint[];
	current_player_id bigint;
	seen_players bigint[] := '{}';
	player public.championship_players%rowtype;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	normalized_color := lower(team_color);
	if normalized_color is not null and normalized_color !~ '^#[0-9a-f]{6}$' then
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
	into target_team
	from public.championship_event_teams t
	where t.id = update_championship_event_team.team_id;

	if target_team.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = target_team.event_id
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

	if update_championship_event_team.goalkeeper_id <> all (ids) then
		raise exception 'invalid goalkeeper' using errcode = '23514';
	end if;

	if normalized_color is not null and exists (
		select 1
		from public.championship_event_teams t
		where t.event_id = event.id
			and t.id is distinct from target_team.id
			and t.color = normalized_color
	) then
		raise exception 'duplicate team color' using errcode = '23505';
	end if;

	foreach current_player_id in array ids loop
		if current_player_id = any (seen_players) then
			raise exception 'duplicate player' using errcode = '23505';
		end if;

		seen_players := seen_players || current_player_id;

		if not exists (
			select 1
			from public.championship_event_attendance a
			where a.event_id = event.id
				and a.player_id = current_player_id
		) then
			raise exception 'player not present' using errcode = '23514';
		end if;

		if exists (
			select 1
			from public.championship_event_team_players tp
			where tp.event_id = event.id
				and tp.team_id is distinct from target_team.id
				and tp.player_id = current_player_id
		) then
			raise exception 'duplicate player' using errcode = '23505';
		end if;

		select *
		into player
		from public.championship_players p
		where p.id = current_player_id
			and p.championship_id = event.championship_id
			and p.deleted_at is null;

		if player.id is null then
			raise exception 'player not found' using errcode = 'P0002';
		end if;
	end loop;

	update public.championship_event_teams
	set color = normalized_color
	where id = target_team.id
	returning * into target_team;

	delete from public.championship_event_team_players tp
	where tp.team_id = target_team.id;

	foreach current_player_id in array ids loop
		select *
		into player
		from public.championship_players p
		where p.id = current_player_id;

		insert into public.championship_event_team_players (
			event_id,
			team_id,
			player_id,
			display_name,
			is_goalkeeper
		)
		values (
			event.id,
			target_team.id,
			player.id,
			coalesce(nullif(btrim(player.nickname), ''), player.display_name),
			current_player_id = update_championship_event_team.goalkeeper_id
		);
	end loop;

	return jsonb_build_object(
		'id', target_team.id,
		'event_id', target_team.event_id,
		'color', target_team.color,
		'sort_order', target_team.sort_order
	);
end;
$$;

notify pgrst, 'reload schema';
