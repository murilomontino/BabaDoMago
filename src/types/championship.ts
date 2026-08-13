export type Championship = {
	id: number;
	name: string;
	invite_code: string;
	created_by: string;
};

export type ChampionshipPlayer = {
	id: number;
	championship_id: number;
	user_id: string | null;
	display_name: string;
	avatar_url: string | null;
	rating: number;
};

export type ChampionshipWithPlayers = Championship & {
	players: ChampionshipPlayer[];
};
