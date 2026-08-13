create table public.championships (
	id bigint generated always as identity primary key,
	name text not null,
	invite_code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 16),
	created_by uuid not null references auth.users (id) on delete cascade,
	created_at timestamptz not null default now()
);

create index championships_created_by_idx on public.championships (created_by);

create table public.championship_players (
	id bigint generated always as identity primary key,
	championship_id bigint not null references public.championships (id) on delete cascade,
	user_id uuid references auth.users (id) on delete set null,
	display_name text not null,
	avatar_url text,
	created_at timestamptz not null default now(),
	unique (championship_id, user_id)
);

create index championship_players_championship_id_idx
	on public.championship_players (championship_id);

create index championship_players_user_id_idx
	on public.championship_players (user_id);

alter table public.championships enable row level security;
alter table public.championship_players enable row level security;

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
				and c.created_by = (select auth.uid())
		)
		or exists (
			select 1
			from public.championship_players p
			where p.championship_id = championship_id
				and p.user_id = (select auth.uid())
		);
$$;

create or replace function public.current_user_display_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
	select coalesce(
		nullif(u.raw_user_meta_data ->> 'full_name', ''),
		nullif(u.raw_user_meta_data ->> 'name', ''),
		nullif(u.email, ''),
		'Jogador'
	)
	from auth.users u
	where u.id = (select auth.uid());
$$;

create or replace function public.current_user_avatar_url()
returns text
language sql
stable
security definer
set search_path = public
as $$
	select coalesce(
		nullif(u.raw_user_meta_data ->> 'avatar_url', ''),
		nullif(u.raw_user_meta_data ->> 'picture', '')
	)
	from auth.users u
	where u.id = (select auth.uid());
$$;

create policy championships_select_member
	on public.championships
	for select
	to authenticated
	using (public.is_championship_member(id));

create policy championships_insert_own
	on public.championships
	for insert
	to authenticated
	with check (created_by = (select auth.uid()));

create policy championships_update_own
	on public.championships
	for update
	to authenticated
	using (created_by = (select auth.uid()))
	with check (created_by = (select auth.uid()));

create policy championships_delete_own
	on public.championships
	for delete
	to authenticated
	using (created_by = (select auth.uid()));

create policy championship_players_select_member
	on public.championship_players
	for select
	to authenticated
	using (public.is_championship_member(championship_id));

create policy championship_players_insert_owner
	on public.championship_players
	for insert
	to authenticated
	with check (
		exists (
			select 1
			from public.championships c
			where c.id = championship_id
				and c.created_by = (select auth.uid())
		)
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
					'avatar_url', p.avatar_url
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
			'avatar_url', player.avatar_url
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
		'avatar_url', player.avatar_url
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
		'avatar_url', player.avatar_url
	);
end;
$$;

revoke all on function public.is_championship_member(bigint) from public;
revoke all on function public.current_user_display_name() from public;
revoke all on function public.current_user_avatar_url() from public;
revoke all on function public.get_championship_by_invite(text) from public;
revoke all on function public.join_championship(text) from public;
revoke all on function public.claim_player(bigint) from public;

grant execute on function public.is_championship_member(bigint) to authenticated;
grant execute on function public.current_user_display_name() to authenticated;
grant execute on function public.current_user_avatar_url() to authenticated;
grant execute on function public.get_championship_by_invite(text) to anon, authenticated;
grant execute on function public.join_championship(text) to authenticated;
grant execute on function public.claim_player(bigint) to authenticated;

grant select, insert, update, delete on public.championships to authenticated;
grant select, insert on public.championship_players to authenticated;
grant usage, select on all sequences in schema public to authenticated;

notify pgrst, 'reload schema';
