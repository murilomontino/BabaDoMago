-- Piso de jogos para alterar a nota, configurável por baba (default 3, 3–10).

alter table public.championships
	add column if not exists rating_min_matches smallint not null default 3;

alter table public.championships
	drop constraint if exists championships_rating_min_matches_check;

alter table public.championships
	add constraint championships_rating_min_matches_check
	check (rating_min_matches between 3 and 10);

drop function if exists public.update_championship_event_config(
	bigint,
	time,
	smallint,
	boolean,
	smallint,
	text,
	boolean,
	boolean,
	smallint,
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
	player_vote_quorum smallint default 3,
	player_vote_allow_self boolean default true,
	rating_min_matches smallint default 3
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

	if update_championship_event_config.rating_min_matches < 3
		or update_championship_event_config.rating_min_matches > 10 then
		raise exception 'invalid rating min matches' using errcode = '23514';
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
		'player_vote_quorum', championship.player_vote_quorum,
		'player_vote_allow_self', championship.player_vote_allow_self,
		'rating_min_matches', championship.rating_min_matches
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
		player_vote_quorum = update_championship_event_config.player_vote_quorum,
		player_vote_allow_self = coalesce(
			update_championship_event_config.player_vote_allow_self,
			true
		),
		rating_min_matches = update_championship_event_config.rating_min_matches
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
			'player_vote_quorum', championship.player_vote_quorum,
			'player_vote_allow_self', championship.player_vote_allow_self,
			'rating_min_matches', championship.rating_min_matches
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
		'player_vote_allow_self', championship.player_vote_allow_self,
		'rating_min_matches', championship.rating_min_matches,
		'is_visible', championship.is_visible
	);
end;
$$;

revoke all on function public.update_championship_event_config(
	bigint,
	time,
	smallint,
	boolean,
	smallint,
	text,
	boolean,
	boolean,
	smallint,
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
	smallint,
	boolean,
	smallint
) to authenticated;

drop function if exists public.championship_event_rating_delta(
	integer,
	integer,
	integer,
	integer,
	numeric,
	numeric,
	numeric
);

create function public.championship_event_rating_delta(
	wins integer,
	draws integer,
	losses integer,
	matches integer,
	rating numeric,
	ceiling numeric,
	dead_zone_down numeric default 0.45,
	min_matches integer default 3
)
returns numeric
language sql
immutable
set search_path = public
as $$
	with pts as (
		select
			(3 * wins
				+ draws * case
					when draws > losses then 1.5
					else 1
				end)::numeric as points,
			(3 * matches)::numeric as max_points,
			round(dead_zone_down * 20)::numeric as down_units
	),
	initial as (
		select case
			when matches < min_matches then 0
			when 20 * pts.points <= 11 * pts.max_points
				and 20 * pts.points >= pts.down_units * pts.max_points then 3
			when 20 * pts.points > 11 * pts.max_points then 3.5
			else 2.7
		end as seed
		from pts
	)
	select case
		when matches < min_matches then 0
		when rating = 0 then
			public.championship_player_rating_apply(
				initial.seed,
				public.championship_event_rating_delta(
					wins,
					draws,
					losses,
					matches,
					initial.seed,
					ceiling,
					dead_zone_down,
					min_matches
				)
			)
		when 20 * pts.points <= 11 * pts.max_points
			and 20 * pts.points >= pts.down_units * pts.max_points then 0
		else round(
			((2 * pts.points - pts.max_points)
				* least(100, greatest(0, ceiling)))
				/ (4 * pts.max_points),
			1
		)
	end
	from pts
	cross join initial;
$$;

