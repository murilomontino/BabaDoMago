create table public.championship_event_draw_audits (
	id bigint generated always as identity primary key,
	event_id bigint not null references public.championship_events(id) on delete cascade,
	championship_id bigint not null references public.championships(id) on delete cascade,
	actor_user_id uuid not null default auth.uid(),
	seed bigint not null,
	algorithm_version integer not null,
	input_snapshot jsonb not null,
	output_snapshot jsonb not null,
	input_hash text not null,
	is_current boolean not null default true,
	created_at timestamptz not null default now()
);

create index championship_event_draw_audits_event_id_idx
	on public.championship_event_draw_audits (event_id);

create index championship_event_draw_audits_championship_id_idx
	on public.championship_event_draw_audits (championship_id);

alter table public.championship_event_draw_audits enable row level security;

create policy "Members can read draw audits"
	on public.championship_event_draw_audits
	for select
	using (
		public.championship_actor_role(championship_id) in (
			'owner', 'captain', 'admin', 'member'
		)
	);

-- Marca auditorias anteriores do mesmo evento como nao-atuais
-- antes de inserir a nova.
create or replace function public.save_event_draw_audit(
	p_event_id bigint,
	p_championship_id bigint,
	p_seed bigint,
	p_algorithm_version integer,
	p_input_snapshot jsonb,
	p_output_snapshot jsonb,
	p_input_hash text
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
	audit_id bigint;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	update public.championship_event_draw_audits
	set is_current = false
	where event_id = p_event_id
		and is_current = true;

	insert into public.championship_event_draw_audits (
		event_id,
		championship_id,
		seed,
		algorithm_version,
		input_snapshot,
		output_snapshot,
		input_hash,
		is_current
	) values (
		p_event_id,
		p_championship_id,
		p_seed,
		p_algorithm_version,
		p_input_snapshot,
		p_output_snapshot,
		p_input_hash,
		true
	)
	returning id into audit_id;

	return audit_id;
end;
$$;

revoke all on function public.save_event_draw_audit(
	bigint, bigint, bigint, integer, jsonb, jsonb, text
) from public;

grant execute on function public.save_event_draw_audit(
	bigint, bigint, bigint, integer, jsonb, jsonb, text
) to authenticated;

notify pgrst, 'reload schema';
