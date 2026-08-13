alter table public.championship_event_attendance
	add column if not exists rating numeric(4,1) not null default 0;

do $$
begin
	if not exists (
		select 1
		from pg_constraint
		where conname = 'championship_event_attendance_rating_check'
			and conrelid = 'public.championship_event_attendance'::regclass
	) then
		alter table public.championship_event_attendance
			add constraint championship_event_attendance_rating_check
			check (rating >= 0 and rating <= 100);
	end if;
end $$;

update public.championship_event_attendance a
set rating = p.rating
from public.championship_players p
where p.id = a.player_id
	and a.rating = 0
	and p.rating <> 0;

create or replace function public.championship_event_attendance_set_rating()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
	select p.rating
	into new.rating
	from public.championship_players p
	where p.id = new.player_id;

	if new.rating is null then
		new.rating := 0;
	end if;

	return new;
end;
$$;

drop trigger if exists championship_event_attendance_set_rating
	on public.championship_event_attendance;

create trigger championship_event_attendance_set_rating
before insert on public.championship_event_attendance
for each row
execute function public.championship_event_attendance_set_rating();

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
			or jsonb_typeof(elem -> 'rating') is distinct from 'number'
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
		where (elem ->> 'rating')::numeric < 0
			or (elem ->> 'rating')::numeric > 100
	) then
		raise exception 'invalid rating' using errcode = '23514';
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
		rating = s.rating,
		goals = s.goals,
		assists = s.assists,
		own_goals = s.own_goals,
		wins = s.wins,
		matches = s.matches
	from (
		select
			(elem ->> 'player_id')::bigint as player_id,
			round((elem ->> 'rating')::numeric, 1) as rating,
			(elem ->> 'goals')::integer as goals,
			(elem ->> 'assists')::integer as assists,
			(elem ->> 'own_goals')::integer as own_goals,
			(elem ->> 'wins')::integer as wins,
			(elem ->> 'matches')::integer as matches
		from jsonb_array_elements(stats) elem
	) s
	where a.event_id = event.id
		and a.player_id = s.player_id;

	perform public.sync_championship_players_from_attendance(player_ids);

	return jsonb_build_object(
		'id', event.id,
		'championship_id', event.championship_id,
		'starts_at', event.starts_at,
		'players_per_team', event.players_per_team,
		'ended_at', event.ended_at
	);
end;
$$;

revoke all on function public.championship_event_attendance_set_rating() from public;
revoke all on function public.save_championship_event_attendance_stats(bigint, jsonb) from public;
grant execute on function public.save_championship_event_attendance_stats(bigint, jsonb) to authenticated;

notify pgrst, 'reload schema';
