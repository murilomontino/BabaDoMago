alter table public.championship_players
	add column if not exists deleted_at timestamptz;

create or replace function public.is_championship_member(championship_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select
		exists (
			select 1
			from public.championships c
			where c.id = championship_id
				and c.deleted_at is null
				and c.created_by = (select auth.uid())
		)
		or exists (
			select 1
			from public.championship_players p
			join public.championships c on c.id = p.championship_id
			where p.championship_id = championship_id
				and c.deleted_at is null
				and p.deleted_at is null
				and p.user_id = (select auth.uid())
		);
$$;

create or replace function public.championship_actor_role(championship_id bigint)
returns text
language sql
stable
security definer
set search_path = public
as $$
	select case
		when exists (
			select 1
			from public.championships c
			where c.id = championship_actor_role.championship_id
				and c.deleted_at is null
				and c.created_by = (select auth.uid())
		) then 'owner'
		else (
			select p.role
			from public.championship_players p
			join public.championships c on c.id = p.championship_id
			where p.championship_id = championship_actor_role.championship_id
				and c.deleted_at is null
				and p.deleted_at is null
				and p.user_id = (select auth.uid())
		)
	end;
$$;

create or replace function public.get_championship_by_invite(invite_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
	result jsonb;
begin
	select jsonb_build_object(
		'id', c.id,
		'name', c.name,
		'invite_code', c.invite_code,
		'created_by', c.created_by,
		'logo_path', c.logo_path,
		'players', coalesce((
			select jsonb_agg(
				jsonb_build_object(
					'id', p.id,
					'championship_id', p.championship_id,
					'user_id', p.user_id,
					'display_name', p.display_name,
					'avatar_url', p.avatar_url,
					'rating', p.rating,
					'role', p.role,
					'deleted_at', p.deleted_at
				)
				order by p.id
			)
			from public.championship_players p
			where p.championship_id = c.id
				and p.deleted_at is null
		), '[]'::jsonb)
	)
	into result
	from public.championships c
	where c.invite_code = get_championship_by_invite.invite_code
		and c.deleted_at is null;

	if result is null then
		raise exception 'championship not found' using errcode = 'P0002';
	end if;

	return result;
end;
$$;

create or replace function public.join_championship(invite_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	viewer uuid := (select auth.uid());
	championship public.championships%rowtype;
	player public.championship_players%rowtype;
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into championship
	from public.championships c
	where c.invite_code = join_championship.invite_code
		and c.deleted_at is null;

	if championship.id is null then
		raise exception 'championship not found' using errcode = 'P0002';
	end if;

	select *
	into player
	from public.championship_players p
	where p.championship_id = championship.id
		and p.user_id = viewer
		and p.deleted_at is null;

	if player.id is not null then
		return jsonb_build_object(
			'id', player.id,
			'championship_id', player.championship_id,
			'user_id', player.user_id,
			'display_name', player.display_name,
			'avatar_url', player.avatar_url,
			'rating', player.rating,
			'role', player.role,
			'deleted_at', player.deleted_at
		);
	end if;

	if exists (
		select 1
		from public.championship_players p
		where p.championship_id = championship.id
			and p.user_id = viewer
			and p.deleted_at is not null
	) then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	insert into public.championship_players (
		championship_id,
		user_id,
		display_name,
		avatar_url
	)
	values (
		championship.id,
		viewer,
		public.current_user_display_name(),
		public.current_user_avatar_url()
	)
	returning * into player;

	return jsonb_build_object(
		'id', player.id,
		'championship_id', player.championship_id,
		'user_id', player.user_id,
		'display_name', player.display_name,
		'avatar_url', player.avatar_url,
		'rating', player.rating,
		'role', player.role,
		'deleted_at', player.deleted_at
	);
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

	if not exists (
		select 1
		from public.championships c
		where c.id = player.championship_id
			and c.deleted_at is null
	) then
		raise exception 'championship not found' using errcode = 'P0002';
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

	return jsonb_build_object(
		'id', player.id,
		'championship_id', player.championship_id,
		'user_id', player.user_id,
		'display_name', player.display_name,
		'avatar_url', player.avatar_url,
		'rating', player.rating,
		'role', player.role,
		'deleted_at', player.deleted_at
	);
end;
$$;

create or replace function public.update_player_rating(player_id bigint, rating numeric)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	viewer uuid := (select auth.uid());
	player public.championship_players%rowtype;
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

	update public.championship_players
	set rating = update_player_rating.rating
	where id = player.id
	returning * into player;

	return jsonb_build_object(
		'id', player.id,
		'championship_id', player.championship_id,
		'user_id', player.user_id,
		'display_name', player.display_name,
		'avatar_url', player.avatar_url,
		'rating', player.rating,
		'role', player.role,
		'deleted_at', player.deleted_at
	);
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

	update public.championship_players
	set role = set_player_role.role
	where id = player.id
	returning * into player;

	return jsonb_build_object(
		'id', player.id,
		'championship_id', player.championship_id,
		'user_id', player.user_id,
		'display_name', player.display_name,
		'avatar_url', player.avatar_url,
		'rating', player.rating,
		'role', player.role,
		'deleted_at', player.deleted_at
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

	update public.championships
	set created_by = player.user_id
	where id = championship.id
	returning * into championship;

	update public.championship_players
	set role = 'member'
	where championship_id = championship.id
		and user_id = previous_owner
		and deleted_at is null;

	return jsonb_build_object(
		'id', championship.id,
		'name', championship.name,
		'invite_code', championship.invite_code,
		'created_by', championship.created_by
	);
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

	return jsonb_build_object(
		'id', player.id,
		'championship_id', player.championship_id,
		'user_id', player.user_id,
		'display_name', player.display_name,
		'avatar_url', player.avatar_url,
		'rating', player.rating,
		'role', player.role,
		'deleted_at', player.deleted_at
	);
end;
$$;

create or replace function public.deactivate_player(player_id bigint)
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
	where p.id = deactivate_player.player_id
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

	if player.user_id is not distinct from championship.created_by then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	update public.championship_players
	set deleted_at = now()
	where id = player.id
		and deleted_at is null;

	if not found then
		raise exception 'player not found' using errcode = 'P0002';
	end if;
end;
$$;

create or replace function public.reactivate_player(player_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	viewer uuid := (select auth.uid());
	player public.championship_players%rowtype;
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into player
	from public.championship_players p
	where p.id = reactivate_player.player_id
	for update;

	if player.id is null or player.deleted_at is null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(player.championship_id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	update public.championship_players
	set deleted_at = null
	where id = player.id
		and deleted_at is not null
	returning * into player;

	if player.id is null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	return jsonb_build_object(
		'id', player.id,
		'championship_id', player.championship_id,
		'user_id', player.user_id,
		'display_name', player.display_name,
		'avatar_url', player.avatar_url,
		'rating', player.rating,
		'role', player.role,
		'deleted_at', player.deleted_at
	);
end;
$$;

drop policy if exists championship_players_select_member on public.championship_players;
drop policy if exists championship_players_select_owner_all on public.championship_players;

create policy championship_players_select_member
	on public.championship_players
	for select
	to authenticated
	using (
		deleted_at is null
		and public.is_championship_member(championship_id)
	);

create policy championship_players_select_owner_all
	on public.championship_players
	for select
	to authenticated
	using (public.championship_actor_role(championship_id) = 'owner');

revoke all on function public.unlink_player(bigint) from public;
revoke all on function public.deactivate_player(bigint) from public;
revoke all on function public.reactivate_player(bigint) from public;

grant execute on function public.unlink_player(bigint) to authenticated;
grant execute on function public.deactivate_player(bigint) to authenticated;
grant execute on function public.reactivate_player(bigint) to authenticated;

notify pgrst, 'reload schema';
