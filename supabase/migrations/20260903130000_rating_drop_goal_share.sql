alter table public.championships
	add column if not exists rating_drop_goal_share boolean not null default false;

create or replace function public.championship_event_rating_team_goal_share(
	player_involvement numeric,
	team_involvement numeric
)
returns numeric
language sql
immutable
set search_path = public
as $$
	select case
		when team_involvement <= 0 or player_involvement <= 0 then 0
		else least(1, greatest(0, player_involvement / team_involvement))
	end;
$$;

create or replace function public.championship_event_rating_apply_drop_share(
	delta numeric,
	share numeric
)
returns numeric
language sql
immutable
set search_path = public
as $$
	select case
		when delta >= 0 or share <= 0 then delta
		else round(delta * (1 - share), 1)
	end;
$$;

create or replace function public.adjust_championship_player_ratings_for_event(
	event_id bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	event public.championship_events%rowtype;
	drop_share_enabled boolean := false;
	ceiling numeric;
	player_ids bigint[];
	attendance_ids bigint[];
begin
	select e.*
	into event
	from public.championship_events e
	where e.id = adjust_championship_player_ratings_for_event.event_id
		and e.deleted_at is null;

	if event.id is null then
		return;
	end if;

	select coalesce(c.rating_drop_goal_share, false)
	into drop_share_enabled
	from public.championships c
	where c.id = event.championship_id;

	select least(100, greatest(coalesce(max(a.rating), 0), 5))
	into ceiling
	from public.championship_event_attendance a
	where a.event_id = event.id;

	with team_involvement as (
		select
			tp.team_id,
			coalesce(sum(a.goals + a.assists), 0)::numeric as involvement
		from public.championship_event_team_players tp
		join public.championship_event_attendance a
			on a.event_id = tp.event_id
			and a.player_id = tp.player_id
		where tp.event_id = adjust_championship_player_ratings_for_event.event_id
		group by tp.team_id
	),
	deltas as (
		select
			a.id as attendance_id,
			a.player_id,
			a.rating_delta as old_delta,
			public.championship_event_rating_apply_drop_share(
				case
					when a.rating = 0
						and p.rating <> 0
						and a.rating_delta = 0 then 0
					else public.championship_event_rating_delta(
						a.wins,
						a.draws,
						a.losses,
						a.matches,
						a.rating,
						ceiling
					)
				end + case
					when a.is_mvp then public.championship_event_mvp_bonus(a.rating)
					else 0
				end,
				case
					when drop_share_enabled then
						public.championship_event_rating_team_goal_share(
							(a.goals + a.assists)::numeric,
							coalesce(ti.involvement, 0)
						)
					else 0
				end
			) as new_delta
		from public.championship_event_attendance a
		join public.championship_players p
			on p.id = a.player_id
		left join public.championship_event_team_players tp
			on tp.event_id = a.event_id
			and tp.player_id = a.player_id
		left join team_involvement ti
			on ti.team_id = tp.team_id
		where a.event_id = adjust_championship_player_ratings_for_event.event_id
	),
	updated_players as (
		update public.championship_players p
		set rating = public.championship_player_rating_apply(
			p.rating,
			-d.old_delta + d.new_delta
		)
		from deltas d
		where p.id = d.player_id
			and d.new_delta <> d.old_delta
		returning p.id
	)
	update public.championship_event_attendance a
	set rating_delta = d.new_delta
	from deltas d
	where a.id = d.attendance_id
		and a.rating_delta <> d.new_delta;

	select coalesce(array_agg(a.id), '{}')
	into attendance_ids
	from public.championship_event_attendance a
	where a.event_id = event.id
		and a.vote_rating_delta <> a.vote_rating_applied;

	if attendance_ids is not null then
		perform public.sync_championship_event_attendance_vote_rating(aid)
		from unnest(attendance_ids) as aid;
	end if;

	select coalesce(array_agg(a.player_id), '{}')
	into player_ids
	from public.championship_event_attendance a
	where a.event_id = event.id;

	perform public.sync_championship_players_from_attendance(player_ids);
end;
$$;

drop function if exists public.update_championship_event_config(
	bigint,
	time,
	smallint,
	boolean,
	smallint,
	text
);

create or replace function public.update_championship_event_config(
	championship_id bigint,
	event_time time,
	players_per_team smallint,
	skip_guest_goalkeeper_matches boolean default true,
	event_weekday smallint default null,
	location text default null,
	rating_drop_goal_share boolean default false
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

	before_data := jsonb_build_object(
		'event_time', championship.event_time,
		'players_per_team', championship.players_per_team,
		'skip_guest_goalkeeper_matches', championship.skip_guest_goalkeeper_matches,
		'event_weekday', championship.event_weekday,
		'location', championship.location,
		'rating_drop_goal_share', championship.rating_drop_goal_share
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
		)
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
			'rating_drop_goal_share', championship.rating_drop_goal_share
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
		'is_visible', championship.is_visible
	);
end;
$$;

revoke all on function public.championship_event_rating_team_goal_share(numeric, numeric) from public;
revoke all on function public.championship_event_rating_apply_drop_share(numeric, numeric) from public;
revoke all on function public.adjust_championship_player_ratings_for_event(bigint) from public;
revoke all on function public.update_championship_event_config(
	bigint,
	time,
	smallint,
	boolean,
	smallint,
	text,
	boolean
) from public;

grant execute on function public.update_championship_event_config(
	bigint,
	time,
	smallint,
	boolean,
	smallint,
	text,
	boolean
) to authenticated;

notify pgrst, 'reload schema';
