-- Nota de goleiro paralela à nota de linha.
-- Ajuste / voto / MVP usam o track vigente (attendance.is_goalkeeper).

alter table public.championship_players
	add column if not exists goalkeeper_rating numeric(4,1) not null default 0;

do $$
begin
	if not exists (
		select 1
		from pg_constraint
		where conname = 'championship_players_goalkeeper_rating_check'
			and conrelid = 'public.championship_players'::regclass
	) then
		alter table public.championship_players
			add constraint championship_players_goalkeeper_rating_check
			check (goalkeeper_rating >= 0 and goalkeeper_rating <= 100);
	end if;
end $$;

alter table public.championship_event_attendance
	add column if not exists goalkeeper_rating numeric(4,1) not null default 0,
	add column if not exists goalkeeper_rating_delta numeric not null default 0,
	add column if not exists goalkeeper_vote_rating_delta numeric not null default 0,
	add column if not exists goalkeeper_vote_rating_applied numeric not null default 0;

do $$
begin
	if not exists (
		select 1
		from pg_constraint
		where conname = 'championship_event_attendance_goalkeeper_rating_check'
			and conrelid = 'public.championship_event_attendance'::regclass
	) then
		alter table public.championship_event_attendance
			add constraint championship_event_attendance_goalkeeper_rating_check
			check (goalkeeper_rating >= 0 and goalkeeper_rating <= 100);
	end if;

	if not exists (
		select 1
		from pg_constraint
		where conname = 'championship_event_attendance_goalkeeper_vote_rating_delta_check'
			and conrelid = 'public.championship_event_attendance'::regclass
	) then
		alter table public.championship_event_attendance
			add constraint championship_event_attendance_goalkeeper_vote_rating_delta_check
			check (goalkeeper_vote_rating_delta in (-0.5, 0, 0.5));
	end if;

	if not exists (
		select 1
		from pg_constraint
		where conname = 'championship_event_attendance_goalkeeper_vote_rating_applied_check'
			and conrelid = 'public.championship_event_attendance'::regclass
	) then
		alter table public.championship_event_attendance
			add constraint championship_event_attendance_goalkeeper_vote_rating_applied_check
			check (goalkeeper_vote_rating_applied in (-0.5, 0, 0.5));
	end if;
end $$;

-- Seed inicial: nota de goleiro começa igual à nota vigente de linha.
update public.championship_players
set goalkeeper_rating = rating
where goalkeeper_rating = 0
	and rating <> 0;

update public.championship_event_attendance
set goalkeeper_rating = rating
where goalkeeper_rating = 0
	and rating <> 0;

create or replace function public.championship_event_attendance_set_rating()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
	select p.rating, p.goalkeeper_rating
	into new.rating, new.goalkeeper_rating
	from public.championship_players p
	where p.id = new.player_id;

	if new.rating is null then
		new.rating := 0;
	end if;

	if new.goalkeeper_rating is null then
		new.goalkeeper_rating := 0;
	end if;

	return new;
end;
$$;

