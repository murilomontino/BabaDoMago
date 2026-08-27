create policy championship_audit_logs_select_draw_members
	on public.championship_audit_logs
	for select
	to authenticated
	using (
		action = 'draw_event_teams'
		and (select public.is_championship_member(championship_id))
	);

alter table public.championship_audit_logs replica identity full;

alter publication supabase_realtime add table only public.championship_audit_logs;
