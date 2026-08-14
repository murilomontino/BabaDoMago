alter table public.championship_event_attendance
	add column if not exists rating_delta numeric(4,1) not null default 0;

create or replace function public.championship_event_rating_delta(
	wins integer,
	matches integer,
	rating numeric,
	ceiling numeric
)
returns numeric
language sql
immutable
set search_path = public
as $$
	select case
		when rating = 0 then 0
		when matches < 3 then 0
		when 20 * wins <= 11 * matches
			and 20 * wins >= 9 * matches then 0
		else round(
			((2 * wins - matches)::numeric * least(100, greatest(0, ceiling)))
				/ (4 * matches),
			1
		)
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
			) as new_delta
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
declare
	event public.championship_events%rowtype;
	player public.championship_players%rowtype;
	old_delta numeric;
	new_delta numeric;
	ceiling numeric;
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

	select a.rating_delta
	into old_delta
	from public.championship_event_attendance a
	where a.event_id = event.id
		and a.player_id = player.id;

	old_delta := coalesce(old_delta, 0);

	select least(100, greatest(coalesce(max(p.rating), 0), 5))
	into ceiling
	from public.championship_players p
	where p.championship_id = event.championship_id
		and p.deleted_at is null;

	new_delta := public.championship_event_rating_delta(
		save_championship_player_event_stats.wins,
		save_championship_player_event_stats.matches,
		player.rating,
		ceiling
	);

	insert into public.championship_event_attendance (
		event_id,
		player_id,
		display_name,
		goals,
		assists,
		wins,
		matches,
		rating_delta
	)
	values (
		event.id,
		player.id,
		coalesce(nullif(btrim(player.nickname), ''), player.display_name),
		save_championship_player_event_stats.goals,
		save_championship_player_event_stats.assists,
		save_championship_player_event_stats.wins,
		save_championship_player_event_stats.matches,
		new_delta
	)
	on conflict (event_id, player_id) do update
	set
		goals = excluded.goals,
		assists = excluded.assists,
		wins = excluded.wins,
		matches = excluded.matches,
		rating_delta = excluded.rating_delta;

	update public.championship_players p
	set rating = least(
		100,
		greatest(
			0,
			round((p.rating - old_delta + new_delta)::numeric, 1)
		)
	)
	where p.id = player.id
		and new_delta <> old_delta;

	perform public.sync_championship_players_from_attendance(array[player.id]);

	return jsonb_build_object(
		'id', event.id,
		'championship_id', event.championship_id,
		'starts_at', event.starts_at,
		'players_per_team', event.players_per_team,
		'ended_at', event.ended_at
	);
end;
$$;

revoke all on function public.championship_event_rating_delta(integer, integer, numeric, numeric) from public;
revoke all on function public.adjust_championship_player_ratings_for_event(bigint) from public;
revoke all on function public.save_championship_player_event_stats(bigint, bigint, integer, integer, integer, integer) from public;
grant execute on function public.save_championship_player_event_stats(bigint, bigint, integer, integer, integer, integer) to authenticated;

notify pgrst, 'reload schema';
