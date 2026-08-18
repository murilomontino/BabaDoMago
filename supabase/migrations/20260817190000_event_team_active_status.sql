alter table public.championship_event_teams
	add column is_active boolean not null default true,
	add column template_player_ids jsonb not null default '[]'::jsonb,
	add column template_goalkeeper_id bigint not null default 0;

alter table public.championship_event_teams
	add constraint championship_event_teams_template_player_ids_check
	check (jsonb_typeof(template_player_ids) = 'array');

create or replace function public.set_championship_event_team_active(
	team_id bigint,
	is_active boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	event public.championship_events%rowtype;
	target_team public.championship_event_teams%rowtype;
	current_player_id bigint;
	template_ids bigint[];
	player public.championship_players%rowtype;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into target_team
	from public.championship_event_teams t
	where t.id = set_championship_event_team_active.team_id;

	if target_team.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if target_team.is_active = set_championship_event_team_active.is_active then
		return jsonb_build_object(
			'id', target_team.id,
			'event_id', target_team.event_id,
			'is_active', target_team.is_active
		);
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

	if public.championship_actor_role(event.championship_id) not in ('owner', 'captain', 'admin') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if not set_championship_event_team_active.is_active then
		if exists (
			select 1
			from public.championship_event_matches m
			where m.ended_at is null
				and (m.team_a_id = target_team.id or m.team_b_id = target_team.id)
		) then
			raise exception 'team in open match' using errcode = '23514';
		end if;

		select coalesce(array_agg(tp.player_id order by tp.id), '{}')
		into template_ids
		from public.championship_event_team_players tp
		where tp.team_id = target_team.id;

		update public.championship_event_teams
		set
			is_active = false,
			template_player_ids = coalesce(to_jsonb(template_ids), '[]'::jsonb),
			template_goalkeeper_id = coalesce((
				select tp.player_id
				from public.championship_event_team_players tp
				where tp.team_id = target_team.id
					and tp.is_goalkeeper
				limit 1
			), 0)
		where id = target_team.id
		returning * into target_team;

		delete from public.championship_event_team_players tp
		where tp.team_id = target_team.id;

		return jsonb_build_object(
			'id', target_team.id,
			'event_id', target_team.event_id,
			'is_active', target_team.is_active
		);
	end if;

	template_ids := coalesce(
		array(
			select jsonb_array_elements_text(target_team.template_player_ids)::bigint
		),
		'{}'
	);

	if cardinality(template_ids) > event.players_per_team then
		raise exception 'invalid team size' using errcode = '23514';
	end if;

	if target_team.template_goalkeeper_id is distinct from 0
		and target_team.template_goalkeeper_id <> all (template_ids) then
		raise exception 'invalid goalkeeper' using errcode = '23514';
	end if;

	foreach current_player_id in array template_ids loop
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
			join public.championship_event_teams t on t.id = tp.team_id
			where tp.event_id = event.id
				and tp.player_id = current_player_id
				and t.is_active
		) then
			raise exception 'player conflict' using errcode = '23505';
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
	set is_active = true
	where id = target_team.id
	returning * into target_team;

	foreach current_player_id in array template_ids loop
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
			current_player_id = target_team.template_goalkeeper_id
				and target_team.template_goalkeeper_id is distinct from 0
		);
	end loop;

	return jsonb_build_object(
		'id', target_team.id,
		'event_id', target_team.event_id,
		'is_active', target_team.is_active
	);
end;
$$;

