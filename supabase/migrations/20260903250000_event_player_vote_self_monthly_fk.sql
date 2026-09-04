-- Voto em si e mensalista ausente: o CHECK e o FK da presença recusavam o insert.

do $$
declare
	constraint_name text;
begin
	for constraint_name in
		select c.conname
		from pg_constraint c
		join pg_class t on t.oid = c.conrelid
		join pg_namespace n on n.oid = t.relnamespace
		where n.nspname = 'public'
			and t.relname = 'championship_event_player_votes'
			and c.contype = 'c'
			and pg_get_constraintdef(c.oid) like '%voter_player_id <> target_player_id%'
	loop
		execute format(
			'alter table public.championship_event_player_votes drop constraint %I',
			constraint_name
		);
	end loop;

	for constraint_name in
		select c.conname
		from pg_constraint c
		join pg_class t on t.oid = c.conrelid
		join pg_namespace n on n.oid = t.relnamespace
		where n.nspname = 'public'
			and t.relname = 'championship_event_player_votes'
			and c.contype = 'f'
			and pg_get_constraintdef(c.oid) like '%(event_id, voter_player_id)%'
	loop
		execute format(
			'alter table public.championship_event_player_votes drop constraint %I',
			constraint_name
		);
	end loop;
end;
$$;

alter table public.championship_event_player_votes
	drop constraint if exists championship_event_player_votes_voter_player_id_fkey;

alter table public.championship_event_player_votes
	add constraint championship_event_player_votes_voter_player_id_fkey
	foreign key (voter_player_id)
	references public.championship_players (id)
	on delete cascade;

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
				and p.id = championship_event_player_votes.voter_player_id
			where e.id = championship_event_player_votes.event_id
				and e.deleted_at is null
				and p.deleted_at is null
				and p.user_id = (select auth.uid())
				and (
					p.is_monthly
					or public.championship_actor_role(e.championship_id) in (
						'owner',
						'captain',
						'admin'
					)
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
				and p.id = championship_event_player_votes.voter_player_id
			where e.id = championship_event_player_votes.event_id
				and e.deleted_at is null
				and p.deleted_at is null
				and p.user_id = (select auth.uid())
				and (
					p.is_monthly
					or (
						public.championship_actor_role(e.championship_id) in (
							'owner',
							'captain',
							'admin'
						)
						and exists (
							select 1
							from public.championship_event_attendance a
							where a.event_id = championship_event_player_votes.event_id
								and a.player_id = championship_event_player_votes.voter_player_id
						)
					)
				)
		)
		and exists (
			select 1
			from public.championship_event_attendance a
			where a.event_id = championship_event_player_votes.event_id
				and a.player_id = championship_event_player_votes.target_player_id
		)
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
				and p.id = championship_event_player_votes.voter_player_id
			where e.id = championship_event_player_votes.event_id
				and e.deleted_at is null
				and p.deleted_at is null
				and p.user_id = (select auth.uid())
				and (
					p.is_monthly
					or public.championship_actor_role(e.championship_id) in (
						'owner',
						'captain',
						'admin'
					)
				)
		)
	)
	with check (
		exists (
			select 1
			from public.championship_events e
			join public.championship_players p
				on p.championship_id = e.championship_id
				and p.id = championship_event_player_votes.voter_player_id
			where e.id = championship_event_player_votes.event_id
				and e.deleted_at is null
				and p.deleted_at is null
				and p.user_id = (select auth.uid())
				and (
					p.is_monthly
					or (
						public.championship_actor_role(e.championship_id) in (
							'owner',
							'captain',
							'admin'
						)
						and exists (
							select 1
							from public.championship_event_attendance a
							where a.event_id = championship_event_player_votes.event_id
								and a.player_id = championship_event_player_votes.voter_player_id
						)
					)
				)
		)
		and exists (
			select 1
			from public.championship_event_attendance a
			where a.event_id = championship_event_player_votes.event_id
				and a.player_id = championship_event_player_votes.target_player_id
		)
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
				and p.id = championship_event_player_votes.voter_player_id
			where e.id = championship_event_player_votes.event_id
				and e.deleted_at is null
				and p.deleted_at is null
				and p.user_id = (select auth.uid())
				and (
					p.is_monthly
					or public.championship_actor_role(e.championship_id) in (
						'owner',
						'captain',
						'admin'
					)
				)
		)
	);

notify pgrst, 'reload schema';
