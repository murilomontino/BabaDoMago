create or replace function public.enforce_championship_owner_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	owned integer;
begin
	if tg_op = 'UPDATE' and new.created_by is not distinct from old.created_by then
		return new;
	end if;

	perform pg_advisory_xact_lock(hashtextextended(new.created_by::text, 0));

	select count(*)::integer
	into owned
	from public.championships
	where created_by = new.created_by
		and deleted_at is null;

	if owned >= 3 then
		raise exception 'championship quota exceeded' using errcode = '23514';
	end if;

	return new;
end;
$$;

drop trigger if exists championships_owner_quota on public.championships;

create trigger championships_owner_quota
	before insert or update of created_by
	on public.championships
	for each row
	execute function public.enforce_championship_owner_quota();

revoke all on function public.enforce_championship_owner_quota() from public;
