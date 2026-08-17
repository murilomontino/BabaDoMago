-- Fix ambiguous event_id in RSVP upsert; drop maybe status.
-- (Superseded function body replaced again in 20260817171000.)

update public.championship_event_rsvp
set status = 'out'
where status = 'maybe';

alter table public.championship_event_rsvp
	drop constraint if exists championship_event_rsvp_status_check;

alter table public.championship_event_rsvp
	add constraint championship_event_rsvp_status_check
	check (status in ('going', 'out'));

drop policy if exists championship_event_rsvp_select_member
	on public.championship_event_rsvp;

create policy championship_event_rsvp_select_member
	on public.championship_event_rsvp
	for select
	to authenticated
	using (
		exists (
			select 1
			from public.championship_events e
			where e.id = championship_event_rsvp.event_id
				and public.is_championship_member(e.championship_id)
		)
	);
