alter table public.championship_players
	drop constraint if exists championship_players_rating_check;

alter table public.championship_players
	alter column rating set default 0;

alter table public.championship_players
	add constraint championship_players_rating_check check (rating between 0 and 100);

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

notify pgrst, 'reload schema';
