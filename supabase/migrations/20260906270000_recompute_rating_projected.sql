-- Recalcula rating_projected com alvo do Gap neutro (sem passo fixo 0,3).

create or replace function public.championship_rating_projected_next(
	rating numeric,
	rate numeric,
	matches integer,
	ceiling numeric
)
returns numeric
language plpgsql
immutable
set search_path = public
as $$
declare
	safe_ceiling numeric;
	gap numeric;
	target numeric;
	aligned numeric := 0.08;
	floor_rating numeric := 0.1;
	max_rating numeric := 100;
begin
	if matches is null or matches < 3 then
		return null;
	end if;

	safe_ceiling := greatest(coalesce(ceiling, 5), floor_rating);
	gap := coalesce(rate, 0) - coalesce(rating, 0) / safe_ceiling;
	target := round((coalesce(rate, 0) * safe_ceiling)::numeric, 1);
	target := least(max_rating, greatest(floor_rating, target));

	if abs(gap) <= aligned then
		return round(coalesce(rating, 0)::numeric, 1);
	end if;

	return target;
end;
$$;

revoke all on function public.championship_rating_projected_next(
	numeric,
	numeric,
	integer,
	numeric
) from public;

comment on column public.championship_event_attendance.rating_projected is
	'Projeção Gap neutro (forma × teto) congelada na presença; salto dinâmico, não passo 0,3.';

-- Overwrite de todas as presenças (corrige valores antigos −0,3).
update public.championship_event_attendance a
set rating_projected = public.championship_attendance_rating_projected_fill(
	a.event_id,
	a.player_id,
	case
		when a.is_goalkeeper then a.goalkeeper_rating
		else a.rating
	end,
	a.is_goalkeeper
);

-- Próxima no elenco recalcula no ensure do perfil.
update public.championship_players
set rating_projected_next = null
where rating_projected_next is not null;
