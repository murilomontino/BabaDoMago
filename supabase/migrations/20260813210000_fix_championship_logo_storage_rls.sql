create or replace function public.owns_championship_logo_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select exists (
		select 1
		from public.championships c
		where c.id::text = split_part(owns_championship_logo_object.object_name, '/', 1)
			and c.created_by = (select auth.uid())
	);
$$;

revoke all on function public.owns_championship_logo_object(text) from public;
grant execute on function public.owns_championship_logo_object(text) to authenticated;

drop policy if exists championship_logos_select on storage.objects;
drop policy if exists championship_logos_insert on storage.objects;
drop policy if exists championship_logos_update on storage.objects;
drop policy if exists championship_logos_delete on storage.objects;

create policy championship_logos_select
	on storage.objects
	for select
	to anon, authenticated
	using (bucket_id = 'championship-logos');

create policy championship_logos_insert
	on storage.objects
	for insert
	to authenticated
	with check (
		bucket_id = 'championship-logos'
		and public.owns_championship_logo_object(name)
	);

create policy championship_logos_update
	on storage.objects
	for update
	to authenticated
	using (
		bucket_id = 'championship-logos'
		and public.owns_championship_logo_object(name)
	)
	with check (
		bucket_id = 'championship-logos'
		and public.owns_championship_logo_object(name)
	);

create policy championship_logos_delete
	on storage.objects
	for delete
	to authenticated
	using (
		bucket_id = 'championship-logos'
		and public.owns_championship_logo_object(name)
	);
