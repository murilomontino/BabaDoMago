create or replace function public.merge_championship_players(
	keep_player_id bigint,
	absorb_player_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	viewer uuid := (select auth.uid());
	keep public.championship_players%rowtype;
	absorb public.championship_players%rowtype;
	championship public.championships%rowtype;
	absorb_user_id uuid;
	absorb_avatar text;
	absorb_role text;
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if keep_player_id = absorb_player_id then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	perform 1
	from public.championship_players p
	where p.id in (
		merge_championship_players.keep_player_id,
		merge_championship_players.absorb_player_id
	)
	order by p.id
	for update;

	select *
	into keep
	from public.championship_players p
	where p.id = merge_championship_players.keep_player_id;

	select *
	into absorb
	from public.championship_players p
	where p.id = merge_championship_players.absorb_player_id;

	if keep.id is null
		or absorb.id is null
		or keep.deleted_at is not null
		or absorb.deleted_at is not null
	then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	if keep.championship_id is distinct from absorb.championship_id then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if keep.user_id is not null then
		raise exception 'player already claimed' using errcode = '23514';
	end if;

	if absorb.user_id is null then
		raise exception 'player has no account' using errcode = '23514';
	end if;

	select *
	into championship
	from public.championships c
	where c.id = keep.championship_id
		and c.deleted_at is null;

	if championship.id is null then
		raise exception 'championship not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(championship.id) not in ('owner', 'captain', 'admin') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if absorb.user_id = championship.created_by then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	delete from public.championship_event_attendance a
	where a.player_id = absorb.id
		and exists (
			select 1
			from public.championship_event_attendance k
			where k.event_id = a.event_id
				and k.player_id = keep.id
		);

	update public.championship_event_attendance
	set player_id = keep.id
	where player_id = absorb.id;

	delete from public.championship_event_team_players tp
	where tp.player_id = absorb.id
		and exists (
			select 1
			from public.championship_event_team_players k
			where k.event_id = tp.event_id
				and k.player_id = keep.id
		);

	update public.championship_event_team_players
	set player_id = keep.id
	where player_id = absorb.id;

	delete from public.championship_event_match_players mp
	where mp.player_id = absorb.id
		and exists (
			select 1
			from public.championship_event_match_players k
			where k.match_id = mp.match_id
				and k.player_id = keep.id
		);

	update public.championship_event_match_players
	set player_id = keep.id
	where player_id = absorb.id;

	update public.championship_event_goals
	set assist_player_id = null
	where assist_player_id = absorb.id
		and scorer_player_id = keep.id;

	update public.championship_event_goals
	set assist_player_id = null
	where scorer_player_id = absorb.id
		and assist_player_id = keep.id;

	update public.championship_event_goals
	set scorer_player_id = keep.id
	where scorer_player_id = absorb.id;

	update public.championship_event_goals
	set assist_player_id = keep.id
	where assist_player_id = absorb.id;

	absorb_user_id := absorb.user_id;
	absorb_avatar := absorb.avatar_url;
	absorb_role := absorb.role;

	update public.championship_players
	set
		user_id = null,
		avatar_url = null,
		role = 'member'
	where id = absorb.id;

	update public.championship_players
	set
		user_id = absorb_user_id,
		avatar_url = absorb_avatar,
		role = absorb_role
	where id = keep.id;

	update public.championship_players
	set deleted_at = now()
	where id = absorb.id
		and deleted_at is null;

	perform public.sync_championship_players_from_attendance(array[keep.id]);

	select *
	into keep
	from public.championship_players p
	where p.id = keep.id;

	return public.championship_player_json(keep);
end;
$$;

revoke all on function public.merge_championship_players(bigint, bigint) from public;

grant execute on function public.merge_championship_players(bigint, bigint) to authenticated;

notify pgrst, 'reload schema';
