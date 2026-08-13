alter table public.championships
	add column if not exists event_time time not null default '19:00';

alter table public.championships
	add column if not exists players_per_team smallint not null default 5;

alter table public.championships
	drop constraint if exists championships_players_per_team_check;

alter table public.championships
	add constraint championships_players_per_team_check
	check (players_per_team between 3 and 11);

create table public.championship_events (
	id bigint generated always as identity primary key,
	championship_id bigint not null references public.championships (id) on delete cascade,
	starts_at timestamptz not null,
	players_per_team smallint not null,
	ended_at timestamptz,
	created_by uuid default auth.uid() references auth.users (id) on delete set null,
	created_at timestamptz not null default now(),
	constraint championship_events_players_per_team_check
		check (players_per_team between 3 and 11)
);

create index championship_events_championship_id_starts_at_idx
	on public.championship_events (championship_id, starts_at desc);

create unique index championship_events_championship_day_idx
	on public.championship_events (
		championship_id,
		((starts_at at time zone 'America/Sao_Paulo')::date)
	);

create table public.championship_event_teams (
	id bigint generated always as identity primary key,
	event_id bigint not null references public.championship_events (id) on delete cascade,
	color text not null,
	sort_order smallint not null,
	constraint championship_event_teams_color_check check (
		color in (
			'white',
			'black',
			'red',
			'blue',
			'yellow',
			'green',
			'orange',
			'pink'
		)
	),
	unique (event_id, color),
	unique (id, event_id)
);

create index championship_event_teams_event_id_idx
	on public.championship_event_teams (event_id);

create table public.championship_event_team_players (
	id bigint generated always as identity primary key,
	event_id bigint not null,
	team_id bigint not null,
	player_id bigint not null references public.championship_players (id) on delete restrict,
	display_name text not null,
	foreign key (team_id, event_id)
		references public.championship_event_teams (id, event_id)
		on delete cascade,
	unique (event_id, player_id)
);

create index championship_event_team_players_event_id_idx
	on public.championship_event_team_players (event_id);

create index championship_event_team_players_team_id_idx
	on public.championship_event_team_players (team_id);

create index championship_event_team_players_player_id_idx
	on public.championship_event_team_players (player_id);

create table public.championship_event_matches (
	id bigint generated always as identity primary key,
	event_id bigint not null references public.championship_events (id) on delete cascade,
	team_a_id bigint not null,
	team_b_id bigint not null,
	created_at timestamptz not null default now(),
	constraint championship_event_matches_distinct_teams_check
		check (team_a_id <> team_b_id),
	foreign key (team_a_id, event_id)
		references public.championship_event_teams (id, event_id)
		on delete restrict,
	foreign key (team_b_id, event_id)
		references public.championship_event_teams (id, event_id)
		on delete restrict
);

create index championship_event_matches_event_id_idx
	on public.championship_event_matches (event_id);

create index championship_event_matches_team_a_id_idx
	on public.championship_event_matches (team_a_id);

create index championship_event_matches_team_b_id_idx
	on public.championship_event_matches (team_b_id);

alter table public.championship_events enable row level security;
alter table public.championship_event_teams enable row level security;
alter table public.championship_event_team_players enable row level security;
alter table public.championship_event_matches enable row level security;

create policy championship_events_select_member
	on public.championship_events
	for select
	to authenticated
	using (public.is_championship_member(championship_id));

create policy championship_event_teams_select_member
	on public.championship_event_teams
	for select
	to authenticated
	using (
		exists (
			select 1
			from public.championship_events e
			where e.id = event_id
				and public.is_championship_member(e.championship_id)
		)
	);

create policy championship_event_team_players_select_member
	on public.championship_event_team_players
	for select
	to authenticated
	using (
		exists (
			select 1
			from public.championship_events e
			where e.id = event_id
				and public.is_championship_member(e.championship_id)
		)
	);

