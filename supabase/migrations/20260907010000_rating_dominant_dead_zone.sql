-- Time dominante (>=80% aproveitamento, >=3 jogos): zona morta 35%–55% para todos.
-- Abaixo de 35%: delta na fórmula atual. Hidden strength segue o default 45%.

drop function if exists public.championship_event_rating_delta(
	integer,
	integer,
	integer,
	integer,
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
	dead_zone_down numeric default 0.45
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
			when matches < 3 then 0
			when 20 * pts.points <= 11 * pts.max_points
				and 20 * pts.points >= pts.down_units * pts.max_points then 3
			when 20 * pts.points > 11 * pts.max_points then 3.5
			else 2.7
		end as seed
		from pts
	)
	select case
		when matches < 3 then 0
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
					dead_zone_down
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
	numeric
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
		coalesce(c.rating_drop_share_exclude_top, false)
	into drop_share_enabled, exclude_top_enabled
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
			where team_stats.matches >= 3
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
								dead_zone_down
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
								dead_zone_down
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
