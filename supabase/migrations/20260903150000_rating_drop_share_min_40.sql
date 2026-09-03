create or replace function public.championship_event_rating_team_goal_share(
	player_involvement numeric,
	team_involvement numeric
)
returns numeric
language sql
immutable
set search_path = public
as $$
	select case
		when team_involvement <= 0 or player_involvement <= 0 then 0
		when player_involvement / team_involvement <= 0.4 then 0
		else least(1, greatest(0, player_involvement / team_involvement))
	end;
$$;

revoke all on function public.championship_event_rating_team_goal_share(numeric, numeric) from public;
