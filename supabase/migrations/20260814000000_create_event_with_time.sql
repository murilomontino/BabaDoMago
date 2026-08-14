drop function if exists public.create_championship_event(bigint, date);

create or replace function public.create_championship_event(
	championship_id bigint,
	event_date date,
	event_time time default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	viewer uuid := (select auth.uid());
	championship public.championships%rowtype;
	new_event public.championship_events%rowtype;
	resolved_time time;
	starts_at timestamptz;
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if event_date is null then
		raise exception 'invalid event date' using errcode = '23514';
	end if;

	select *
	into championship
	from public.championships c
	where c.id = create_championship_event.championship_id
		and c.deleted_at is null
	for update;

	if championship.id is null then
		raise exception 'championship not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(championship.id) not in ('owner', 'captain', 'admin') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if exists (
		select 1
		from public.championship_events e
		where e.championship_id = championship.id
			and e.deleted_at is null
			and (e.starts_at at time zone 'America/Sao_Paulo')::date = event_date
	) then
		raise exception 'event already exists' using errcode = '23505';
	end if;

	resolved_time := coalesce(
		create_championship_event.event_time,
		championship.event_time
	);

	if resolved_time is null then
		raise exception 'invalid event time' using errcode = '23514';
	end if;

	starts_at :=
		(event_date::timestamp + resolved_time)
		at time zone 'America/Sao_Paulo';

	insert into public.championship_events (
		championship_id,
		starts_at,
		players_per_team,
		created_by
	)
	values (
		championship.id,
		starts_at,
		championship.players_per_team,
		viewer
	)
	returning * into new_event;

	return jsonb_build_object(
		'id', new_event.id,
		'championship_id', new_event.championship_id,
		'starts_at', new_event.starts_at,
		'players_per_team', new_event.players_per_team,
		'ended_at', new_event.ended_at
	);
end;
$$;

revoke all on function public.create_championship_event(bigint, date, time) from public;
grant execute on function public.create_championship_event(bigint, date, time) to authenticated;

notify pgrst, 'reload schema';
