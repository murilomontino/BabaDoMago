import type { ChampionshipPlayer } from "../types/championship.ts";
import {
	formatRosterAverage,
	formatRosterCount,
	formatRosterStat,
	formatRosterWinRate,
	isRosterOptionalColumn,
	ROSTER_COLUMN,
	ROSTER_COLUMN_ABBR,
	ROSTER_COLUMN_LABEL,
	ROSTER_DEFAULT_COLUMN_VISIBILITY,
	ROSTER_OPTIONAL_COLUMNS,
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
check(formatRosterStat(ROSTER_COLUMN.goals, 4) === "4", "stat goals");
check(formatRosterStat(ROSTER_COLUMN.assists, 2) === "2", "stat assists");
check(
	formatRosterStat(ROSTER_COLUMN.assisted_goals, 3) === "3",
	"stat assisted goals",
);
check(formatRosterStat(ROSTER_COLUMN.own_goals, 1) === "1", "stat own goals");
check(
	formatRosterStat(ROSTER_COLUMN.goalInvolvement, 6) === "6",
	"stat involvement",
);
check(formatRosterStat(ROSTER_COLUMN.wins, 3) === "3", "stat wins");
check(formatRosterStat(ROSTER_COLUMN.losses, 2) === "2", "stat losses");
check(formatRosterStat(ROSTER_COLUMN.draws, 1) === "1", "stat draws");
check(formatRosterStat(ROSTER_COLUMN.mvps, 2) === "2", "stat mvps");
check(formatRosterStat(ROSTER_COLUMN.matches, 6) === "6", "stat matches");
check(
	formatRosterStat(ROSTER_COLUMN.goalsAverage, 0.5) === "0.5",
	"stat goals average",
);
check(
	formatRosterStat(ROSTER_COLUMN.assistsAverage, 1) === "1.0",
	"stat assists average",
);
check(formatRosterStat(ROSTER_COLUMN.winRate, 0.5) === "50%", "stat win rate");
check(
	Object.keys(ROSTER_COLUMN).every((id) => id in ROSTER_COLUMN_ABBR),
	"every column has abbr",
);
check(
	Object.keys(ROSTER_COLUMN).every((id) => id in ROSTER_COLUMN_LABEL),
	"every column has label",
);
check(ROSTER_COLUMN_ABBR.assisted_goals === "GS", "assisted goals abbr");
check(
	ROSTER_COLUMN_LABEL.assisted_goals === "Gols servidos",
	"assisted goals label",
);
check(ROSTER_COLUMN_ABBR.own_goals === "GC", "own goals abbr");
check(ROSTER_COLUMN_LABEL.own_goals === "Gols contra", "own goals label");
check(ROSTER_COLUMN_ABBR.losses === "D", "losses abbr");
check(ROSTER_COLUMN_LABEL.losses === "Derrotas", "losses label");
check(ROSTER_COLUMN_ABBR.draws === "E", "draws abbr");
check(ROSTER_COLUMN_LABEL.draws === "Empates", "draws label");
check(
	ROSTER_OPTIONAL_COLUMNS.join(",") === "assisted_goals,losses,draws",
	"optional columns",
);
check(
	ROSTER_DEFAULT_COLUMN_VISIBILITY.assisted_goals === false,
	"assisted goals hidden by default",
);
check(
	ROSTER_DEFAULT_COLUMN_VISIBILITY.losses === false,
	"losses hidden by default",
);
check(
	ROSTER_DEFAULT_COLUMN_VISIBILITY.draws === false,
	"draws hidden by default",
);
check(
	isRosterOptionalColumn(ROSTER_COLUMN.assisted_goals),
	"assisted goals is optional",
);
check(isRosterOptionalColumn(ROSTER_COLUMN.losses), "losses is optional");
check(isRosterOptionalColumn(ROSTER_COLUMN.draws), "draws is optional");
check(!isRosterOptionalColumn(ROSTER_COLUMN.wins), "wins is not optional");
check(ROSTER_COLUMN_ABBR.goals === "G", "goals abbr");
check(ROSTER_COLUMN_LABEL.goals === "Gols", "goals label");
check(ROSTER_COLUMN_ABBR.rating === "Rat", "rating abbr");
check(ROSTER_COLUMN_LABEL.rating === "Rating", "rating label");
check(ROSTER_COLUMN_ABBR.actions === "Ações", "actions abbr");
check(ROSTER_COLUMN_LABEL.actions === "Ações", "actions label");
check(ROSTER_COLUMN_ABBR.mvps === "MVP", "mvps abbr");
check(ROSTER_COLUMN_LABEL.mvps === "Destaque da rodada", "mvps label");

const player: ChampionshipPlayer = {
	id: 1,
	championship_id: 1,
	user_id: null,
	display_name: "Ana",
	nickname: null,
	nickname_tags: [],
	avatar_url: null,
	rating: 5,
	role: "member",
	is_goalkeeper: false,
	deleted_at: null,
	goals: 4,
	assists: 2,
	assisted_goals: 3,
	own_goals: 1,
	wins: 3,
	losses: 2,
	draws: 1,
	matches: 6,
	mvps: 0,
};
const row = toRosterRow(player);
check(row.goals === 4, "row keeps goals");
check(row.assists === 2, "row keeps assists");
check(row.assisted_goals === 3, "row keeps assisted goals");
check(row.own_goals === 1, "row keeps own goals");
check(row.wins === 3, "row keeps wins");
check(row.losses === 2, "row keeps losses");
check(row.draws === 1, "row keeps draws");
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
	losses: Number.NaN,
	draws: Number.NaN,
	matches: Number.NaN,
});
check(broken.goals === 0, "broken goals");
check(broken.goalInvolvement === 0, "broken involvement");
check(broken.winRate === 0, "broken win rate");

console.log("roster-stats ok");
