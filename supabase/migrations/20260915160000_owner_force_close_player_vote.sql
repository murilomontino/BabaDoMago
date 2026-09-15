-- Quórum volta a aplicar ±0,5 sozinho.
-- Dono também pode forçar like/dislike no alvo via RPC.

create or replace function public.recompute_championship_event_player_vote_delta(
	event_id bigint,
	target_player_id bigint,
	track text default 'line'
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
	vote_track text := coalesce(
		recompute_championship_event_player_vote_delta.track,
		'line'
	);
	like_count integer;
	dislike_count integer;
	maintain_count integer;
	quorum_count integer;
	new_delta numeric;
	current_delta numeric;
	attendance_id bigint;
begin
	if vote_track not in ('line', 'goalkeeper') then
		raise exception 'invalid vote track' using errcode = '23514';
	end if;

	select
		a.id,
		case
			when vote_track = 'goalkeeper' then a.goalkeeper_vote_rating_delta
			else a.vote_rating_delta
		end
	into attendance_id, current_delta
	from public.championship_event_attendance a
	where a.event_id = recompute_championship_event_player_vote_delta.event_id
		and a.player_id = recompute_championship_event_player_vote_delta.target_player_id
	for update;

	if attendance_id is null then
		return 0;
	end if;

	-- Já fechado (quórum ou dono): delta fica e não recalcula.
	if coalesce(current_delta, 0) <> 0 then
		return current_delta;
	end if;

	select coalesce(c.player_vote_quorum, 5)
	into quorum_count
	from public.championship_events e
	join public.championships c on c.id = e.championship_id
	where e.id = recompute_championship_event_player_vote_delta.event_id;

	select
		coalesce(count(*) filter (where v.value = 'like'), 0)::integer,
		coalesce(count(*) filter (where v.value = 'dislike'), 0)::integer,
		coalesce(count(*) filter (where v.value = 'maintain'), 0)::integer
	into like_count, dislike_count, maintain_count
	from public.championship_event_player_votes v
	where v.event_id = recompute_championship_event_player_vote_delta.event_id
		and v.target_player_id = recompute_championship_event_player_vote_delta.target_player_id
		and v.track = vote_track;

	new_delta := public.championship_event_player_vote_applied_delta(
		like_count,
		dislike_count,
		maintain_count,
		quorum_count
	);

	if new_delta = coalesce(current_delta, 0) then
		return coalesce(current_delta, 0);
	end if;

	if vote_track = 'goalkeeper' then
		update public.championship_event_attendance a
		set goalkeeper_vote_rating_delta = new_delta
		where a.id = attendance_id;
	else
		update public.championship_event_attendance a
		set vote_rating_delta = new_delta
		where a.id = attendance_id;
	end if;

	perform public.sync_championship_event_attendance_vote_rating(attendance_id);

	return new_delta;
end;
$$;

revoke all on function public.recompute_championship_event_player_vote_delta(
	bigint,
	bigint,
	text
) from public;

alter table public.championships
	alter column player_vote_quorum set default 5;

create or replace function public.close_championship_event_player_vote_target(
	event_id bigint,
	target_player_id bigint,
	track text default 'line',
	decision text default 'like'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	event public.championship_events%rowtype;
	vote_track text := coalesce(close_championship_event_player_vote_target.track, 'line');
	vote_decision text := coalesce(close_championship_event_player_vote_target.decision, 'like');
	attendance_id bigint;
	current_delta numeric;
	new_delta numeric;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if vote_track not in ('line', 'goalkeeper') then
		raise exception 'invalid vote track' using errcode = '23514';
	end if;

	if vote_decision not in ('like', 'dislike') then
		raise exception 'invalid vote' using errcode = '23514';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = close_championship_event_player_vote_target.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(event.championship_id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if event.ended_at is null then
		raise exception 'event still open' using errcode = '23514';
	end if;

	if event.player_votes_voided_at is not null then
		raise exception 'player votes voided' using errcode = '23514';
	end if;

	if event.player_votes_closed_at is not null then
		raise exception 'player votes closed' using errcode = '23514';
	end if;

	select
		a.id,
		case
			when vote_track = 'goalkeeper' then a.goalkeeper_vote_rating_delta
			else a.vote_rating_delta
		end
	into attendance_id, current_delta
	from public.championship_event_attendance a
	where a.event_id = event.id
		and a.player_id = close_championship_event_player_vote_target.target_player_id
	for update;

	if attendance_id is null then
		raise exception 'player not present' using errcode = '23514';
	end if;

	new_delta := case
		when vote_decision = 'like' then 0.5
		else -0.5
	end;

	if coalesce(current_delta, 0) <> 0 then
		if current_delta = new_delta then
			return jsonb_build_object(
				'event_id', event.id,
				'target_player_id', close_championship_event_player_vote_target.target_player_id,
				'track', vote_track,
				'vote_rating_delta', current_delta
			);
		end if;

		raise exception 'vote closed' using errcode = '23514';
	end if;

	if vote_track = 'goalkeeper' then
		update public.championship_event_attendance a
		set goalkeeper_vote_rating_delta = new_delta
		where a.id = attendance_id;
	else
		update public.championship_event_attendance a
		set vote_rating_delta = new_delta
		where a.id = attendance_id;
	end if;

	perform public.sync_championship_event_attendance_vote_rating(attendance_id);

	return jsonb_build_object(
		'event_id', event.id,
		'target_player_id', close_championship_event_player_vote_target.target_player_id,
		'track', vote_track,
		'vote_rating_delta', new_delta
	);
end;
$$;

revoke all on function public.close_championship_event_player_vote_target(
	bigint,
	bigint,
	text,
	text
) from public;

grant execute on function public.close_championship_event_player_vote_target(
	bigint,
	bigint,
	text,
	text
) to authenticated;
