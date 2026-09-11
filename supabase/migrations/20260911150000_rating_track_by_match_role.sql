-- Nota por track do jogo: linha e goleiro contam partidas separadas.
-- attendance guarda line_* e gk_*; o ajuste calcula os dois deltas de forma independente.
-- Voto do elenco passa a ter track ('line' | 'goalkeeper') e overlay independente por nota.

-- 1. Estatísticas por track na presença.

alter table public.championship_event_attendance
	add column if not exists line_wins integer not null default 0;

alter table public.championship_event_attendance
	add column if not exists line_draws integer not null default 0;

alter table public.championship_event_attendance
	add column if not exists line_losses integer not null default 0;

alter table public.championship_event_attendance
	add column if not exists line_matches integer not null default 0;

alter table public.championship_event_attendance
	add column if not exists gk_wins integer not null default 0;

alter table public.championship_event_attendance
	add column if not exists gk_draws integer not null default 0;

alter table public.championship_event_attendance
	add column if not exists gk_losses integer not null default 0;

alter table public.championship_event_attendance
	add column if not exists gk_matches integer not null default 0;

-- 2. refresh divide o lateral `played` por papel na partida.

create or replace function public.refresh_championship_event_attendance_stats(
	event_id bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
	update public.championship_event_attendance a
	set
		event_date = s.event_date,
		matches = s.matches,
		wins = s.wins,
		losses = s.losses,
		draws = s.draws,
		line_matches = s.line_matches,
		line_wins = s.line_wins,
		line_losses = s.line_losses,
		line_draws = s.line_draws,
		gk_matches = s.gk_matches,
		gk_wins = s.gk_wins,
		gk_losses = s.gk_losses,
		gk_draws = s.gk_draws,
		goals = s.goals,
		assists = s.assists,
		assisted_goals = s.assisted_goals,
		own_goals = s.own_goals
	from (
		select
			a2.id,
			(e.starts_at at time zone 'America/Sao_Paulo')::date as event_date,
			coalesce(played.matches, 0) as matches,
			coalesce(played.wins, 0) as wins,
			coalesce(played.losses, 0) as losses,
			coalesce(played.draws, 0) as draws,
			coalesce(played_line.matches, 0) as line_matches,
			coalesce(played_line.wins, 0) as line_wins,
			coalesce(played_line.losses, 0) as line_losses,
			coalesce(played_line.draws, 0) as line_draws,
			coalesce(played_gk.matches, 0) as gk_matches,
			coalesce(played_gk.wins, 0) as gk_wins,
			coalesce(played_gk.losses, 0) as gk_losses,
			coalesce(played_gk.draws, 0) as gk_draws,
			coalesce(scored.goals, 0) as goals,
			coalesce(assisted.assists, 0) as assists,
			coalesce(served.assisted_goals, 0) as assisted_goals,
			coalesce(own_scored.own_goals, 0) as own_goals
		from public.championship_event_attendance a2
		join public.championship_events e
			on e.id = a2.event_id
		left join lateral (
			select
				count(*)::integer as matches,
				count(*) filter (
					where m.winner_team_id is not distinct from mp.team_id
				)::integer as wins,
				count(*) filter (
					where m.winner_team_id is not null
						and m.winner_team_id is distinct from mp.team_id
				)::integer as losses,
				count(*) filter (
					where m.winner_team_id is null
				)::integer as draws
			from public.championship_event_match_players mp
			join public.championship_event_matches m
				on m.id = mp.match_id
			left join public.championship_event_team_players tp
				on tp.event_id = mp.event_id
				and tp.player_id = mp.player_id
			where mp.event_id = a2.event_id
				and mp.player_id = a2.player_id
				and mp.include_stats
				and m.ended_at is not null
				and (
					not e.skip_guest_goalkeeper_matches
					or not mp.is_goalkeeper
					or tp.team_id is not distinct from mp.team_id
					or m.winner_team_id is not distinct from mp.team_id
				)
		) played on true
		left join lateral (
			select
				count(*)::integer as matches,
				count(*) filter (
					where m.winner_team_id is not distinct from mp.team_id
				)::integer as wins,
				count(*) filter (
					where m.winner_team_id is not null
						and m.winner_team_id is distinct from mp.team_id
				)::integer as losses,
				count(*) filter (
					where m.winner_team_id is null
				)::integer as draws
			from public.championship_event_match_players mp
			join public.championship_event_matches m
				on m.id = mp.match_id
			left join public.championship_event_team_players tp
				on tp.event_id = mp.event_id
				and tp.player_id = mp.player_id
			where mp.event_id = a2.event_id
				and mp.player_id = a2.player_id
				and mp.include_stats
				and m.ended_at is not null
				and not mp.is_goalkeeper
				and (
					not e.skip_guest_goalkeeper_matches
					or not mp.is_goalkeeper
					or tp.team_id is not distinct from mp.team_id
					or m.winner_team_id is not distinct from mp.team_id
				)
		) played_line on true
		left join lateral (
			select
				count(*)::integer as matches,
				count(*) filter (
					where m.winner_team_id is not distinct from mp.team_id
				)::integer as wins,
				count(*) filter (
					where m.winner_team_id is not null
						and m.winner_team_id is distinct from mp.team_id
				)::integer as losses,
				count(*) filter (
					where m.winner_team_id is null
				)::integer as draws
			from public.championship_event_match_players mp
			join public.championship_event_matches m
				on m.id = mp.match_id
			left join public.championship_event_team_players tp
				on tp.event_id = mp.event_id
				and tp.player_id = mp.player_id
			where mp.event_id = a2.event_id
				and mp.player_id = a2.player_id
				and mp.include_stats
				and m.ended_at is not null
				and mp.is_goalkeeper
				and (
					not e.skip_guest_goalkeeper_matches
					or not mp.is_goalkeeper
					or tp.team_id is not distinct from mp.team_id
					or m.winner_team_id is not distinct from mp.team_id
				)
		) played_gk on true
		left join lateral (
			select count(*)::integer as goals
			from public.championship_event_goals g
			join public.championship_event_match_players mp
				on mp.match_id = g.match_id
				and mp.player_id = g.scorer_player_id
			where g.event_id = a2.event_id
				and g.scorer_player_id = a2.player_id
				and not g.is_own_goal
				and mp.include_stats
		) scored on true
		left join lateral (
			select count(*)::integer as assists
			from public.championship_event_goals g
			join public.championship_event_match_players mp
				on mp.match_id = g.match_id
				and mp.player_id = g.assist_player_id
			where g.event_id = a2.event_id
				and g.assist_player_id = a2.player_id
				and mp.include_stats
		) assisted on true
		left join lateral (
			select count(*)::integer as assisted_goals
			from public.championship_event_goals g
			join public.championship_event_match_players mp
				on mp.match_id = g.match_id
				and mp.player_id = g.scorer_player_id
			where g.event_id = a2.event_id
				and g.scorer_player_id = a2.player_id
				and not g.is_own_goal
				and g.assist_player_id is not null
				and mp.include_stats
		) served on true
		left join lateral (
			select count(*)::integer as own_goals
			from public.championship_event_goals g
			join public.championship_event_match_players mp
				on mp.match_id = g.match_id
				and mp.player_id = g.scorer_player_id
			where g.event_id = a2.event_id
				and g.scorer_player_id = a2.player_id
				and g.is_own_goal
				and mp.include_stats
		) own_scored on true
		where a2.event_id = refresh_championship_event_attendance_stats.event_id
	) s
	where a.id = s.id;
end;
$$;

revoke all on function public.refresh_championship_event_attendance_stats(bigint) from public;

-- 3. Backfill dos contadores por track.

do $$
declare
	eid bigint;
begin
	for eid in
		select distinct a.event_id
		from public.championship_event_attendance a
	loop
		perform public.refresh_championship_event_attendance_stats(eid);
	end loop;
end $$;

-- 4. Ajuste calcula linha e goleiro de forma independente.

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
	base as (
		select
			a.id as attendance_id,
			a.player_id,
			a.rating_delta as line_old_delta,
			a.goalkeeper_rating_delta as gk_old_delta,
			case
				when a.rating = 0
					and p.rating <> 0
					and a.rating_delta = 0 then 0
				else public.championship_event_rating_delta(
					a.line_wins,
					a.line_draws,
					a.line_losses,
					a.line_matches,
					a.rating,
					line_ceiling,
					dead_zone_down,
					rating_min_matches
				)
			end + case
				when a.is_mvp
					and (
						(
							not a.is_goalkeeper
							and (a.line_matches > 0 or a.gk_matches = 0)
						)
						or (
							a.is_goalkeeper
							and a.gk_matches = 0
							and a.line_matches > 0
						)
					)
				then public.championship_event_mvp_bonus(a.rating)
				else 0
			end as line_raw_delta,
			case
				when a.goalkeeper_rating = 0
					and p.goalkeeper_rating <> 0
					and a.goalkeeper_rating_delta = 0 then 0
				else public.championship_event_rating_delta(
					a.gk_wins,
					a.gk_draws,
					a.gk_losses,
					a.gk_matches,
					a.goalkeeper_rating,
					gk_ceiling,
					dead_zone_down,
					rating_min_matches
				)
			end + case
				when a.is_mvp
					and (
						(
							a.is_goalkeeper
							and (a.gk_matches > 0 or a.line_matches = 0)
						)
						or (
							not a.is_goalkeeper
							and a.line_matches = 0
							and a.gk_matches > 0
						)
					)
				then public.championship_event_mvp_bonus(a.goalkeeper_rating)
				else 0
			end as gk_raw_delta,
			case
				when drop_share_enabled
					and not (
						exclude_top_enabled
						and exists (
							select 1
							from excluded_top_line xt
							where xt.id = a.player_id
						)
					)
				then public.championship_event_rating_team_goal_share(
					(a.goals + a.assists)::numeric,
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
							where xt.id = a.player_id
						)
					)
				then public.championship_event_rating_team_goal_share(
					(a.goals + a.assists)::numeric,
					coalesce(ti.involvement, 0)
				)
				else 0
			end as gk_share
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

-- 5. Voto do elenco por track.

alter table public.championship_event_player_votes
	add column if not exists track text not null default 'line';

alter table public.championship_event_player_votes
	drop constraint if exists championship_event_player_votes_track_check;

alter table public.championship_event_player_votes
	add constraint championship_event_player_votes_track_check
	check (track in ('line', 'goalkeeper'));

-- O nome da unique antiga foi gerado pelo Postgres (e truncado): acha pelas colunas.
do $$
declare
	target record;
begin
	for target in
		select con.conname
		from pg_constraint con
		where con.conrelid = 'public.championship_event_player_votes'::regclass
			and con.contype = 'u'
			and (
				select array_agg(att.attname::text order by att.attname)
				from unnest(con.conkey) as k(attnum)
				join pg_attribute att
					on att.attrelid = con.conrelid
					and att.attnum = k.attnum
			) = array['event_id', 'target_player_id', 'voter_player_id']
	loop
		execute format(
			'alter table public.championship_event_player_votes drop constraint %I',
			target.conname
		);
	end loop;
end $$;

alter table public.championship_event_player_votes
	drop constraint if exists championship_event_player_votes_event_id_voter_player_id_target_player_id_key;

alter table public.championship_event_player_votes
	drop constraint if exists championship_event_player_votes_event_id_voter_player_id_targ_key;

alter table public.championship_event_player_votes
	drop constraint if exists championship_event_player_votes_event_voter_target_key;

alter table public.championship_event_player_votes
	drop constraint if exists championship_event_player_votes_event_voter_target_track_key;

alter table public.championship_event_player_votes
	add constraint championship_event_player_votes_event_voter_target_track_key
	unique (event_id, voter_player_id, target_player_id, track);

drop index if exists public.championship_event_player_votes_target_idx;

create index if not exists championship_event_player_votes_target_idx
	on public.championship_event_player_votes (event_id, target_player_id, track);

-- 6. recompute por track.

drop function if exists public.recompute_championship_event_player_vote_delta(
	bigint,
	bigint
);

create or replace function public.recompute_championship_event_player_vote_delta(
	event_id bigint,
	target_player_id bigint,
	track text default 'line'
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
	vote_track text := coalesce(
		recompute_championship_event_player_vote_delta.track,
		'line'
	);
	like_count integer;
	dislike_count integer;
	maintain_count integer;
	quorum_count integer;
	new_delta numeric;
	current_delta numeric;
	attendance_id bigint;
begin
	if vote_track not in ('line', 'goalkeeper') then
		raise exception 'invalid vote track' using errcode = '23514';
	end if;

	select
		a.id,
		case
			when vote_track = 'goalkeeper' then a.goalkeeper_vote_rating_delta
			else a.vote_rating_delta
		end
	into attendance_id, current_delta
	from public.championship_event_attendance a
	where a.event_id = recompute_championship_event_player_vote_delta.event_id
		and a.player_id = recompute_championship_event_player_vote_delta.target_player_id
	for update;

	if attendance_id is null then
		return 0;
	end if;

	-- Quórum já fechou naquele track: delta fica e não recalcula.
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
		and v.target_player_id = recompute_championship_event_player_vote_delta.target_player_id
		and v.track = vote_track;

	new_delta := public.championship_event_player_vote_applied_delta(
		like_count,
		dislike_count,
		maintain_count,
		quorum_count
	);

	if new_delta = current_delta then
		return current_delta;
	end if;

	if vote_track = 'goalkeeper' then
		update public.championship_event_attendance a
		set goalkeeper_vote_rating_delta = new_delta
		where a.id = attendance_id;
	else
		update public.championship_event_attendance a
		set vote_rating_delta = new_delta
		where a.id = attendance_id;
	end if;

	perform public.sync_championship_event_attendance_vote_rating(attendance_id);

	return new_delta;
end;
$$;

revoke all on function public.recompute_championship_event_player_vote_delta(
	bigint,
	bigint,
	text
) from public;

-- 7. Sync aplica os dois overlays de forma independente.

create or replace function public.sync_championship_event_attendance_vote_rating(
	attendance_id bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	attendance public.championship_event_attendance%rowtype;
	player public.championship_players%rowtype;
	event_voided boolean := false;
	line_target numeric;
	line_diff numeric;
	gk_target numeric;
	gk_diff numeric;
begin
	select *
	into attendance
	from public.championship_event_attendance a
	where a.id = sync_championship_event_attendance_vote_rating.attendance_id
	for update;

	if attendance.id is null then
		return;
	end if;

	select e.player_votes_voided_at is not null
	into event_voided
	from public.championship_events e
	where e.id = attendance.event_id;

	select *
	into player
	from public.championship_players p
	where p.id = attendance.player_id
	for update;

	if player.id is null then
		return;
	end if;

	line_target := case
		when event_voided then 0
		else attendance.vote_rating_delta
	end;
	line_diff := line_target - attendance.vote_rating_applied;

	if player.rating <> 0 and line_diff <> 0 then
		update public.championship_players p
		set rating = public.championship_player_rating_apply(p.rating, line_diff)
		where p.id = player.id;

		update public.championship_event_attendance a
		set vote_rating_applied = line_target
		where a.id = attendance.id;
	end if;

	gk_target := case
		when event_voided then 0
		else attendance.goalkeeper_vote_rating_delta
	end;
	gk_diff := gk_target - attendance.goalkeeper_vote_rating_applied;

	if player.goalkeeper_rating <> 0 and gk_diff <> 0 then
		update public.championship_players p
		set goalkeeper_rating = public.championship_player_rating_apply(
			p.goalkeeper_rating,
			gk_diff
		)
		where p.id = player.id;

		update public.championship_event_attendance a
		set goalkeeper_vote_rating_applied = gk_target
		where a.id = attendance.id;
	end if;
end;
$$;

revoke all on function public.sync_championship_event_attendance_vote_rating(bigint) from public;

-- 8. Trigger propaga o track.

create or replace function public.championship_event_player_votes_recompute_trg()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	if tg_op = 'DELETE' then
		perform public.recompute_championship_event_player_vote_delta(
			old.event_id,
			old.target_player_id,
			old.track
		);
		return old;
	end if;

	perform public.recompute_championship_event_player_vote_delta(
		new.event_id,
		new.target_player_id,
		new.track
	);

	if tg_op = 'UPDATE'
		and (
			old.target_player_id is distinct from new.target_player_id
			or old.track is distinct from new.track
		) then
		perform public.recompute_championship_event_player_vote_delta(
			old.event_id,
			old.target_player_id,
			old.track
		);
	end if;

	return new;
end;
$$;

revoke all on function public.championship_event_player_votes_recompute_trg() from public;

drop trigger if exists championship_event_player_votes_recompute
	on public.championship_event_player_votes;

create trigger championship_event_player_votes_recompute
	after insert or update or delete
	on public.championship_event_player_votes
	for each row
	execute function public.championship_event_player_votes_recompute_trg();

-- 9. Urna em lote com track.

create or replace function public.submit_championship_event_player_votes(
	event_id bigint,
	votes jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
	viewer uuid := (select auth.uid());
	event public.championship_events%rowtype;
	voter_id bigint;
	allow_self boolean;
	vote_row record;
	vote_track text;
	seen_key text;
	like_count integer := 0;
	dislike_count integer := 0;
	locked_like_count integer := 0;
	locked_dislike_count integer := 0;
	kept_keys text[] := '{}';
	write_keys text[] := '{}';
	target_ids bigint[] := '{}';
	affected_ids bigint[] := '{}';
	my_votes jsonb := '[]'::jsonb;
	attendance_rows jsonb := '[]'::jsonb;
	seen_keys text[] := '{}';
	target_delta numeric;
	stored_value text;
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if submit_championship_event_player_votes.votes is null
		or jsonb_typeof(submit_championship_event_player_votes.votes) <> 'array'
	then
		raise exception 'invalid vote' using errcode = '23514';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = submit_championship_event_player_votes.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if event.ended_at is null then
		raise exception 'event still open' using errcode = '23514';
	end if;

	if event.player_votes_voided_at is not null then
		raise exception 'player votes voided' using errcode = '23514';
	end if;

	if event.player_votes_closed_at is not null then
		raise exception 'player votes closed' using errcode = '23514';
	end if;

	voter_id := public.championship_event_player_vote_voter_id(event.id);

	select c.player_vote_allow_self
	into allow_self
	from public.championships c
	where c.id = event.championship_id;

	for vote_row in
		select
			entry.target_player_id,
			coalesce(entry.track, 'line') as track,
			entry.value
		from jsonb_to_recordset(submit_championship_event_player_votes.votes) as entry(
			target_player_id bigint,
			track text,
			value text
		)
	loop
		vote_track := vote_row.track;

		if vote_row.target_player_id is null then
			raise exception 'invalid vote' using errcode = '23514';
		end if;

		if vote_track not in ('line', 'goalkeeper') then
			raise exception 'invalid vote track' using errcode = '23514';
		end if;

		if vote_row.value not in ('like', 'dislike', 'maintain', 'blank') then
			raise exception 'invalid vote' using errcode = '23514';
		end if;

		seen_key := vote_row.target_player_id::text || ':' || vote_track;

		if seen_key = any (seen_keys) then
			raise exception 'invalid vote' using errcode = '23514';
		end if;

		seen_keys := array_append(seen_keys, seen_key);

		if not exists (
			select 1
			from public.championship_event_attendance a
			where a.event_id = event.id
				and a.player_id = vote_row.target_player_id
		) then
			raise exception 'player not present' using errcode = '23514';
		end if;

		select
			case
				when vote_track = 'goalkeeper' then a.goalkeeper_vote_rating_delta
				else a.vote_rating_delta
			end,
			v.value
		into target_delta, stored_value
		from public.championship_event_attendance a
		left join public.championship_event_player_votes v
			on v.event_id = a.event_id
			and v.target_player_id = a.player_id
			and v.voter_player_id = voter_id
			and v.track = vote_track
		where a.event_id = event.id
			and a.player_id = vote_row.target_player_id;

		if coalesce(target_delta, 0) <> 0 then
			if stored_value is not distinct from vote_row.value then
				kept_keys := array_append(kept_keys, seen_key);
				continue;
			end if;

			raise exception 'vote closed' using errcode = '23514';
		end if;

		if not coalesce(allow_self, true)
			and vote_row.target_player_id = voter_id
		then
			raise exception 'cannot vote self' using errcode = '23514';
		end if;

		if vote_row.value = 'like' then
			like_count := like_count + 1;
		elsif vote_row.value = 'dislike' then
			dislike_count := dislike_count + 1;
		end if;

		kept_keys := array_append(kept_keys, seen_key);
		write_keys := array_append(write_keys, seen_key);
		target_ids := array_append(target_ids, vote_row.target_player_id);
	end loop;

	select
		coalesce(count(*) filter (where v.value = 'like'), 0)::integer,
		coalesce(count(*) filter (where v.value = 'dislike'), 0)::integer
	into locked_like_count, locked_dislike_count
	from public.championship_event_player_votes v
	join public.championship_event_attendance a
		on a.event_id = v.event_id
		and a.player_id = v.target_player_id
	where v.event_id = event.id
		and v.voter_player_id = voter_id
		and case
			when v.track = 'goalkeeper' then a.goalkeeper_vote_rating_delta
			else a.vote_rating_delta
		end <> 0;

	if like_count + locked_like_count > 5 then
		raise exception 'like budget exceeded' using errcode = '23514';
	end if;

	if dislike_count + locked_dislike_count > 5 then
		raise exception 'dislike budget exceeded' using errcode = '23514';
	end if;

	select coalesce(array_agg(distinct v.target_player_id), '{}')
	into affected_ids
	from public.championship_event_player_votes v
	where v.event_id = event.id
		and v.voter_player_id = voter_id;

	affected_ids := (
		select coalesce(array_agg(distinct id), '{}')
		from unnest(affected_ids || target_ids) as id
	);

	-- Omitido some só se aquele track ainda estiver aberto.
	delete from public.championship_event_player_votes v
	using public.championship_event_attendance a
	where v.event_id = event.id
		and v.voter_player_id = voter_id
		and a.event_id = v.event_id
		and a.player_id = v.target_player_id
		and not (
			v.target_player_id::text || ':' || v.track = any (kept_keys)
		)
		and case
			when v.track = 'goalkeeper' then a.goalkeeper_vote_rating_delta
			else a.vote_rating_delta
		end = 0;

	for vote_row in
		select
			entry.target_player_id,
			coalesce(entry.track, 'line') as track,
			entry.value
		from jsonb_to_recordset(submit_championship_event_player_votes.votes) as entry(
			target_player_id bigint,
			track text,
			value text
		)
	loop
		if not (
			vote_row.target_player_id::text || ':' || vote_row.track = any (write_keys)
		) then
			continue;
		end if;

		insert into public.championship_event_player_votes as v (
			event_id,
			voter_player_id,
			target_player_id,
			track,
			value
		)
		values (
			event.id,
			voter_id,
			vote_row.target_player_id,
			vote_row.track,
			vote_row.value
		)
		on conflict (event_id, voter_player_id, target_player_id, track)
		do update set
			value = excluded.value,
			updated_at = now();
	end loop;

	select coalesce(
		jsonb_agg(
			jsonb_build_object(
				'target_player_id', v.target_player_id,
				'track', v.track,
				'value', v.value
			)
			order by v.target_player_id, v.track
		),
		'[]'::jsonb
	)
	into my_votes
	from public.championship_event_player_votes v
	where v.event_id = event.id
		and v.voter_player_id = voter_id;

	select coalesce(
		jsonb_agg(
			jsonb_build_object(
				'player_id', a.player_id,
				'vote_rating_delta', a.vote_rating_delta,
				'goalkeeper_vote_rating_delta', a.goalkeeper_vote_rating_delta
			)
			order by a.player_id
		),
		'[]'::jsonb
	)
	into attendance_rows
	from public.championship_event_attendance a
	where a.event_id = event.id
		and a.player_id = any (affected_ids);

	return jsonb_build_object(
		'event_id', event.id,
		'votes', my_votes,
		'attendance', attendance_rows
	);
end;
$$;

revoke all on function public.submit_championship_event_player_votes(bigint, jsonb) from public;
grant execute on function public.submit_championship_event_player_votes(bigint, jsonb) to authenticated;

-- 10. Voto unitário com track.

drop function if exists public.vote_championship_event_player(bigint, bigint, text);

create or replace function public.vote_championship_event_player(
	event_id bigint,
	target_player_id bigint,
	value text,
	track text default 'line'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
	viewer uuid := (select auth.uid());
	event public.championship_events%rowtype;
	voter_id bigint;
	allow_self boolean;
	vote_track text := coalesce(vote_championship_event_player.track, 'line');
	new_delta numeric;
	my_value text;
	like_count integer;
	dislike_count integer;
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if vote_track not in ('line', 'goalkeeper') then
		raise exception 'invalid vote track' using errcode = '23514';
	end if;

	if vote_championship_event_player.value is not null
		and vote_championship_event_player.value not in ('like', 'dislike', 'maintain', 'blank')
	then
		raise exception 'invalid vote' using errcode = '23514';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = vote_championship_event_player.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if event.ended_at is null then
		raise exception 'event still open' using errcode = '23514';
	end if;

	if event.player_votes_voided_at is not null then
		raise exception 'player votes voided' using errcode = '23514';
	end if;

	if event.player_votes_closed_at is not null then
		raise exception 'player votes closed' using errcode = '23514';
	end if;

	voter_id := public.championship_event_player_vote_voter_id(event.id);

	if not exists (
		select 1
		from public.championship_event_attendance a
		where a.event_id = event.id
			and a.player_id = vote_championship_event_player.target_player_id
	) then
		raise exception 'player not present' using errcode = '23514';
	end if;

	select v.value
	into my_value
	from public.championship_event_player_votes v
	where v.event_id = event.id
		and v.voter_player_id = voter_id
		and v.target_player_id = vote_championship_event_player.target_player_id
		and v.track = vote_track;

	select case
		when vote_track = 'goalkeeper' then a.goalkeeper_vote_rating_delta
		else a.vote_rating_delta
	end
	into new_delta
	from public.championship_event_attendance a
	where a.event_id = event.id
		and a.player_id = vote_championship_event_player.target_player_id;

	if coalesce(new_delta, 0) <> 0 then
		if vote_championship_event_player.value is not null
			and vote_championship_event_player.value is not distinct from my_value
		then
			return jsonb_build_object(
				'event_id', event.id,
				'target_player_id', vote_championship_event_player.target_player_id,
				'track', vote_track,
				'my_value', to_jsonb(my_value),
				'vote_rating_delta', coalesce(new_delta, 0)
			);
		end if;

		raise exception 'vote closed' using errcode = '23514';
	end if;

	select c.player_vote_allow_self
	into allow_self
	from public.championships c
	where c.id = event.championship_id;

	if not coalesce(allow_self, true)
		and voter_id = vote_championship_event_player.target_player_id
	then
		raise exception 'cannot vote self' using errcode = '23514';
	end if;

	if vote_championship_event_player.value is null then
		delete from public.championship_event_player_votes v
		where v.event_id = event.id
			and v.voter_player_id = voter_id
			and v.target_player_id = vote_championship_event_player.target_player_id
			and v.track = vote_track;
		my_value := null;
	else
		select
			coalesce(
				count(*) filter (
					where v.value = 'like'
						and not (
							v.target_player_id = vote_championship_event_player.target_player_id
							and v.track = vote_track
						)
				),
				0
			)::integer,
			coalesce(
				count(*) filter (
					where v.value = 'dislike'
						and not (
							v.target_player_id = vote_championship_event_player.target_player_id
							and v.track = vote_track
						)
				),
				0
			)::integer
		into like_count, dislike_count
		from public.championship_event_player_votes v
		where v.event_id = event.id
			and v.voter_player_id = voter_id;

		if vote_championship_event_player.value = 'like'
			and like_count + 1 > 5
		then
			raise exception 'like budget exceeded' using errcode = '23514';
		end if;

		if vote_championship_event_player.value = 'dislike'
			and dislike_count + 1 > 5
		then
			raise exception 'dislike budget exceeded' using errcode = '23514';
		end if;

		insert into public.championship_event_player_votes as v (
			event_id,
			voter_player_id,
			target_player_id,
			track,
			value
		)
		values (
			event.id,
			voter_id,
			vote_championship_event_player.target_player_id,
			vote_track,
			vote_championship_event_player.value
		)
		on conflict (event_id, voter_player_id, target_player_id, track)
		do update set
			value = excluded.value,
			updated_at = now();
		my_value := vote_championship_event_player.value;
	end if;

	select case
		when vote_track = 'goalkeeper' then a.goalkeeper_vote_rating_delta
		else a.vote_rating_delta
	end
	into new_delta
	from public.championship_event_attendance a
	where a.event_id = event.id
		and a.player_id = vote_championship_event_player.target_player_id;

	return jsonb_build_object(
		'event_id', event.id,
		'target_player_id', vote_championship_event_player.target_player_id,
		'track', vote_track,
		'my_value', to_jsonb(my_value),
		'vote_rating_delta', coalesce(new_delta, 0)
	);
end;
$$;

revoke all on function public.vote_championship_event_player(bigint, bigint, text, text) from public;
grant execute on function public.vote_championship_event_player(bigint, bigint, text, text) to authenticated;

-- 11. Reabrir zera os dois overlays (delta e applied) nos dois tracks.

create or replace function public.reopen_championship_event_player_votes(
	event_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	event public.championship_events%rowtype;
	attendance_id bigint;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = reopen_championship_event_player_votes.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(event.championship_id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if event.ended_at is null then
		raise exception 'event still open' using errcode = '23514';
	end if;

	if event.player_votes_voided_at is null then
		raise exception 'votes not voided' using errcode = '23514';
	end if;

	delete from public.championship_event_player_votes v
	where v.event_id = event.id;

	update public.championship_event_attendance a
	set vote_rating_delta = 0,
		vote_rating_applied = 0,
		goalkeeper_vote_rating_delta = 0,
		goalkeeper_vote_rating_applied = 0
	where a.event_id = event.id
		and (
			a.vote_rating_delta <> 0
			or a.vote_rating_applied <> 0
			or a.goalkeeper_vote_rating_delta <> 0
			or a.goalkeeper_vote_rating_applied <> 0
		);

	update public.championship_events e
	set player_votes_voided_at = null,
		player_votes_closed_at = null
	where e.id = event.id;

	for attendance_id in
		select a.id
		from public.championship_event_attendance a
		where a.event_id = event.id
	loop
		perform public.sync_championship_event_attendance_vote_rating(attendance_id);
	end loop;

	return jsonb_build_object(
		'event_id', event.id,
		'player_votes_voided_at', null,
		'player_votes_closed_at', null
	);
end;
$$;

revoke all on function public.reopen_championship_event_player_votes(bigint) from public;
grant execute on function public.reopen_championship_event_player_votes(bigint) to authenticated;

-- 12. PostgREST recarrega o schema.

notify pgrst, 'reload schema';
