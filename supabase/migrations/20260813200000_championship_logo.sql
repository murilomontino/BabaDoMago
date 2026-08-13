	alter table public.championships
		add column if not exists logo_path text;

	insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
	values (
		'championship-logos',
		'championship-logos',
		true,
		1048576,
		array['image/png', 'image/jpeg']
	)
	on conflict (id) do update
	set
		public = excluded.public,
		file_size_limit = excluded.file_size_limit,
		allowed_mime_types = excluded.allowed_mime_types;

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

	create or replace function public.get_championship_by_invite(invite_code text)
	returns jsonb
	language plpgsql
	stable
	security definer
	set search_path = public
	as $$
	declare
		result jsonb;
	begin
		select jsonb_build_object(
			'id', c.id,
			'name', c.name,
			'invite_code', c.invite_code,
			'created_by', c.created_by,
			'logo_path', c.logo_path,
			'players', coalesce((
				select jsonb_agg(
					jsonb_build_object(
						'id', p.id,
						'championship_id', p.championship_id,
						'user_id', p.user_id,
						'display_name', p.display_name,
						'avatar_url', p.avatar_url,
						'rating', p.rating,
						'role', p.role
					)
					order by p.id
				)
				from public.championship_players p
				where p.championship_id = c.id
			), '[]'::jsonb)
		)
		into result
		from public.championships c
		where c.invite_code = get_championship_by_invite.invite_code;

		if result is null then
			raise exception 'championship not found' using errcode = 'P0002';
		end if;

		return result;
	end;
	$$;

	create or replace function public.update_championship_name(championship_id bigint, name text)
	returns jsonb
	language plpgsql
	security definer
	set search_path = public
	as $$
	declare
		championship public.championships%rowtype;
		trimmed text := btrim(update_championship_name.name);
	begin
		if (select auth.uid()) is null then
			raise exception 'not authenticated' using errcode = '42501';
		end if;

		if trimmed is null or trimmed = '' then
			raise exception 'invalid name' using errcode = '23514';
		end if;

		if public.championship_actor_role(update_championship_name.championship_id) not in ('owner', 'captain') then
			raise exception 'not allowed' using errcode = '42501';
		end if;

		update public.championships c
		set name = trimmed
		where c.id = update_championship_name.championship_id
		returning * into championship;

		if championship.id is null then
			raise exception 'championship not found' using errcode = 'P0002';
		end if;

		return jsonb_build_object(
			'id', championship.id,
			'name', championship.name,
			'invite_code', championship.invite_code,
			'created_by', championship.created_by,
			'logo_path', championship.logo_path
		);
	end;
	$$;

	notify pgrst, 'reload schema';
