alter table public.championship_players
	add column if not exists goals integer not null default 0,
	add column if not exists assists integer not null default 0,
	add column if not exists wins integer not null default 0,
	add column if not exists matches integer not null default 0;

alter table public.championship_players
	drop constraint if exists championship_players_stats_check;

alter table public.championship_players
	add constraint championship_players_stats_check
	check (
		goals >= 0
		and assists >= 0
		and wins >= 0
		and matches >= 0
		and wins <= matches
	);

create or replace function public.championship_player_json(
	player public.championship_players
)
returns jsonb
language sql
immutable
as $$
	select jsonb_build_object(
		'id', player.id,
		'championship_id', player.championship_id,
		'user_id', player.user_id,
		'display_name', player.display_name,
		'avatar_url', player.avatar_url,
		'rating', player.rating,
		'role', player.role,
		'deleted_at', player.deleted_at,
		'goals', player.goals,
		'assists', player.assists,
		'wins', player.wins,
		'matches', player.matches
	);
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
				public.championship_player_json(p)
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
		return public.championship_player_json(player);
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

	return public.championship_player_json(player);
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

	return public.championship_player_json(player);
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

	return public.championship_player_json(player);
end;
$$;

revoke all on function public.championship_player_json(public.championship_players) from public;
grant execute on function public.championship_player_json(public.championship_players) to authenticated;

notify pgrst, 'reload schema';
