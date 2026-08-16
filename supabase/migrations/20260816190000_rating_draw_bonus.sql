drop function if exists public.championship_event_rating_delta(
	integer,
	integer,
	integer,
	numeric,
	numeric
);

create function public.championship_event_rating_delta(
	wins integer,
	draws integer,
	losses integer,
	matches integer,
	rating numeric,
	ceiling numeric
)
returns numeric
language sql
immutable
set search_path = public
as $$
	with pts as (
		select
			(3 * wins
				+ draws * case
					when draws > losses then 1.5
					else 1
				end)::numeric as points,
			(3 * matches)::numeric as max_points
	)
	select case
		when matches < 3 then 0
		when rating = 0 then
			case
				when 20 * pts.points <= 11 * pts.max_points
					and 20 * pts.points >= 9 * pts.max_points then 3
				when 20 * pts.points > 11 * pts.max_points then 3.5
				else 2.7
			end
		when 20 * pts.points <= 11 * pts.max_points
			and 20 * pts.points >= 9 * pts.max_points then 0
		else round(
			((2 * pts.points - pts.max_points)
				* least(100, greatest(0, ceiling)))
				/ (4 * pts.max_points),
			1
		)
	end
	from pts;
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
				when a.is_mvp then 0.1
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

revoke all on function public.championship_event_rating_delta(
	integer,
	integer,
	integer,
	integer,
	numeric,
	numeric
) from public;
