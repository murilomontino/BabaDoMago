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

	update public.championship_players p
	set rating = least(
		100,
		greatest(
			0,
			round((p.rating + d.delta)::numeric, 1)
		)
	)
	from (
		select
			a.player_id,
			case
				when roster.rating = 0 then 0
				when a.matches < 3 then 0
				when 20 * a.wins <= 11 * a.matches
					and 20 * a.wins >= 9 * a.matches then 0
				else round(
					((2 * a.wins - a.matches)::numeric * ceiling)
						/ (4 * a.matches),
					1
				)
			end as delta
		from public.championship_event_attendance a
		join public.championship_players roster
			on roster.id = a.player_id
		where a.event_id = adjust_championship_player_ratings_for_event.event_id
	) d
	where p.id = d.player_id
		and d.delta <> 0;
end;
$$;

revoke all on function public.adjust_championship_player_ratings_for_event(bigint) from public;

notify pgrst, 'reload schema';
