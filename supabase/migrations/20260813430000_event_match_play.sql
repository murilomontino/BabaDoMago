alter table public.championship_event_matches
	add column if not exists ended_at timestamptz;

alter table public.championship_event_matches
	add column if not exists winner_team_id bigint;

update public.championship_event_matches
set ended_at = created_at
where ended_at is null;

do $$
begin
	if not exists (
		select 1
		from pg_constraint
		where conname = 'championship_event_matches_id_event_id_key'
			and conrelid = 'public.championship_event_matches'::regclass
	) then
		alter table public.championship_event_matches
			add constraint championship_event_matches_id_event_id_key
			unique (id, event_id);
	end if;
end $$;

do $$
begin
	if not exists (
		select 1
		from pg_constraint
		where conname = 'championship_event_matches_winner_team_check'
			and conrelid = 'public.championship_event_matches'::regclass
	) then
		alter table public.championship_event_matches
			add constraint championship_event_matches_winner_team_check
			check (
				winner_team_id is null
				or winner_team_id = team_a_id
				or winner_team_id = team_b_id
			);
	end if;
end $$;

do $$
begin
	if not exists (
		select 1
		from pg_constraint
		where conname = 'championship_event_matches_open_winner_check'
			and conrelid = 'public.championship_event_matches'::regclass
	) then
		alter table public.championship_event_matches
			add constraint championship_event_matches_open_winner_check
			check (ended_at is not null or winner_team_id is null);
	end if;
end $$;

do $$
begin
	if not exists (
		select 1
		from pg_constraint
		where conname = 'championship_event_matches_winner_team_id_event_id_fkey'
			and conrelid = 'public.championship_event_matches'::regclass
	) then
		alter table public.championship_event_matches
			add constraint championship_event_matches_winner_team_id_event_id_fkey
			foreign key (winner_team_id, event_id)
			references public.championship_event_teams (id, event_id)
			on delete restrict;
	end if;
end $$;

create unique index if not exists championship_event_matches_one_open_idx
	on public.championship_event_matches (event_id)
	where ended_at is null;

create index if not exists championship_event_matches_winner_team_id_idx
	on public.championship_event_matches (winner_team_id);

create table if not exists public.championship_event_match_players (
	id bigint generated always as identity primary key,
	match_id bigint not null,
	event_id bigint not null,
	team_id bigint not null,
	player_id bigint not null references public.championship_players (id) on delete restrict,
	display_name text not null,
	is_goalkeeper boolean not null default false,
	slot smallint not null,
	foreign key (match_id, event_id)
		references public.championship_event_matches (id, event_id)
		on delete cascade,
	foreign key (team_id, event_id)
		references public.championship_event_teams (id, event_id)
		on delete restrict,
	foreign key (event_id, player_id)
		references public.championship_event_attendance (event_id, player_id)
		on delete restrict,
	unique (match_id, player_id),
	unique (match_id, team_id, slot),
	constraint championship_event_match_players_slot_check
		check (slot >= 0 and slot < 11)
);

create index if not exists championship_event_match_players_match_id_idx
	on public.championship_event_match_players (match_id);

create index if not exists championship_event_match_players_event_id_idx
	on public.championship_event_match_players (event_id);

create index if not exists championship_event_match_players_team_id_idx
	on public.championship_event_match_players (team_id);

create index if not exists championship_event_match_players_player_id_idx
	on public.championship_event_match_players (player_id);

create table if not exists public.championship_event_goals (
	id bigint generated always as identity primary key,
	match_id bigint not null,
	event_id bigint not null,
	scorer_player_id bigint not null,
	assist_player_id bigint,
	is_own_goal boolean not null default false,
	created_at timestamptz not null default now(),
	foreign key (match_id, event_id)
		references public.championship_event_matches (id, event_id)
		on delete cascade,
	foreign key (match_id, scorer_player_id)
		references public.championship_event_match_players (match_id, player_id)
		on delete restrict,
	foreign key (match_id, assist_player_id)
		references public.championship_event_match_players (match_id, player_id)
		on delete restrict,
	constraint championship_event_goals_scorer_assist_check
		check (scorer_player_id is distinct from assist_player_id),
	constraint championship_event_goals_own_goal_assist_check
		check (not is_own_goal or assist_player_id is null)
);

create index if not exists championship_event_goals_match_id_idx
	on public.championship_event_goals (match_id);

create index if not exists championship_event_goals_event_id_idx
	on public.championship_event_goals (event_id);

create index if not exists championship_event_goals_scorer_player_id_idx
	on public.championship_event_goals (scorer_player_id);

create index if not exists championship_event_goals_assist_player_id_idx
	on public.championship_event_goals (assist_player_id);

alter table public.championship_event_match_players enable row level security;
alter table public.championship_event_goals enable row level security;

drop policy if exists championship_event_match_players_select_member
	on public.championship_event_match_players;