create or replace function public.championship_player_json(
	player public.championship_players
)
returns jsonb
language sql
immutable
as $$
	select jsonb_build_object(
		'id', player.id,
		'championship_id', player.championship_id,
		'user_id', player.user_id,
		'display_name', player.display_name,
		'nickname', player.nickname,
		'nickname_tags', player.nickname_tags,
		'avatar_url', player.avatar_url,
		'rating', player.rating,
		'goalkeeper_rating', player.goalkeeper_rating,
		'role', player.role,
		'deleted_at', player.deleted_at,
		'is_goalkeeper', player.is_goalkeeper,
		'is_monthly', player.is_monthly,
		'goals', player.goals,
		'assists', player.assists,
		'assisted_goals', player.assisted_goals,
		'own_goals', player.own_goals,
		'wins', player.wins,
		'losses', player.losses,
		'draws', player.draws,
		'matches', player.matches,
		'mvps', player.mvps
	);
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
	event_voided boolean := false;
	target_delta numeric;
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

	select e.player_votes_voided_at is not null
	into event_voided
	from public.championship_events e
	where e.id = attendance.event_id;

	select *
	into player
	from public.championship_players p
	where p.id = attendance.player_id
	for update;

	if player.id is null then
		return;
	end if;

	if attendance.is_goalkeeper then
		target_delta := case
			when event_voided then 0
			else attendance.vote_rating_delta
		end;
		diff := target_delta - attendance.goalkeeper_vote_rating_applied;

		if player.goalkeeper_rating = 0 or diff = 0 then
			update public.championship_event_attendance a
			set goalkeeper_vote_rating_delta = attendance.vote_rating_delta,
				goalkeeper_vote_rating_applied = case
					when player.goalkeeper_rating = 0 then attendance.goalkeeper_vote_rating_applied
					else target_delta
				end
			where a.id = attendance.id
				and (
					a.goalkeeper_vote_rating_delta is distinct from attendance.vote_rating_delta
					or (
						player.goalkeeper_rating <> 0
						and a.goalkeeper_vote_rating_applied is distinct from target_delta
					)
				);
			return;
		end if;

		update public.championship_players p
		set goalkeeper_rating = public.championship_player_rating_apply(
			p.goalkeeper_rating,
			diff
		)
		where p.id = player.id;

		update public.championship_event_attendance a
		set goalkeeper_vote_rating_delta = attendance.vote_rating_delta,
			goalkeeper_vote_rating_applied = target_delta
		where a.id = attendance.id;

		return;
	end if;

	target_delta := case
		when event_voided then 0
		else attendance.vote_rating_delta
	end;

	diff := target_delta - attendance.vote_rating_applied;

	if player.rating = 0 or diff = 0 then
		return;
	end if;

	update public.championship_players p
	set rating = public.championship_player_rating_apply(p.rating, diff)
	where p.id = player.id;

	update public.championship_event_attendance a
	set vote_rating_applied = target_delta
	where a.id = attendance.id;
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
	drop_share_enabled boolean := false;
	exclude_top_enabled boolean := false;
	line_ceiling numeric;
	gk_ceiling numeric;
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

	select
		coalesce(c.rating_drop_goal_share, false),
		coalesce(c.rating_drop_share_exclude_top, false)
	into drop_share_enabled, exclude_top_enabled
	from public.championships c
	where c.id = event.championship_id;

	select least(100, greatest(coalesce(max(a.rating), 0), 5))
	into line_ceiling
	from public.championship_event_attendance a
	where a.event_id = event.id
		and a.is_goalkeeper = false;

	select least(100, greatest(coalesce(max(a.goalkeeper_rating), 0), 5))
	into gk_ceiling
	from public.championship_event_attendance a
	where a.event_id = event.id
		and a.is_goalkeeper = true;

	if line_ceiling is null then
		line_ceiling := 5;
	end if;

	if gk_ceiling is null then
		gk_ceiling := 5;
	end if;

	with team_involvement as (
		select
			tp.team_id,
			coalesce(sum(a.goals + a.assists), 0)::numeric as involvement
		from public.championship_event_team_players tp
		join public.championship_event_attendance a
			on a.event_id = tp.event_id
			and a.player_id = tp.player_id
		where tp.event_id = adjust_championship_player_ratings_for_event.event_id
		group by tp.team_id
	),
	excluded_top_line as (
		select p.id
		from public.championship_players p
		where p.championship_id = event.championship_id
			and p.deleted_at is null
			and p.removed_at is null
			and p.rating > 0
		order by p.rating desc, p.id asc
		limit 10
	),
	excluded_top_gk as (
		select p.id
		from public.championship_players p
		where p.championship_id = event.championship_id
			and p.deleted_at is null
			and p.removed_at is null
			and p.goalkeeper_rating > 0
		order by p.goalkeeper_rating desc, p.id asc
		limit 10
	),
	deltas as (
		select
			a.id as attendance_id,
			a.player_id,
			a.is_goalkeeper,
			case
				when a.is_goalkeeper then a.goalkeeper_rating_delta
				else a.rating_delta
			end as old_delta,
			public.championship_event_rating_apply_drop_share(
				case
					when a.is_goalkeeper then
						case
							when a.goalkeeper_rating = 0
								and p.goalkeeper_rating <> 0
								and a.goalkeeper_rating_delta = 0 then 0
							else public.championship_event_rating_delta(
								a.wins,
								a.draws,
								a.losses,
								a.matches,
								a.goalkeeper_rating,
								gk_ceiling
							)
						end + case
							when a.is_mvp then public.championship_event_mvp_bonus(a.goalkeeper_rating)
							else 0
						end
					else
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
								line_ceiling
							)
						end + case
							when a.is_mvp then public.championship_event_mvp_bonus(a.rating)
							else 0
						end
				end,
				case
					when drop_share_enabled
						and not (
							exclude_top_enabled
							and (
								(
									a.is_goalkeeper = false
									and exists (
										select 1
										from excluded_top_line xt
										where xt.id = a.player_id
									)
								)
								or (
									a.is_goalkeeper = true
									and exists (
										select 1
										from excluded_top_gk xt
										where xt.id = a.player_id
									)
								)
							)
						)
					then public.championship_event_rating_team_goal_share(
						(a.goals + a.assists)::numeric,
						coalesce(ti.involvement, 0)
					)
					else 0
				end
			) as new_delta
		from public.championship_event_attendance a
		join public.championship_players p
			on p.id = a.player_id
		left join public.championship_event_team_players tp
			on tp.event_id = a.event_id
			and tp.player_id = a.player_id
		left join team_involvement ti
			on ti.team_id = tp.team_id
		where a.event_id = adjust_championship_player_ratings_for_event.event_id
	),
	updated_line as (
		update public.championship_players p
		set rating = public.championship_player_rating_apply(
			p.rating,
			-d.old_delta + d.new_delta
		)
		from deltas d
		where p.id = d.player_id
			and d.is_goalkeeper = false
			and d.new_delta <> d.old_delta
		returning p.id
	),
	updated_gk as (
		update public.championship_players p
		set goalkeeper_rating = public.championship_player_rating_apply(
			p.goalkeeper_rating,
			-d.old_delta + d.new_delta
		)
		from deltas d
		where p.id = d.player_id
			and d.is_goalkeeper = true
			and d.new_delta <> d.old_delta
		returning p.id
	),
	updated_attendance_line as (
		update public.championship_event_attendance a
		set rating_delta = d.new_delta
		from deltas d
		where a.id = d.attendance_id
			and d.is_goalkeeper = false
			and a.rating_delta <> d.new_delta
		returning a.id
	)
	update public.championship_event_attendance a
	set goalkeeper_rating_delta = d.new_delta
	from deltas d
	where a.id = d.attendance_id
		and d.is_goalkeeper = true
		and a.goalkeeper_rating_delta <> d.new_delta;

	select coalesce(array_agg(a.id), '{}')
	into attendance_ids
	from public.championship_event_attendance a
	where a.event_id = event.id
		and (
			(
				a.is_goalkeeper = false
				and a.vote_rating_delta <> a.vote_rating_applied
			)
			or (
				a.is_goalkeeper = true
				and a.vote_rating_delta <> a.goalkeeper_vote_rating_applied
			)
		);

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

