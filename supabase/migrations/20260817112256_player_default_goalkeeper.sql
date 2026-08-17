alter table public.championship_players
	add column if not exists is_goalkeeper boolean not null default false;

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
		'nickname', player.nickname,
		'avatar_url', player.avatar_url,
		'rating', player.rating,
		'role', player.role,
		'deleted_at', player.deleted_at,
		'is_goalkeeper', player.is_goalkeeper,
		'goals', player.goals,
		'assists', player.assists,
		'assisted_goals', player.assisted_goals,
		'own_goals', player.own_goals,
		'wins', player.wins,
		'losses', player.losses,
		'draws', player.draws,
		'matches', player.matches,
		'mvps', player.mvps
	);
$$;

create or replace function public.set_player_is_goalkeeper(
	player_id bigint,
	is_goalkeeper boolean
)
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
	where p.id = set_player_is_goalkeeper.player_id
	for update;

	if player.id is null or player.deleted_at is not null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(player.championship_id) not in ('owner', 'captain', 'admin') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	update public.championship_players
	set is_goalkeeper = set_player_is_goalkeeper.is_goalkeeper
	where id = player.id
	returning * into player;

	return public.championship_player_json(player);
end;
$$;

revoke all on function public.championship_player_json(public.championship_players) from public;
revoke all on function public.set_player_is_goalkeeper(bigint, boolean) from public;

grant execute on function public.championship_player_json(public.championship_players) to authenticated;
grant execute on function public.set_player_is_goalkeeper(bigint, boolean) to authenticated;

notify pgrst, 'reload schema';
