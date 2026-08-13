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

	if player.id is null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	select *
	into championship
	from public.championships c
	where c.id = player.championship_id
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
		and user_id = previous_owner;

	return jsonb_build_object(
		'id', championship.id,
		'name', championship.name,
		'invite_code', championship.invite_code,
		'created_by', championship.created_by
	);
end;
$$;

revoke all on function public.transfer_championship_owner(bigint) from public;
grant execute on function public.transfer_championship_owner(bigint) to authenticated;

notify pgrst, 'reload schema';
