-- Voto secreto do elenco na rodada.
-- Like/dislike simétricos: 3 iguais → ±0,5 na nota (overlay, fora do aproveitamento).

alter table public.championship_event_attendance
	add column if not exists vote_rating_delta numeric not null default 0,
	add column if not exists vote_rating_applied numeric not null default 0;

alter table public.championship_event_attendance
	drop constraint if exists championship_event_attendance_vote_rating_delta_check;

alter table public.championship_event_attendance
	add constraint championship_event_attendance_vote_rating_delta_check
	check (vote_rating_delta in (-0.5, 0, 0.5));

alter table public.championship_event_attendance
	drop constraint if exists championship_event_attendance_vote_rating_applied_check;

alter table public.championship_event_attendance
	add constraint championship_event_attendance_vote_rating_applied_check
	check (vote_rating_applied in (-0.5, 0, 0.5));

create table if not exists public.championship_event_player_votes (
	id bigint generated always as identity primary key,
	event_id bigint not null references public.championship_events (id) on delete cascade,
	voter_player_id bigint not null,
	target_player_id bigint not null,
	value text not null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (event_id, voter_player_id, target_player_id),
	check (voter_player_id <> target_player_id),
	check (value in ('like', 'dislike')),
	foreign key (event_id, voter_player_id)
		references public.championship_event_attendance (event_id, player_id)
		on delete cascade,
	foreign key (event_id, target_player_id)
		references public.championship_event_attendance (event_id, player_id)
		on delete cascade
);

create index if not exists championship_event_player_votes_target_idx
	on public.championship_event_player_votes (event_id, target_player_id);

alter table public.championship_event_player_votes enable row level security;

grant select, insert, update, delete on table public.championship_event_player_votes to authenticated;

drop policy if exists championship_event_player_votes_select_own
	on public.championship_event_player_votes;
drop policy if exists championship_event_player_votes_insert_own
	on public.championship_event_player_votes;
drop policy if exists championship_event_player_votes_update_own
	on public.championship_event_player_votes;
drop policy if exists championship_event_player_votes_delete_own
	on public.championship_event_player_votes;

create policy championship_event_player_votes_select_own
	on public.championship_event_player_votes
	for select
	to authenticated
	using (
		exists (
			select 1
			from public.championship_events e
			join public.championship_players p
				on p.championship_id = e.championship_id
				and p.id = voter_player_id
			where e.id = event_id
				and e.deleted_at is null
				and p.deleted_at is null
				and p.user_id = (select auth.uid())
				and public.championship_actor_role(e.championship_id) in (
					'owner',
					'captain',
					'admin'
				)
		)
	);

create policy championship_event_player_votes_insert_own
	on public.championship_event_player_votes
	for insert
	to authenticated
	with check (
		exists (
			select 1
			from public.championship_events e
			join public.championship_players p
				on p.championship_id = e.championship_id
				and p.id = voter_player_id
			where e.id = event_id
				and e.deleted_at is null
				and p.deleted_at is null
				and p.user_id = (select auth.uid())
				and public.championship_actor_role(e.championship_id) in (
					'owner',
					'captain',
					'admin'
				)
		)
		and exists (
			select 1
			from public.championship_event_attendance a
			where a.event_id = event_id
				and a.player_id = voter_player_id
		)
		and exists (
			select 1
			from public.championship_event_attendance a
			where a.event_id = event_id
				and a.player_id = target_player_id
		)
		and voter_player_id <> target_player_id
	);

create policy championship_event_player_votes_update_own
	on public.championship_event_player_votes
	for update
	to authenticated
	using (
		exists (
			select 1
			from public.championship_events e
			join public.championship_players p
				on p.championship_id = e.championship_id
				and p.id = voter_player_id
			where e.id = event_id
				and e.deleted_at is null
				and p.deleted_at is null
				and p.user_id = (select auth.uid())
				and public.championship_actor_role(e.championship_id) in (
					'owner',
					'captain',
					'admin'
				)
		)
	)
	with check (
		exists (
			select 1
			from public.championship_events e
			join public.championship_players p
				on p.championship_id = e.championship_id
				and p.id = voter_player_id
			where e.id = event_id
				and e.deleted_at is null
				and p.deleted_at is null
				and p.user_id = (select auth.uid())
				and public.championship_actor_role(e.championship_id) in (
					'owner',
					'captain',
					'admin'
				)
		)
		and voter_player_id <> target_player_id
	);

create policy championship_event_player_votes_delete_own
	on public.championship_event_player_votes
	for delete
	to authenticated
	using (
		exists (
			select 1
			from public.championship_events e
			join public.championship_players p
				on p.championship_id = e.championship_id
				and p.id = voter_player_id
			where e.id = event_id
				and e.deleted_at is null
				and p.deleted_at is null
				and p.user_id = (select auth.uid())
				and public.championship_actor_role(e.championship_id) in (
					'owner',
					'captain',
					'admin'
				)
		)
	);

