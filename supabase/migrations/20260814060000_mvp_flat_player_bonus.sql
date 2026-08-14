create or replace function public.championship_event_mvp_star_delta(
	ceiling numeric
)
returns numeric
language sql
immutable
set search_path = public
as $$
	select 0.1;
$$;
