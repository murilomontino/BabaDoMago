create table public.championship_audit_logs (
	id bigint generated always as identity primary key,
	championship_id bigint not null references public.championships (id) on delete cascade,
	actor_user_id uuid references auth.users (id) on delete set null,
	actor_display_name text not null,
	action text not null,
	entity_type text not null,
	entity_id bigint,
	before_data jsonb,
	after_data jsonb,
	created_at timestamptz not null default now(),
	constraint championship_audit_logs_action_check check (
		action in (
			'update_player_rating',
			'save_player_event_stats',
			'save_attendance_stats',
			'set_event_mvps',
			'set_player_role',
			'merge_players',
			'remove_player',
			'claim_player',
			'unlink_player',
			'transfer_owner',
			'update_event_config',
			'update_visibility',
			'rename_championship'
		)
	),
	constraint championship_audit_logs_entity_type_check check (
		entity_type in ('player', 'event', 'championship')
	)
);

create index championship_audit_logs_list_idx
	on public.championship_audit_logs (championship_id, id desc);

create index championship_audit_logs_created_at_idx
	on public.championship_audit_logs (championship_id, created_at desc);

alter table public.championship_audit_logs enable row level security;

create policy championship_audit_logs_select_managers
	on public.championship_audit_logs
	for select
	to authenticated
	using (
		public.championship_actor_role(championship_id) in (
			'owner',
			'captain',
			'admin'
		)
	);

grant select on table public.championship_audit_logs to authenticated;

