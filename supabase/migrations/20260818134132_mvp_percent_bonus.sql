drop function if exists public.championship_event_mvp_star_delta(numeric);

create function public.championship_event_mvp_bonus(rating numeric)
returns numeric
language sql
immutable
set search_path = public
as $$
	select greatest(0.1, ceil(greatest(rating, 0) / 5::numeric) / 10);
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

	select least(100, greatest(coalesce(max(a.rating), 0), 5))
	into ceiling
	from public.championship_event_attendance a
	where a.event_id = event.id;

	with deltas as (
		select
			a.id as attendance_id,
			a.player_id,
			a.rating_delta as old_delta,
			case
				when a.rating = 0
					and p.rating <> 0
					and a.rating_delta = 0 then 0
				else public.championship_event_rating_delta(
					a.wins,
					a.draws,
					a.losses,
					a.matches,
					a.rating,
					ceiling
				)
			end + case
				when a.is_mvp then public.championship_event_mvp_bonus(a.rating)
				else 0
			end as new_delta
		from public.championship_event_attendance a
		join public.championship_players p
			on p.id = a.player_id
		where a.event_id = adjust_championship_player_ratings_for_event.event_id
	),
	updated_players as (
		update public.championship_players p
		set rating = public.championship_player_rating_apply(
			p.rating,
			-d.old_delta + d.new_delta
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
	player_ids_sync bigint[];
	before_mvps jsonb;
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

	select coalesce(jsonb_agg(a.player_id order by a.player_id), '[]'::jsonb)
	into before_mvps
	from public.championship_event_attendance a
	where a.event_id = event.id
		and a.is_mvp;

	with bonus as (
		select
			a.id,
			a.player_id,
			case
				when a.player_id = any (mvp_ids)
					then public.championship_event_mvp_bonus(a.rating)
				else 0
			end
				- case
					when a.is_mvp then public.championship_event_mvp_bonus(a.rating)
					else 0
				end as bonus_fix
		from public.championship_event_attendance a
		where a.event_id = event.id
	),
	updated_attendance as (
		update public.championship_event_attendance a
		set
			is_mvp = a.player_id = any (mvp_ids),
			mvp_overridden = true,
			rating_delta = round((a.rating_delta + b.bonus_fix)::numeric, 1)
		from bonus b
		where a.id = b.id
		returning a.player_id, b.bonus_fix
	)
	update public.championship_players p
	set rating = public.championship_player_rating_apply(p.rating, u.bonus_fix)
	from updated_attendance u
	where p.id = u.player_id
		and u.bonus_fix <> 0;

	select coalesce(array_agg(a.player_id), '{}')
	into player_ids_sync
	from public.championship_event_attendance a
	where a.event_id = event.id;

	perform public.sync_championship_players_from_attendance(player_ids_sync);

	perform public.championship_audit_log(
		event.championship_id,
		'set_event_mvps',
		'event',
		event.id,
		jsonb_build_object('player_ids', before_mvps),
		jsonb_build_object('player_ids', to_jsonb(mvp_ids))
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

revoke all on function public.championship_event_mvp_bonus(numeric) from public;
revoke all on function public.adjust_championship_player_ratings_for_event(bigint) from public;
revoke all on function public.set_championship_event_mvps(bigint, jsonb) from public;

grant execute on function public.set_championship_event_mvps(bigint, jsonb) to authenticated;
