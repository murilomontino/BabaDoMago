alter table public.championship_players
	add column if not exists removed_at timestamptz;

alter table public.championship_players
	drop constraint if exists championship_players_removed_at_check;

alter table public.championship_players
	add constraint championship_players_removed_at_check
	check (
		removed_at is null
		or (deleted_at is not null and user_id is null)
	);

drop policy if exists championship_players_select_owner_all on public.championship_players;

create policy championship_players_select_owner_all
	on public.championship_players
	for select
	to authenticated
	using (
		removed_at is null
		and public.championship_actor_role(championship_id) = 'owner'
	);

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

	if player.id is null
		or player.deleted_at is null
		or player.removed_at is not null
	then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(player.championship_id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	update public.championship_players
	set deleted_at = null
	where id = player.id
		and deleted_at is not null
		and removed_at is null
	returning * into player;

	if player.id is null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	return public.championship_player_json(player);
end;
$$;

revoke all on function public.remove_player(bigint) from public;
grant execute on function public.remove_player(bigint) to authenticated;

notify pgrst, 'reload schema';
