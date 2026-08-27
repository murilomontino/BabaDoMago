alter table public.championship_audit_logs
	drop constraint championship_audit_logs_action_check;

alter table public.championship_audit_logs
	add constraint championship_audit_logs_action_check check (
		action in (
			'update_player_rating',
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

create or replace function public.draw_championship_event_teams(
	event_id bigint,
	present_player_ids jsonb,
	teams jsonb,
	goalkeeper_player_ids jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	result jsonb;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	result := public.save_championship_event_teams(
		draw_championship_event_teams.event_id,
		present_player_ids,
		teams,
		goalkeeper_player_ids
	);

	perform public.championship_audit_log(
		(result ->> 'championship_id')::bigint,
		'draw_event_teams',
		'event',
		(result ->> 'id')::bigint,
		null,
		jsonb_build_object(
			'team_count', jsonb_array_length(teams)
		)
	);

	return result;
end;
$$;

revoke all on function public.draw_championship_event_teams(
	bigint,
	jsonb,
	jsonb,
	jsonb
) from public;

grant execute on function public.draw_championship_event_teams(
	bigint,
	jsonb,
	jsonb,
	jsonb
) to authenticated;

notify pgrst, 'reload schema';
