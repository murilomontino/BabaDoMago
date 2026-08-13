alter table public.championship_players
	add column if not exists own_goals integer not null default 0;

alter table public.championship_players
	drop constraint if exists championship_players_stats_check;

alter table public.championship_players
	add constraint championship_players_stats_check
	check (
		goals >= 0
		and assists >= 0
		and own_goals >= 0
		and wins >= 0
		and matches >= 0
		and wins <= matches
	);

update public.championship_players p
set own_goals = sub.n
from (
	select
		g.scorer_player_id as player_id,
		count(*)::integer as n
	from public.championship_event_goals g
	join public.championship_event_matches m
		on m.id = g.match_id
	where g.is_own_goal
		and m.ended_at is not null
	group by g.scorer_player_id
) sub
where p.id = sub.player_id;

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
		'goals', player.goals,
		'assists', player.assists,
		'own_goals', player.own_goals,
		'wins', player.wins,
		'matches', player.matches
	);
$$;

create or replace function public.apply_championship_event_match_stats(
	match_id bigint,
	delta integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	match public.championship_event_matches%rowtype;
	score_a integer;
	score_b integer;
	winner_id bigint;
begin
	if apply_championship_event_match_stats.delta not in (-1, 1) then
		raise exception 'invalid stats delta' using errcode = '23514';
	end if;

	select *
	into match
	from public.championship_event_matches m
	where m.id = apply_championship_event_match_stats.match_id;

	if match.id is null then
		raise exception 'match not found' using errcode = 'P0002';
	end if;

	score_a := public.championship_event_match_score(match, match.team_a_id);
	score_b := public.championship_event_match_score(match, match.team_b_id);

	if score_a > score_b then
		winner_id := match.team_a_id;
	elsif score_b > score_a then
		winner_id := match.team_b_id;
	else
		winner_id := null;
	end if;

	update public.championship_players p
	set
		matches = p.matches + apply_championship_event_match_stats.delta,
		wins = p.wins + case
			when r.team_id is not distinct from winner_id
				then apply_championship_event_match_stats.delta
			else 0
		end,
		goals = p.goals + coalesce(scored.n, 0) * apply_championship_event_match_stats.delta,
		assists = p.assists + coalesce(assisted.n, 0) * apply_championship_event_match_stats.delta,
		own_goals = p.own_goals + coalesce(own_scored.n, 0) * apply_championship_event_match_stats.delta
	from public.championship_event_match_players r
	left join (
		select
			g.scorer_player_id as player_id,
			count(*)::integer as n
		from public.championship_event_goals g
		where g.match_id = match.id
			and not g.is_own_goal
		group by g.scorer_player_id
	) scored on scored.player_id = r.player_id
	left join (
		select
			g.assist_player_id as player_id,
			count(*)::integer as n
		from public.championship_event_goals g
		where g.match_id = match.id
			and g.assist_player_id is not null
		group by g.assist_player_id
	) assisted on assisted.player_id = r.player_id
	left join (
		select
			g.scorer_player_id as player_id,
			count(*)::integer as n
		from public.championship_event_goals g
		where g.match_id = match.id
			and g.is_own_goal
		group by g.scorer_player_id
	) own_scored on own_scored.player_id = r.player_id
	where r.match_id = match.id
		and p.id = r.player_id;
end;
$$;