revoke all on function public.championship_event_rating_delta(
	integer,
	integer,
	integer,
	integer,
	numeric,
	numeric,
	numeric,
	integer
) from public;

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
	exclude_top_enabled boolean := false;
	rating_min_matches integer := 3;
	line_ceiling numeric;
	gk_ceiling numeric;
	dead_zone_down numeric := 0.45;
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

	select
		coalesce(c.rating_drop_goal_share, false),
		coalesce(c.rating_drop_share_exclude_top, false),
		coalesce(c.rating_min_matches, 3)
	into drop_share_enabled, exclude_top_enabled, rating_min_matches
	from public.championships c
	where c.id = event.championship_id;

	select least(100, greatest(coalesce(max(a.rating), 0), 5))
	into line_ceiling
	from public.championship_event_attendance a
	where a.event_id = event.id
		and a.is_goalkeeper = false;

	select least(100, greatest(coalesce(max(a.goalkeeper_rating), 0), 5))
	into gk_ceiling
	from public.championship_event_attendance a
	where a.event_id = event.id
		and a.is_goalkeeper = true;

	if line_ceiling is null then
		line_ceiling := 5;
	end if;

	if gk_ceiling is null then
		gk_ceiling := 5;
	end if;

	select case
		when exists (
			select 1
			from (
				select
					team_rows.team_id,
					count(*)::integer as matches,
					count(*) filter (
						where team_rows.result = 'win'
					)::integer as wins,
					count(*) filter (
						where team_rows.result = 'draw'
					)::integer as draws
				from (
					select
						m.team_a_id as team_id,
						case
							when m.winner_team_id is null then 'draw'
							when m.winner_team_id = m.team_a_id then 'win'
							else 'loss'
						end as result
					from public.championship_event_matches m
					where m.event_id = event.id
						and m.ended_at is not null
					union all
					select
						m.team_b_id as team_id,
						case
							when m.winner_team_id is null then 'draw'
							when m.winner_team_id = m.team_b_id then 'win'
							else 'loss'
						end as result
					from public.championship_event_matches m
					where m.event_id = event.id
						and m.ended_at is not null
				) team_rows
				group by team_rows.team_id
			) team_stats
			where team_stats.matches >= rating_min_matches
				and (3.0 * team_stats.wins + team_stats.draws)
					/ (3.0 * team_stats.matches) >= 0.8
		) then 0.35
		else 0.45
	end
	into dead_zone_down;

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
	excluded_top_line as (
		select p.id
		from public.championship_players p
		where p.championship_id = event.championship_id
			and p.deleted_at is null
			and p.removed_at is null
			and p.rating > 0
		order by p.rating desc, p.id asc
		limit 10
	),
	excluded_top_gk as (
		select p.id
		from public.championship_players p
		where p.championship_id = event.championship_id
			and p.deleted_at is null
			and p.removed_at is null
			and p.goalkeeper_rating > 0
		order by p.goalkeeper_rating desc, p.id asc
		limit 10
	),
	deltas as (
		select
			a.id as attendance_id,
			a.player_id,
			a.is_goalkeeper,
			case
				when a.is_goalkeeper then a.goalkeeper_rating_delta
				else a.rating_delta
			end as old_delta,
			public.championship_event_rating_apply_drop_share(
				case
					when a.is_goalkeeper then
						case
							when a.goalkeeper_rating = 0
								and p.goalkeeper_rating <> 0
								and a.goalkeeper_rating_delta = 0 then 0
							else public.championship_event_rating_delta(
								a.wins,
								a.draws,
								a.losses,
								a.matches,
								a.goalkeeper_rating,
								gk_ceiling,
								dead_zone_down,
								rating_min_matches
							)
						end + case
							when a.is_mvp then public.championship_event_mvp_bonus(a.goalkeeper_rating)
							else 0
						end
					else
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
								line_ceiling,
								dead_zone_down,
								rating_min_matches
							)
						end + case
							when a.is_mvp then public.championship_event_mvp_bonus(a.rating)
							else 0
						end
				end,
				case
					when drop_share_enabled
						and not (
							exclude_top_enabled
							and (
								(
									a.is_goalkeeper = false
									and exists (
										select 1
										from excluded_top_line xt
										where xt.id = a.player_id
									)
								)
								or (
									a.is_goalkeeper = true
									and exists (
										select 1
										from excluded_top_gk xt
										where xt.id = a.player_id
									)
								)
							)
						)
					then public.championship_event_rating_team_goal_share(
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
	updated_line as (
		update public.championship_players p
		set rating = public.championship_player_rating_apply(
			p.rating,
			-d.old_delta + d.new_delta
		)
		from deltas d
		where p.id = d.player_id
			and d.is_goalkeeper = false
			and d.new_delta <> d.old_delta
		returning p.id
	),
	updated_gk as (
		update public.championship_players p
		set goalkeeper_rating = public.championship_player_rating_apply(
			p.goalkeeper_rating,
			-d.old_delta + d.new_delta
		)
		from deltas d
		where p.id = d.player_id
			and d.is_goalkeeper = true
			and d.new_delta <> d.old_delta
		returning p.id
	),
	updated_attendance_line as (
		update public.championship_event_attendance a
		set rating_delta = d.new_delta
		from deltas d
		where a.id = d.attendance_id
			and d.is_goalkeeper = false
			and a.rating_delta <> d.new_delta
		returning a.id
	)
	update public.championship_event_attendance a
	set goalkeeper_rating_delta = d.new_delta
	from deltas d
	where a.id = d.attendance_id
		and d.is_goalkeeper = true
		and a.goalkeeper_rating_delta <> d.new_delta;

	select coalesce(array_agg(a.id), '{}')
	into attendance_ids
	from public.championship_event_attendance a
	where a.event_id = event.id
		and (
			(
				a.is_goalkeeper = false
				and a.vote_rating_delta <> a.vote_rating_applied
			)
			or (
				a.is_goalkeeper = true
				and a.vote_rating_delta <> a.goalkeeper_vote_rating_applied
			)
		);

	if attendance_ids is not null then
		perform public.sync_championship_event_attendance_vote_rating(aid)
		from unnest(attendance_ids) as aid;
	end if;

	perform public.adjust_championship_player_hidden_strength_for_event(event.id);

	select coalesce(array_agg(a.player_id), '{}')
	into player_ids
	from public.championship_event_attendance a
	where a.event_id = event.id;

	perform public.sync_championship_players_from_attendance(player_ids);
end;
$$;

create or replace function public.championship_rating_projected_next(
	rating numeric,
	rate numeric,
	matches integer,
	ceiling numeric,
	min_matches integer default 3
)
returns numeric
language plpgsql
immutable
set search_path = public
as $$
declare
	safe_ceiling numeric;
	gap numeric;
	target numeric;
	aligned numeric := 0.08;
	floor_rating numeric := 0.1;
	max_rating numeric := 100;
begin
	if matches is null or matches < min_matches then
		return null;
	end if;

	safe_ceiling := greatest(coalesce(ceiling, 5), floor_rating);
	gap := coalesce(rate, 0) - coalesce(rating, 0) / safe_ceiling;
	target := round((coalesce(rate, 0) * safe_ceiling)::numeric, 1);
	target := least(max_rating, greatest(floor_rating, target));

	if abs(gap) <= aligned then
		return round(coalesce(rating, 0)::numeric, 1);
	end if;

	return target;
end;
$$;

revoke all on function public.championship_rating_projected_next(
	numeric,
	numeric,
	integer,
	numeric,
	integer
) from public;

-- Drop 4-arg overload so callers use the version with min_matches default.
drop function if exists public.championship_rating_projected_next(
	numeric,
	numeric,
	integer,
	numeric
);

create or replace function public.championship_attendance_rating_projected_fill(
	p_event_id bigint,
	p_player_id bigint,
	p_rating numeric,
	p_is_goalkeeper boolean default false
)
returns numeric
language plpgsql
stable
set search_path = public
as $$
declare
	event_row public.championship_events%rowtype;
	form_wins integer := 0;
	form_draws integer := 0;
	form_losses integer := 0;
	form_matches integer := 0;
	rate numeric;
	ceiling numeric;
	min_matches integer := 3;
begin
	select e.*
	into event_row
	from public.championship_events e
	where e.id = p_event_id
		and e.deleted_at is null;

	if event_row.id is null then
		return null;
	end if;

	select coalesce(c.rating_min_matches, 3)
	into min_matches
	from public.championships c
	where c.id = event_row.championship_id;

	select
		coalesce(sum(prior.wins), 0)::integer,
		coalesce(sum(prior.draws), 0)::integer,
		coalesce(sum(prior.losses), 0)::integer,
		coalesce(sum(prior.matches), 0)::integer
	into form_wins, form_draws, form_losses, form_matches
	from (
		select
			a.wins,
			a.draws,
			a.losses,
			a.matches
		from public.championship_event_attendance a
		join public.championship_events e
			on e.id = a.event_id
		where a.player_id = p_player_id
			and e.championship_id = event_row.championship_id
			and e.deleted_at is null
			and e.ended_at is not null
			and a.matches > 0
			and a.is_goalkeeper = coalesce(p_is_goalkeeper, false)
			and (
				e.starts_at < event_row.starts_at
				or (e.starts_at = event_row.starts_at and e.id < event_row.id)
			)
		order by e.starts_at desc, e.id desc
		limit 5
	) prior;

	if form_matches < min_matches then
		return null;
	end if;

	rate := public.championship_event_rating_rate(
		form_wins,
		form_draws,
		form_losses,
		form_matches
	);

	if coalesce(p_is_goalkeeper, false) then
		select least(
			100,
			greatest(
				coalesce((
					select max(a.goalkeeper_rating)
					from public.championship_event_attendance a
					where a.event_id = p_event_id
						and a.is_goalkeeper = true
				), 0),
				coalesce(p_rating, 0),
				5
			)
		)
		into ceiling;
	else
		select least(
			100,
			greatest(
				coalesce((
					select max(a.rating)
					from public.championship_event_attendance a
					where a.event_id = p_event_id
						and a.is_goalkeeper = false
				), 0),
				coalesce(p_rating, 0),
				5
			)
		)
		into ceiling;
	end if;

	return public.championship_rating_projected_next(
		p_rating,
		rate,
		form_matches,
		ceiling,
		min_matches
	);
end;
$$;

revoke all on function public.championship_attendance_rating_projected_fill(
	bigint,
	bigint,
	numeric,
	boolean
) from public;

create or replace function public.championship_player_next_rating_projected_fill(
	p_championship_id bigint,
	p_player_id bigint,
	p_rating numeric,
	p_is_goalkeeper boolean default false
)
returns numeric
language plpgsql
stable
set search_path = public
as $$
declare
	form_wins integer := 0;
	form_draws integer := 0;
	form_losses integer := 0;
	form_matches integer := 0;
	rate numeric;
	ceiling numeric;
	min_matches integer := 3;
begin
	select coalesce(c.rating_min_matches, 3)
	into min_matches
	from public.championships c
	where c.id = p_championship_id;

	select
		coalesce(sum(prior.wins), 0)::integer,
		coalesce(sum(prior.draws), 0)::integer,
		coalesce(sum(prior.losses), 0)::integer,
		coalesce(sum(prior.matches), 0)::integer
	into form_wins, form_draws, form_losses, form_matches
	from (
		select
			a.wins,
			a.draws,
			a.losses,
			a.matches
		from public.championship_event_attendance a
		join public.championship_events e
			on e.id = a.event_id
		where a.player_id = p_player_id
			and e.championship_id = p_championship_id
			and e.deleted_at is null
			and e.ended_at is not null
			and a.matches > 0
			and a.is_goalkeeper = coalesce(p_is_goalkeeper, false)
		order by e.starts_at desc, e.id desc
		limit 5
	) prior;

	if form_matches < min_matches then
		return null;
	end if;

	rate := public.championship_event_rating_rate(
		form_wins,
		form_draws,
		form_losses,
		form_matches
	);

	if coalesce(p_is_goalkeeper, false) then
		select least(
			100,
			greatest(coalesce(max(p.goalkeeper_rating), 0), coalesce(p_rating, 0), 5)
		)
		into ceiling
		from public.championship_players p
		where p.championship_id = p_championship_id
			and p.deleted_at is null
			and p.removed_at is null;
	else
		select least(
			100,
			greatest(coalesce(max(p.rating), 0), coalesce(p_rating, 0), 5)
		)
		into ceiling
		from public.championship_players p
		where p.championship_id = p_championship_id
			and p.deleted_at is null
			and p.removed_at is null;
	end if;

	return public.championship_rating_projected_next(
		p_rating,
		rate,
		form_matches,
		ceiling,
		min_matches
	);
end;
$$;

revoke all on function public.championship_player_next_rating_projected_fill(
	bigint,
	bigint,
	numeric,
	boolean
) from public;

notify pgrst, 'reload schema';
