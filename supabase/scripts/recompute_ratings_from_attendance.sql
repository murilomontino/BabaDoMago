-- Recalcula rating_delta e championship_players.rating
-- a partir da nota da presença (antes do evento) + aproveitamento
-- ((3*V + drawPts*E) / (3*J)) + MVP 2% ceil 1 casa (mínimo +0,1).
-- drawPts = 1.5 se E > D, senao 1.
-- vote_rating_delta e overlay separado: nao recalcula a urna;
-- so re-sincroniza vote_rating_applied quando a nota deixa a sentinela.
--
-- Nao rode o arquivo inteiro.
-- 1. Execute so o SELECT de preview e confira.
-- 2. Execute so o bloco BEGIN ... COMMIT.
-- Um evento: descomente `and e.id = 123` nos dois blocos.

-- Preview
with event_ceiling as (
	select
		e.id as event_id,
		least(100, greatest(coalesce(max(a.rating), 0), 5)) as ceiling
	from public.championship_events e
	join public.championship_event_attendance a
		on a.event_id = e.id
	where e.deleted_at is null
		and e.ended_at is not null
		-- and e.id = 123
	group by e.id
),
recomputed as (
	select
		e.championship_id,
		e.id as event_id,
		e.starts_at,
		a.player_id,
		a.display_name,
		a.rating as rating_from,
		a.wins,
		a.draws,
		a.losses,
		a.matches,
		a.is_mvp,
		a.vote_rating_delta,
		a.vote_rating_applied,
		c.ceiling,
		a.rating_delta as old_delta,
		public.championship_event_rating_delta(
			a.wins,
			a.draws,
			a.losses,
			a.matches,
			a.rating,
			c.ceiling
		) + case
			when a.is_mvp then public.championship_event_mvp_bonus(a.rating)
			else 0
		end as new_delta
	from public.championship_event_attendance a
	join public.championship_events e
		on e.id = a.event_id
	join event_ceiling c
		on c.event_id = a.event_id
)
select
	r.championship_id,
	r.event_id,
	r.starts_at,
	r.player_id,
	r.display_name,
	r.rating_from,
	r.wins,
	r.draws,
	r.losses,
	r.matches,
	r.is_mvp,
	r.vote_rating_delta,
	r.vote_rating_applied,
	r.ceiling,
	r.old_delta,
	r.new_delta,
	r.new_delta - r.old_delta as delta_fix,
	p.rating as player_rating_now
from recomputed r
join public.championship_players p
	on p.id = r.player_id
where r.new_delta is distinct from r.old_delta
	or r.vote_rating_delta is distinct from r.vote_rating_applied
order by r.starts_at, r.event_id, r.player_id;

-- Aplicar
begin;

create temporary table recomputed_event_rating on commit drop as
with event_ceiling as (
	select
		e.id as event_id,
		least(100, greatest(coalesce(max(a.rating), 0), 5)) as ceiling
	from public.championship_events e
	join public.championship_event_attendance a
		on a.event_id = e.id
	where e.deleted_at is null
		and e.ended_at is not null
		-- and e.id = 123
	group by e.id
)
select
	a.id as attendance_id,
	a.player_id,
	a.rating_delta as old_delta,
	a.vote_rating_delta,
	a.vote_rating_applied,
	public.championship_event_rating_delta(
		a.wins,
		a.draws,
		a.losses,
		a.matches,
		a.rating,
		c.ceiling
	) + case
		when a.is_mvp then public.championship_event_mvp_bonus(a.rating)
		else 0
	end as new_delta
from public.championship_event_attendance a
join event_ceiling c
	on c.event_id = a.event_id;

update public.championship_players p
set rating = public.championship_player_rating_apply(p.rating, f.rating_fix)
from (
	select
		player_id,
		round(sum(new_delta - old_delta), 1) as rating_fix
	from recomputed_event_rating
	group by player_id
	having round(sum(new_delta - old_delta), 1) <> 0
) f
where p.id = f.player_id
	and p.deleted_at is null;

update public.championship_event_attendance a
set rating_delta = r.new_delta
from recomputed_event_rating r
where a.id = r.attendance_id
	and a.rating_delta is distinct from r.new_delta;

-- Overlay de voto: aplica pendente sem recalcular a urna.
select public.sync_championship_event_attendance_vote_rating(r.attendance_id)
from recomputed_event_rating r
where r.vote_rating_delta is distinct from r.vote_rating_applied;

commit;
