-- Quórum de voto do elenco configurável por baba (default 3).

alter table public.championships
	add column if not exists player_vote_quorum smallint not null default 3;

alter table public.championships
	drop constraint if exists championships_player_vote_quorum_check;

alter table public.championships
	add constraint championships_player_vote_quorum_check
	check (player_vote_quorum between 1 and 10);

drop function if exists public.championship_event_player_vote_applied_delta(
	integer,
	integer,
	integer
);

create or replace function public.championship_event_player_vote_applied_delta(
	like_count integer,
	dislike_count integer,
	maintain_count integer,
	quorum_count integer
)
returns numeric
language sql
immutable
set search_path = public
as $$
	select case
		when like_count >= quorum_count
			and like_count > dislike_count
			and like_count > maintain_count then 0.5
		when dislike_count >= quorum_count
			and dislike_count > like_count
			and dislike_count > maintain_count then -0.5
		else 0
	end;
$$;

create or replace function public.recompute_championship_event_player_vote_delta(
	event_id bigint,
	target_player_id bigint
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
	like_count integer;
	dislike_count integer;
	maintain_count integer;
	quorum_count integer;
	new_delta numeric;
	current_delta numeric;
	attendance_id bigint;
begin
	select a.id, a.vote_rating_delta
	into attendance_id, current_delta
	from public.championship_event_attendance a
	where a.event_id = recompute_championship_event_player_vote_delta.event_id
		and a.player_id = recompute_championship_event_player_vote_delta.target_player_id
	for update;

	if attendance_id is null then
		return 0;
	end if;

	-- Quórum já fechou: delta fica e não recalcula.
	if current_delta <> 0 then
		return current_delta;
	end if;

	select coalesce(c.player_vote_quorum, 3)
	into quorum_count
	from public.championship_events e
	join public.championships c on c.id = e.championship_id
	where e.id = recompute_championship_event_player_vote_delta.event_id;

	select
		coalesce(count(*) filter (where v.value = 'like'), 0)::integer,
		coalesce(count(*) filter (where v.value = 'dislike'), 0)::integer,
		coalesce(count(*) filter (where v.value = 'maintain'), 0)::integer
	into like_count, dislike_count, maintain_count
	from public.championship_event_player_votes v
	where v.event_id = recompute_championship_event_player_vote_delta.event_id
		and v.target_player_id = recompute_championship_event_player_vote_delta.target_player_id;

	new_delta := public.championship_event_player_vote_applied_delta(
		like_count,
		dislike_count,
		maintain_count,
		quorum_count
	);

	if new_delta = current_delta then
		return current_delta;
	end if;

	update public.championship_event_attendance a
	set vote_rating_delta = new_delta
	where a.id = attendance_id;

	perform public.sync_championship_event_attendance_vote_rating(attendance_id);

	return new_delta;
end;
$$;

drop function if exists public.update_championship_event_config(
	bigint,
	time,
	smallint,
	boolean,
	smallint,
	text,
	boolean,
	boolean
);

create or replace function public.update_championship_event_config(
	championship_id bigint,
	event_time time,
	players_per_team smallint,
	skip_guest_goalkeeper_matches boolean default true,
	event_weekday smallint default null,
	location text default null,
	rating_drop_goal_share boolean default false,
	rating_drop_share_exclude_top boolean default false,
	player_vote_quorum smallint default 3
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	championship public.championships%rowtype;
	open_event_ids bigint[];
	player_ids bigint[];
	open_event_id bigint;
	before_data jsonb;
	next_location text;
	quorum_changed boolean;
	open_vote record;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if update_championship_event_config.players_per_team < 3
		or update_championship_event_config.players_per_team > 11 then
		raise exception 'invalid players per team' using errcode = '23514';
	end if;

	if update_championship_event_config.event_weekday is not null
		and (
			update_championship_event_config.event_weekday < 1
			or update_championship_event_config.event_weekday > 7
		) then
		raise exception 'invalid event weekday' using errcode = '23514';
	end if;

	if update_championship_event_config.player_vote_quorum < 1
		or update_championship_event_config.player_vote_quorum > 10 then
		raise exception 'invalid player vote quorum' using errcode = '23514';
	end if;

	next_location := nullif(btrim(update_championship_event_config.location), '');
	if next_location is not null and char_length(next_location) > 120 then
		raise exception 'invalid location' using errcode = '23514';
	end if;

	select *
	into championship
	from public.championships c
	where c.id = update_championship_event_config.championship_id
		and c.deleted_at is null
	for update;

	if championship.id is null then
		raise exception 'championship not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(championship.id) not in ('owner', 'captain') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	quorum_changed := championship.player_vote_quorum
		<> update_championship_event_config.player_vote_quorum;

	before_data := jsonb_build_object(
		'event_time', championship.event_time,
		'players_per_team', championship.players_per_team,
		'skip_guest_goalkeeper_matches', championship.skip_guest_goalkeeper_matches,
		'event_weekday', championship.event_weekday,
		'location', championship.location,
		'rating_drop_goal_share', championship.rating_drop_goal_share,
		'rating_drop_share_exclude_top', championship.rating_drop_share_exclude_top,
		'player_vote_quorum', championship.player_vote_quorum
	);

	update public.championships
	set
		event_time = update_championship_event_config.event_time,
		players_per_team = update_championship_event_config.players_per_team,
		skip_guest_goalkeeper_matches = coalesce(
			update_championship_event_config.skip_guest_goalkeeper_matches,
			true
		),
		event_weekday = update_championship_event_config.event_weekday,
		location = next_location,
		rating_drop_goal_share = coalesce(
			update_championship_event_config.rating_drop_goal_share,
			false
		),
		rating_drop_share_exclude_top = coalesce(
			update_championship_event_config.rating_drop_share_exclude_top,
			false
		),
		player_vote_quorum = update_championship_event_config.player_vote_quorum
	where id = championship.id
	returning * into championship;

	select coalesce(array_agg(e.id), '{}')
	into open_event_ids
	from public.championship_events e
	where e.championship_id = championship.id
		and e.ended_at is null
		and e.deleted_at is null;

	update public.championship_events
	set skip_guest_goalkeeper_matches = championship.skip_guest_goalkeeper_matches
	where id = any (open_event_ids);

	foreach open_event_id in array open_event_ids loop
		perform public.refresh_championship_event_attendance_stats(open_event_id);
	end loop;

	select coalesce(array_agg(distinct a.player_id), '{}')
	into player_ids
	from public.championship_event_attendance a
	where a.event_id = any (open_event_ids);

	perform public.sync_championship_players_from_attendance(player_ids);

	if quorum_changed then
		for open_vote in
			select a.event_id, a.player_id
			from public.championship_event_attendance a
			join public.championship_events e on e.id = a.event_id
			where e.championship_id = championship.id
				and e.ended_at is not null
				and e.player_votes_closed_at is null
				and e.deleted_at is null
				and a.vote_rating_delta = 0
		loop
			perform public.recompute_championship_event_player_vote_delta(
				open_vote.event_id,
				open_vote.player_id
			);
		end loop;
	end if;

	perform public.championship_audit_log(
		championship.id,
		'update_event_config',
		'championship',
		championship.id,
		before_data,
		jsonb_build_object(
			'event_time', championship.event_time,
			'players_per_team', championship.players_per_team,
			'skip_guest_goalkeeper_matches', championship.skip_guest_goalkeeper_matches,
			'event_weekday', championship.event_weekday,
			'location', championship.location,
			'rating_drop_goal_share', championship.rating_drop_goal_share,
			'rating_drop_share_exclude_top', championship.rating_drop_share_exclude_top,
			'player_vote_quorum', championship.player_vote_quorum
		)
	);

	return jsonb_build_object(
		'id', championship.id,
		'name', championship.name,
		'invite_code', championship.invite_code,
		'created_by', championship.created_by,
		'logo_path', championship.logo_path,
		'event_time', championship.event_time,
		'players_per_team', championship.players_per_team,
		'skip_guest_goalkeeper_matches', championship.skip_guest_goalkeeper_matches,
		'event_weekday', championship.event_weekday,
		'location', championship.location,
		'rating_drop_goal_share', championship.rating_drop_goal_share,
		'rating_drop_share_exclude_top', championship.rating_drop_share_exclude_top,
		'player_vote_quorum', championship.player_vote_quorum,
		'is_visible', championship.is_visible
	);
end;
$$;

revoke all on function public.championship_event_player_vote_applied_delta(
	integer,
	integer,
	integer,
	integer
) from public;

grant execute on function public.championship_event_player_vote_applied_delta(
	integer,
	integer,
	integer,
	integer
) to authenticated;

revoke all on function public.update_championship_event_config(
	bigint,
	time,
	smallint,
	boolean,
	smallint,
	text,
	boolean,
	boolean,
	smallint
) from public;

grant execute on function public.update_championship_event_config(
	bigint,
	time,
	smallint,
	boolean,
	smallint,
	text,
	boolean,
	boolean,
	smallint
) to authenticated;

notify pgrst, 'reload schema';
