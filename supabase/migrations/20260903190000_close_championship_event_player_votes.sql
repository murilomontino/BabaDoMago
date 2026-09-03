-- Encerrar votação (dono) é separado de encerrar rodada (ended_at).

alter table public.championship_events
	add column if not exists player_votes_closed_at timestamptz;

create or replace function public.close_championship_event_player_votes(
	event_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	event public.championship_events%rowtype;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = close_championship_event_player_votes.event_id
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

	if event.player_votes_closed_at is not null then
		return jsonb_build_object(
			'event_id', event.id,
			'player_votes_closed_at', event.player_votes_closed_at
		);
	end if;

	update public.championship_events e
	set player_votes_closed_at = now()
	where e.id = event.id
	returning * into event;

	return jsonb_build_object(
		'event_id', event.id,
		'player_votes_closed_at', event.player_votes_closed_at
	);
end;
$$;

create or replace function public.vote_championship_event_player(
	event_id bigint,
	target_player_id bigint,
	value text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
	viewer uuid := (select auth.uid());
	event public.championship_events%rowtype;
	voter_id bigint;
	new_delta numeric;
	my_value text;
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if vote_championship_event_player.value is not null
		and vote_championship_event_player.value not in ('like', 'dislike', 'maintain')
	then
		raise exception 'invalid vote' using errcode = '23514';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = vote_championship_event_player.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if event.ended_at is null then
		raise exception 'event still open' using errcode = '23514';
	end if;

	if event.player_votes_closed_at is not null then
		raise exception 'player votes closed' using errcode = '23514';
	end if;

	if public.championship_actor_role(event.championship_id) not in (
		'owner',
		'captain',
		'admin'
	) then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	select p.id
	into voter_id
	from public.championship_players p
	where p.championship_id = event.championship_id
		and p.deleted_at is null
		and p.user_id = viewer;

	if voter_id is null then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if voter_id = vote_championship_event_player.target_player_id then
		raise exception 'cannot vote self' using errcode = '23514';
	end if;

	if not exists (
		select 1
		from public.championship_event_attendance a
		where a.event_id = event.id
			and a.player_id = voter_id
	) then
		raise exception 'voter not present' using errcode = '23514';
	end if;

	if not exists (
		select 1
		from public.championship_event_attendance a
		where a.event_id = event.id
			and a.player_id = vote_championship_event_player.target_player_id
	) then
		raise exception 'player not present' using errcode = '23514';
	end if;

	if exists (
		select 1
		from public.championship_event_attendance a
		where a.event_id = event.id
			and a.player_id = vote_championship_event_player.target_player_id
			and a.vote_rating_delta <> 0
	) then
		raise exception 'vote closed' using errcode = '23514';
	end if;

	if vote_championship_event_player.value is null then
		delete from public.championship_event_player_votes v
		where v.event_id = event.id
			and v.voter_player_id = voter_id
			and v.target_player_id = vote_championship_event_player.target_player_id;
		my_value := null;
	else
		insert into public.championship_event_player_votes as v (
			event_id,
			voter_player_id,
			target_player_id,
			value
		)
		values (
			event.id,
			voter_id,
			vote_championship_event_player.target_player_id,
			vote_championship_event_player.value
		)
		on conflict (event_id, voter_player_id, target_player_id)
		do update set
			value = excluded.value,
			updated_at = now();
		my_value := vote_championship_event_player.value;
	end if;

	select a.vote_rating_delta
	into new_delta
	from public.championship_event_attendance a
	where a.event_id = event.id
		and a.player_id = vote_championship_event_player.target_player_id;

	return jsonb_build_object(
		'event_id', event.id,
		'target_player_id', vote_championship_event_player.target_player_id,
		'my_value', to_jsonb(my_value),
		'vote_rating_delta', coalesce(new_delta, 0)
	);
end;
$$;

revoke all on function public.close_championship_event_player_votes(bigint) from public;
grant execute on function public.close_championship_event_player_votes(bigint) to authenticated;

notify pgrst, 'reload schema';
