import type { EventTeamColor } from "@/const/event-team-color";

export type ChampionshipEventAttendance = {
	id: number;
	event_id: number;
	player_id: number;
	display_name: string;
	is_goalkeeper: boolean;
	event_date: string;
	goals: number;
	assists: number;
	assisted_goals: number;
	own_goals: number;
	wins: number;
	losses: number;
	draws: number;
	matches: number;
	rating: number;
	rating_delta: number;
	is_mvp: boolean;
	mvp_overridden: boolean;
};

export type ChampionshipEventRsvp = {
	id: number;
	event_id: number;
	player_id: number;
	status: string;
	updated_at: string;
};

export type ChampionshipEventTeamPlayer = {
	id: number;
	event_id: number;
	team_id: number;
	player_id: number;
	display_name: string;
	is_goalkeeper: boolean;
};

export type ChampionshipEventTeam = {
	id: number;
	event_id: number;
	color: EventTeamColor | null;
	sort_order: number;
	players: ChampionshipEventTeamPlayer[];
};

export type ChampionshipEventMatchPlayer = {
	id: number;
	match_id: number;
	event_id: number;
	team_id: number;
	player_id: number;
	display_name: string;
	is_goalkeeper: boolean;
	slot: number | null;
	is_substituted: boolean;
	include_stats: boolean;
};

export type ChampionshipEventGoal = {
	id: number;
	match_id: number;
	event_id: number;
	scorer_player_id: number;
	assist_player_id: number | null;
	is_own_goal: boolean;
	created_at: string;
};

export type ChampionshipEventMatch = {
	id: number;
	event_id: number;
	team_a_id: number;
	team_b_id: number;
	created_at: string;
	ended_at: string | null;
	winner_team_id: number | null;
	duration_seconds: number;
	started_at: string | null;
	paused_at: string | null;
	pause_accumulated_seconds: number;
	players: ChampionshipEventMatchPlayer[];
	goals: ChampionshipEventGoal[];
};

export type ChampionshipEvent = {
	id: number;
	championship_id: number;
	starts_at: string;
	players_per_team: number;
	skip_guest_goalkeeper_matches: boolean;
	ended_at: string | null;
	attendance: ChampionshipEventAttendance[];
	rsvps: ChampionshipEventRsvp[];
	teams: ChampionshipEventTeam[];
	matches: ChampionshipEventMatch[];
};
