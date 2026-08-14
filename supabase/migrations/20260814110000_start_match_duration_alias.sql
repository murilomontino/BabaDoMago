create function public.start_championship_event_match(
	event_id bigint,
	team_a_id bigint,
	team_b_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
	return public.start_championship_event_match(
		start_championship_event_match.event_id,
		start_championship_event_match.team_a_id,
		start_championship_event_match.team_b_id,
		420
	);
end;
$$;

create function public.add_championship_event_match(
	event_id bigint,
	team_a_id bigint,
	team_b_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
	return public.start_championship_event_match(
		add_championship_event_match.event_id,
		add_championship_event_match.team_a_id,
		add_championship_event_match.team_b_id,
		420
	);
end;
$$;

revoke all on function public.start_championship_event_match(bigint, bigint, bigint) from public;
revoke all on function public.add_championship_event_match(bigint, bigint, bigint) from public;
revoke all on function public.start_championship_event_match(bigint, bigint, bigint, integer) from public;
revoke all on function public.add_championship_event_match(bigint, bigint, bigint, integer) from public;

grant execute on function public.start_championship_event_match(bigint, bigint, bigint) to authenticated;
grant execute on function public.add_championship_event_match(bigint, bigint, bigint) to authenticated;
grant execute on function public.start_championship_event_match(bigint, bigint, bigint, integer) to authenticated;
grant execute on function public.add_championship_event_match(bigint, bigint, bigint, integer) to authenticated;

notify pgrst, 'reload schema';
