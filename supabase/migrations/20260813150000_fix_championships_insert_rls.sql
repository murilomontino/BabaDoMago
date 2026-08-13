alter table public.championships
	alter column created_by set default auth.uid();

drop policy if exists championships_select_member on public.championships;

create policy championships_select_member
	on public.championships
	for select
	to authenticated
	using (
		created_by = (select auth.uid())
		or public.is_championship_member(id)
	);
