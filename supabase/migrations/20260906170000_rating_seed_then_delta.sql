-- Sentinela: escolhe 2.7 / 3 / 3.5 e aplica o delta ranqueado nessa nota.

create or replace function public.championship_event_rating_delta(
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
	),
	initial as (
		select case
			when matches < 3 then 0
			when 20 * pts.points <= 11 * pts.max_points
				and 20 * pts.points >= 9 * pts.max_points then 3
			when 20 * pts.points > 11 * pts.max_points then 3.5
			else 2.7
		end as seed
		from pts
	)
	select case
		when matches < 3 then 0
		when rating = 0 then
			public.championship_player_rating_apply(
				initial.seed,
				public.championship_event_rating_delta(
					wins,
					draws,
					losses,
					matches,
					initial.seed,
					ceiling
				)
			)
		when 20 * pts.points <= 11 * pts.max_points
			and 20 * pts.points >= 9 * pts.max_points then 0
		else round(
			((2 * pts.points - pts.max_points)
				* least(100, greatest(0, ceiling)))
				/ (4 * pts.max_points),
			1
		)
	end
	from pts
	cross join initial;
$$;

revoke all on function public.championship_event_rating_delta(
	integer,
	integer,
	integer,
	integer,
	numeric,
	numeric
) from public;
