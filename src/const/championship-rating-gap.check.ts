import type { ChampionshipPlayer } from "../types/championship.ts";
import {
	championshipRatingGap,
	RATING_GAP_KIND,
} from "./championship-rating-gap.ts";
import { CHAMPIONSHIP_ROLE } from "./championship-role.ts";
import { PLAYER_RATING } from "./player-rating.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

function player(
	id: number,
	name: string,
	rating: number,
	hidden?: number,
): ChampionshipPlayer {
	return {
		id,
		championship_id: 1,
		user_id: null,
		display_name: name,
		nickname: null,
		nickname_tags: [],
		avatar_url: null,
		rating,
		goalkeeper_rating: 0,
		hidden_strength: hidden,
		role: CHAMPIONSHIP_ROLE.member,
		is_goalkeeper: false,
		is_monthly: false,
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

const rows = championshipRatingGap([
	player(1, "Ana", 7.3, 100),
	player(2, "Bruno", 3, 80),
	player(3, "Caio", 3, 0),
	player(4, "Duda", 0, 40),
]);

check(rows.length === 2, "only with both public and hidden");
check(rows[0]?.player.id === 2, "biggest gap first");
check(rows[0]?.kind === RATING_GAP_KIND.underrated, "bruno underrated");
check(
	championshipRatingGap([player(5, "Eva", 5)]).length === 0,
	"missing hidden skipped",
);
check(PLAYER_RATING.default === 0, "sentinel 0");

console.log("championship-rating-gap.check.ts ok");
