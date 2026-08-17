-- Attendance dynamics: staff late-join, RSVP, self check-in.

create table if not exists public.championship_event_rsvp (
	id bigint generated always as identity primary key,
	event_id bigint not null references public.championship_events (id) on delete cascade,
	player_id bigint not null references public.championship_players (id) on delete cascade,
	status text not null,
	updated_at timestamptz not null default timezone('utc', now()),
	unique (event_id, player_id),
	constraint championship_event_rsvp_status_check
		check (status in ('going', 'out'))
);

create index if not exists championship_event_rsvp_event_id_idx
	on public.championship_event_rsvp (event_id);

create index if not exists championship_event_rsvp_player_id_idx
	on public.championship_event_rsvp (player_id);

alter table public.championship_event_rsvp enable row level security;

drop policy if exists championship_event_rsvp_select_member
	on public.championship_event_rsvp;

create policy championship_event_rsvp_select_member
	on public.championship_event_rsvp
	for select
	to authenticated
	using (
		exists (
			select 1
			from public.championship_events e
			where e.id = championship_event_rsvp.event_id
				and public.is_championship_member(e.championship_id)
		)
	);

grant select on public.championship_event_rsvp to authenticated;

create or replace function public.save_championship_event_attendance(
	event_id bigint,
	present_player_ids jsonb,
	goalkeeper_player_ids jsonb
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
	player_id bigint;
	seen_present bigint[] := '{}';
	seen_goalkeepers bigint[] := '{}';
	player public.championship_players%rowtype;
	removed_ids bigint[];
begin
	if (select auth.uid()) is null then
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

	if jsonb_typeof(goalkeeper_player_ids) is distinct from 'array' then
		raise exception 'invalid attendance' using errcode = '23514';
	end if;

	if exists (
		select 1
		from jsonb_array_elements(goalkeeper_player_ids) elem
		where jsonb_typeof(elem) is distinct from 'number'
	) then
		raise exception 'invalid attendance' using errcode = '23514';
	end if;

	select coalesce(array_agg(elem::bigint), '{}')
	into goalkeeper_ids
	from jsonb_array_elements_text(goalkeeper_player_ids) as elem;

	select *
	into event
	from public.championship_events e
	where e.id = save_championship_event_attendance.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(event.championship_id) not in (
		'owner',
		'captain',
		'admin'
	) then
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

	if exists (
		select 1
		from public.championship_event_team_players tp
		where tp.event_id = event.id
			and tp.player_id <> all (present_ids)
	) then
		raise exception 'player not present' using errcode = '23514';
	end if;

	select coalesce(array_agg(a.player_id), '{}')
	into removed_ids
	from public.championship_event_attendance a
	where a.event_id = event.id
		and a.player_id <> all (present_ids);

	delete from public.championship_event_attendance a
	where a.event_id = event.id
		and a.player_id <> all (present_ids);

	update public.championship_event_attendance a
	set
		is_goalkeeper = (a.player_id = any (goalkeeper_ids)),
		event_date = (event.starts_at at time zone 'America/Sao_Paulo')::date
	where a.event_id = event.id
		and a.player_id = any (present_ids);

	insert into public.championship_event_attendance (
		event_id,
		player_id,
		display_name,
		is_goalkeeper,
		event_date
	)
	select
		event.id,
		p.id,
		coalesce(nullif(btrim(p.nickname), ''), p.display_name),
		p.id = any (goalkeeper_ids),
		(event.starts_at at time zone 'America/Sao_Paulo')::date
	from unnest(present_ids) as u(pid)
	join public.championship_players p on p.id = u.pid
	where not exists (
		select 1
		from public.championship_event_attendance existing
		where existing.event_id = event.id
			and existing.player_id = p.id
	);

	perform public.sync_championship_players_from_attendance(
		coalesce(removed_ids, '{}')
	);

	return jsonb_build_object(
		'id', event.id,
		'championship_id', event.championship_id,
		'starts_at', event.starts_at,
		'players_per_team', event.players_per_team,
		'ended_at', event.ended_at
	);
end;
$$;

create or replace function public.ensure_championship_event_attendance_player(
	event_id bigint,
	player_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	viewer uuid := (select auth.uid());
	event public.championship_events%rowtype;
	player public.championship_players%rowtype;
	actor_role text;
	is_self boolean;
	event_day date;
	today_sp date;
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = ensure_championship_event_attendance_player.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if event.ended_at is not null then
		raise exception 'event already ended' using errcode = '23514';
	end if;

	select *
	into player
	from public.championship_players p
	where p.id = ensure_championship_event_attendance_player.player_id
		and p.championship_id = event.championship_id
		and p.deleted_at is null;

	if player.id is null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	actor_role := public.championship_actor_role(event.championship_id);
	is_self := player.user_id is not distinct from viewer;
	event_day := (event.starts_at at time zone 'America/Sao_Paulo')::date;
	today_sp := (timezone('utc', now()) at time zone 'America/Sao_Paulo')::date;

	if actor_role not in ('owner', 'captain', 'admin') then
		if not is_self then
			raise exception 'not allowed' using errcode = '42501';
		end if;

		if event_day is distinct from today_sp then
			raise exception 'not event day' using errcode = '23514';
		end if;
	end if;

	insert into public.championship_event_attendance (
		event_id,
		player_id,
		display_name,
		is_goalkeeper,
		event_date
	)
	select
		event.id,
		player.id,
		coalesce(nullif(btrim(player.nickname), ''), player.display_name),
		player.is_goalkeeper,
		event_day
	where not exists (
		select 1
		from public.championship_event_attendance a
		where a.event_id = event.id
			and a.player_id = player.id
	);

	return jsonb_build_object(
		'id', event.id,
		'player_id', player.id
	);
end;
$$;

create or replace function public.upsert_championship_event_rsvp(
	p_event_id bigint,
	p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	viewer uuid := (select auth.uid());
	event_row public.championship_events%rowtype;
	player_row public.championship_players%rowtype;
	rsvp_id bigint;
	rsvp_event_id bigint;
	rsvp_player_id bigint;
	rsvp_status text;
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if p_status not in ('going', 'out') then
		raise exception 'invalid rsvp' using errcode = '23514';
	end if;

	select *
	into event_row
	from public.championship_events e
	where e.id = p_event_id
		and e.deleted_at is null
	for update;

	if event_row.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if event_row.ended_at is not null then
		raise exception 'event already ended' using errcode = '23514';
	end if;

	select *
	into player_row
	from public.championship_players p
	where p.championship_id = event_row.championship_id
		and p.user_id = viewer
		and p.deleted_at is null;

	if player_row.id is null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	insert into public.championship_event_rsvp as r (
		event_id,
		player_id,
		status,
		updated_at
	)
	values (
		event_row.id,
		player_row.id,
		p_status,
		timezone('utc', now())
	)
	on conflict (event_id, player_id) do update
	set
		status = excluded.status,
		updated_at = excluded.updated_at
	returning r.id, r.event_id, r.player_id, r.status
	into rsvp_id, rsvp_event_id, rsvp_player_id, rsvp_status;

	return jsonb_build_object(
		'id', rsvp_id,
		'event_id', rsvp_event_id,
		'player_id', rsvp_player_id,
		'status', rsvp_status
	);
end;
$$;

create or replace function public.promote_championship_event_rsvp_going(
	event_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	event public.championship_events%rowtype;
	added integer := 0;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = promote_championship_event_rsvp_going.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(event.championship_id) not in (
		'owner',
		'captain',
		'admin'
	) then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	with going as (
		select r.player_id
		from public.championship_event_rsvp r
		join public.championship_players p on p.id = r.player_id
		where r.event_id = event.id
			and r.status = 'going'
			and p.championship_id = event.championship_id
			and p.deleted_at is null
	),
	ins as (
		insert into public.championship_event_attendance (
			event_id,
			player_id,
			display_name,
			is_goalkeeper,
			event_date
		)
		select
			event.id,
			p.id,
			coalesce(nullif(btrim(p.nickname), ''), p.display_name),
			p.is_goalkeeper,
			(event.starts_at at time zone 'America/Sao_Paulo')::date
		from going g
		join public.championship_players p on p.id = g.player_id
		where not exists (
			select 1
			from public.championship_event_attendance a
			where a.event_id = event.id
				and a.player_id = p.id
		)
		returning 1
	)
	select count(*)::integer into added from ins;

	return jsonb_build_object(
		'id', event.id,
		'added', coalesce(added, 0)
	);
end;
$$;

grant execute on function public.save_championship_event_attendance(bigint, jsonb, jsonb)
	to authenticated;
grant execute on function public.ensure_championship_event_attendance_player(bigint, bigint)
	to authenticated;
grant execute on function public.upsert_championship_event_rsvp(bigint, text)
	to authenticated;
grant execute on function public.promote_championship_event_rsvp_going(bigint)
	to authenticated;

notify pgrst, 'reload schema';
