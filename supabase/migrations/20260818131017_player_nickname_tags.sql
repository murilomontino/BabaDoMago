-- keep in sync with PLAYER_NICKNAME.maxLength / maxTags
alter table public.championship_players
	add column if not exists nickname_tags text[] not null default '{}';

alter table public.championship_players
	drop constraint if exists championship_players_nickname_tags_len;

alter table public.championship_players
	add constraint championship_players_nickname_tags_len
	check (cardinality(nickname_tags) <= 8);

create or replace function public.normalize_nickname_tags(tags text[])
returns text[]
language sql
immutable
as $$
	select coalesce(
		(
			select array_agg(capped.tag order by capped.ord)
			from (
				select
					deduped.tag,
					deduped.ord
				from (
					select distinct on (lower(trimmed.tag))
						trimmed.tag,
						trimmed.ord
					from (
						select
							btrim(elem) as tag,
							ord
						from unnest(coalesce(normalize_nickname_tags.tags, '{}'::text[]))
							with ordinality as u(elem, ord)
					) trimmed
					where char_length(trimmed.tag) between 1 and 40
					order by lower(trimmed.tag), trimmed.ord
				) deduped
				order by deduped.ord
				limit 8
			) capped
		),
		'{}'::text[]
	);
$$;

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
		'nickname_tags', player.nickname_tags,
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

drop function if exists public.update_player_nickname(bigint, text);

create function public.update_player_nickname(
	player_id bigint,
	nickname text,
	nickname_tags text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	viewer uuid := (select auth.uid());
	player public.championship_players%rowtype;
	normalized text;
	normalized_tags text[];
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	normalized := nullif(btrim(coalesce(update_player_nickname.nickname, '')), '');
	if normalized is not null and char_length(normalized) > 40 then
		raise exception 'invalid nickname' using errcode = '23514';
	end if;

	normalized_tags := public.normalize_nickname_tags(
		coalesce(update_player_nickname.nickname_tags, '{}'::text[])
	);

	select *
	into player
	from public.championship_players p
	where p.id = update_player_nickname.player_id
	for update;

	if player.id is null or player.deleted_at is not null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(player.championship_id) not in ('owner', 'captain', 'admin')
		and player.user_id is distinct from viewer then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	update public.championship_players
	set
		nickname = normalized,
		nickname_tags = normalized_tags
	where id = player.id
	returning * into player;

	return public.championship_player_json(player);
end;
$$;

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

	set constraints
		championship_event_team_players_attendance_fk,
		championship_event_match_players_event_id_player_id_fkey,
		championship_event_goals_match_id_scorer_player_id_fkey,
		championship_event_goals_match_id_assist_player_id_fkey
	deferred;

	update public.championship_event_attendance k
	set
		is_mvp = k.is_mvp or a.is_mvp,
		mvp_overridden = k.mvp_overridden or a.mvp_overridden
	from public.championship_event_attendance a
	where a.player_id = absorb.id
		and k.player_id = keep.id
		and k.event_id = a.event_id;

	insert into public.championship_event_attendance (
		event_id,
		player_id,
		display_name,
		is_goalkeeper,
		event_date,
		goals,
		assists,
		own_goals,
		wins,
		matches,
		rating,
		rating_delta,
		is_mvp,
		mvp_overridden
	)
	select
		a.event_id,
		keep.id,
		keep.display_name,
		a.is_goalkeeper,
		a.event_date,
		a.goals,
		a.assists,
		a.own_goals,
		a.wins,
		a.matches,
		a.rating,
		a.rating_delta,
		a.is_mvp,
		a.mvp_overridden
	from public.championship_event_attendance a
	where a.player_id = absorb.id
		and not exists (
			select 1
			from public.championship_event_attendance k
			where k.event_id = a.event_id
				and k.player_id = keep.id
		);

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

	delete from public.championship_event_attendance
	where player_id = absorb.id;

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
		role = absorb_role,
		nickname_tags = public.normalize_nickname_tags(
			keep.nickname_tags || absorb.nickname_tags
		)
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

	perform public.championship_audit_log(
		keep.championship_id,
		'merge_players',
		'player',
		keep.id,
		jsonb_build_object(
			'absorb_player_id', absorb.id,
			'display_name', absorb.display_name
		),
		jsonb_build_object(
			'keep_player_id', keep.id,
			'display_name', keep.display_name
		)
	);

	return public.championship_player_json(keep);
end;
$$;

revoke all on function public.normalize_nickname_tags(text[]) from public;
revoke all on function public.update_player_nickname(bigint, text, text[]) from public;

grant execute on function public.update_player_nickname(bigint, text, text[]) to authenticated;

notify pgrst, 'reload schema';
