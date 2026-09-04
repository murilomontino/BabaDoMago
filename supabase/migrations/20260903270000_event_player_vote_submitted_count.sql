-- Contagem de mensalistas que já enviaram urna (votantes distintos).
-- Uma leitura; o cliente monta "X de Y mensalistas votaram".

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
	submitted integer;
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

	select count(distinct v.voter_player_id)::integer
	into submitted
	from public.championship_event_player_votes v
	inner join public.championship_players p on p.id = v.voter_player_id
	where v.event_id = event.id
		and p.is_monthly = true
		and p.deleted_at is null;

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

	return jsonb_build_object(
		'submitted', coalesce(submitted, 0),
		'counts', counts
	);
end;
$$;

revoke all on function public.list_championship_event_player_vote_counts(bigint) from public;
grant execute on function public.list_championship_event_player_vote_counts(bigint) to authenticated;

notify pgrst, 'reload schema';