create or replace function public.save_championship_event_teams(
	event_id bigint,
	present_player_ids jsonb,
	teams jsonb,
	goalkeeper_player_ids jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	event public.championship_events%rowtype;
	present_ids bigint[];
	goalkeeper_ids bigint[];
	team_count integer;
	team_item jsonb;
	team_color text;
	player_ids bigint[];
	goalkeeper_id bigint;
	team_is_active boolean;
	player_id bigint;
	seen_present bigint[] := '{}';
	seen_goalkeepers bigint[] := '{}';
	seen_colors text[] := '{}';
	seen_active_players bigint[] := '{}';
	active_team_count integer := 0;
	new_team public.championship_event_teams%rowtype;
	player public.championship_players%rowtype;
	i integer;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if jsonb_typeof(present_player_ids) is distinct from 'array'
		or jsonb_typeof(teams) is distinct from 'array'
		or jsonb_typeof(goalkeeper_player_ids) is distinct from 'array' then
		raise exception 'invalid teams' using errcode = '23514';
	end if;

	select coalesce(array_agg(elem::bigint), '{}')
	into present_ids
	from jsonb_array_elements_text(present_player_ids) as elem;

	select coalesce(array_agg(elem::bigint), '{}')
	into goalkeeper_ids
	from jsonb_array_elements_text(goalkeeper_player_ids) as elem;

	team_count := jsonb_array_length(teams);

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

	foreach player_id in array goalkeeper_ids loop
		if player_id = any (seen_goalkeepers) then
			raise exception 'duplicate attendance' using errcode = '23505';
		end if;

		seen_goalkeepers := seen_goalkeepers || player_id;

		if player_id <> all (present_ids) then
			raise exception 'player not present' using errcode = '23514';
		end if;
	end loop;

	for i in 0 .. team_count - 1 loop
		team_item := teams -> i;
		if jsonb_typeof(team_item) is distinct from 'object' then
			raise exception 'invalid teams' using errcode = '23514';
		end if;

		team_is_active := coalesce((team_item ->> 'is_active')::boolean, true);
		if team_is_active then
			active_team_count := active_team_count + 1;
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

		if jsonb_typeof(team_item -> 'goalkeeper_id') is distinct from 'number' then
			raise exception 'invalid goalkeeper' using errcode = '23514';
		end if;

		goalkeeper_id := (team_item ->> 'goalkeeper_id')::bigint;
		if goalkeeper_id is distinct from 0 and goalkeeper_id <> all (player_ids) then
			raise exception 'invalid goalkeeper' using errcode = '23514';
		end if;

		if team_is_active then
			if cardinality(player_ids) is null
				or cardinality(player_ids) = 0
				or cardinality(player_ids) > event.players_per_team then
				raise exception 'invalid team size' using errcode = '23514';
			end if;
		elsif cardinality(player_ids) > event.players_per_team then
			raise exception 'invalid team size' using errcode = '23514';
		end if;

		foreach player_id in array player_ids loop
			if player_id <> all (present_ids) then
				raise exception 'player not present' using errcode = '23514';
			end if;

			if team_is_active then
				if player_id = any (seen_active_players) then
					raise exception 'duplicate player' using errcode = '23505';
				end if;

				seen_active_players := seen_active_players || player_id;
			end if;
		end loop;
	end loop;

	if active_team_count < 2 then
		raise exception 'invalid teams' using errcode = '23514';
	end if;

	delete from public.championship_event_team_players
	where championship_event_team_players.event_id = event.id;

	delete from public.championship_event_teams
	where championship_event_teams.event_id = event.id;

	delete from public.championship_event_attendance
	where championship_event_attendance.event_id = event.id;

	insert into public.championship_event_attendance (
		event_id,
		player_id,
		display_name,
		is_goalkeeper
	)
	select
		event.id,
		p.id,
		coalesce(nullif(btrim(p.nickname), ''), p.display_name),
		p.id = any (goalkeeper_ids)
	from unnest(present_ids) as pid
	join public.championship_players p on p.id = pid;

	for i in 0 .. team_count - 1 loop
		team_item := teams -> i;
		team_color := lower(team_item ->> 'color');
		goalkeeper_id := (team_item ->> 'goalkeeper_id')::bigint;
		team_is_active := coalesce((team_item ->> 'is_active')::boolean, true);

		select coalesce(array_agg(elem::bigint), '{}')
		into player_ids
		from jsonb_array_elements_text(team_item -> 'player_ids') as elem;

		insert into public.championship_event_teams (
			event_id,
			color,
			sort_order,
			is_active,
			template_player_ids,
			template_goalkeeper_id
		)
		values (
			event.id,
			team_color,
			i::smallint,
			team_is_active,
			case
				when team_is_active then '[]'::jsonb
				else coalesce(team_item -> 'player_ids', '[]'::jsonb)
			end,
			case
				when team_is_active then 0
				else goalkeeper_id
			end
		)
		returning * into new_team;

		if not team_is_active then
			continue;
		end if;

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
				player_id = goalkeeper_id and goalkeeper_id is distinct from 0
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

	if not team_a.is_active or not team_b.is_active then
		raise exception 'team inactive' using errcode = '23514';
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

	if target_team.is_active then
		if cardinality(ids) is null
			or cardinality(ids) = 0
			or cardinality(ids) > event.players_per_team then
			raise exception 'invalid team size' using errcode = '23514';
		end if;
	elsif cardinality(ids) > event.players_per_team then
		raise exception 'invalid team size' using errcode = '23514';
	end if;

	if update_championship_event_team.goalkeeper_id is distinct from 0
		and update_championship_event_team.goalkeeper_id <> all (ids) then
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

		if target_team.is_active and exists (
			select 1
			from public.championship_event_team_players tp
			join public.championship_event_teams t on t.id = tp.team_id
			where tp.event_id = event.id
				and tp.team_id is distinct from target_team.id
				and tp.player_id = current_player_id
				and t.is_active
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
	set
		color = normalized_color,
		template_player_ids = case
			when target_team.is_active then template_player_ids
			else coalesce(player_ids, '[]'::jsonb)
		end,
		template_goalkeeper_id = case
			when target_team.is_active then template_goalkeeper_id
			else update_championship_event_team.goalkeeper_id
		end
	where id = target_team.id
	returning * into target_team;

	if not target_team.is_active then
		return jsonb_build_object(
			'id', target_team.id,
			'event_id', target_team.event_id,
			'color', target_team.color,
			'sort_order', target_team.sort_order,
			'is_active', target_team.is_active
		);
	end if;

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
				and update_championship_event_team.goalkeeper_id is distinct from 0
		);
	end loop;

	return jsonb_build_object(
		'id', target_team.id,
		'event_id', target_team.event_id,
		'color', target_team.color,
		'sort_order', target_team.sort_order,
		'is_active', target_team.is_active
	);
end;
$$;

revoke all on function public.set_championship_event_team_active(bigint, boolean) from public;
grant execute on function public.set_championship_event_team_active(bigint, boolean) to authenticated;

notify pgrst, 'reload schema';
