-- Terceira opção de voto: maintain. Bloqueia like/dislike quando não supera maintain.

alter table public.championship_event_player_votes
	drop constraint if exists championship_event_player_votes_value_check;

alter table public.championship_event_player_votes
	add constraint championship_event_player_votes_value_check
	check (value in ('like', 'dislike', 'maintain'));

drop function if exists public.championship_event_player_vote_applied_delta(integer, integer);

create or replace function public.championship_event_player_vote_applied_delta(
	like_count integer,
	dislike_count integer,
	maintain_count integer
)
returns numeric
language sql
immutable
set search_path = public
as $$
	select case
		when like_count >= 3
			and like_count > dislike_count
			and like_count > maintain_count then 0.5
		when dislike_count >= 3
			and dislike_count > like_count
			and dislike_count > maintain_count then -0.5
		else 0
	end;
$$;

create or replace function public.recompute_championship_event_player_vote_delta(
	event_id bigint,
	target_player_id bigint
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
	like_count integer;
	dislike_count integer;
	maintain_count integer;
	new_delta numeric;
	current_delta numeric;
	attendance_id bigint;
begin
	select a.id, a.vote_rating_delta
	into attendance_id, current_delta
	from public.championship_event_attendance a
	where a.event_id = recompute_championship_event_player_vote_delta.event_id
		and a.player_id = recompute_championship_event_player_vote_delta.target_player_id
	for update;

	if attendance_id is null then
		return 0;
	end if;

	-- Quórum já fechou: delta fica e não recalcula.
	if current_delta <> 0 then
		return current_delta;
	end if;

	select
		coalesce(count(*) filter (where v.value = 'like'), 0)::integer,
		coalesce(count(*) filter (where v.value = 'dislike'), 0)::integer,
		coalesce(count(*) filter (where v.value = 'maintain'), 0)::integer
	into like_count, dislike_count, maintain_count
	from public.championship_event_player_votes v
	where v.event_id = recompute_championship_event_player_vote_delta.event_id
		and v.target_player_id = recompute_championship_event_player_vote_delta.target_player_id;

	new_delta := public.championship_event_player_vote_applied_delta(
		like_count,
		dislike_count,
		maintain_count
	);

	if new_delta = current_delta then
		return current_delta;
	end if;

	update public.championship_event_attendance a
	set vote_rating_delta = new_delta
	where a.id = attendance_id;

	perform public.sync_championship_event_attendance_vote_rating(attendance_id);

	return new_delta;
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

revoke all on function public.championship_event_player_vote_applied_delta(integer, integer, integer) from public;
grant execute on function public.championship_event_player_vote_applied_delta(integer, integer, integer) to authenticated;

notify pgrst, 'reload schema';
