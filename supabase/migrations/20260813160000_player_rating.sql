alter table public.championship_players
	add column if not exists rating smallint not null default 50;

alter table public.championship_players
	drop constraint if exists championship_players_rating_check;

alter table public.championship_players
	add constraint championship_players_rating_check check (rating between 1 and 100);

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
		'players', coalesce((
			select jsonb_agg(
				jsonb_build_object(
					'id', p.id,
					'championship_id', p.championship_id,
					'user_id', p.user_id,
					'display_name', p.display_name,
					'avatar_url', p.avatar_url,
					'rating', p.rating
				)
				order by p.id
			)
			from public.championship_players p
			where p.championship_id = c.id
		), '[]'::jsonb)
	)
	into result
	from public.championships c
	where c.invite_code = get_championship_by_invite.invite_code;

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
	where c.invite_code = join_championship.invite_code;

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
			'rating', player.rating
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
		'rating', player.rating
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
		'rating', player.rating
	);
end;
$$;

create or replace function public.update_player_rating(player_id bigint, rating smallint)
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

	if update_player_rating.rating < 1 or update_player_rating.rating > 100 then
		raise exception 'invalid rating' using errcode = '23514';
	end if;

	select *
	into player
	from public.championship_players p
	where p.id = update_player_rating.player_id
	for update;

	if player.id is null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	if not exists (
		select 1
		from public.championships c
		where c.id = player.championship_id
			and c.created_by = viewer
	) then
		raise exception 'not championship owner' using errcode = '42501';
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
		'rating', player.rating
	);
end;
$$;

revoke all on function public.update_player_rating(bigint, smallint) from public;
grant execute on function public.update_player_rating(bigint, smallint) to authenticated;

notify pgrst, 'reload schema';
