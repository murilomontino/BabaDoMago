-- Totais da urna para o dono. Flag de voto em si na config do baba.

alter table public.championships
	add column if not exists player_vote_allow_self boolean not null default true;

drop function if exists public.update_championship_event_config(
	bigint,
	time,
	smallint,
	boolean,
	smallint,
	text,
	boolean,
	boolean,
	smallint
);

create or replace function public.update_championship_event_config(
	championship_id bigint,
	event_time time,
	players_per_team smallint,
	skip_guest_goalkeeper_matches boolean default true,
	event_weekday smallint default null,
	location text default null,
	rating_drop_goal_share boolean default false,
	rating_drop_share_exclude_top boolean default false,
	player_vote_quorum smallint default 3,
	player_vote_allow_self boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	championship public.championships%rowtype;
	open_event_ids bigint[];
	player_ids bigint[];
	open_event_id bigint;
	before_data jsonb;
	next_location text;
	quorum_changed boolean;
	open_vote record;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if update_championship_event_config.players_per_team < 3
		or update_championship_event_config.players_per_team > 11 then
		raise exception 'invalid players per team' using errcode = '23514';
	end if;

	if update_championship_event_config.event_weekday is not null
		and (
			update_championship_event_config.event_weekday < 1
			or update_championship_event_config.event_weekday > 7
		) then
		raise exception 'invalid event weekday' using errcode = '23514';
	end if;

	if update_championship_event_config.player_vote_quorum < 1
		or update_championship_event_config.player_vote_quorum > 10 then
		raise exception 'invalid player vote quorum' using errcode = '23514';
	end if;

	next_location := nullif(btrim(update_championship_event_config.location), '');
	if next_location is not null and char_length(next_location) > 120 then
		raise exception 'invalid location' using errcode = '23514';
	end if;

	select *
	into championship
	from public.championships c
	where c.id = update_championship_event_config.championship_id
		and c.deleted_at is null
	for update;

	if championship.id is null then
		raise exception 'championship not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(championship.id) not in ('owner', 'captain') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	quorum_changed := championship.player_vote_quorum
		<> update_championship_event_config.player_vote_quorum;

	before_data := jsonb_build_object(
		'event_time', championship.event_time,
		'players_per_team', championship.players_per_team,
		'skip_guest_goalkeeper_matches', championship.skip_guest_goalkeeper_matches,
		'event_weekday', championship.event_weekday,
		'location', championship.location,
		'rating_drop_goal_share', championship.rating_drop_goal_share,
		'rating_drop_share_exclude_top', championship.rating_drop_share_exclude_top,
		'player_vote_quorum', championship.player_vote_quorum,
		'player_vote_allow_self', championship.player_vote_allow_self
	);

	update public.championships
	set
		event_time = update_championship_event_config.event_time,
		players_per_team = update_championship_event_config.players_per_team,
		skip_guest_goalkeeper_matches = coalesce(
			update_championship_event_config.skip_guest_goalkeeper_matches,
			true
		),
		event_weekday = update_championship_event_config.event_weekday,
		location = next_location,
		rating_drop_goal_share = coalesce(
			update_championship_event_config.rating_drop_goal_share,
			false
		),
		rating_drop_share_exclude_top = coalesce(
			update_championship_event_config.rating_drop_share_exclude_top,
			false
		),
		player_vote_quorum = update_championship_event_config.player_vote_quorum,
		player_vote_allow_self = coalesce(
			update_championship_event_config.player_vote_allow_self,
			true
		)
	where id = championship.id
	returning * into championship;

	select coalesce(array_agg(e.id), '{}')
	into open_event_ids
	from public.championship_events e
	where e.championship_id = championship.id
		and e.ended_at is null
		and e.deleted_at is null;

	update public.championship_events
	set skip_guest_goalkeeper_matches = championship.skip_guest_goalkeeper_matches
	where id = any (open_event_ids);

	foreach open_event_id in array open_event_ids loop
		perform public.refresh_championship_event_attendance_stats(open_event_id);
	end loop;

	select coalesce(array_agg(distinct a.player_id), '{}')
	into player_ids
	from public.championship_event_attendance a
	where a.event_id = any (open_event_ids);

	perform public.sync_championship_players_from_attendance(player_ids);

	if quorum_changed then
		for open_vote in
			select a.event_id, a.player_id
			from public.championship_event_attendance a
			join public.championship_events e on e.id = a.event_id
			where e.championship_id = championship.id
				and e.ended_at is not null
				and e.player_votes_closed_at is null
				and e.deleted_at is null
				and a.vote_rating_delta = 0
		loop
			perform public.recompute_championship_event_player_vote_delta(
				open_vote.event_id,
				open_vote.player_id
			);
		end loop;
	end if;

	perform public.championship_audit_log(
		championship.id,
		'update_event_config',
		'championship',
		championship.id,
		before_data,
		jsonb_build_object(
			'event_time', championship.event_time,
			'players_per_team', championship.players_per_team,
			'skip_guest_goalkeeper_matches', championship.skip_guest_goalkeeper_matches,
			'event_weekday', championship.event_weekday,
			'location', championship.location,
			'rating_drop_goal_share', championship.rating_drop_goal_share,
			'rating_drop_share_exclude_top', championship.rating_drop_share_exclude_top,
			'player_vote_quorum', championship.player_vote_quorum,
			'player_vote_allow_self', championship.player_vote_allow_self
		)
	);

	return jsonb_build_object(
		'id', championship.id,
		'name', championship.name,
		'invite_code', championship.invite_code,
		'created_by', championship.created_by,
		'logo_path', championship.logo_path,
		'event_time', championship.event_time,
		'players_per_team', championship.players_per_team,
		'skip_guest_goalkeeper_matches', championship.skip_guest_goalkeeper_matches,
		'event_weekday', championship.event_weekday,
		'location', championship.location,
		'rating_drop_goal_share', championship.rating_drop_goal_share,
		'rating_drop_share_exclude_top', championship.rating_drop_share_exclude_top,
		'player_vote_quorum', championship.player_vote_quorum,
		'player_vote_allow_self', championship.player_vote_allow_self,
		'is_visible', championship.is_visible
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
	allow_self boolean;
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

	select c.player_vote_allow_self
	into allow_self
	from public.championships c
	where c.id = event.championship_id;

	if not coalesce(allow_self, true)
		and voter_id = vote_championship_event_player.target_player_id
	then
		raise exception 'cannot vote self' using errcode = '23514';
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
	allow_self boolean;
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

	select c.player_vote_allow_self
	into allow_self
	from public.championships c
	where c.id = event.championship_id;

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

		if not coalesce(allow_self, true)
			and vote_row.target_player_id = voter_id
		then
			raise exception 'cannot vote self' using errcode = '23514';
		end if;

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

drop policy if exists championship_event_player_votes_insert_own
	on public.championship_event_player_votes;
drop policy if exists championship_event_player_votes_update_own
	on public.championship_event_player_votes;

create policy championship_event_player_votes_insert_own
	on public.championship_event_player_votes
	for insert
	to authenticated
	with check (
		exists (
			select 1
			from public.championship_events e
			join public.championships c
				on c.id = e.championship_id
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
				and (
					championship_event_player_votes.voter_player_id
						is distinct from championship_event_player_votes.target_player_id
					or c.player_vote_allow_self
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
			join public.championships c
				on c.id = e.championship_id
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
				and (
					championship_event_player_votes.voter_player_id
						is distinct from championship_event_player_votes.target_player_id
					or c.player_vote_allow_self
				)
		)
		and exists (
			select 1
			from public.championship_event_attendance a
			where a.event_id = championship_event_player_votes.event_id
				and a.player_id = championship_event_player_votes.target_player_id
		)
	);

create or replace function public.list_championship_event_player_vote_counts(
	event_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	event public.championship_events%rowtype;
	counts jsonb;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = list_championship_event_player_vote_counts.event_id
		and e.deleted_at is null;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(event.championship_id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	select coalesce(
		jsonb_agg(
			jsonb_build_object(
				'player_id', a.player_id,
				'likes', coalesce(t.likes, 0),
				'dislikes', coalesce(t.dislikes, 0)
			)
			order by a.player_id
		),
		'[]'::jsonb
	)
	into counts
	from public.championship_event_attendance a
	left join (
		select
			v.target_player_id,
			count(*) filter (where v.value = 'like')::integer as likes,
			count(*) filter (where v.value = 'dislike')::integer as dislikes
		from public.championship_event_player_votes v
		where v.event_id = event.id
		group by v.target_player_id
	) t on t.target_player_id = a.player_id
	where a.event_id = event.id;

	return counts;
end;
$$;

revoke all on function public.update_championship_event_config(
	bigint,
	time,
	smallint,
	boolean,
	smallint,
	text,
	boolean,
	boolean,
	smallint,
	boolean
) from public;

grant execute on function public.update_championship_event_config(
	bigint,
	time,
	smallint,
	boolean,
	smallint,
	text,
	boolean,
	boolean,
	smallint,
	boolean
) to authenticated;

revoke all on function public.list_championship_event_player_vote_counts(bigint) from public;
grant execute on function public.list_championship_event_player_vote_counts(bigint) to authenticated;

notify pgrst, 'reload schema';

