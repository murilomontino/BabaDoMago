create table if not exists public.championship_event_attendance (
	id bigint generated always as identity primary key,
	event_id bigint not null references public.championship_events (id) on delete cascade,
	player_id bigint not null references public.championship_players (id) on delete restrict,
	display_name text not null,
	unique (event_id, player_id)
);

create index if not exists championship_event_attendance_event_id_idx
	on public.championship_event_attendance (event_id);

create index if not exists championship_event_attendance_player_id_idx
	on public.championship_event_attendance (player_id);

insert into public.championship_event_attendance (
	event_id,
	player_id,
	display_name
)
select distinct
	tp.event_id,
	tp.player_id,
	tp.display_name
from public.championship_event_team_players tp
on conflict (event_id, player_id) do nothing;

alter table public.championship_event_team_players
	drop constraint if exists championship_event_team_players_attendance_fk;

alter table public.championship_event_team_players
	add constraint championship_event_team_players_attendance_fk
	foreign key (event_id, player_id)
	references public.championship_event_attendance (event_id, player_id);

alter table public.championship_event_attendance enable row level security;

drop policy if exists championship_event_attendance_select_member
	on public.championship_event_attendance;

create policy championship_event_attendance_select_member
	on public.championship_event_attendance
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

drop function if exists public.start_championship_event(bigint, date, jsonb);

create or replace function public.start_championship_event(
	championship_id bigint,
	event_date date,
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
	championship public.championships%rowtype;
	team_item jsonb;
	team_color text;
	player_ids bigint[];
	present_ids bigint[];
	player_id bigint;
	seen_colors text[] := '{}';
	seen_players bigint[] := '{}';
	seen_present bigint[] := '{}';
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

	foreach player_id in array present_ids loop
		if player_id = any (seen_present) then
			raise exception 'duplicate attendance' using errcode = '23505';
		end if;

		seen_present := seen_present || player_id;

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

			if player_id <> all (present_ids) then
				raise exception 'player not present' using errcode = '23514';
			end if;

			seen_players := seen_players || player_id;
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

	insert into public.championship_event_attendance (
		event_id,
		player_id,
		display_name
	)
	select
		new_event.id,
		p.id,
		p.display_name
	from unnest(present_ids) as pid
	join public.championship_players p on p.id = pid;

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

revoke all on function public.start_championship_event(bigint, date, jsonb, jsonb) from public;
grant execute on function public.start_championship_event(bigint, date, jsonb, jsonb) to authenticated;
grant select on public.championship_event_attendance to authenticated;

notify pgrst, 'reload schema';
