-- Param names collided with columns in ON CONFLICT (event_id, …).

drop function if exists public.upsert_championship_event_rsvp(bigint, text);

create function public.upsert_championship_event_rsvp(
	p_event_id bigint,
	p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	viewer uuid := (select auth.uid());
	event_row public.championship_events%rowtype;
	player_row public.championship_players%rowtype;
	rsvp_id bigint;
	rsvp_event_id bigint;
	rsvp_player_id bigint;
	rsvp_status text;
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if p_status not in ('going', 'out') then
		raise exception 'invalid rsvp' using errcode = '23514';
	end if;

	select *
	into event_row
	from public.championship_events e
	where e.id = p_event_id
		and e.deleted_at is null
	for update;

	if event_row.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if event_row.ended_at is not null then
		raise exception 'event already ended' using errcode = '23514';
	end if;

	select *
	into player_row
	from public.championship_players p
	where p.championship_id = event_row.championship_id
		and p.user_id = viewer
		and p.deleted_at is null;

	if player_row.id is null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	insert into public.championship_event_rsvp as r (
		event_id,
		player_id,
		status,
		updated_at
	)
	values (
		event_row.id,
		player_row.id,
		p_status,
		timezone('utc', now())
	)
	on conflict (event_id, player_id) do update
	set
		status = excluded.status,
		updated_at = excluded.updated_at
	returning r.id, r.event_id, r.player_id, r.status
	into rsvp_id, rsvp_event_id, rsvp_player_id, rsvp_status;

	return jsonb_build_object(
		'id', rsvp_id,
		'event_id', rsvp_event_id,
		'player_id', rsvp_player_id,
		'status', rsvp_status
	);
end;
$$;

grant execute on function public.upsert_championship_event_rsvp(bigint, text)
	to authenticated;

notify pgrst, 'reload schema';