create or replace function public.championship_event_player_vote_applied_delta(
	like_count integer,
	dislike_count integer
)
returns numeric
language sql
immutable
set search_path = public
as $$
	select case
		when like_count >= 3 and dislike_count < 3 then 0.5
		when dislike_count >= 3 and like_count < 3 then -0.5
		else 0
	end;
$$;

create or replace function public.sync_championship_event_attendance_vote_rating(
	attendance_id bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	attendance public.championship_event_attendance%rowtype;
	player public.championship_players%rowtype;
	diff numeric;
begin
	select *
	into attendance
	from public.championship_event_attendance a
	where a.id = sync_championship_event_attendance_vote_rating.attendance_id
	for update;

	if attendance.id is null then
		return;
	end if;

	select *
	into player
	from public.championship_players p
	where p.id = attendance.player_id
	for update;

	if player.id is null then
		return;
	end if;

	diff := attendance.vote_rating_delta - attendance.vote_rating_applied;

	if player.rating = 0 or diff = 0 then
		return;
	end if;

	update public.championship_players p
	set rating = public.championship_player_rating_apply(p.rating, diff)
	where p.id = player.id;

	update public.championship_event_attendance a
	set vote_rating_applied = attendance.vote_rating_delta
	where a.id = attendance.id;
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
		coalesce(count(*) filter (where v.value = 'dislike'), 0)::integer
	into like_count, dislike_count
	from public.championship_event_player_votes v
	where v.event_id = recompute_championship_event_player_vote_delta.event_id
		and v.target_player_id = recompute_championship_event_player_vote_delta.target_player_id;

	new_delta := public.championship_event_player_vote_applied_delta(
		like_count,
		dislike_count
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

	if value is not null and value not in ('like', 'dislike') then
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

	if value is null then
		delete from public.championship_event_player_votes v
		where v.event_id = event.id
			and v.voter_player_id = voter_id
			and v.target_player_id = vote_championship_event_player.target_player_id;
		my_value := null;
	else
		insert into public.championship_event_player_votes (
			event_id,
			voter_player_id,
			target_player_id,
			value
		)
		values (
			event.id,
			voter_id,
			vote_championship_event_player.target_player_id,
			value
		)
		on conflict (event_id, voter_player_id, target_player_id)
		do update set
			value = excluded.value,
			updated_at = now();
		my_value := value;
	end if;

	-- Trigger recomputa vote_rating_delta e sincroniza a nota.
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
	attendance_ids bigint[];
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

	select coalesce(array_agg(a.id), '{}')
	into attendance_ids
	from public.championship_event_attendance a
	where a.event_id = event.id
		and a.vote_rating_delta <> a.vote_rating_applied;

	if attendance_ids is not null then
		perform public.sync_championship_event_attendance_vote_rating(aid)
		from unnest(attendance_ids) as aid;
	end if;

	select coalesce(array_agg(a.player_id), '{}')
	into player_ids
	from public.championship_event_attendance a
	where a.event_id = event.id;

	perform public.sync_championship_players_from_attendance(player_ids);
end;
$$;

create or replace function public.championship_event_player_votes_recompute_trg()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	if tg_op = 'DELETE' then
		perform public.recompute_championship_event_player_vote_delta(
			old.event_id,
			old.target_player_id
		);
		return old;
	end if;

	perform public.recompute_championship_event_player_vote_delta(
		new.event_id,
		new.target_player_id
	);

	if tg_op = 'UPDATE'
		and old.target_player_id is distinct from new.target_player_id then
		perform public.recompute_championship_event_player_vote_delta(
			old.event_id,
			old.target_player_id
		);
	end if;

	return new;
end;
$$;

drop trigger if exists championship_event_player_votes_recompute
	on public.championship_event_player_votes;

create trigger championship_event_player_votes_recompute
	after insert or update or delete
	on public.championship_event_player_votes
	for each row
	execute function public.championship_event_player_votes_recompute_trg();

revoke all on function public.championship_event_player_vote_applied_delta(integer, integer) from public;
revoke all on function public.sync_championship_event_attendance_vote_rating(bigint) from public;
revoke all on function public.recompute_championship_event_player_vote_delta(bigint, bigint) from public;
revoke all on function public.vote_championship_event_player(bigint, bigint, text) from public;
revoke all on function public.adjust_championship_player_ratings_for_event(bigint) from public;
revoke all on function public.championship_event_player_votes_recompute_trg() from public;

grant execute on function public.championship_event_player_vote_applied_delta(integer, integer) to authenticated;
grant execute on function public.vote_championship_event_player(bigint, bigint, text) to authenticated;

alter publication supabase_realtime add table only public.championship_event_attendance;
