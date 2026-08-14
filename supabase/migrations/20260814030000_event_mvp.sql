alter table public.championship_players
	add column if not exists mvps integer not null default 0;

alter table public.championship_event_attendance
	add column if not exists is_mvp boolean not null default false;

alter table public.championship_event_attendance
	add column if not exists mvp_overridden boolean not null default false;

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
		and mvps >= 0
		and wins <= matches
	);

create or replace function public.championship_event_mvp_star_delta(
	ceiling numeric
)
returns numeric
language sql
immutable
set search_path = public
as $$
	select 0.1;
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
		'avatar_url', player.avatar_url,
		'rating', player.rating,
		'role', player.role,
		'deleted_at', player.deleted_at,
		'goals', player.goals,
		'assists', player.assists,
		'own_goals', player.own_goals,
		'wins', player.wins,
		'matches', player.matches,
		'mvps', player.mvps
	);
$$;

create or replace function public.assign_championship_event_mvps(
	event_id bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	event public.championship_events%rowtype;
begin
	select *
	into event
	from public.championship_events e
	where e.id = assign_championship_event_mvps.event_id
		and e.deleted_at is null;

	if event.id is null then
		return;
	end if;

	if event.ended_at is null then
		return;
	end if;

	if exists (
		select 1
		from public.championship_event_attendance a
		where a.event_id = event.id
			and a.mvp_overridden
	) then
		return;
	end if;

	with team_wins as (
		select
			m.winner_team_id as team_id,
			count(*)::integer as wins
		from public.championship_event_matches m
		where m.event_id = event.id
			and m.ended_at is not null
			and m.winner_team_id is not null
		group by m.winner_team_id
	),
	max_wins as (
		select coalesce(max(tw.wins), 0) as wins
		from team_wins tw
	),
	finalists as (
		select tw.team_id
		from team_wins tw
		join max_wins mw on mw.wins = tw.wins
		where mw.wins >= 1
	),
	involvement as (
		select
			tp.team_id,
			tp.player_id,
			a.goals + a.assists as goal_involvement
		from public.championship_event_team_players tp
		join public.championship_event_attendance a
			on a.event_id = tp.event_id
			and a.player_id = tp.player_id
		join finalists f on f.team_id = tp.team_id
		where tp.event_id = event.id
	),
	best as (
		select
			i.team_id,
			max(i.goal_involvement) as goal_involvement
		from involvement i
		group by i.team_id
	),
	mvp_ids as (
		select i.player_id
		from involvement i
		join best b
			on b.team_id = i.team_id
			and b.goal_involvement = i.goal_involvement
		where i.goal_involvement > 0
	)
	update public.championship_event_attendance a
	set is_mvp = exists (
		select 1
		from mvp_ids m
		where m.player_id = a.player_id
	)
	where a.event_id = event.id;
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
	ceiling numeric;
	player_ids bigint[];
begin
	select e.*
	into event
	from public.championship_events e
	where e.id = adjust_championship_player_ratings_for_event.event_id
		and e.deleted_at is null;

	if event.id is null then
		return;
	end if;

	select least(100, greatest(coalesce(max(p.rating), 0), 5))
	into ceiling
	from public.championship_players p
	where p.championship_id = event.championship_id
		and p.deleted_at is null;

	with deltas as (
		select
			a.id as attendance_id,
			a.player_id,
			a.rating_delta as old_delta,
			public.championship_event_rating_delta(
				a.wins,
				a.matches,
				roster.rating,
				ceiling
			) + case
				when a.is_mvp then public.championship_event_mvp_star_delta(ceiling)
				else 0
			end as new_delta
		from public.championship_event_attendance a
		join public.championship_players roster
			on roster.id = a.player_id
		where a.event_id = adjust_championship_player_ratings_for_event.event_id
	),
	updated_players as (
		update public.championship_players p
		set rating = least(
			100,
			greatest(
				0,
				round((p.rating - d.old_delta + d.new_delta)::numeric, 1)
			)
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

	select coalesce(array_agg(a.player_id), '{}')
	into player_ids
	from public.championship_event_attendance a
	where a.event_id = event.id;

	perform public.sync_championship_players_from_attendance(player_ids);
end;
$$;

create or replace function public.sync_championship_players_from_attendance(
	player_ids bigint[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
	if player_ids is null or cardinality(player_ids) is null then
		return;
	end if;

	update public.championship_players p
	set
		goals = coalesce(totals.goals, 0),
		assists = coalesce(totals.assists, 0),
		own_goals = coalesce(totals.own_goals, 0),
		wins = coalesce(totals.wins, 0),
		matches = coalesce(totals.matches, 0),
		mvps = coalesce(totals.mvps, 0)
	from unnest(player_ids) as u(player_id)
	left join (
		select
			a.player_id,
			sum(
				case
					when open_match.event_id is null then a.goals
					else coalesce(ended_goals.n, 0)
				end
			)::integer as goals,
			sum(
				case
					when open_match.event_id is null then a.assists
					else coalesce(ended_assists.n, 0)
				end
			)::integer as assists,
			sum(
				case
					when open_match.event_id is null then a.own_goals
					else coalesce(ended_own_goals.n, 0)
				end
			)::integer as own_goals,
			sum(a.wins)::integer as wins,
			sum(a.matches)::integer as matches,
			sum(case when a.is_mvp then 1 else 0 end)::integer as mvps
		from public.championship_event_attendance a
		join public.championship_events e
			on e.id = a.event_id
		left join lateral (
			select m.event_id
			from public.championship_event_matches m
			where m.event_id = a.event_id
				and m.ended_at is null
			limit 1
		) open_match on true
		left join lateral (
			select count(*)::integer as n
			from public.championship_event_goals g
			join public.championship_event_matches m
				on m.id = g.match_id
			where g.event_id = a.event_id
				and g.scorer_player_id = a.player_id
				and not g.is_own_goal
				and m.ended_at is not null
		) ended_goals on true
		left join lateral (
			select count(*)::integer as n
			from public.championship_event_goals g
			join public.championship_event_matches m
				on m.id = g.match_id
			where g.event_id = a.event_id
				and g.assist_player_id = a.player_id
				and m.ended_at is not null
		) ended_assists on true
		left join lateral (
			select count(*)::integer as n
			from public.championship_event_goals g
			join public.championship_event_matches m
				on m.id = g.match_id
			where g.event_id = a.event_id
				and g.scorer_player_id = a.player_id
				and g.is_own_goal
				and m.ended_at is not null
		) ended_own_goals on true
		where a.player_id = any (player_ids)
			and e.deleted_at is null
		group by a.player_id
	) totals on totals.player_id = u.player_id
	where p.id = u.player_id;
end;
$$;

create or replace function public.end_championship_event(
	event_id bigint,
	present_player_ids jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	event public.championship_events%rowtype;
	present_ids bigint[];
	player_id bigint;
	seen_present bigint[] := '{}';
	player public.championship_players%rowtype;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = end_championship_event.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(event.championship_id) not in ('owner', 'captain', 'admin') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if event.ended_at is not null then
		return jsonb_build_object(
			'id', event.id,
			'championship_id', event.championship_id,
			'starts_at', event.starts_at,
			'players_per_team', event.players_per_team,
			'ended_at', event.ended_at
		);
	end if;

	if present_player_ids is not null then
		if jsonb_typeof(present_player_ids) is distinct from 'array' then
			raise exception 'invalid attendance' using errcode = '23514';
		end if;

		if exists (
			select 1
			from jsonb_array_elements(present_player_ids) elem
			where jsonb_typeof(elem) is distinct from 'number'
		) then
			raise exception 'invalid attendance' using errcode = '23514';
		end if;

		select coalesce(array_agg(elem::bigint), '{}')
		into present_ids
		from jsonb_array_elements_text(present_player_ids) as elem;

		if cardinality(present_ids) is null or cardinality(present_ids) < 2 then
			raise exception 'invalid attendance' using errcode = '23514';
		end if;

		foreach player_id in array present_ids loop
			if player_id = any (seen_present) then
				raise exception 'duplicate attendance' using errcode = '23505';
			end if;

			seen_present := seen_present || player_id;

			select *
			into player
			from public.championship_players p
			where p.id = player_id
				and p.championship_id = event.championship_id
				and p.deleted_at is null;

			if player.id is null then
				raise exception 'player not found' using errcode = 'P0002';
			end if;
		end loop;

		if exists (
			select 1
			from public.championship_event_team_players tp
			where tp.event_id = event.id
				and tp.player_id <> all (present_ids)
		) then
			raise exception 'player not present' using errcode = '23514';
		end if;

		delete from public.championship_event_attendance a
		where a.event_id = event.id
			and a.player_id <> all (present_ids);

		insert into public.championship_event_attendance (
			event_id,
			player_id,
			display_name
		)
		select
			event.id,
			p.id,
			coalesce(nullif(btrim(p.nickname), ''), p.display_name)
		from unnest(present_ids) as u(pid)
		join public.championship_players p on p.id = u.pid
		where not exists (
			select 1
			from public.championship_event_attendance existing
			where existing.event_id = event.id
				and existing.player_id = p.id
		);
	end if;

	update public.championship_events
	set ended_at = now()
	where id = event.id
	returning * into event;

	perform public.refresh_championship_event_attendance_stats(event.id);
	perform public.assign_championship_event_mvps(event.id);
	perform public.adjust_championship_player_ratings_for_event(event.id);

	return jsonb_build_object(
		'id', event.id,
		'championship_id', event.championship_id,
		'starts_at', event.starts_at,
		'players_per_team', event.players_per_team,
		'ended_at', event.ended_at
	);
end;
$$;

create or replace function public.save_championship_player_event_stats(
	player_id bigint,
	event_id bigint,
	goals integer,
	assists integer,
	wins integer,
	matches integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
	event public.championship_events%rowtype;
	player public.championship_players%rowtype;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if goals < 0
		or assists < 0
		or wins < 0
		or matches < 0
	then
		raise exception 'invalid attendance stats' using errcode = '23514';
	end if;

	if wins > matches then
		raise exception 'wins exceed matches' using errcode = '23514';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = save_championship_player_event_stats.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if event.ended_at is null then
		raise exception 'event still open' using errcode = '23514';
	end if;

	if public.championship_actor_role(event.championship_id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	select *
	into player
	from public.championship_players p
	where p.id = save_championship_player_event_stats.player_id
		and p.championship_id = event.championship_id
		and p.deleted_at is null
	for update;

	if player.id is null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	insert into public.championship_event_attendance (
		event_id,
		player_id,
		display_name,
		goals,
		assists,
		wins,
		matches
	)
	values (
		event.id,
		player.id,
		coalesce(nullif(btrim(player.nickname), ''), player.display_name),
		save_championship_player_event_stats.goals,
		save_championship_player_event_stats.assists,
		save_championship_player_event_stats.wins,
		save_championship_player_event_stats.matches
	)
	on conflict (event_id, player_id) do update
	set
		goals = excluded.goals,
		assists = excluded.assists,
		wins = excluded.wins,
		matches = excluded.matches;

	perform public.assign_championship_event_mvps(event.id);
	perform public.adjust_championship_player_ratings_for_event(event.id);

	return jsonb_build_object(
		'id', event.id,
		'championship_id', event.championship_id,
		'starts_at', event.starts_at,
		'players_per_team', event.players_per_team,
		'ended_at', event.ended_at
	);
end;
$$;

create or replace function public.save_championship_event_attendance_stats(
	event_id bigint,
	stats jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	event public.championship_events%rowtype;
	player_ids bigint[];
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if jsonb_typeof(stats) is distinct from 'array' then
		raise exception 'invalid attendance stats' using errcode = '23514';
	end if;

	if exists (
		select 1
		from jsonb_array_elements(stats) elem
		where jsonb_typeof(elem) is distinct from 'object'
			or jsonb_typeof(elem -> 'player_id') is distinct from 'number'
			or jsonb_typeof(elem -> 'goals') is distinct from 'number'
			or jsonb_typeof(elem -> 'assists') is distinct from 'number'
			or jsonb_typeof(elem -> 'own_goals') is distinct from 'number'
			or jsonb_typeof(elem -> 'wins') is distinct from 'number'
			or jsonb_typeof(elem -> 'matches') is distinct from 'number'
	) then
		raise exception 'invalid attendance stats' using errcode = '23514';
	end if;

	if exists (
		select 1
		from jsonb_array_elements(stats) elem
		where (elem ->> 'player_id')::numeric <> trunc((elem ->> 'player_id')::numeric)
			or (elem ->> 'goals')::numeric <> trunc((elem ->> 'goals')::numeric)
			or (elem ->> 'assists')::numeric <> trunc((elem ->> 'assists')::numeric)
			or (elem ->> 'own_goals')::numeric <> trunc((elem ->> 'own_goals')::numeric)
			or (elem ->> 'wins')::numeric <> trunc((elem ->> 'wins')::numeric)
			or (elem ->> 'matches')::numeric <> trunc((elem ->> 'matches')::numeric)
			or (elem ->> 'player_id')::bigint <= 0
			or (elem ->> 'goals')::integer < 0
			or (elem ->> 'assists')::integer < 0
			or (elem ->> 'own_goals')::integer < 0
			or (elem ->> 'wins')::integer < 0
			or (elem ->> 'matches')::integer < 0
	) then
		raise exception 'invalid attendance stats' using errcode = '23514';
	end if;

	if exists (
		select 1
		from jsonb_array_elements(stats) elem
		where (elem ->> 'wins')::integer > (elem ->> 'matches')::integer
	) then
		raise exception 'wins exceed matches' using errcode = '23514';
	end if;

	select coalesce(array_agg((elem ->> 'player_id')::bigint), '{}')
	into player_ids
	from jsonb_array_elements(stats) elem;

	if (
		select count(*) <> count(distinct (elem ->> 'player_id')::bigint)
		from jsonb_array_elements(stats) elem
	) then
		raise exception 'duplicate attendance' using errcode = '23505';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = save_championship_event_attendance_stats.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(event.championship_id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if not exists (
		select 1
		from public.championship_event_attendance a
		where a.event_id = event.id
	) then
		raise exception 'invalid attendance' using errcode = '23514';
	end if;

	if exists (
		select 1
		from public.championship_event_attendance a
		where a.event_id = event.id
			and a.player_id <> all (player_ids)
	) then
		raise exception 'invalid attendance stats' using errcode = '23514';
	end if;

	if exists (
		select 1
		from unnest(player_ids) as u(player_id)
		where not exists (
			select 1
			from public.championship_event_attendance a
			where a.event_id = event.id
				and a.player_id = u.player_id
		)
	) then
		raise exception 'player not present' using errcode = '23514';
	end if;

	update public.championship_event_attendance a
	set
		goals = s.goals,
		assists = s.assists,
		own_goals = s.own_goals,
		wins = s.wins,
		matches = s.matches
	from (
		select
			(elem ->> 'player_id')::bigint as player_id,
			(elem ->> 'goals')::integer as goals,
			(elem ->> 'assists')::integer as assists,
			(elem ->> 'own_goals')::integer as own_goals,
			(elem ->> 'wins')::integer as wins,
			(elem ->> 'matches')::integer as matches
		from jsonb_array_elements(stats) elem
	) s
	where a.event_id = event.id
		and a.player_id = s.player_id;

	perform public.assign_championship_event_mvps(event.id);
	perform public.adjust_championship_player_ratings_for_event(event.id);

	return jsonb_build_object(
		'id', event.id,
		'championship_id', event.championship_id,
		'starts_at', event.starts_at,
		'players_per_team', event.players_per_team,
		'ended_at', event.ended_at
	);
end;
$$;

create or replace function public.set_championship_event_mvps(
	event_id bigint,
	player_ids jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	event public.championship_events%rowtype;
	mvp_ids bigint[];
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if jsonb_typeof(player_ids) is distinct from 'array' then
		raise exception 'invalid attendance' using errcode = '23514';
	end if;

	if exists (
		select 1
		from jsonb_array_elements(player_ids) elem
		where jsonb_typeof(elem) is distinct from 'number'
	) then
		raise exception 'invalid attendance' using errcode = '23514';
	end if;

	select coalesce(array_agg(elem::bigint), '{}')
	into mvp_ids
	from jsonb_array_elements_text(player_ids) as elem;

	if (
		select count(*) <> count(distinct u.player_id)
		from unnest(mvp_ids) as u(player_id)
	) then
		raise exception 'duplicate attendance' using errcode = '23505';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = set_championship_event_mvps.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if event.ended_at is null then
		raise exception 'event still open' using errcode = '23514';
	end if;

	if public.championship_actor_role(event.championship_id) not in ('owner', 'captain') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if exists (
		select 1
		from unnest(mvp_ids) as u(player_id)
		where not exists (
			select 1
			from public.championship_event_attendance a
			where a.event_id = event.id
				and a.player_id = u.player_id
		)
	) then
		raise exception 'player not present' using errcode = '23514';
	end if;

	update public.championship_event_attendance a
	set
		is_mvp = a.player_id = any (mvp_ids),
		mvp_overridden = true
	where a.event_id = event.id;

	perform public.adjust_championship_player_ratings_for_event(event.id);

	return jsonb_build_object(
		'id', event.id,
		'championship_id', event.championship_id,
		'starts_at', event.starts_at,
		'players_per_team', event.players_per_team,
		'ended_at', event.ended_at
	);
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

revoke all on function public.championship_event_mvp_star_delta(numeric) from public;
revoke all on function public.assign_championship_event_mvps(bigint) from public;
revoke all on function public.adjust_championship_player_ratings_for_event(bigint) from public;
revoke all on function public.sync_championship_players_from_attendance(bigint[]) from public;
revoke all on function public.end_championship_event(bigint, jsonb) from public;
revoke all on function public.save_championship_player_event_stats(bigint, bigint, integer, integer, integer, integer) from public;
revoke all on function public.save_championship_event_attendance_stats(bigint, jsonb) from public;
revoke all on function public.set_championship_event_mvps(bigint, jsonb) from public;
revoke all on function public.merge_championship_players(bigint, bigint) from public;
revoke all on function public.championship_player_json(public.championship_players) from public;

grant execute on function public.end_championship_event(bigint, jsonb) to authenticated;
grant execute on function public.save_championship_player_event_stats(bigint, bigint, integer, integer, integer, integer) to authenticated;
grant execute on function public.save_championship_event_attendance_stats(bigint, jsonb) to authenticated;
grant execute on function public.set_championship_event_mvps(bigint, jsonb) to authenticated;
grant execute on function public.merge_championship_players(bigint, bigint) to authenticated;
grant execute on function public.championship_player_json(public.championship_players) to authenticated;

notify pgrst, 'reload schema';
