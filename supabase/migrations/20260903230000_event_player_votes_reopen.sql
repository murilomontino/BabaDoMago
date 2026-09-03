-- Reabrir votação depois do cancelamento: urna zerada, rodada aberta de novo.

drop function if exists public.restore_championship_event_player_votes(bigint);

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

	-- Notas já voltaram no cancelamento; aqui só zera o overlay da rodada.
	update public.championship_event_attendance a
	set vote_rating_delta = 0,
		vote_rating_applied = 0
	where a.event_id = event.id
		and (a.vote_rating_delta <> 0 or a.vote_rating_applied <> 0);

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

revoke all on function public.reopen_championship_event_player_votes(bigint) from public;
grant execute on function public.reopen_championship_event_player_votes(bigint) to authenticated;