create or replace function public.reopen_championship_event_player_votes(
	event_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	event public.championship_events%rowtype;
	attendance_id bigint;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = reopen_championship_event_player_votes.event_id
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

	if event.player_votes_voided_at is null then
		raise exception 'votes not voided' using errcode = '23514';
	end if;

	delete from public.championship_event_player_votes v
	where v.event_id = event.id;

	update public.championship_event_attendance a
	set vote_rating_delta = 0,
		vote_rating_applied = 0,
		goalkeeper_vote_rating_delta = 0,
		goalkeeper_vote_rating_applied = 0
	where a.event_id = event.id
		and (
			a.vote_rating_delta <> 0
			or a.vote_rating_applied <> 0
			or a.goalkeeper_vote_rating_delta <> 0
			or a.goalkeeper_vote_rating_applied <> 0
		);

	update public.championship_events e
	set player_votes_voided_at = null,
		player_votes_closed_at = null
	where e.id = event.id;

	for attendance_id in
		select a.id
		from public.championship_event_attendance a
		where a.event_id = event.id
	loop
		perform public.sync_championship_event_attendance_vote_rating(attendance_id);
	end loop;

	return jsonb_build_object(
		'event_id', event.id,
		'player_votes_voided_at', null,
		'player_votes_closed_at', null
	);
end;
$$;

alter table public.championship_audit_logs
	drop constraint championship_audit_logs_action_check;

alter table public.championship_audit_logs
	add constraint championship_audit_logs_action_check check (
		action in (
			'update_player_rating',
			'update_player_goalkeeper_rating',
			'save_player_event_stats',
			'save_attendance_stats',
			'set_event_mvps',
			'set_player_role',
			'merge_players',
			'remove_player',
			'claim_player',
			'unlink_player',
			'transfer_owner',
			'update_event_config',
			'update_visibility',
			'rename_championship',
			'draw_event_teams'
		)
	);

create or replace function public.list_championship_audit_logs(
	p_championship_id bigint,
	p_action text default null,
	p_before_id bigint default null,
	p_page_size integer default 30
)
returns setof public.championship_audit_logs
language plpgsql
stable
security invoker
set search_path = public
as $$
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if public.championship_actor_role(p_championship_id) not in (
		'owner',
		'captain',
		'admin'
	) then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if p_page_size is null
		or p_page_size < 1
		or p_page_size > 100
	then
		raise exception 'invalid page size' using errcode = '23514';
	end if;

	if p_action is not null
		and p_action not in (
			'update_player_rating',
			'update_player_goalkeeper_rating',
			'save_player_event_stats',
			'save_attendance_stats',
			'set_event_mvps',
			'set_player_role',
			'merge_players',
			'remove_player',
			'claim_player',
			'unlink_player',
			'transfer_owner',
			'update_event_config',
			'update_visibility',
			'rename_championship',
			'draw_event_teams'
		)
	then
		raise exception 'invalid audit action' using errcode = '23514';
	end if;

	return query
	select l.*
	from public.championship_audit_logs l
	where l.championship_id = p_championship_id
		and (p_action is null or l.action = p_action)
		and (p_before_id is null or l.id < p_before_id)
	order by l.id desc
	limit p_page_size;
end;
$$;

create or replace function public.update_player_rating(player_id bigint, rating numeric)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	viewer uuid := (select auth.uid());
	player public.championship_players%rowtype;
	old_rating numeric;
	old_goalkeeper_rating numeric;
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if update_player_rating.rating < 0 or update_player_rating.rating > 100 then
		raise exception 'invalid rating' using errcode = '23514';
	end if;

	select *
	into player
	from public.championship_players p
	where p.id = update_player_rating.player_id
	for update;

	if player.id is null or player.deleted_at is not null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(player.championship_id) not in (
		'owner',
		'captain',
		'admin'
	) then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	old_rating := player.rating;
	old_goalkeeper_rating := player.goalkeeper_rating;

	update public.championship_players
	set
		rating = update_player_rating.rating,
		goalkeeper_rating = case
			when player.goalkeeper_rating = 0
				and player.rating = 0
				and update_player_rating.rating <> 0
			then update_player_rating.rating
			else player.goalkeeper_rating
		end
	where id = player.id
	returning * into player;

	perform public.championship_audit_log(
		player.championship_id,
		'update_player_rating',
		'player',
		player.id,
		jsonb_build_object(
			'rating', old_rating,
			'goalkeeper_rating', old_goalkeeper_rating
		),
		jsonb_build_object(
			'rating', player.rating,
			'goalkeeper_rating', player.goalkeeper_rating
		)
	);

	return public.championship_player_json(player);
end;
$$;

create or replace function public.update_player_goalkeeper_rating(
	player_id bigint,
	rating numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	viewer uuid := (select auth.uid());
	player public.championship_players%rowtype;
	old_rating numeric;
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if update_player_goalkeeper_rating.rating < 0
		or update_player_goalkeeper_rating.rating > 100 then
		raise exception 'invalid rating' using errcode = '23514';
	end if;

	select *
	into player
	from public.championship_players p
	where p.id = update_player_goalkeeper_rating.player_id
	for update;

	if player.id is null or player.deleted_at is not null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(player.championship_id) not in (
		'owner',
		'captain',
		'admin'
	) then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	old_rating := player.goalkeeper_rating;

	update public.championship_players
	set goalkeeper_rating = update_player_goalkeeper_rating.rating
	where id = player.id
	returning * into player;

	perform public.championship_audit_log(
		player.championship_id,
		'update_player_goalkeeper_rating',
		'player',
		player.id,
		jsonb_build_object('goalkeeper_rating', old_rating),
		jsonb_build_object('goalkeeper_rating', player.goalkeeper_rating)
	);

	return public.championship_player_json(player);
end;
$$;

revoke all on function public.adjust_championship_player_ratings_for_event(bigint) from public;
revoke all on function public.sync_championship_event_attendance_vote_rating(bigint) from public;
revoke all on function public.reopen_championship_event_player_votes(bigint) from public;
revoke all on function public.update_player_goalkeeper_rating(bigint, numeric) from public;
revoke all on function public.list_championship_audit_logs(bigint, text, bigint, integer) from public;

grant execute on function public.reopen_championship_event_player_votes(bigint) to authenticated;
grant execute on function public.update_player_goalkeeper_rating(bigint, numeric) to authenticated;
grant execute on function public.list_championship_audit_logs(bigint, text, bigint, integer) to authenticated;

notify pgrst, 'reload schema';
