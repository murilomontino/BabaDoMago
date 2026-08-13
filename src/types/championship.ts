export type Championship = {
	id: number;
	name: string;
	invite_code: string;
	created_by: string;
	logo_path: string | null;
	event_time: string;
	players_per_team: number;
};

export type ChampionshipPlayer = {
	id: number;
	championship_id: number;
	user_id: string | null;
	display_name: string;
	nickname: string | null;
	avatar_url: string | null;
	rating: number;
	role: string;
	deleted_at: string | null;
	goals: number;
	assists: number;
	wins: number;
	matches: number;
};

export type ChampionshipWithPlayers = Championship & {
	players: ChampionshipPlayer[];
};
