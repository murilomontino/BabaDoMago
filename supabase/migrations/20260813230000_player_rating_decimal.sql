alter table public.championship_players
	drop constraint if exists championship_players_rating_check;

alter table public.championship_players
	alter column rating type numeric(4,1)
	using rating::numeric(4,1);

alter table public.championship_players
	alter column rating set default 0;

alter table public.championship_players
	add constraint championship_players_rating_check check (rating between 0 and 100);

drop function if exists public.update_player_rating(bigint, smallint);

create function public.update_player_rating(player_id bigint, rating numeric)
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

revoke all on function public.update_player_rating(bigint, numeric) from public;
grant execute on function public.update_player_rating(bigint, numeric) to authenticated;

notify pgrst, 'reload schema';