create or replace function public.championship_audit_log(
	p_championship_id bigint,
	p_action text,
	p_entity_type text,
	p_entity_id bigint,
	p_before jsonb,
	p_after jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	actor uuid := (select auth.uid());
	actor_name text;
begin
	select coalesce(
		(
			select coalesce(nullif(btrim(p.nickname), ''), p.display_name)
			from public.championship_players p
			where p.championship_id = p_championship_id
				and p.user_id = actor
				and p.deleted_at is null
			limit 1
		),
		(
			select u.display_name
			from public.users u
			where u.id = actor
		),
		'Jogador'
	)
	into actor_name;

	insert into public.championship_audit_logs (
		championship_id,
		actor_user_id,
		actor_display_name,
		action,
		entity_type,
		entity_id,
		before_data,
		after_data
	)
	values (
		p_championship_id,
		actor,
		actor_name,
		p_action,
		p_entity_type,
		p_entity_id,
		p_before,
		p_after
	);
end;
$$;

create or replace function public.list_championship_audit_logs(
	p_championship_id bigint,
	p_action text default null,
	p_before_id bigint default null,
	p_page_size integer default 30
)
returns setof public.championship_audit_logs
language plpgsql
stable
security invoker
set search_path = public
as $$
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if public.championship_actor_role(p_championship_id) not in (
		'owner',
		'captain',
		'admin'
	) then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if p_page_size is null
		or p_page_size < 1
		or p_page_size > 100
	then
		raise exception 'invalid page size' using errcode = '23514';
	end if;

	if p_action is not null
		and p_action not in (
			'update_player_rating',
			'save_player_event_stats',
			'save_attendance_stats',
			'set_event_mvps',
			'set_player_role',
			'merge_players',
			'remove_player',
			'claim_player',
			'unlink_player',
			'transfer_owner',
			'update_event_config',
			'update_visibility',
			'rename_championship'
		)
	then
		raise exception 'invalid audit action' using errcode = '23514';
	end if;

	return query
	select l.*
	from public.championship_audit_logs l
	where l.championship_id = p_championship_id
		and (p_action is null or l.action = p_action)
		and (p_before_id is null or l.id < p_before_id)
	order by l.id desc
	limit p_page_size;
end;
$$;

revoke all on function public.championship_audit_log(
	bigint,
	text,
	text,
	bigint,
	jsonb,
	jsonb
) from public;

revoke all on function public.list_championship_audit_logs(
	bigint,
	text,
	bigint,
	integer
) from public;

grant execute on function public.list_championship_audit_logs(
	bigint,
	text,
	bigint,
	integer
) to authenticated;

create or replace function public.update_player_rating(player_id bigint, rating numeric)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	viewer uuid := (select auth.uid());
	player public.championship_players%rowtype;
	old_rating numeric;
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if update_player_rating.rating < 0 or update_player_rating.rating > 100 then
		raise exception 'invalid rating' using errcode = '23514';
	end if;

	select *
	into player
	from public.championship_players p
	where p.id = update_player_rating.player_id
	for update;

	if player.id is null or player.deleted_at is not null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(player.championship_id) not in ('owner', 'captain', 'admin') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	old_rating := player.rating;

	update public.championship_players
	set rating = update_player_rating.rating
	where id = player.id
	returning * into player;

	perform public.championship_audit_log(
		player.championship_id,
		'update_player_rating',
		'player',
		player.id,
		jsonb_build_object('rating', old_rating),
		jsonb_build_object('rating', player.rating)
	);

	return public.championship_player_json(player);
end;
$$;

create or replace function public.set_player_role(player_id bigint, role text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	player public.championship_players%rowtype;
	championship public.championships%rowtype;
	old_role text;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if set_player_role.role not in ('captain', 'admin', 'member') then
		raise exception 'invalid role' using errcode = '23514';
	end if;

	select *
	into player
	from public.championship_players p
	where p.id = set_player_role.player_id
	for update;

	if player.id is null or player.deleted_at is not null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(player.championship_id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if player.user_id is null then
		raise exception 'player has no account' using errcode = '23514';
	end if;

	select *
	into championship
	from public.championships c
	where c.id = player.championship_id;

	if championship.created_by = player.user_id then
		raise exception 'cannot change owner role' using errcode = '42501';
	end if;

	old_role := player.role;

	update public.championship_players
	set role = set_player_role.role
	where id = player.id
	returning * into player;

	perform public.championship_audit_log(
		player.championship_id,
		'set_player_role',
		'player',
		player.id,
		jsonb_build_object('role', old_role, 'display_name', player.display_name),
		jsonb_build_object('role', player.role, 'display_name', player.display_name)
	);

	return public.championship_player_json(player);
end;
$$;

create or replace function public.unlink_player(player_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	viewer uuid := (select auth.uid());
	player public.championship_players%rowtype;
	championship public.championships%rowtype;
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into player
	from public.championship_players p
	where p.id = unlink_player.player_id
	for update;

	if player.id is null or player.deleted_at is not null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	select *
	into championship
	from public.championships c
	where c.id = player.championship_id
		and c.deleted_at is null;

	if championship.id is null then
		raise exception 'championship not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(championship.id) not in ('owner', 'captain', 'admin') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if player.user_id is null then
		raise exception 'player has no account' using errcode = '23514';
	end if;

	if player.user_id = championship.created_by then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	update public.championship_players
	set
		user_id = null,
		avatar_url = null,
		role = 'member'
	where id = player.id
	returning * into player;

	perform public.championship_audit_log(
		player.championship_id,
		'unlink_player',
		'player',
		player.id,
		jsonb_build_object('display_name', player.display_name, 'claimed', true),
		jsonb_build_object('display_name', player.display_name, 'claimed', false)
	);

	return public.championship_player_json(player);
end;
$$;

create or replace function public.claim_player(player_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	viewer uuid := (select auth.uid());
	player public.championship_players%rowtype;
	championship public.championships%rowtype;
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into player
	from public.championship_players p
	where p.id = claim_player.player_id
	for update;

	if player.id is null or player.deleted_at is not null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	select *
	into championship
	from public.championships c
	where c.id = player.championship_id
		and c.deleted_at is null;

	if championship.id is null then
		raise exception 'championship not found' using errcode = 'P0002';
	end if;

	if not championship.is_visible then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if player.user_id is not null then
		raise exception 'player already claimed' using errcode = '23514';
	end if;

	if exists (
		select 1
		from public.championship_players p
		where p.championship_id = player.championship_id
			and p.user_id = viewer
	) then
		raise exception 'already in championship' using errcode = '23505';
	end if;

	update public.championship_players
	set
		user_id = viewer,
		avatar_url = public.current_user_avatar_url()
	where id = player.id
	returning * into player;

	perform public.championship_audit_log(
		player.championship_id,
		'claim_player',
		'player',
		player.id,
		jsonb_build_object('display_name', player.display_name, 'claimed', false),
		jsonb_build_object('display_name', player.display_name, 'claimed', true)
	);

	return public.championship_player_json(player);
end;
$$;

create or replace function public.update_championship_visibility(
	championship_id bigint,
	is_visible boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	championship public.championships%rowtype;
	old_visible boolean;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into championship
	from public.championships c
	where c.id = update_championship_visibility.championship_id
		and c.deleted_at is null
	for update;

	if championship.id is null then
		raise exception 'championship not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(championship.id) not in ('owner', 'captain') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	old_visible := championship.is_visible;

	update public.championships
	set is_visible = update_championship_visibility.is_visible
	where id = championship.id
	returning * into championship;

	perform public.championship_audit_log(
		championship.id,
		'update_visibility',
		'championship',
		championship.id,
		jsonb_build_object('is_visible', old_visible),
		jsonb_build_object('is_visible', championship.is_visible)
	);

	return jsonb_build_object(
		'id', championship.id,
		'name', championship.name,
		'invite_code', championship.invite_code,
		'created_by', championship.created_by,
		'logo_path', championship.logo_path,
		'event_time', championship.event_time,
		'players_per_team', championship.players_per_team,
		'is_visible', championship.is_visible
	);
end;
$$;

create or replace function public.update_championship_name(championship_id bigint, name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	championship public.championships%rowtype;
	trimmed text := btrim(update_championship_name.name);
	old_name text;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if trimmed is null or trimmed = '' then
		raise exception 'invalid name' using errcode = '23514';
	end if;

	if public.championship_actor_role(update_championship_name.championship_id) not in ('owner', 'captain') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	select *
	into championship
	from public.championships c
	where c.id = update_championship_name.championship_id
	for update;

	if championship.id is null then
		raise exception 'championship not found' using errcode = 'P0002';
	end if;

	old_name := championship.name;

	update public.championships c
	set name = trimmed
	where c.id = championship.id
	returning * into championship;

	perform public.championship_audit_log(
		championship.id,
		'rename_championship',
		'championship',
		championship.id,
		jsonb_build_object('name', old_name),
		jsonb_build_object('name', championship.name)
	);

	return jsonb_build_object(
		'id', championship.id,
		'name', championship.name,
		'invite_code', championship.invite_code,
		'created_by', championship.created_by,
		'logo_path', championship.logo_path
	);
end;
$$;

create or replace function public.transfer_championship_owner(player_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	viewer uuid := (select auth.uid());
	player public.championship_players%rowtype;
	championship public.championships%rowtype;
	previous_owner uuid;
	previous_name text;
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into player
	from public.championship_players p
	where p.id = transfer_championship_owner.player_id
	for update;

	if player.id is null or player.deleted_at is not null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	select *
	into championship
	from public.championships c
	where c.id = player.championship_id
		and c.deleted_at is null
	for update;

	if championship.id is null then
		raise exception 'championship not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(championship.id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if player.user_id is null then
		raise exception 'player has no account' using errcode = '23514';
	end if;

	if player.user_id = championship.created_by then
		raise exception 'cannot transfer to self' using errcode = '23514';
	end if;

	previous_owner := championship.created_by;

	select coalesce(nullif(btrim(p.nickname), ''), p.display_name)
	into previous_name
	from public.championship_players p
	where p.championship_id = championship.id
		and p.user_id = previous_owner
		and p.deleted_at is null
	limit 1;

	update public.championships
	set created_by = player.user_id
	where id = championship.id
	returning * into championship;

	update public.championship_players
	set role = 'member'
	where championship_id = championship.id
		and user_id = previous_owner
		and deleted_at is null;

	perform public.championship_audit_log(
		championship.id,
		'transfer_owner',
		'player',
		player.id,
		jsonb_build_object('display_name', coalesce(previous_name, 'Jogador')),
		jsonb_build_object('display_name', player.display_name)
	);

	return jsonb_build_object(
		'id', championship.id,
		'name', championship.name,
		'invite_code', championship.invite_code,
		'created_by', championship.created_by
	);
end;
$$;

create or replace function public.remove_player(player_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	viewer uuid := (select auth.uid());
	player public.championship_players%rowtype;
	championship public.championships%rowtype;
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into player
	from public.championship_players p
	where p.id = remove_player.player_id
	for update;

	if player.id is null
		or player.deleted_at is null
		or player.user_id is not null
		or player.removed_at is not null
	then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	select *
	into championship
	from public.championships c
	where c.id = player.championship_id
		and c.deleted_at is null;

	if championship.id is null then
		raise exception 'championship not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(championship.id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	update public.championship_players
	set removed_at = now()
	where id = player.id
		and deleted_at is not null
		and user_id is null
		and removed_at is null;

	if not found then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	perform public.championship_audit_log(
		player.championship_id,
		'remove_player',
		'player',
		player.id,
		jsonb_build_object('display_name', player.display_name),
		null
	);
end;
$$;

create or replace function public.update_championship_event_config(
	championship_id bigint,
	event_time time,
	players_per_team smallint,
	skip_guest_goalkeeper_matches boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	championship public.championships%rowtype;
	open_event_ids bigint[];
	player_ids bigint[];
	open_event_id bigint;
	before_data jsonb;
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

	before_data := jsonb_build_object(
		'event_time', championship.event_time,
		'players_per_team', championship.players_per_team,
		'skip_guest_goalkeeper_matches', championship.skip_guest_goalkeeper_matches
	);

	update public.championships
	set
		event_time = update_championship_event_config.event_time,
		players_per_team = update_championship_event_config.players_per_team,
		skip_guest_goalkeeper_matches = coalesce(
			update_championship_event_config.skip_guest_goalkeeper_matches,
			true
		)
	where id = championship.id
	returning * into championship;

	select coalesce(array_agg(e.id), '{}')
	into open_event_ids
	from public.championship_events e
	where e.championship_id = championship.id
		and e.ended_at is null
		and e.deleted_at is null;

	update public.championship_events
	set skip_guest_goalkeeper_matches = championship.skip_guest_goalkeeper_matches
	where id = any (open_event_ids);

	foreach open_event_id in array open_event_ids loop
		perform public.refresh_championship_event_attendance_stats(open_event_id);
	end loop;

	select coalesce(array_agg(distinct a.player_id), '{}')
	into player_ids
	from public.championship_event_attendance a
	where a.event_id = any (open_event_ids);

	perform public.sync_championship_players_from_attendance(player_ids);

	perform public.championship_audit_log(
		championship.id,
		'update_event_config',
		'championship',
		championship.id,
		before_data,
		jsonb_build_object(
			'event_time', championship.event_time,
			'players_per_team', championship.players_per_team,
			'skip_guest_goalkeeper_matches', championship.skip_guest_goalkeeper_matches
		)
	);

	return jsonb_build_object(
		'id', championship.id,
		'name', championship.name,
		'invite_code', championship.invite_code,
		'created_by', championship.created_by,
		'logo_path', championship.logo_path,
		'event_time', championship.event_time,
		'players_per_team', championship.players_per_team,
		'skip_guest_goalkeeper_matches', championship.skip_guest_goalkeeper_matches
	);
end;
$$;

create or replace function public.save_championship_player_event_stats(
	player_id bigint,
	event_id bigint,
	goals integer,
	assists integer,
	wins integer,
	losses integer,
	draws integer,
	matches integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
	event public.championship_events%rowtype;
	player public.championship_players%rowtype;
	before_stats jsonb;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if goals < 0
		or assists < 0
		or wins < 0
		or losses < 0
		or draws < 0
		or matches < 0
	then
		raise exception 'invalid attendance stats' using errcode = '23514';
	end if;

	if wins > matches then
		raise exception 'wins exceed matches' using errcode = '23514';
	end if;

	if wins + losses + draws > matches then
		raise exception 'result stats mismatch' using errcode = '23514';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = save_championship_player_event_stats.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if event.ended_at is null then
		raise exception 'event still open' using errcode = '23514';
	end if;

	if public.championship_actor_role(event.championship_id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	select *
	into player
	from public.championship_players p
	where p.id = save_championship_player_event_stats.player_id
		and p.championship_id = event.championship_id
		and p.deleted_at is null
	for update;

	if player.id is null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	select jsonb_build_object(
		'goals', a.goals,
		'assists', a.assists,
		'wins', a.wins,
		'losses', a.losses,
		'draws', a.draws,
		'matches', a.matches
	)
	into before_stats
	from public.championship_event_attendance a
	where a.event_id = event.id
		and a.player_id = player.id;

	insert into public.championship_event_attendance (
		event_id,
		player_id,
		display_name,
		goals,
		assists,
		wins,
		losses,
		draws,
		matches
	)
	values (
		event.id,
		player.id,
		coalesce(nullif(btrim(player.nickname), ''), player.display_name),
		save_championship_player_event_stats.goals,
		save_championship_player_event_stats.assists,
		save_championship_player_event_stats.wins,
		save_championship_player_event_stats.losses,
		save_championship_player_event_stats.draws,
		save_championship_player_event_stats.matches
	)
	on conflict (event_id, player_id) do update
	set
		goals = excluded.goals,
		assists = excluded.assists,
		wins = excluded.wins,
		losses = excluded.losses,
		draws = excluded.draws,
		matches = excluded.matches;

	perform public.assign_championship_event_mvps(event.id);
	perform public.adjust_championship_player_ratings_for_event(event.id);

	perform public.championship_audit_log(
		event.championship_id,
		'save_player_event_stats',
		'player',
		player.id,
		before_stats,
		jsonb_build_object(
			'event_id', event.id,
			'goals', save_championship_player_event_stats.goals,
			'assists', save_championship_player_event_stats.assists,
			'wins', save_championship_player_event_stats.wins,
			'losses', save_championship_player_event_stats.losses,
			'draws', save_championship_player_event_stats.draws,
			'matches', save_championship_player_event_stats.matches
		)
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

create or replace function public.save_championship_event_attendance_stats(
	event_id bigint,
	stats jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	event public.championship_events%rowtype;
	player_ids bigint[];
	before_stats jsonb;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if jsonb_typeof(stats) is distinct from 'array' then
		raise exception 'invalid attendance stats' using errcode = '23514';
	end if;

	if exists (
		select 1
		from jsonb_array_elements(stats) elem
		where jsonb_typeof(elem) is distinct from 'object'
			or jsonb_typeof(elem -> 'player_id') is distinct from 'number'
			or jsonb_typeof(elem -> 'goals') is distinct from 'number'
			or jsonb_typeof(elem -> 'assists') is distinct from 'number'
			or jsonb_typeof(elem -> 'own_goals') is distinct from 'number'
			or jsonb_typeof(elem -> 'wins') is distinct from 'number'
			or jsonb_typeof(elem -> 'losses') is distinct from 'number'
			or jsonb_typeof(elem -> 'draws') is distinct from 'number'
			or jsonb_typeof(elem -> 'matches') is distinct from 'number'
	) then
		raise exception 'invalid attendance stats' using errcode = '23514';
	end if;

	if exists (
		select 1
		from jsonb_array_elements(stats) elem
		where (elem ->> 'player_id')::numeric <> trunc((elem ->> 'player_id')::numeric)
			or (elem ->> 'goals')::numeric <> trunc((elem ->> 'goals')::numeric)
			or (elem ->> 'assists')::numeric <> trunc((elem ->> 'assists')::numeric)
			or (elem ->> 'own_goals')::numeric <> trunc((elem ->> 'own_goals')::numeric)
			or (elem ->> 'wins')::numeric <> trunc((elem ->> 'wins')::numeric)
			or (elem ->> 'losses')::numeric <> trunc((elem ->> 'losses')::numeric)
			or (elem ->> 'draws')::numeric <> trunc((elem ->> 'draws')::numeric)
			or (elem ->> 'matches')::numeric <> trunc((elem ->> 'matches')::numeric)
			or (elem ->> 'player_id')::bigint <= 0
			or (elem ->> 'goals')::integer < 0
			or (elem ->> 'assists')::integer < 0
			or (elem ->> 'own_goals')::integer < 0
			or (elem ->> 'wins')::integer < 0
			or (elem ->> 'losses')::integer < 0
			or (elem ->> 'draws')::integer < 0
			or (elem ->> 'matches')::integer < 0
	) then
		raise exception 'invalid attendance stats' using errcode = '23514';
	end if;

	if exists (
		select 1
		from jsonb_array_elements(stats) elem
		where (elem ->> 'wins')::integer > (elem ->> 'matches')::integer
	) then
		raise exception 'wins exceed matches' using errcode = '23514';
	end if;

	if exists (
		select 1
		from jsonb_array_elements(stats) elem
		where (elem ->> 'wins')::integer
			+ (elem ->> 'losses')::integer
			+ (elem ->> 'draws')::integer
			> (elem ->> 'matches')::integer
	) then
		raise exception 'result stats mismatch' using errcode = '23514';
	end if;

	select coalesce(array_agg((elem ->> 'player_id')::bigint), '{}')
	into player_ids
	from jsonb_array_elements(stats) elem;

	if (
		select count(*) <> count(distinct (elem ->> 'player_id')::bigint)
		from jsonb_array_elements(stats) elem
	) then
		raise exception 'duplicate attendance' using errcode = '23505';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = save_championship_event_attendance_stats.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(event.championship_id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if not exists (
		select 1
		from public.championship_event_attendance a
		where a.event_id = event.id
	) then
		raise exception 'invalid attendance' using errcode = '23514';
	end if;

	if exists (
		select 1
		from public.championship_event_attendance a
		where a.event_id = event.id
			and a.player_id <> all (player_ids)
	) then
		raise exception 'invalid attendance stats' using errcode = '23514';
	end if;

	if exists (
		select 1
		from unnest(player_ids) as u(player_id)
		where not exists (
			select 1
			from public.championship_event_attendance a
			where a.event_id = event.id
				and a.player_id = u.player_id
		)
	) then
		raise exception 'player not present' using errcode = '23514';
	end if;

	select coalesce(
		jsonb_agg(
			jsonb_build_object(
				'player_id', a.player_id,
				'goals', a.goals,
				'assists', a.assists,
				'own_goals', a.own_goals,
				'wins', a.wins,
				'losses', a.losses,
				'draws', a.draws,
				'matches', a.matches
			)
			order by a.player_id
		),
		'[]'::jsonb
	)
	into before_stats
	from public.championship_event_attendance a
	where a.event_id = event.id;

	update public.championship_event_attendance a
	set
		goals = s.goals,
		assists = s.assists,
		own_goals = s.own_goals,
		wins = s.wins,
		losses = s.losses,
		draws = s.draws,
		matches = s.matches
	from (
		select
			(elem ->> 'player_id')::bigint as player_id,
			(elem ->> 'goals')::integer as goals,
			(elem ->> 'assists')::integer as assists,
			(elem ->> 'own_goals')::integer as own_goals,
			(elem ->> 'wins')::integer as wins,
			(elem ->> 'losses')::integer as losses,
			(elem ->> 'draws')::integer as draws,
			(elem ->> 'matches')::integer as matches
		from jsonb_array_elements(stats) elem
	) s
	where a.event_id = event.id
		and a.player_id = s.player_id;

	perform public.assign_championship_event_mvps(event.id);
	perform public.adjust_championship_player_ratings_for_event(event.id);

	perform public.championship_audit_log(
		event.championship_id,
		'save_attendance_stats',
		'event',
		event.id,
		before_stats,
		stats
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

create or replace function public.set_championship_event_mvps(
	event_id bigint,
	player_ids jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	event public.championship_events%rowtype;
	mvp_ids bigint[];
	player_ids_sync bigint[];
	before_mvps jsonb;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if jsonb_typeof(player_ids) is distinct from 'array' then
		raise exception 'invalid attendance' using errcode = '23514';
	end if;

	if exists (
		select 1
		from jsonb_array_elements(player_ids) elem
		where jsonb_typeof(elem) is distinct from 'number'
	) then
		raise exception 'invalid attendance' using errcode = '23514';
	end if;

	select coalesce(array_agg(elem::bigint), '{}')
	into mvp_ids
	from jsonb_array_elements_text(player_ids) as elem;

	if (
		select count(*) <> count(distinct u.player_id)
		from unnest(mvp_ids) as u(player_id)
	) then
		raise exception 'duplicate attendance' using errcode = '23505';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = set_championship_event_mvps.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if event.ended_at is null then
		raise exception 'event still open' using errcode = '23514';
	end if;

	if public.championship_actor_role(event.championship_id) not in ('owner', 'captain') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if exists (
		select 1
		from unnest(mvp_ids) as u(player_id)
		where not exists (
			select 1
			from public.championship_event_attendance a
			where a.event_id = event.id
				and a.player_id = u.player_id
		)
	) then
		raise exception 'player not present' using errcode = '23514';
	end if;

	select coalesce(jsonb_agg(a.player_id order by a.player_id), '[]'::jsonb)
	into before_mvps
	from public.championship_event_attendance a
	where a.event_id = event.id
		and a.is_mvp;

	with bonus as (
		select
			a.id,
			a.player_id,
			case when a.player_id = any (mvp_ids) then 0.1 else 0 end
				- case when a.is_mvp then 0.1 else 0 end as bonus_fix
		from public.championship_event_attendance a
		where a.event_id = event.id
	),
	updated_attendance as (
		update public.championship_event_attendance a
		set
			is_mvp = a.player_id = any (mvp_ids),
			mvp_overridden = true,
			rating_delta = round((a.rating_delta + b.bonus_fix)::numeric, 1)
		from bonus b
		where a.id = b.id
		returning a.player_id, b.bonus_fix
	)
	update public.championship_players p
	set rating = public.championship_player_rating_apply(p.rating, u.bonus_fix)
	from updated_attendance u
	where p.id = u.player_id
		and u.bonus_fix <> 0;

	select coalesce(array_agg(a.player_id), '{}')
	into player_ids_sync
	from public.championship_event_attendance a
	where a.event_id = event.id;

	perform public.sync_championship_players_from_attendance(player_ids_sync);

	perform public.championship_audit_log(
		event.championship_id,
		'set_event_mvps',
		'event',
		event.id,
		jsonb_build_object('player_ids', before_mvps),
		jsonb_build_object('player_ids', to_jsonb(mvp_ids))
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

create or replace function public.merge_championship_players(
	keep_player_id bigint,
	absorb_player_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	viewer uuid := (select auth.uid());
	keep public.championship_players%rowtype;
	absorb public.championship_players%rowtype;
	championship public.championships%rowtype;
	absorb_user_id uuid;
	absorb_avatar text;
	absorb_role text;
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if keep_player_id = absorb_player_id then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	perform 1
	from public.championship_players p
	where p.id in (
		merge_championship_players.keep_player_id,
		merge_championship_players.absorb_player_id
	)
	order by p.id
	for update;

	select *
	into keep
	from public.championship_players p
	where p.id = merge_championship_players.keep_player_id;

	select *
	into absorb
	from public.championship_players p
	where p.id = merge_championship_players.absorb_player_id;

	if keep.id is null
		or absorb.id is null
		or keep.deleted_at is not null
		or absorb.deleted_at is not null
	then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	if keep.championship_id is distinct from absorb.championship_id then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if keep.user_id is not null then
		raise exception 'player already claimed' using errcode = '23514';
	end if;

	if absorb.user_id is null then
		raise exception 'player has no account' using errcode = '23514';
	end if;

	select *
	into championship
	from public.championships c
	where c.id = keep.championship_id
		and c.deleted_at is null;

	if championship.id is null then
		raise exception 'championship not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(championship.id) not in ('owner', 'captain', 'admin') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if absorb.user_id = championship.created_by then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	set constraints
		championship_event_team_players_attendance_fk,
		championship_event_match_players_event_id_player_id_fkey,
		championship_event_goals_match_id_scorer_player_id_fkey,
		championship_event_goals_match_id_assist_player_id_fkey
	deferred;

	update public.championship_event_attendance k
	set
		is_mvp = k.is_mvp or a.is_mvp,
		mvp_overridden = k.mvp_overridden or a.mvp_overridden
	from public.championship_event_attendance a
	where a.player_id = absorb.id
		and k.player_id = keep.id
		and k.event_id = a.event_id;

	insert into public.championship_event_attendance (
		event_id,
		player_id,
		display_name,
		is_goalkeeper,
		event_date,
		goals,
		assists,
		own_goals,
		wins,
		matches,
		rating,
		rating_delta,
		is_mvp,
		mvp_overridden
	)
	select
		a.event_id,
		keep.id,
		keep.display_name,
		a.is_goalkeeper,
		a.event_date,
		a.goals,
		a.assists,
		a.own_goals,
		a.wins,
		a.matches,
		a.rating,
		a.rating_delta,
		a.is_mvp,
		a.mvp_overridden
	from public.championship_event_attendance a
	where a.player_id = absorb.id
		and not exists (
			select 1
			from public.championship_event_attendance k
			where k.event_id = a.event_id
				and k.player_id = keep.id
		);

	delete from public.championship_event_team_players tp
	where tp.player_id = absorb.id
		and exists (
			select 1
			from public.championship_event_team_players k
			where k.event_id = tp.event_id
				and k.player_id = keep.id
		);

	update public.championship_event_team_players
	set player_id = keep.id
	where player_id = absorb.id;

	delete from public.championship_event_match_players mp
	where mp.player_id = absorb.id
		and exists (
			select 1
			from public.championship_event_match_players k
			where k.match_id = mp.match_id
				and k.player_id = keep.id
		);

	update public.championship_event_match_players
	set player_id = keep.id
	where player_id = absorb.id;

	update public.championship_event_goals
	set assist_player_id = null
	where assist_player_id = absorb.id
		and scorer_player_id = keep.id;

	update public.championship_event_goals
	set assist_player_id = null
	where scorer_player_id = absorb.id
		and assist_player_id = keep.id;

	update public.championship_event_goals
	set scorer_player_id = keep.id
	where scorer_player_id = absorb.id;

	update public.championship_event_goals
	set assist_player_id = keep.id
	where assist_player_id = absorb.id;

	delete from public.championship_event_attendance
	where player_id = absorb.id;

	absorb_user_id := absorb.user_id;
	absorb_avatar := absorb.avatar_url;
	absorb_role := absorb.role;

	update public.championship_players
	set
		user_id = null,
		avatar_url = null,
		role = 'member'
	where id = absorb.id;

	update public.championship_players
	set
		user_id = absorb_user_id,
		avatar_url = absorb_avatar,
		role = absorb_role
	where id = keep.id;

	update public.championship_players
	set deleted_at = now()
	where id = absorb.id
		and deleted_at is null;

	perform public.sync_championship_players_from_attendance(array[keep.id]);

	select *
	into keep
	from public.championship_players p
	where p.id = keep.id;

	perform public.championship_audit_log(
		keep.championship_id,
		'merge_players',
		'player',
		keep.id,
		jsonb_build_object(
			'absorb_player_id', absorb.id,
			'display_name', absorb.display_name
		),
		jsonb_build_object(
			'keep_player_id', keep.id,
			'display_name', keep.display_name
		)
	);

	return public.championship_player_json(keep);
end;
$$;


revoke all on function public.update_player_rating(bigint, numeric) from public;
revoke all on function public.set_player_role(bigint, text) from public;
revoke all on function public.unlink_player(bigint) from public;
revoke all on function public.claim_player(bigint) from public;
revoke all on function public.update_championship_visibility(bigint, boolean) from public;
revoke all on function public.update_championship_name(bigint, text) from public;
revoke all on function public.transfer_championship_owner(bigint) from public;
revoke all on function public.remove_player(bigint) from public;
revoke all on function public.update_championship_event_config(bigint, time, smallint, boolean) from public;
revoke all on function public.save_championship_player_event_stats(
	bigint,
	bigint,
	integer,
	integer,
	integer,
	integer,
	integer,
	integer
) from public;
revoke all on function public.save_championship_event_attendance_stats(bigint, jsonb) from public;
revoke all on function public.set_championship_event_mvps(bigint, jsonb) from public;
revoke all on function public.merge_championship_players(bigint, bigint) from public;

grant execute on function public.update_player_rating(bigint, numeric) to authenticated;
grant execute on function public.set_player_role(bigint, text) to authenticated;
grant execute on function public.unlink_player(bigint) to authenticated;
grant execute on function public.claim_player(bigint) to authenticated;
grant execute on function public.update_championship_visibility(bigint, boolean) to authenticated;
grant execute on function public.update_championship_name(bigint, text) to authenticated;
grant execute on function public.transfer_championship_owner(bigint) to authenticated;
grant execute on function public.remove_player(bigint) to authenticated;
grant execute on function public.update_championship_event_config(bigint, time, smallint, boolean) to authenticated;
grant execute on function public.save_championship_player_event_stats(
	bigint,
	bigint,
	integer,
	integer,
	integer,
	integer,
	integer,
	integer
) to authenticated;
grant execute on function public.save_championship_event_attendance_stats(bigint, jsonb) to authenticated;
grant execute on function public.set_championship_event_mvps(bigint, jsonb) to authenticated;
grant execute on function public.merge_championship_players(bigint, bigint) to authenticated;

notify pgrst, 'reload schema';
