alter table public.championship_event_attendance
	add column if not exists event_date date,
	add column if not exists goals integer not null default 0,
	add column if not exists assists integer not null default 0,
	add column if not exists own_goals integer not null default 0,
	add column if not exists wins integer not null default 0,
	add column if not exists matches integer not null default 0;

update public.championship_event_attendance a
set event_date = (e.starts_at at time zone 'America/Sao_Paulo')::date
from public.championship_events e
where e.id = a.event_id
	and a.event_date is null;

alter table public.championship_event_attendance
	alter column event_date set not null;

do $$
begin
	if not exists (
		select 1
		from pg_constraint
		where conname = 'championship_event_attendance_stats_check'
			and conrelid = 'public.championship_event_attendance'::regclass
	) then
		alter table public.championship_event_attendance
			add constraint championship_event_attendance_stats_check
			check (
				goals >= 0
				and assists >= 0
				and own_goals >= 0
				and wins >= 0
				and matches >= 0
				and wins <= matches
			);
	end if;
end $$;

create or replace function public.championship_event_attendance_set_event_date()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
	if new.event_date is null then
		select (e.starts_at at time zone 'America/Sao_Paulo')::date
		into new.event_date
		from public.championship_events e
		where e.id = new.event_id;
	end if;

	return new;
end;
$$;

drop trigger if exists championship_event_attendance_set_event_date
	on public.championship_event_attendance;

create trigger championship_event_attendance_set_event_date
before insert on public.championship_event_attendance
for each row
execute function public.championship_event_attendance_set_event_date();

-- presença: gols ao vivo; jogos/vitórias só de partidas encerradas
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
		goals = s.goals,
		assists = s.assists,
		own_goals = s.own_goals
	from (
		select
			a2.id,
			(e.starts_at at time zone 'America/Sao_Paulo')::date as event_date,
			coalesce(played.matches, 0) as matches,
			coalesce(played.wins, 0) as wins,
			coalesce(scored.goals, 0) as goals,
			coalesce(assisted.assists, 0) as assists,
			coalesce(own_scored.own_goals, 0) as own_goals
		from public.championship_event_attendance a2
		join public.championship_events e
			on e.id = a2.event_id
		left join lateral (
			select
				count(*)::integer as matches,
				count(*) filter (
					where m.winner_team_id is not distinct from mp.team_id
				)::integer as wins
			from public.championship_event_match_players mp
			join public.championship_event_matches m
				on m.id = mp.match_id
			where mp.event_id = a2.event_id
				and mp.player_id = a2.player_id
				and m.ended_at is not null
		) played on true
		left join lateral (
			select count(*)::integer as goals
			from public.championship_event_goals g
			where g.event_id = a2.event_id
				and g.scorer_player_id = a2.player_id
				and not g.is_own_goal
		) scored on true
		left join lateral (
			select count(*)::integer as assists
			from public.championship_event_goals g
			where g.event_id = a2.event_id
				and g.assist_player_id = a2.player_id
		) assisted on true
		left join lateral (
			select count(*)::integer as own_goals
			from public.championship_event_goals g
			where g.event_id = a2.event_id
				and g.scorer_player_id = a2.player_id
				and g.is_own_goal
		) own_scored on true
		where a2.event_id = refresh_championship_event_attendance_stats.event_id
	) s
	where a.id = s.id;
end;
$$;

-- jogador = soma da presença, ignorando gols de eventos com partida aberta
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
		matches = coalesce(totals.matches, 0)
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
			sum(a.matches)::integer as matches
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
	player_ids bigint[];
begin
	-- ponytail: delta kept for callers; stats recomputed via attendance
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

	select coalesce(array_agg(mp.player_id), '{}')
	into player_ids
	from public.championship_event_match_players mp
	where mp.match_id = match.id;

	perform public.refresh_championship_event_attendance_stats(match.event_id);
	perform public.sync_championship_players_from_attendance(player_ids);
end;
$$;

