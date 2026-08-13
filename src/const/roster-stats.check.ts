import {
	formatRosterAverage,
	formatRosterCount,
	formatRosterWinRate,
	ROSTER_COLUMN,
	ROSTER_COLUMN_ABBR,
	ROSTER_COLUMN_LABEL,
	rosterAverage,
	rosterGoalInvolvement,
	rosterWinRate,
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

console.log("roster-stats ok");
