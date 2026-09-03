-- Mensalista vota (mesmo ausente). Voto em si permitido.

create or replace function public.championship_event_player_vote_voter_id(
	event_id bigint
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
	viewer uuid := (select auth.uid());
	event_championship_id bigint;
	voter_id bigint;
	voter_monthly boolean;
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select e.championship_id
	into event_championship_id
	from public.championship_events e
	where e.id = championship_event_player_vote_voter_id.event_id
		and e.deleted_at is null;

	if event_championship_id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	select p.id, p.is_monthly
	into voter_id, voter_monthly
	from public.championship_players p
	where p.championship_id = event_championship_id
		and p.deleted_at is null
		and p.user_id = viewer;

	if voter_id is null then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if voter_monthly then
		return voter_id;
	end if;

	if public.championship_actor_role(event_championship_id) not in (
		'owner',
		'captain',
		'admin'
	) then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if not exists (
		select 1
		from public.championship_event_attendance a
		where a.event_id = championship_event_player_vote_voter_id.event_id
			and a.player_id = voter_id
	) then
		raise exception 'voter not present' using errcode = '23514';
	end if;

	return voter_id;
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
	like_count integer;
	dislike_count integer;
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

	if event.player_votes_voided_at is not null then
		raise exception 'player votes voided' using errcode = '23514';
	end if;

	if event.player_votes_closed_at is not null then
		raise exception 'player votes closed' using errcode = '23514';
	end if;

	voter_id := public.championship_event_player_vote_voter_id(event.id);

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
		select
			coalesce(
				count(*) filter (
					where v.value = 'like'
						and v.target_player_id <> vote_championship_event_player.target_player_id
				),
				0
			)::integer,
			coalesce(
				count(*) filter (
					where v.value = 'dislike'
						and v.target_player_id <> vote_championship_event_player.target_player_id
				),
				0
			)::integer
		into like_count, dislike_count
		from public.championship_event_player_votes v
		where v.event_id = event.id
			and v.voter_player_id = voter_id;

		if vote_championship_event_player.value = 'like'
			and like_count + 1 > 5
		then
			raise exception 'like budget exceeded' using errcode = '23514';
		end if;

		if vote_championship_event_player.value = 'dislike'
			and dislike_count + 1 > 5
		then
			raise exception 'dislike budget exceeded' using errcode = '23514';
		end if;

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

create or replace function public.submit_championship_event_player_votes(
	event_id bigint,
	votes jsonb
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
	vote_row record;
	like_count integer := 0;
	dislike_count integer := 0;
	target_ids bigint[] := '{}';
	affected_ids bigint[] := '{}';
	my_votes jsonb := '[]'::jsonb;
	attendance_rows jsonb := '[]'::jsonb;
	seen_targets bigint[] := '{}';
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if submit_championship_event_player_votes.votes is null
		or jsonb_typeof(submit_championship_event_player_votes.votes) <> 'array'
	then
		raise exception 'invalid vote' using errcode = '23514';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = submit_championship_event_player_votes.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
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

	voter_id := public.championship_event_player_vote_voter_id(event.id);

	for vote_row in
		select
			entry.target_player_id,
			entry.value
		from jsonb_to_recordset(submit_championship_event_player_votes.votes) as entry(
			target_player_id bigint,
			value text
		)
	loop
		if vote_row.target_player_id is null then
			raise exception 'invalid vote' using errcode = '23514';
		end if;

		if vote_row.value not in ('like', 'dislike', 'maintain') then
			raise exception 'invalid vote' using errcode = '23514';
		end if;

		if vote_row.target_player_id = any (seen_targets) then
			raise exception 'invalid vote' using errcode = '23514';
		end if;

		seen_targets := array_append(seen_targets, vote_row.target_player_id);

		if not exists (
			select 1
			from public.championship_event_attendance a
			where a.event_id = event.id
				and a.player_id = vote_row.target_player_id
		) then
			raise exception 'player not present' using errcode = '23514';
		end if;

		if exists (
			select 1
			from public.championship_event_attendance a
			where a.event_id = event.id
				and a.player_id = vote_row.target_player_id
				and a.vote_rating_delta <> 0
		) then
			raise exception 'vote closed' using errcode = '23514';
		end if;

		if vote_row.value = 'like' then
			like_count := like_count + 1;
		elsif vote_row.value = 'dislike' then
			dislike_count := dislike_count + 1;
		end if;

		target_ids := array_append(target_ids, vote_row.target_player_id);
	end loop;

	if like_count > 5 then
		raise exception 'like budget exceeded' using errcode = '23514';
	end if;

	if dislike_count > 5 then
		raise exception 'dislike budget exceeded' using errcode = '23514';
	end if;

	select coalesce(array_agg(distinct v.target_player_id), '{}')
	into affected_ids
	from public.championship_event_player_votes v
	where v.event_id = event.id
		and v.voter_player_id = voter_id;

	affected_ids := (
		select coalesce(array_agg(distinct id), '{}')
		from unnest(affected_ids || target_ids) as id
	);

	delete from public.championship_event_player_votes v
	where v.event_id = event.id
		and v.voter_player_id = voter_id
		and not (v.target_player_id = any (target_ids));

	for vote_row in
		select
			entry.target_player_id,
			entry.value
		from jsonb_to_recordset(submit_championship_event_player_votes.votes) as entry(
			target_player_id bigint,
			value text
		)
	loop
		insert into public.championship_event_player_votes as v (
			event_id,
			voter_player_id,
			target_player_id,
			value
		)
		values (
			event.id,
			voter_id,
			vote_row.target_player_id,
			vote_row.value
		)
		on conflict (event_id, voter_player_id, target_player_id)
		do update set
			value = excluded.value,
			updated_at = now();
	end loop;

	select coalesce(
		jsonb_agg(
			jsonb_build_object(
				'target_player_id', v.target_player_id,
				'value', v.value
			)
			order by v.target_player_id
		),
		'[]'::jsonb
	)
	into my_votes
	from public.championship_event_player_votes v
	where v.event_id = event.id
		and v.voter_player_id = voter_id;

	select coalesce(
		jsonb_agg(
			jsonb_build_object(
				'player_id', a.player_id,
				'vote_rating_delta', a.vote_rating_delta
			)
			order by a.player_id
		),
		'[]'::jsonb
	)
	into attendance_rows
	from public.championship_event_attendance a
	where a.event_id = event.id
		and a.player_id = any (affected_ids);

	return jsonb_build_object(
		'event_id', event.id,
		'votes', my_votes,
		'attendance', attendance_rows
	);
end;
$$;

revoke all on function public.championship_event_player_vote_voter_id(bigint) from public;

notify pgrst, 'reload schema';
