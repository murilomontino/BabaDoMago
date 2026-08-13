import type { EventTeamColor } from "@/const/event-team-color";

export type ChampionshipEventAttendance = {
	id: number;
	event_id: number;
	player_id: number;
	display_name: string;
};

export type ChampionshipEventTeamPlayer = {
	id: number;
	event_id: number;
	team_id: number;
	player_id: number;
	display_name: string;
};

export type ChampionshipEventTeam = {
	id: number;
	event_id: number;
	color: EventTeamColor;
	sort_order: number;
	players: ChampionshipEventTeamPlayer[];
};

export type ChampionshipEventMatch = {
	id: number;
	event_id: number;
	team_a_id: number;
	team_b_id: number;
	created_at: string;
};

export type ChampionshipEvent = {
	id: number;
	championship_id: number;
	starts_at: string;
	players_per_team: number;
	ended_at: string | null;
	attendance: ChampionshipEventAttendance[];
	teams: ChampionshipEventTeam[];
	matches: ChampionshipEventMatch[];
};
