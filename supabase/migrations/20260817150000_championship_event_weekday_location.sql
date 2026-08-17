alter table public.championships
	add column if not exists event_weekday smallint;

alter table public.championships
	add column if not exists location text;

alter table public.championships
	drop constraint if exists championships_event_weekday_check;

alter table public.championships
	add constraint championships_event_weekday_check
	check (event_weekday is null or event_weekday between 1 and 7);

alter table public.championships
	drop constraint if exists championships_location_length_check;

alter table public.championships
	add constraint championships_location_length_check
	check (location is null or char_length(location) <= 120);

drop function if exists public.update_championship_event_config(bigint, time, smallint, boolean);

create or replace function public.update_championship_event_config(
	championship_id bigint,
	event_time time,
	players_per_team smallint,
	skip_guest_goalkeeper_matches boolean default true,
	event_weekday smallint default null,
	location text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	championship public.championships%rowtype;
	open_event_ids bigint[];
	player_ids bigint[];
	open_event_id bigint;
	before_data jsonb;
	next_location text;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if update_championship_event_config.players_per_team < 3
		or update_championship_event_config.players_per_team > 11 then
		raise exception 'invalid players per team' using errcode = '23514';
	end if;

	if update_championship_event_config.event_weekday is not null
		and (
			update_championship_event_config.event_weekday < 1
			or update_championship_event_config.event_weekday > 7
		) then
		raise exception 'invalid event weekday' using errcode = '23514';
	end if;

	next_location := nullif(btrim(update_championship_event_config.location), '');
	if next_location is not null and char_length(next_location) > 120 then
		raise exception 'invalid location' using errcode = '23514';
	end if;

	select *
	into championship
	from public.championships c
	where c.id = update_championship_event_config.championship_id
		and c.deleted_at is null
	for update;

	if championship.id is null then
		raise exception 'championship not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(championship.id) not in ('owner', 'captain') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	before_data := jsonb_build_object(
		'event_time', championship.event_time,
		'players_per_team', championship.players_per_team,
		'skip_guest_goalkeeper_matches', championship.skip_guest_goalkeeper_matches,
		'event_weekday', championship.event_weekday,
		'location', championship.location
	);

	update public.championships
	set
		event_time = update_championship_event_config.event_time,
		players_per_team = update_championship_event_config.players_per_team,
		skip_guest_goalkeeper_matches = coalesce(
			update_championship_event_config.skip_guest_goalkeeper_matches,
			true
		),
		event_weekday = update_championship_event_config.event_weekday,
		location = next_location
	where id = championship.id
	returning * into championship;

	select coalesce(array_agg(e.id), '{}')
	into open_event_ids
	from public.championship_events e
	where e.championship_id = championship.id
		and e.ended_at is null
		and e.deleted_at is null;

	update public.championship_events
	set skip_guest_goalkeeper_matches = championship.skip_guest_goalkeeper_matches
	where id = any (open_event_ids);

	foreach open_event_id in array open_event_ids loop
		perform public.refresh_championship_event_attendance_stats(open_event_id);
	end loop;

	select coalesce(array_agg(distinct a.player_id), '{}')
	into player_ids
	from public.championship_event_attendance a
	where a.event_id = any (open_event_ids);

	perform public.sync_championship_players_from_attendance(player_ids);

	perform public.championship_audit_log(
		championship.id,
		'update_event_config',
		'championship',
		championship.id,
		before_data,
		jsonb_build_object(
			'event_time', championship.event_time,
			'players_per_team', championship.players_per_team,
			'skip_guest_goalkeeper_matches', championship.skip_guest_goalkeeper_matches,
			'event_weekday', championship.event_weekday,
			'location', championship.location
		)
	);

	return jsonb_build_object(
		'id', championship.id,
		'name', championship.name,
		'invite_code', championship.invite_code,
		'created_by', championship.created_by,
		'logo_path', championship.logo_path,
		'event_time', championship.event_time,
		'players_per_team', championship.players_per_team,
		'skip_guest_goalkeeper_matches', championship.skip_guest_goalkeeper_matches,
		'event_weekday', championship.event_weekday,
		'location', championship.location,
		'is_visible', championship.is_visible
	);
end;
$$;

create or replace function public.get_championship_by_invite(invite_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
	result jsonb;
begin
	select jsonb_build_object(
		'id', c.id,
		'name', c.name,
		'invite_code', c.invite_code,
		'created_by', c.created_by,
		'logo_path', c.logo_path,
		'event_time', c.event_time,
		'event_weekday', c.event_weekday,
		'location', c.location,
		'players', coalesce((
			select jsonb_agg(
				public.championship_player_json(p)
				order by p.id
			)
			from public.championship_players p
			where p.championship_id = c.id
				and p.deleted_at is null
		), '[]'::jsonb)
	)
	into result
	from public.championships c
	where c.invite_code = get_championship_by_invite.invite_code
		and c.deleted_at is null
		and c.is_visible;

	if result is null then
		raise exception 'championship not found' using errcode = 'P0002';
	end if;

	return result;
end;
$$;

revoke all on function public.update_championship_event_config(
	bigint,
	time,
	smallint,
	boolean,
	smallint,
	text
) from public;

grant execute on function public.update_championship_event_config(
	bigint,
	time,
	smallint,
	boolean,
	smallint,
	text
) to authenticated;

notify pgrst, 'reload schema';
