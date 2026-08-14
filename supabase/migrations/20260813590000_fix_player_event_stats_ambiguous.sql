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
#variable_conflict use_column
declare
	event public.championship_events%rowtype;
	player public.championship_players%rowtype;
	old_delta numeric;
	old_wins integer;
	old_matches integer;
	implied_old numeric;
	new_delta numeric;
	stored_delta numeric;
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

	select a.rating_delta, a.wins, a.matches
	into old_delta, old_wins, old_matches
	from public.championship_event_attendance a
	where a.event_id = event.id
		and a.player_id = player.id;

	old_delta := coalesce(old_delta, 0);
	old_wins := coalesce(old_wins, 0);
	old_matches := coalesce(old_matches, 0);

	select least(100, greatest(coalesce(max(p.rating), 0), 5))
	into ceiling
	from public.championship_players p
	where p.championship_id = event.championship_id
		and p.deleted_at is null;

	implied_old := public.championship_event_rating_delta(
		old_wins,
		old_matches,
		player.rating,
		ceiling
	);
	new_delta := public.championship_event_rating_delta(
		save_championship_player_event_stats.wins,
		save_championship_player_event_stats.matches,
		player.rating,
		ceiling
	);

	-- já ranqueado no encerrar (delta não gravado): stats ok, rate intacto
	if old_delta = 0 and implied_old <> 0 then
		stored_delta := 0;
		new_delta := 0;
		old_delta := 0;
	else
		stored_delta := new_delta;
	end if;

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
		stored_delta
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

revoke all on function public.save_championship_player_event_stats(bigint, bigint, integer, integer, integer, integer) from public;
grant execute on function public.save_championship_player_event_stats(bigint, bigint, integer, integer, integer, integer) to authenticated;

notify pgrst, 'reload schema';