create policy championship_event_match_players_select_member
	on public.championship_event_match_players
	for select
	to authenticated
	using (
		exists (
			select 1
			from public.championship_events e
			where e.id = event_id
				and e.deleted_at is null
				and public.is_championship_member(e.championship_id)
		)
	);

drop policy if exists championship_event_goals_select_member
	on public.championship_event_goals;

create policy championship_event_goals_select_member
	on public.championship_event_goals
	for select
	to authenticated
	using (
		exists (
			select 1
			from public.championship_events e
			where e.id = event_id
				and e.deleted_at is null
				and public.is_championship_member(e.championship_id)
		)
	);

grant select on table public.championship_event_match_players to authenticated;
grant select on table public.championship_event_goals to authenticated;

create or replace function public.championship_event_match_json(
	match public.championship_event_matches
)
returns jsonb
language sql
immutable
as $$
	select jsonb_build_object(
		'id', match.id,
		'event_id', match.event_id,
		'team_a_id', match.team_a_id,
		'team_b_id', match.team_b_id,
		'created_at', match.created_at,
		'ended_at', match.ended_at,
		'winner_team_id', match.winner_team_id
	);
$$;

create or replace function public.championship_event_match_score(
	match public.championship_event_matches,
	for_team_id bigint
)
returns integer
language sql
stable
as $$
	select count(*)::integer
	from public.championship_event_goals g
	join public.championship_event_match_players mp
		on mp.match_id = g.match_id
		and mp.player_id = g.scorer_player_id
	where g.match_id = match.id
		and (
			(mp.team_id = for_team_id and not g.is_own_goal)
			or (mp.team_id is distinct from for_team_id and g.is_own_goal)
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
		assists = p.assists + coalesce(assisted.n, 0) * apply_championship_event_match_stats.delta
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
	where r.match_id = match.id
		and p.id = r.player_id;
end;
$$;

create or replace function public.start_championship_event_match(
	event_id bigint,
	team_a_id bigint,
	team_b_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	event public.championship_events%rowtype;
	match public.championship_event_matches%rowtype;
	team_a public.championship_event_teams%rowtype;
	team_b public.championship_event_teams%rowtype;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if start_championship_event_match.team_a_id = start_championship_event_match.team_b_id then
		raise exception 'same team' using errcode = '23514';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = start_championship_event_match.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if not public.is_championship_member(event.championship_id) then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if event.ended_at is not null then
		raise exception 'event already ended' using errcode = '23514';
	end if;

	if exists (
		select 1
		from public.championship_event_matches m
		where m.event_id = event.id
			and m.ended_at is null
	) then
		raise exception 'match already open' using errcode = '23505';
	end if;

	select *
	into team_a
	from public.championship_event_teams t
	where t.id = start_championship_event_match.team_a_id
		and t.event_id = event.id;

	select *
	into team_b
	from public.championship_event_teams t
	where t.id = start_championship_event_match.team_b_id
		and t.event_id = event.id;

	if team_a.id is null or team_b.id is null then
		raise exception 'team not in event' using errcode = '23514';
	end if;

	insert into public.championship_event_matches (
		event_id,
		team_a_id,
		team_b_id
	)
	values (
		event.id,
		team_a.id,
		team_b.id
	)
	returning * into match;

	insert into public.championship_event_match_players (
		match_id,
		event_id,
		team_id,
		player_id,
		display_name,
		is_goalkeeper,
		slot
	)
	select
		match.id,
		event.id,
		tp.team_id,
		tp.player_id,
		tp.display_name,
		tp.is_goalkeeper,
		case
			when tp.is_goalkeeper then 0
			else row_number() over (
				partition by tp.team_id, tp.is_goalkeeper
				order by tp.id
			)
		end
	from public.championship_event_team_players tp
	where tp.team_id in (team_a.id, team_b.id);

	return public.championship_event_match_json(match);
end;
$$;

create or replace function public.set_championship_event_match_player(
	match_id bigint,
	team_id bigint,
	slot smallint,
	player_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	event public.championship_events%rowtype;
	match public.championship_event_matches%rowtype;
	player public.championship_players%rowtype;
	outgoing_player_id bigint;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into match
	from public.championship_event_matches m
	where m.id = set_championship_event_match_player.match_id;

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

	if set_championship_event_match_player.team_id not in (match.team_a_id, match.team_b_id) then
		raise exception 'team not in match' using errcode = '23514';
	end if;

	if set_championship_event_match_player.slot < 0
		or set_championship_event_match_player.slot >= event.players_per_team then
		raise exception 'invalid slot' using errcode = '23514';
	end if;

	select mp.player_id
	into outgoing_player_id
	from public.championship_event_match_players mp
	where mp.match_id = match.id
		and mp.team_id = set_championship_event_match_player.team_id
		and mp.slot = set_championship_event_match_player.slot;

	if set_championship_event_match_player.player_id is null then
		if outgoing_player_id is not null
			and exists (
				select 1
				from public.championship_event_goals g
				where g.match_id = match.id
					and (
						g.scorer_player_id = outgoing_player_id
						or g.assist_player_id = outgoing_player_id
					)
			) then
			raise exception 'player has goals' using errcode = '23514';
		end if;

		delete from public.championship_event_match_players mp
		where mp.match_id = match.id
			and mp.team_id = set_championship_event_match_player.team_id
			and mp.slot = set_championship_event_match_player.slot;

		return public.championship_event_match_json(match);
	end if;

	if not exists (
		select 1
		from public.championship_event_attendance a
		where a.event_id = event.id
			and a.player_id = set_championship_event_match_player.player_id
	) then
		raise exception 'player not present' using errcode = '23514';
	end if;

	if exists (
		select 1
		from public.championship_event_match_players mp
		where mp.match_id = match.id
			and mp.player_id = set_championship_event_match_player.player_id
			and (
				mp.team_id is distinct from set_championship_event_match_player.team_id
				or mp.slot is distinct from set_championship_event_match_player.slot
			)
	) then
		raise exception 'duplicate player' using errcode = '23505';
	end if;

	select *
	into player
	from public.championship_players p
	where p.id = set_championship_event_match_player.player_id
		and p.championship_id = event.championship_id
		and p.deleted_at is null;

	if player.id is null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	if outgoing_player_id is not null
		and outgoing_player_id is distinct from set_championship_event_match_player.player_id
		and exists (
			select 1
			from public.championship_event_goals g
			where g.match_id = match.id
				and (
					g.scorer_player_id = outgoing_player_id
					or g.assist_player_id = outgoing_player_id
				)
		) then
		raise exception 'player has goals' using errcode = '23514';
	end if;

	insert into public.championship_event_match_players (
		match_id,
		event_id,
		team_id,
		player_id,
		display_name,
		is_goalkeeper,
		slot
	)
	values (
		match.id,
		event.id,
		set_championship_event_match_player.team_id,
		player.id,
		coalesce(nullif(btrim(player.nickname), ''), player.display_name),
		set_championship_event_match_player.slot = 0,
		set_championship_event_match_player.slot
	)
	on conflict (match_id, team_id, slot)
	do update set
		player_id = excluded.player_id,
		display_name = excluded.display_name,
		is_goalkeeper = excluded.is_goalkeeper;

	return public.championship_event_match_json(match);
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

create or replace function public.end_championship_event_match(match_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	event public.championship_events%rowtype;
	match public.championship_event_matches%rowtype;
	score_a integer;
	score_b integer;
	winner_id bigint;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into match
	from public.championship_event_matches m
	where m.id = end_championship_event_match.match_id;

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
		return public.championship_event_match_json(match);
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

	update public.championship_event_matches
	set
		ended_at = now(),
		winner_team_id = winner_id
	where id = match.id
	returning * into match;

	perform public.apply_championship_event_match_stats(match.id, 1);

	return public.championship_event_match_json(match);
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

	if match.ended_at is not null then
		perform public.apply_championship_event_match_stats(match.id, -1);
	end if;

	delete from public.championship_event_goals g
	where g.match_id = match.id;

	delete from public.championship_event_match_players mp
	where mp.match_id = match.id;

	delete from public.championship_event_matches
	where id = match.id;

	return public.championship_event_match_json(match);
end;
$$;

create or replace function public.add_championship_event_match(
	event_id bigint,
	team_a_id bigint,
	team_b_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
	return public.start_championship_event_match(
		add_championship_event_match.event_id,
		add_championship_event_match.team_a_id,
		add_championship_event_match.team_b_id
	);
end;
$$;

revoke all on function public.championship_event_match_json(public.championship_event_matches) from public;
revoke all on function public.championship_event_match_score(public.championship_event_matches, bigint) from public;
revoke all on function public.apply_championship_event_match_stats(bigint, integer) from public;
revoke all on function public.start_championship_event_match(bigint, bigint, bigint) from public;
revoke all on function public.set_championship_event_match_player(bigint, bigint, smallint, bigint) from public;
revoke all on function public.add_championship_event_goal(bigint, bigint, bigint, boolean) from public;
revoke all on function public.end_championship_event_match(bigint) from public;
revoke all on function public.delete_championship_event_match(bigint) from public;
revoke all on function public.add_championship_event_match(bigint, bigint, bigint) from public;

grant execute on function public.start_championship_event_match(bigint, bigint, bigint) to authenticated;
grant execute on function public.set_championship_event_match_player(bigint, bigint, smallint, bigint) to authenticated;
grant execute on function public.add_championship_event_goal(bigint, bigint, bigint, boolean) to authenticated;
grant execute on function public.end_championship_event_match(bigint) to authenticated;
grant execute on function public.delete_championship_event_match(bigint) to authenticated;
grant execute on function public.add_championship_event_match(bigint, bigint, bigint) to authenticated;

notify pgrst, 'reload schema';
