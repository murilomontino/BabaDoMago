-- Recalcula rating_delta / goalkeeper_rating_delta e notas do elenco
-- a partir do snapshot da presença + aproveitamento
-- ((3*V + drawPts*E) / (3*J)) + MVP 2% ceil 1 casa (mínimo +0,1).
-- drawPts = 1.5 se E > D, senao 1.
-- Track vigente: attendance.is_goalkeeper → goalkeeper_*; senão → rating_*.
-- Se championships.rating_drop_goal_share, amortece queda pela
-- participacao G+A no time do elenco (depois do MVP).
-- Se rating_drop_share_exclude_top, top 10 do track nao amortecem.
-- vote_rating_delta e overlay separado: nao recalcula a urna;
-- so re-sincroniza applied quando a nota deixa a sentinela.
--
-- Nao rode o arquivo inteiro.
-- 1. Execute so o SELECT de preview e confira.
-- 2. Execute so o bloco BEGIN ... COMMIT.
-- Um evento: descomente `and e.id = 123` nos dois blocos.

-- Preview
with event_ceilings as (
	select
		e.id as event_id,
		e.championship_id,
		least(
			100,
			greatest(
				coalesce(
					max(a.rating) filter (where a.is_goalkeeper = false),
					0
				),
				5
			)
		) as line_ceiling,
		least(
			100,
			greatest(
				coalesce(
					max(a.goalkeeper_rating) filter (where a.is_goalkeeper = true),
					0
				),
				5
			)
		) as gk_ceiling
	from public.championship_events e
	join public.championship_event_attendance a
		on a.event_id = e.id
	where e.deleted_at is null
		and e.ended_at is not null
		-- and e.id = 123
	group by e.id, e.championship_id
),
team_involvement as (
	select
		tp.event_id,
		tp.team_id,
		coalesce(sum(a.goals + a.assists), 0)::numeric as involvement
	from public.championship_event_team_players tp
	join public.championship_event_attendance a
		on a.event_id = tp.event_id
		and a.player_id = tp.player_id
	group by tp.event_id, tp.team_id
),
excluded_top_line as (
	select
		p.championship_id,
		p.id as player_id
	from (
		select
			p.id,
			p.championship_id,
			row_number() over (
				partition by p.championship_id
				order by p.rating desc, p.id asc
			) as rank
		from public.championship_players p
		where p.deleted_at is null
			and p.removed_at is null
			and p.rating > 0
	) p
	where p.rank <= 10
),
excluded_top_gk as (
	select
		p.championship_id,
		p.id as player_id
	from (
		select
			p.id,
			p.championship_id,
			row_number() over (
				partition by p.championship_id
				order by p.goalkeeper_rating desc, p.id asc
			) as rank
		from public.championship_players p
		where p.deleted_at is null
			and p.removed_at is null
			and p.goalkeeper_rating > 0
	) p
	where p.rank <= 10
),
recomputed as (
	select
		e.championship_id,
		e.id as event_id,
		e.starts_at,
		a.player_id,
		a.display_name,
		a.is_goalkeeper,
		case
			when a.is_goalkeeper then a.goalkeeper_rating
			else a.rating
		end as rating_from,
		a.wins,
		a.draws,
		a.losses,
		a.matches,
		a.is_mvp,
		a.vote_rating_delta,
		case
			when a.is_goalkeeper then a.goalkeeper_vote_rating_applied
			else a.vote_rating_applied
		end as vote_rating_applied,
		case
			when a.is_goalkeeper then c.gk_ceiling
			else c.line_ceiling
		end as ceiling,
		case
			when a.is_goalkeeper then a.goalkeeper_rating_delta
			else a.rating_delta
		end as old_delta,
		public.championship_event_rating_apply_drop_share(
			public.championship_event_rating_delta(
				a.wins,
				a.draws,
				a.losses,
				a.matches,
				case
					when a.is_goalkeeper then a.goalkeeper_rating
					else a.rating
				end,
				case
					when a.is_goalkeeper then c.gk_ceiling
					else c.line_ceiling
				end
			) + case
				when a.is_mvp then public.championship_event_mvp_bonus(
					case
						when a.is_goalkeeper then a.goalkeeper_rating
						else a.rating
					end
				)
				else 0
			end,
			case
				when ch.rating_drop_goal_share
					and not (
						ch.rating_drop_share_exclude_top
						and (
							(
								a.is_goalkeeper = false
								and xt_line.player_id is not null
							)
							or (
								a.is_goalkeeper = true
								and xt_gk.player_id is not null
							)
						)
					)
				then public.championship_event_rating_team_goal_share(
					(a.goals + a.assists)::numeric,
					coalesce(ti.involvement, 0)
				)
				else 0
			end
		) as new_delta
	from public.championship_event_attendance a
	join public.championship_events e
		on e.id = a.event_id
	join event_ceilings c
		on c.event_id = a.event_id
	join public.championships ch
		on ch.id = e.championship_id
	left join public.championship_event_team_players tp
		on tp.event_id = a.event_id
		and tp.player_id = a.player_id
	left join team_involvement ti
		on ti.event_id = a.event_id
		and ti.team_id = tp.team_id
	left join excluded_top_line xt_line
		on xt_line.championship_id = e.championship_id
		and xt_line.player_id = a.player_id
	left join excluded_top_gk xt_gk
		on xt_gk.championship_id = e.championship_id
		and xt_gk.player_id = a.player_id
)
select
	r.championship_id,
	r.event_id,
	r.starts_at,
	r.player_id,
	r.display_name,
	r.is_goalkeeper,
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
	case
		when r.is_goalkeeper then p.goalkeeper_rating
		else p.rating
	end as player_rating_now
from recomputed r
join public.championship_players p
	on p.id = r.player_id
