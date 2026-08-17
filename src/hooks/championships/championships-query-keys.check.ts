import type {
	ChampionshipPlayer,
	ChampionshipWithPlayers,
} from "../../types/championship.ts";
import { withChampionshipPlayerGoalkeeper } from "./championships-query-keys.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

const player = {
	id: 10,
	is_goalkeeper: false,
} as ChampionshipPlayer;

const championship = {
	players: [player, { ...player, id: 11, is_goalkeeper: true }],
} as ChampionshipWithPlayers;

const next = withChampionshipPlayerGoalkeeper(championship, 10, true);

check(next.players[0]?.is_goalkeeper === true, "patches target");
check(next.players[1]?.is_goalkeeper === true, "leaves other");
check(championship.players[0]?.is_goalkeeper === false, "does not mutate");

console.log("championships-query-keys ok");