create policy championship_event_matches_select_member
	on public.championship_event_matches
	for select
	to authenticated
	using (
		exists (
			select 1
			from public.championship_events e
			where e.id = event_id
				and public.is_championship_member(e.championship_id)
		)
	);

create or replace function public.update_championship_event_config(
	championship_id bigint,
	event_time time,
	players_per_team smallint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	championship public.championships%rowtype;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if update_championship_event_config.players_per_team < 3
		or update_championship_event_config.players_per_team > 11 then
		raise exception 'invalid players per team' using errcode = '23514';
	end if;

	select *
	into championship
	from public.championships c
	where c.id = update_championship_event_config.championship_id
		and c.deleted_at is null
	for update;

	if championship.id is null then
		raise exception 'championship not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(championship.id) not in ('owner', 'captain') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	update public.championships
	set
		event_time = update_championship_event_config.event_time,
		players_per_team = update_championship_event_config.players_per_team
	where id = championship.id
	returning * into championship;

	return jsonb_build_object(
		'id', championship.id,
		'name', championship.name,
		'invite_code', championship.invite_code,
		'created_by', championship.created_by,
		'logo_path', championship.logo_path,
		'event_time', championship.event_time,
		'players_per_team', championship.players_per_team
	);
end;
$$;

create or replace function public.start_championship_event(
	championship_id bigint,
	event_date date,
	teams jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	viewer uuid := (select auth.uid());
	championship public.championships%rowtype;
	team_item jsonb;
	team_color text;
	player_ids bigint[];
	player_id bigint;
	seen_colors text[] := '{}';
	seen_players bigint[] := '{}';
	team_count integer;
	i integer;
	new_event public.championship_events%rowtype;
	new_team public.championship_event_teams%rowtype;
	player public.championship_players%rowtype;
	starts_at timestamptz;
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if event_date is null then
		raise exception 'invalid event date' using errcode = '23514';
	end if;

	if jsonb_typeof(teams) is distinct from 'array' then
		raise exception 'invalid teams' using errcode = '23514';
	end if;

	team_count := jsonb_array_length(teams);
	if team_count < 2 then
		raise exception 'invalid teams' using errcode = '23514';
	end if;

	select *
	into championship
	from public.championships c
	where c.id = start_championship_event.championship_id
		and c.deleted_at is null
	for update;

	if championship.id is null then
		raise exception 'championship not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(championship.id) not in ('owner', 'captain', 'admin') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	for i in 0 .. team_count - 1 loop
		team_item := teams -> i;
		if jsonb_typeof(team_item) is distinct from 'object' then
			raise exception 'invalid teams' using errcode = '23514';
		end if;

		team_color := team_item ->> 'color';
		if team_color is null or team_color not in (
			'white',
			'black',
			'red',
			'blue',
			'yellow',
			'green',
			'orange',
			'pink'
		) then
			raise exception 'invalid team color' using errcode = '23514';
		end if;

		if team_color = any (seen_colors) then
			raise exception 'duplicate team color' using errcode = '23505';
		end if;

		seen_colors := seen_colors || team_color;

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
			or cardinality(player_ids) > championship.players_per_team then
			raise exception 'invalid team size' using errcode = '23514';
		end if;

		foreach player_id in array player_ids loop
			if player_id = any (seen_players) then
				raise exception 'duplicate player' using errcode = '23505';
			end if;

			seen_players := seen_players || player_id;

			select *
			into player
			from public.championship_players p
			where p.id = player_id
				and p.championship_id = championship.id
				and p.deleted_at is null;

			if player.id is null then
				raise exception 'player not found' using errcode = 'P0002';
			end if;
		end loop;
	end loop;

	if exists (
		select 1
		from public.championship_events e
		where e.championship_id = championship.id
			and (e.starts_at at time zone 'America/Sao_Paulo')::date = event_date
	) then
		raise exception 'event already exists' using errcode = '23505';
	end if;

	starts_at :=
		(event_date::timestamp + championship.event_time)
		at time zone 'America/Sao_Paulo';

	insert into public.championship_events (
		championship_id,
		starts_at,
		players_per_team,
		created_by
	)
	values (
		championship.id,
		starts_at,
		championship.players_per_team,
		viewer
	)
	returning * into new_event;

	for i in 0 .. team_count - 1 loop
		team_item := teams -> i;
		team_color := team_item ->> 'color';

		select coalesce(array_agg(elem::bigint), '{}')
		into player_ids
		from jsonb_array_elements_text(team_item -> 'player_ids') as elem;

		insert into public.championship_event_teams (
			event_id,
			color,
			sort_order
		)
		values (
			new_event.id,
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
				display_name
			)
			values (
				new_event.id,
				new_team.id,
				player.id,
				player.display_name
			);
		end loop;
	end loop;

	return jsonb_build_object(
		'id', new_event.id,
		'championship_id', new_event.championship_id,
		'starts_at', new_event.starts_at,
		'players_per_team', new_event.players_per_team,
		'ended_at', new_event.ended_at
	);
end;
$$;

create or replace function public.add_championship_event_match(
	event_id bigint,
	team_a_id bigint,
	team_b_id bigint
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

	if add_championship_event_match.team_a_id = add_championship_event_match.team_b_id then
		raise exception 'same team' using errcode = '23514';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = add_championship_event_match.event_id
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(event.championship_id) not in ('owner', 'captain', 'admin') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	select *
	into team_a
	from public.championship_event_teams t
	where t.id = add_championship_event_match.team_a_id
		and t.event_id = event.id;

	select *
	into team_b
	from public.championship_event_teams t
	where t.id = add_championship_event_match.team_b_id
		and t.event_id = event.id;

	if team_a.id is null or team_b.id is null then
		raise exception 'team not in event' using errcode = '23514';
	end if;

	insert into public.championship_event_matches (
		event_id,
		team_a_id,
		team_b_id
	)
	values (
		event.id,
		team_a.id,
		team_b.id
	)
	returning * into match;

	return jsonb_build_object(
		'id', match.id,
		'event_id', match.event_id,
		'team_a_id', match.team_a_id,
		'team_b_id', match.team_b_id,
		'created_at', match.created_at
	);
end;
$$;

create or replace function public.end_championship_event(event_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	event public.championship_events%rowtype;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = end_championship_event.event_id
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(event.championship_id) not in ('owner', 'captain', 'admin') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if event.ended_at is not null then
		return jsonb_build_object(
			'id', event.id,
			'championship_id', event.championship_id,
			'starts_at', event.starts_at,
			'players_per_team', event.players_per_team,
			'ended_at', event.ended_at
		);
	end if;

	update public.championship_events
	set ended_at = now()
	where id = event.id
	returning * into event;

	return jsonb_build_object(
		'id', event.id,
		'championship_id', event.championship_id,
		'starts_at', event.starts_at,
		'players_per_team', event.players_per_team,
		'ended_at', event.ended_at
	);
end;
$$;

revoke all on function public.update_championship_event_config(bigint, time, smallint) from public;
revoke all on function public.start_championship_event(bigint, date, jsonb) from public;
revoke all on function public.add_championship_event_match(bigint, bigint, bigint) from public;
revoke all on function public.end_championship_event(bigint) from public;

grant execute on function public.update_championship_event_config(bigint, time, smallint) to authenticated;
grant execute on function public.start_championship_event(bigint, date, jsonb) to authenticated;
grant execute on function public.add_championship_event_match(bigint, bigint, bigint) to authenticated;
grant execute on function public.end_championship_event(bigint) to authenticated;

grant select on public.championship_events to authenticated;
grant select on public.championship_event_teams to authenticated;
grant select on public.championship_event_team_players to authenticated;
grant select on public.championship_event_matches to authenticated;

notify pgrst, 'reload schema';
