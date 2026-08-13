import type { ChampionshipPlayer } from "../types/championship.ts";
import {
	formatRosterAverage,
	formatRosterCount,
	formatRosterWinRate,
	ROSTER_COLUMN,
	ROSTER_COLUMN_ABBR,
	ROSTER_COLUMN_LABEL,
	rosterAverage,
	rosterGoalInvolvement,
	rosterSafeCount,
	rosterWinRate,
	toRosterRow,
} from "./roster-stats.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

check(rosterGoalInvolvement(1, 2) === 3, "involvement sums");
check(rosterGoalInvolvement(0, 0) === 0, "involvement zero");
check(rosterAverage(4, 2) === 2, "average divides");
check(rosterAverage(1, 0) === 0, "average without matches");
check(rosterWinRate(1, 2) === 0.5, "win rate half");
check(rosterWinRate(1, 0) === 0, "win rate without matches");
check(formatRosterCount(0) === "0", "count format");
check(formatRosterAverage(0) === "0.0", "average format");
check(formatRosterWinRate(0) === "0%", "win rate zero format");
check(formatRosterWinRate(0.5) === "50%", "win rate percent");
check(
	Object.keys(ROSTER_COLUMN).every((id) => id in ROSTER_COLUMN_ABBR),
	"every column has abbr",
);
check(
	Object.keys(ROSTER_COLUMN).every((id) => id in ROSTER_COLUMN_LABEL),
	"every column has label",
);
check(ROSTER_COLUMN_ABBR.goals === "G", "goals abbr");
check(ROSTER_COLUMN_LABEL.goals === "Gols", "goals label");
check(ROSTER_COLUMN_ABBR.actions === "Ações", "actions abbr");
check(ROSTER_COLUMN_LABEL.actions === "Ações", "actions label");

const player: ChampionshipPlayer = {
	id: 1,
	championship_id: 1,
	user_id: null,
	display_name: "Ana",
	avatar_url: null,
	rating: 5,
	role: "member",
	deleted_at: null,
	goals: 4,
	assists: 2,
	wins: 3,
	matches: 6,
};
const row = toRosterRow(player);
check(row.goals === 4, "row keeps goals");
check(row.assists === 2, "row keeps assists");
check(row.wins === 3, "row keeps wins");
check(row.matches === 6, "row keeps matches");
check(row.goalInvolvement === 6, "row involvement");
check(row.goalsAverage === 4 / 6, "row goals average");
check(row.assistsAverage === 2 / 6, "row assists average");
check(row.winRate === 0.5, "row win rate");

check(rosterSafeCount(Number.NaN) === 0, "safe count nan");
check(rosterSafeCount(undefined) === 0, "safe count missing");
check(rosterSafeCount(-1) === 0, "safe count negative");
check(rosterGoalInvolvement(Number.NaN, 2) === 2, "involvement nan");
check(rosterAverage(Number.NaN, 2) === 0, "average nan");
check(rosterWinRate(Number.NaN, 2) === 0, "win rate nan");
check(formatRosterCount(Number.NaN) === "0", "count nan format");
check(formatRosterAverage(Number.NaN) === "0.0", "average nan format");
check(formatRosterWinRate(Number.NaN) === "0%", "win rate nan format");

const broken = toRosterRow({
	...player,
	goals: Number.NaN,
	assists: Number.NaN,
	wins: Number.NaN,
	matches: Number.NaN,
});
check(broken.goals === 0, "broken goals");
check(broken.goalInvolvement === 0, "broken involvement");
check(broken.winRate === 0, "broken win rate");

console.log("roster-stats ok");