where r.new_delta is distinct from r.old_delta
	or r.vote_rating_delta is distinct from r.vote_rating_applied
order by r.starts_at, r.event_id, r.player_id;

-- Aplicar
begin;

create temporary table recomputed_event_rating on commit drop as
with event_ceilings as (
	select
		e.id as event_id,
		least(
			100,
			greatest(
				coalesce(
					max(a.rating) filter (where a.is_goalkeeper = false),
					0
				),
				5
			)
		) as line_ceiling,
		least(
			100,
			greatest(
				coalesce(
					max(a.goalkeeper_rating) filter (where a.is_goalkeeper = true),
					0
				),
				5
			)
		) as gk_ceiling
	from public.championship_events e
	join public.championship_event_attendance a
		on a.event_id = e.id
	where e.deleted_at is null
		and e.ended_at is not null
		-- and e.id = 123
	group by e.id
),
team_involvement as (
	select
		tp.event_id,
		tp.team_id,
		coalesce(sum(a.goals + a.assists), 0)::numeric as involvement
	from public.championship_event_team_players tp
	join public.championship_event_attendance a
		on a.event_id = tp.event_id
		and a.player_id = tp.player_id
	group by tp.event_id, tp.team_id
),
excluded_top_line as (
	select
		p.championship_id,
		p.id as player_id
	from (
		select
			p.id,
			p.championship_id,
			row_number() over (
				partition by p.championship_id
				order by p.rating desc, p.id asc
			) as rank
		from public.championship_players p
		where p.deleted_at is null
			and p.removed_at is null
			and p.rating > 0
	) p
	where p.rank <= 10
),
excluded_top_gk as (
	select
		p.championship_id,
		p.id as player_id
	from (
		select
			p.id,
			p.championship_id,
			row_number() over (
				partition by p.championship_id
				order by p.goalkeeper_rating desc, p.id asc
			) as rank
		from public.championship_players p
		where p.deleted_at is null
			and p.removed_at is null
			and p.goalkeeper_rating > 0
	) p
	where p.rank <= 10
)
select
	a.id as attendance_id,
	a.player_id,
	a.is_goalkeeper,
	case
		when a.is_goalkeeper then a.goalkeeper_rating_delta
		else a.rating_delta
	end as old_delta,
	a.vote_rating_delta,
	case
		when a.is_goalkeeper then a.goalkeeper_vote_rating_applied
		else a.vote_rating_applied
	end as vote_rating_applied,
	public.championship_event_rating_apply_drop_share(
		public.championship_event_rating_delta(
			a.wins,
			a.draws,
			a.losses,
			a.matches,
			case
				when a.is_goalkeeper then a.goalkeeper_rating
				else a.rating
			end,
			case
				when a.is_goalkeeper then c.gk_ceiling
				else c.line_ceiling
			end
		) + case
			when a.is_mvp then public.championship_event_mvp_bonus(
				case
					when a.is_goalkeeper then a.goalkeeper_rating
					else a.rating
				end
			)
			else 0
		end,
		case
			when ch.rating_drop_goal_share
				and not (
					ch.rating_drop_share_exclude_top
					and (
						(
							a.is_goalkeeper = false
							and xt_line.player_id is not null
						)
						or (
							a.is_goalkeeper = true
							and xt_gk.player_id is not null
						)
					)
				)
			then public.championship_event_rating_team_goal_share(
				(a.goals + a.assists)::numeric,
				coalesce(ti.involvement, 0)
			)
			else 0
		end
	) as new_delta
from public.championship_event_attendance a
join event_ceilings c
	on c.event_id = a.event_id
join public.championship_events e
	on e.id = a.event_id
join public.championships ch
	on ch.id = e.championship_id
left join public.championship_event_team_players tp
	on tp.event_id = a.event_id
	and tp.player_id = a.player_id
left join team_involvement ti
	on ti.event_id = a.event_id
	and ti.team_id = tp.team_id
left join excluded_top_line xt_line
	on xt_line.championship_id = e.championship_id
	and xt_line.player_id = a.player_id
left join excluded_top_gk xt_gk
	on xt_gk.championship_id = e.championship_id
	and xt_gk.player_id = a.player_id;

update public.championship_players p
set rating = public.championship_player_rating_apply(p.rating, f.rating_fix)
from (
	select
		player_id,
		round(sum(new_delta - old_delta), 1) as rating_fix
	from recomputed_event_rating
	where is_goalkeeper = false
	group by player_id
	having round(sum(new_delta - old_delta), 1) <> 0
) f
where p.id = f.player_id
	and p.deleted_at is null;

update public.championship_players p
set goalkeeper_rating = public.championship_player_rating_apply(
	p.goalkeeper_rating,
	f.rating_fix
)
from (
	select
		player_id,
		round(sum(new_delta - old_delta), 1) as rating_fix
	from recomputed_event_rating
	where is_goalkeeper = true
	group by player_id
	having round(sum(new_delta - old_delta), 1) <> 0
) f
where p.id = f.player_id
	and p.deleted_at is null;

update public.championship_event_attendance a
set rating_delta = r.new_delta
from recomputed_event_rating r
where a.id = r.attendance_id
	and r.is_goalkeeper = false
	and a.rating_delta is distinct from r.new_delta;

update public.championship_event_attendance a
set goalkeeper_rating_delta = r.new_delta
from recomputed_event_rating r
where a.id = r.attendance_id
	and r.is_goalkeeper = true
	and a.goalkeeper_rating_delta is distinct from r.new_delta;

select public.sync_championship_event_attendance_vote_rating(r.attendance_id)
from recomputed_event_rating r
where r.vote_rating_delta is distinct from r.vote_rating_applied;

commit;
