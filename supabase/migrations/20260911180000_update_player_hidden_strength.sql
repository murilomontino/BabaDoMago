alter table public.championship_audit_logs
	drop constraint championship_audit_logs_action_check;

alter table public.championship_audit_logs
	add constraint championship_audit_logs_action_check check (
		action in (
			'update_player_rating',
			'update_player_goalkeeper_rating',
			'update_player_hidden_strength',
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
			'update_player_hidden_strength',
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

create or replace function public.update_player_hidden_strength(
	player_id bigint,
	value numeric,
	track text default 'line'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	viewer uuid := (select auth.uid());
	player public.championship_players%rowtype;
	old_value numeric;
	next_value numeric;
	ceiling numeric;
	public_rating numeric;
	field_name text;
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if update_player_hidden_strength.track not in ('line', 'goalkeeper') then
		raise exception 'invalid track' using errcode = '23514';
	end if;

	if update_player_hidden_strength.value < 0
		or update_player_hidden_strength.value > 100
	then
		raise exception 'invalid hidden strength' using errcode = '23514';
	end if;

	select *
	into player
	from public.championship_players p
	where p.id = update_player_hidden_strength.player_id
	for update;

	if player.id is null or player.deleted_at is not null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(player.championship_id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if update_player_hidden_strength.track = 'goalkeeper'
		and not coalesce(player.is_goalkeeper, false)
	then
		raise exception 'player is not goalkeeper' using errcode = '23514';
	end if;

	if update_player_hidden_strength.value = 0 then
		if update_player_hidden_strength.track = 'goalkeeper' then
			public_rating := player.goalkeeper_rating;
			select coalesce(
				max(p.goalkeeper_rating) filter (where p.goalkeeper_rating <> 0),
				0
			)
			into ceiling
			from public.championship_players p
			where p.championship_id = player.championship_id
				and p.deleted_at is null;
		else
			public_rating := player.rating;
			select coalesce(max(p.rating) filter (where p.rating <> 0), 0)
			into ceiling
			from public.championship_players p
			where p.championship_id = player.championship_id
				and p.deleted_at is null;
		end if;

		next_value := public.championship_hidden_strength_seed(
			public_rating,
			ceiling
		);
	else
		next_value := least(
			100,
			greatest(1, round(update_player_hidden_strength.value, 1))
		);
	end if;

	if update_player_hidden_strength.track = 'goalkeeper' then
		old_value := player.hidden_goalkeeper_strength;
		field_name := 'hidden_goalkeeper_strength';

		update public.championship_players
		set hidden_goalkeeper_strength = next_value
		where id = player.id
		returning * into player;
	else
		old_value := player.hidden_strength;
		field_name := 'hidden_strength';

		update public.championship_players
		set hidden_strength = next_value
		where id = player.id
		returning * into player;
	end if;

	perform public.championship_audit_log(
		player.championship_id,
		'update_player_hidden_strength',
		'player',
		player.id,
		jsonb_build_object(
			'track', update_player_hidden_strength.track,
			field_name, old_value
		),
		jsonb_build_object(
			'track', update_player_hidden_strength.track,
			field_name, next_value
		)
	);

	return public.championship_player_json(player);
end;
$$;

revoke all on function public.update_player_hidden_strength(bigint, numeric, text) from public;
revoke all on function public.list_championship_audit_logs(bigint, text, bigint, integer) from public;

grant execute on function public.update_player_hidden_strength(bigint, numeric, text) to authenticated;
grant execute on function public.list_championship_audit_logs(bigint, text, bigint, integer) to authenticated;

notify pgrst, 'reload schema';
