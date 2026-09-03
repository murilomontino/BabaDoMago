export type Championship = {
	id: number;
	name: string;
	invite_code: string;
	created_by: string;
	logo_path: string | null;
	event_time: string;
	event_weekday: number | null;
	location: string | null;
	players_per_team: number;
	skip_guest_goalkeeper_matches: boolean;
	rating_drop_goal_share: boolean;
	rating_drop_share_exclude_top: boolean;
	player_vote_quorum: number;
	is_visible: boolean;
};

export type ChampionshipPlayer = {
	id: number;
	championship_id: number;
	user_id: string | null;
	display_name: string;
	nickname: string | null;
	nickname_tags: string[];
	avatar_url: string | null;
	rating: number;
	role: string;
	is_goalkeeper: boolean;
	deleted_at: string | null;
	goals: number;
	assists: number;
	assisted_goals: number;
	own_goals: number;
	wins: number;
	losses: number;
	draws: number;
	matches: number;
	mvps: number;
};

export type ChampionshipWithPlayers = Championship & {
	players: ChampionshipPlayer[];
};
