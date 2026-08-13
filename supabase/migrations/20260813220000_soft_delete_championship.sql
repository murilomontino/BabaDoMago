alter table public.championships
	add column if not exists deleted_at timestamptz;

drop index if exists championships_created_by_idx;

create index championships_created_by_idx
	on public.championships (created_by)
	where deleted_at is null;

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
					'role', p.role
				)
				order by p.id
			)
			from public.championship_players p
			where p.championship_id = c.id
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
		and p.user_id = viewer;

	if player.id is not null then
		return jsonb_build_object(
			'id', player.id,
			'championship_id', player.championship_id,
			'user_id', player.user_id,
			'display_name', player.display_name,
			'avatar_url', player.avatar_url,
			'rating', player.rating,
			'role', player.role
		);
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
		'role', player.role
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

	if player.id is null then
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
		'role', player.role
	);
end;
$$;

create or replace function public.owns_championship_logo_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select exists (
		select 1
		from public.championships c
		where c.id::text = split_part(owns_championship_logo_object.object_name, '/', 1)
			and c.deleted_at is null
			and c.created_by = (select auth.uid())
	);
$$;

create or replace function public.soft_delete_championship(championship_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if public.championship_actor_role(soft_delete_championship.championship_id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	update public.championships
	set deleted_at = now()
	where id = soft_delete_championship.championship_id
		and deleted_at is null;

	if not found then
		raise exception 'championship not found' using errcode = 'P0002';
	end if;
end;
$$;

drop policy if exists championships_select_member on public.championships;

create policy championships_select_member
	on public.championships
	for select
	to authenticated
	using (
		deleted_at is null
		and (
			created_by = (select auth.uid())
			or public.is_championship_member(id)
		)
	);

drop policy if exists championships_update_own on public.championships;

create policy championships_update_own
	on public.championships
	for update
	to authenticated
	using (
		created_by = (select auth.uid())
		and deleted_at is null
	)
	with check (
		created_by = (select auth.uid())
		and deleted_at is null
	);

drop policy if exists championships_delete_own on public.championships;

revoke delete on public.championships from authenticated;

revoke all on function public.soft_delete_championship(bigint) from public;
grant execute on function public.soft_delete_championship(bigint) to authenticated;

notify pgrst, 'reload schema';
