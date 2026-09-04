import type { ChampionshipPlayer } from "../types/championship.ts";
import {
	monthlyEligiblePlayers,
	monthlyRemoveHint,
	monthlyRosterPlayers,
	PLAYER_MONTHLY_LABEL,
} from "./player-monthly.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

function stubPlayer(id: number, isMonthly: boolean): ChampionshipPlayer {
	return {
		id,
		championship_id: 1,
		user_id: null,
		display_name: `P${id}`,
		nickname: null,
		nickname_tags: [],
		avatar_url: null,
		rating: 3,
		goalkeeper_rating: 0,
		role: "member",
		is_goalkeeper: false,
		is_monthly: isMonthly,
		deleted_at: null,
		goals: 0,
		assists: 0,
		assisted_goals: 0,
		own_goals: 0,
		wins: 0,
		losses: 0,
		draws: 0,
		matches: 0,
		mvps: 0,
	};
}

const players = [stubPlayer(1, true), stubPlayer(2, false), stubPlayer(3, true)];

check(PLAYER_MONTHLY_LABEL.title === "Mensalistas", "title label");
check(
	monthlyRosterPlayers(players)
		.map((player) => player.id)
		.join(",") === "1,3",
	"monthly filter",
);
check(
	monthlyEligiblePlayers(players)
		.map((player) => player.id)
		.join(",") === "2",
	"eligible filter",
);
check(monthlyRosterPlayers([]).length === 0, "empty monthly");
check(monthlyEligiblePlayers([]).length === 0, "empty eligible");
check(
	monthlyRemoveHint("Vitinho") === "Remover Vitinho dos mensalistas?",
	"remove hint",
);

console.log("player-monthly ok");
