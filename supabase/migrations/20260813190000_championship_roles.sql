	alter table public.championship_players
		add column if not exists role text not null default 'member';

	alter table public.championship_players
		drop constraint if exists championship_players_role_check;

	alter table public.championship_players
		add constraint championship_players_role_check check (role in ('captain', 'admin', 'member'));

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
					and c.created_by = (select auth.uid())
			) then 'owner'
			else (
				select p.role
				from public.championship_players p
				where p.championship_id = championship_actor_role.championship_id
					and p.user_id = (select auth.uid())
			)
		end;
	$$;

	drop policy if exists championship_players_insert_owner on public.championship_players;
	drop policy if exists championship_players_insert_staff on public.championship_players;

	create policy championship_players_insert_staff
		on public.championship_players
		for insert
		to authenticated
		with check (
			public.championship_actor_role(championship_id) in ('owner', 'captain', 'admin')
			and (
				user_id is null
				or user_id = (select auth.uid())
			)
		);

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

		if update_player_rating.rating < 0 or update_player_rating.rating > 100 then
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
			'role', player.role
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

		update public.championships c
		set name = trimmed
		where c.id = update_championship_name.championship_id
		returning * into championship;

		if championship.id is null then
			raise exception 'championship not found' using errcode = 'P0002';
		end if;

		return jsonb_build_object(
			'id', championship.id,
			'name', championship.name,
			'invite_code', championship.invite_code,
			'created_by', championship.created_by
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

		if player.id is null then
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
			'role', player.role
		);
	end;
	$$;

	revoke all on function public.championship_actor_role(bigint) from public;
	revoke all on function public.update_championship_name(bigint, text) from public;
	revoke all on function public.set_player_role(bigint, text) from public;

	grant execute on function public.championship_actor_role(bigint) to authenticated;
	grant execute on function public.update_championship_name(bigint, text) to authenticated;
	grant execute on function public.set_player_role(bigint, text) to authenticated;

	notify pgrst, 'reload schema';