create or replace function public.add_championship_event_goal(
	match_id bigint,
	scorer_player_id bigint,
	assist_player_id bigint,
	is_own_goal boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	event public.championship_events%rowtype;
	match public.championship_event_matches%rowtype;
	scorer public.championship_event_match_players%rowtype;
	assist public.championship_event_match_players%rowtype;
	goal public.championship_event_goals%rowtype;
	own_goal boolean;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	own_goal := coalesce(add_championship_event_goal.is_own_goal, false);

	select *
	into match
	from public.championship_event_matches m
	where m.id = add_championship_event_goal.match_id;

	if match.id is null then
		raise exception 'match not found' using errcode = 'P0002';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = match.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if not public.is_championship_member(event.championship_id) then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if match.ended_at is not null then
		raise exception 'match already ended' using errcode = '23514';
	end if;

	select *
	into scorer
	from public.championship_event_match_players mp
	where mp.match_id = match.id
		and mp.player_id = add_championship_event_goal.scorer_player_id;

	if scorer.id is null then
		raise exception 'player not in match' using errcode = '23514';
	end if;

	if own_goal then
		assist_player_id := null;
	end if;

	if add_championship_event_goal.assist_player_id is not null then
		select *
		into assist
		from public.championship_event_match_players mp
		where mp.match_id = match.id
			and mp.player_id = add_championship_event_goal.assist_player_id;

		if assist.id is null then
			raise exception 'player not in match' using errcode = '23514';
		end if;

		if assist.team_id is distinct from scorer.team_id then
			raise exception 'assist not in team' using errcode = '23514';
		end if;
	end if;

	insert into public.championship_event_goals (
		match_id,
		event_id,
		scorer_player_id,
		assist_player_id,
		is_own_goal
	)
	values (
		match.id,
		event.id,
		scorer.player_id,
		add_championship_event_goal.assist_player_id,
		own_goal
	)
	returning * into goal;

	-- gol atualiza só a presença; jogador sobe no fim/exclusão da partida
	perform public.refresh_championship_event_attendance_stats(event.id);

	return jsonb_build_object(
		'id', goal.id,
		'match_id', goal.match_id,
		'event_id', goal.event_id,
		'scorer_player_id', goal.scorer_player_id,
		'assist_player_id', goal.assist_player_id,
		'is_own_goal', goal.is_own_goal,
		'created_at', goal.created_at
	);
end;
$$;

create or replace function public.delete_championship_event_match(match_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	event public.championship_events%rowtype;
	match public.championship_event_matches%rowtype;
	player_ids bigint[];
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into match
	from public.championship_event_matches m
	where m.id = delete_championship_event_match.match_id;

	if match.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = match.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(event.championship_id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	select coalesce(array_agg(mp.player_id), '{}')
	into player_ids
	from public.championship_event_match_players mp
	where mp.match_id = match.id;

	delete from public.championship_event_goals g
	where g.match_id = match.id;

	delete from public.championship_event_match_players mp
	where mp.match_id = match.id;

	delete from public.championship_event_matches
	where id = match.id;

	perform public.refresh_championship_event_attendance_stats(event.id);
	perform public.sync_championship_players_from_attendance(player_ids);

	return public.championship_event_match_json(match);
end;
$$;

create or replace function public.soft_delete_championship_event(event_id bigint)
returns void
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

	select *
	into event
	from public.championship_events e
	where e.id = soft_delete_championship_event.event_id
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(event.championship_id) not in ('owner', 'captain', 'admin') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	select coalesce(array_agg(a.player_id), '{}')
	into player_ids
	from public.championship_event_attendance a
	where a.event_id = event.id;

	update public.championship_events
	set deleted_at = now()
	where id = event.id
		and deleted_at is null;

	if not found then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	perform public.sync_championship_players_from_attendance(player_ids);
end;
$$;

create or replace function public.save_championship_event_attendance(
	event_id bigint,
	present_player_ids jsonb,
	goalkeeper_player_ids jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	event public.championship_events%rowtype;
	present_ids bigint[];
	goalkeeper_ids bigint[];
	player_id bigint;
	seen_present bigint[] := '{}';
	seen_goalkeepers bigint[] := '{}';
	player public.championship_players%rowtype;
	removed_ids bigint[];
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

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

	if jsonb_typeof(goalkeeper_player_ids) is distinct from 'array' then
		raise exception 'invalid attendance' using errcode = '23514';
	end if;

	if exists (
		select 1
		from jsonb_array_elements(goalkeeper_player_ids) elem
		where jsonb_typeof(elem) is distinct from 'number'
	) then
		raise exception 'invalid attendance' using errcode = '23514';
	end if;

	select coalesce(array_agg(elem::bigint), '{}')
	into goalkeeper_ids
	from jsonb_array_elements_text(goalkeeper_player_ids) as elem;

	select *
	into event
	from public.championship_events e
	where e.id = save_championship_event_attendance.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(event.championship_id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
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

	foreach player_id in array goalkeeper_ids loop
		if player_id = any (seen_goalkeepers) then
			raise exception 'duplicate attendance' using errcode = '23505';
		end if;

		seen_goalkeepers := seen_goalkeepers || player_id;

		if player_id <> all (present_ids) then
			raise exception 'player not present' using errcode = '23514';
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

	select coalesce(array_agg(a.player_id), '{}')
	into removed_ids
	from public.championship_event_attendance a
	where a.event_id = event.id
		and a.player_id <> all (present_ids);

	delete from public.championship_event_attendance a
	where a.event_id = event.id
		and a.player_id <> all (present_ids);

	update public.championship_event_attendance a
	set
		is_goalkeeper = (a.player_id = any (goalkeeper_ids)),
		event_date = (event.starts_at at time zone 'America/Sao_Paulo')::date
	where a.event_id = event.id
		and a.player_id = any (present_ids);

	insert into public.championship_event_attendance (
		event_id,
		player_id,
		display_name,
		is_goalkeeper,
		event_date
	)
	select
		event.id,
		p.id,
		coalesce(nullif(btrim(p.nickname), ''), p.display_name),
		p.id = any (goalkeeper_ids),
		(event.starts_at at time zone 'America/Sao_Paulo')::date
	from unnest(present_ids) as u(pid)
	join public.championship_players p on p.id = u.pid
	where not exists (
		select 1
		from public.championship_event_attendance existing
		where existing.event_id = event.id
			and existing.player_id = p.id
	);

	perform public.sync_championship_players_from_attendance(
		coalesce(removed_ids, '{}')
	);

	return jsonb_build_object(
		'id', event.id,
		'championship_id', event.championship_id,
		'starts_at', event.starts_at,
		'players_per_team', event.players_per_team,
		'ended_at', event.ended_at
	);
end;
$$;

update public.championship_event_attendance a
set
	event_date = s.event_date,
	matches = s.matches,
	wins = s.wins,
	goals = s.goals,
	assists = s.assists,
	own_goals = s.own_goals
from (
	select
		a2.id,
		(e.starts_at at time zone 'America/Sao_Paulo')::date as event_date,
		coalesce(played.matches, 0) as matches,
		coalesce(played.wins, 0) as wins,
		coalesce(scored.goals, 0) as goals,
		coalesce(assisted.assists, 0) as assists,
		coalesce(own_scored.own_goals, 0) as own_goals
	from public.championship_event_attendance a2
	join public.championship_events e
		on e.id = a2.event_id
	left join lateral (
		select
			count(*)::integer as matches,
			count(*) filter (
				where m.winner_team_id is not distinct from mp.team_id
			)::integer as wins
		from public.championship_event_match_players mp
		join public.championship_event_matches m
			on m.id = mp.match_id
		where mp.event_id = a2.event_id
			and mp.player_id = a2.player_id
			and m.ended_at is not null
	) played on true
	left join lateral (
		select count(*)::integer as goals
		from public.championship_event_goals g
		where g.event_id = a2.event_id
			and g.scorer_player_id = a2.player_id
			and not g.is_own_goal
	) scored on true
	left join lateral (
		select count(*)::integer as assists
		from public.championship_event_goals g
		where g.event_id = a2.event_id
			and g.assist_player_id = a2.player_id
	) assisted on true
	left join lateral (
		select count(*)::integer as own_goals
		from public.championship_event_goals g
		where g.event_id = a2.event_id
			and g.scorer_player_id = a2.player_id
			and g.is_own_goal
	) own_scored on true
) s
where a.id = s.id;

update public.championship_players p
set
	goals = coalesce(totals.goals, 0),
	assists = coalesce(totals.assists, 0),
	own_goals = coalesce(totals.own_goals, 0),
	wins = coalesce(totals.wins, 0),
	matches = coalesce(totals.matches, 0)
from (
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
		sum(a.matches)::integer as matches
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
	where e.deleted_at is null
	group by a.player_id
) totals
where p.id = totals.player_id;

update public.championship_players p
set
	goals = 0,
	assists = 0,
	own_goals = 0,
	wins = 0,
	matches = 0
where not exists (
	select 1
	from public.championship_event_attendance a
	join public.championship_events e
		on e.id = a.event_id
	where a.player_id = p.id
		and e.deleted_at is null
)
and (
	p.goals <> 0
	or p.assists <> 0
	or p.own_goals <> 0
	or p.wins <> 0
	or p.matches <> 0
);

revoke all on function public.refresh_championship_event_attendance_stats(bigint) from public;
revoke all on function public.sync_championship_players_from_attendance(bigint[]) from public;
revoke all on function public.championship_event_attendance_set_event_date() from public;

notify pgrst, 'reload schema';
