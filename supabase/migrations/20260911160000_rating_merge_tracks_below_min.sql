-- Merge line+gk sample into the larger track when both are below
-- rating_min_matches but the sum reaches it (tie → line).

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

	-- Teto por track olha toda a presença: o papel varia partida a partida.
	select least(100, greatest(coalesce(max(a.rating), 0), 5))
	into line_ceiling
	from public.championship_event_attendance a
	where a.event_id = event.id;

	select least(100, greatest(coalesce(max(a.goalkeeper_rating), 0), 5))
	into gk_ceiling
	from public.championship_event_attendance a
	where a.event_id = event.id;

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
	effective as (
		select
			a.id as attendance_id,
			a.player_id,
			a.rating,
			a.goalkeeper_rating,
			a.rating_delta as line_old_delta,
			a.goalkeeper_rating_delta as gk_old_delta,
			a.is_mvp,
			a.is_goalkeeper,
			a.goals,
			a.assists,
			p.rating as player_rating,
			p.goalkeeper_rating as player_gk_rating,
			case
				when a.line_matches < rating_min_matches
					and a.gk_matches < rating_min_matches
					and a.line_matches + a.gk_matches >= rating_min_matches
					and a.line_matches >= a.gk_matches
				then 'line'
				when a.line_matches < rating_min_matches
					and a.gk_matches < rating_min_matches
					and a.line_matches + a.gk_matches >= rating_min_matches
				then 'goalkeeper'
				else null
			end as merged_into,
			case
				when a.line_matches < rating_min_matches
					and a.gk_matches < rating_min_matches
					and a.line_matches + a.gk_matches >= rating_min_matches
					and a.line_matches >= a.gk_matches
				then a.line_wins + a.gk_wins
				when a.line_matches < rating_min_matches
					and a.gk_matches < rating_min_matches
					and a.line_matches + a.gk_matches >= rating_min_matches
				then 0
				else a.line_wins
			end as eff_line_wins,
			case
				when a.line_matches < rating_min_matches
					and a.gk_matches < rating_min_matches
					and a.line_matches + a.gk_matches >= rating_min_matches
					and a.line_matches >= a.gk_matches
				then a.line_draws + a.gk_draws
				when a.line_matches < rating_min_matches
					and a.gk_matches < rating_min_matches
					and a.line_matches + a.gk_matches >= rating_min_matches
				then 0
				else a.line_draws
			end as eff_line_draws,
			case
				when a.line_matches < rating_min_matches
					and a.gk_matches < rating_min_matches
					and a.line_matches + a.gk_matches >= rating_min_matches
					and a.line_matches >= a.gk_matches
				then a.line_losses + a.gk_losses
				when a.line_matches < rating_min_matches
					and a.gk_matches < rating_min_matches
					and a.line_matches + a.gk_matches >= rating_min_matches
				then 0
				else a.line_losses
			end as eff_line_losses,
			case
				when a.line_matches < rating_min_matches
					and a.gk_matches < rating_min_matches
					and a.line_matches + a.gk_matches >= rating_min_matches
					and a.line_matches >= a.gk_matches
				then a.line_matches + a.gk_matches
				when a.line_matches < rating_min_matches
					and a.gk_matches < rating_min_matches
					and a.line_matches + a.gk_matches >= rating_min_matches
				then 0
				else a.line_matches
			end as eff_line_matches,
			case
				when a.line_matches < rating_min_matches
					and a.gk_matches < rating_min_matches
					and a.line_matches + a.gk_matches >= rating_min_matches
					and a.line_matches < a.gk_matches
				then a.line_wins + a.gk_wins
				when a.line_matches < rating_min_matches
					and a.gk_matches < rating_min_matches
					and a.line_matches + a.gk_matches >= rating_min_matches
				then 0
				else a.gk_wins
			end as eff_gk_wins,
			case
				when a.line_matches < rating_min_matches
					and a.gk_matches < rating_min_matches
					and a.line_matches + a.gk_matches >= rating_min_matches
					and a.line_matches < a.gk_matches
				then a.line_draws + a.gk_draws
				when a.line_matches < rating_min_matches
					and a.gk_matches < rating_min_matches
					and a.line_matches + a.gk_matches >= rating_min_matches
				then 0
				else a.gk_draws
			end as eff_gk_draws,
			case
				when a.line_matches < rating_min_matches
					and a.gk_matches < rating_min_matches
					and a.line_matches + a.gk_matches >= rating_min_matches
					and a.line_matches < a.gk_matches
				then a.line_losses + a.gk_losses
				when a.line_matches < rating_min_matches
					and a.gk_matches < rating_min_matches
					and a.line_matches + a.gk_matches >= rating_min_matches
				then 0
				else a.gk_losses
			end as eff_gk_losses,
			case
				when a.line_matches < rating_min_matches
					and a.gk_matches < rating_min_matches
					and a.line_matches + a.gk_matches >= rating_min_matches
					and a.line_matches < a.gk_matches
				then a.line_matches + a.gk_matches
				when a.line_matches < rating_min_matches
					and a.gk_matches < rating_min_matches
					and a.line_matches + a.gk_matches >= rating_min_matches
				then 0
				else a.gk_matches
			end as eff_gk_matches,
			a.line_matches as raw_line_matches,
			a.gk_matches as raw_gk_matches,
			tp.team_id
		from public.championship_event_attendance a
		join public.championship_players p
			on p.id = a.player_id
		left join public.championship_event_team_players tp
			on tp.event_id = a.event_id
			and tp.player_id = a.player_id
		where a.event_id = adjust_championship_player_ratings_for_event.event_id
	),
	base as (
		select
			e.attendance_id,
			e.player_id,
			e.line_old_delta,
			e.gk_old_delta,
			case
				when e.rating = 0
					and e.player_rating <> 0
					and e.line_old_delta = 0 then 0
				else public.championship_event_rating_delta(
					e.eff_line_wins,
					e.eff_line_draws,
					e.eff_line_losses,
					e.eff_line_matches,
					e.rating,
					line_ceiling,
					dead_zone_down,
					rating_min_matches
				)
			end + case
				when e.is_mvp
					and (
						e.merged_into = 'line'
						or (
							e.merged_into is null
							and (
								(
									not e.is_goalkeeper
									and (
										e.raw_line_matches > 0
										or e.raw_gk_matches = 0
									)
								)
								or (
									e.is_goalkeeper
									and e.raw_gk_matches = 0
									and e.raw_line_matches > 0
								)
							)
						)
					)
				then public.championship_event_mvp_bonus(e.rating)
				else 0
			end as line_raw_delta,
			case
				when e.goalkeeper_rating = 0
					and e.player_gk_rating <> 0
					and e.gk_old_delta = 0 then 0
				else public.championship_event_rating_delta(
					e.eff_gk_wins,
					e.eff_gk_draws,
					e.eff_gk_losses,
					e.eff_gk_matches,
					e.goalkeeper_rating,
					gk_ceiling,
					dead_zone_down,
					rating_min_matches
				)
			end + case
				when e.is_mvp
					and (
						e.merged_into = 'goalkeeper'
						or (
							e.merged_into is null
							and (
								(
									e.is_goalkeeper
									and (
										e.raw_gk_matches > 0
										or e.raw_line_matches = 0
									)
								)
								or (
									not e.is_goalkeeper
									and e.raw_line_matches = 0
									and e.raw_gk_matches > 0
								)
							)
						)
					)
				then public.championship_event_mvp_bonus(e.goalkeeper_rating)
				else 0
			end as gk_raw_delta,
			case
				when drop_share_enabled
					and not (
						exclude_top_enabled
						and exists (
							select 1
							from excluded_top_line xt
							where xt.id = e.player_id
						)
					)
				then public.championship_event_rating_team_goal_share(
					(e.goals + e.assists)::numeric,
					coalesce(ti.involvement, 0)
				)
				else 0
			end as line_share,
			case
				when drop_share_enabled
					and not (
						exclude_top_enabled
						and exists (
							select 1
							from excluded_top_gk xt
							where xt.id = e.player_id
						)
					)
				then public.championship_event_rating_team_goal_share(
					(e.goals + e.assists)::numeric,
					coalesce(ti.involvement, 0)
				)
				else 0
			end as gk_share
		from effective e
		left join team_involvement ti
			on ti.team_id = e.team_id
	),
	deltas as (
		select
			b.attendance_id,
			b.player_id,
			b.line_old_delta,
			b.gk_old_delta,
			public.championship_event_rating_apply_drop_share(
				b.line_raw_delta,
				b.line_share
			) as line_new_delta,
			public.championship_event_rating_apply_drop_share(
				b.gk_raw_delta,
				b.gk_share
			) as gk_new_delta
		from base b
	),
	-- Um único update por tabela: o mesmo jogador pode mexer nos dois tracks
	-- e CTEs irmãs não enxergam a linha atualizada pela outra.
	updated_players as (
		update public.championship_players p
		set
			rating = case
				when d.line_new_delta <> d.line_old_delta then
					public.championship_player_rating_apply(
						p.rating,
						-d.line_old_delta + d.line_new_delta
					)
				else p.rating
			end,
			goalkeeper_rating = case
				when d.gk_new_delta <> d.gk_old_delta then
					public.championship_player_rating_apply(
						p.goalkeeper_rating,
						-d.gk_old_delta + d.gk_new_delta
					)
				else p.goalkeeper_rating
			end
		from deltas d
		where p.id = d.player_id
			and (
				d.line_new_delta <> d.line_old_delta
				or d.gk_new_delta <> d.gk_old_delta
			)
		returning p.id
	)
	update public.championship_event_attendance a
	set
		rating_delta = d.line_new_delta,
		goalkeeper_rating_delta = d.gk_new_delta
	from deltas d
	where a.id = d.attendance_id
		and (
			a.rating_delta <> d.line_new_delta
			or a.goalkeeper_rating_delta <> d.gk_new_delta
		);

	select coalesce(array_agg(a.id), '{}')
	into attendance_ids
	from public.championship_event_attendance a
	where a.event_id = event.id
		and (
			a.vote_rating_delta <> a.vote_rating_applied
			or a.goalkeeper_vote_rating_delta <> a.goalkeeper_vote_rating_applied
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

revoke all on function public.adjust_championship_player_ratings_for_event(bigint) from public;
