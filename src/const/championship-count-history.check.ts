import { championshipCountHistoryChart } from "./championship-count-history.ts";
import { ROSTER_COLUMN } from "./roster-stats.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

function attendance(
	playerId: number,
	goals: number,
	assists: number,
	matches: number,
	wins: number,
	isMvp: boolean,
): {
	player_id: number;
	goals: number;
	assists: number;
	assisted_goals: number;
	own_goals: number;
	wins: number;
	losses: number;
	draws: number;
	matches: number;
	rating: number;
	rating_delta: number;
	is_mvp: boolean;
} {
	return {
		player_id: playerId,
		goals,
		assists,
		assisted_goals: 1,
		own_goals: 0,
		wins,
		losses: 0,
		draws: 0,
		matches,
		rating: 3,
		rating_delta: 0,
		is_mvp: isMvp,
	};
}

function player(id: number): {
	id: number;
	display_name: string;
	nickname: string | null;
	avatar_url: string | null;
	rating: number;
} {
	return {
		id,
		display_name: `Player ${id}`,
		nickname: null,
		avatar_url: null,
		rating: 3,
	};
}

const first = {
	id: 1,
	championship_id: 9,
	starts_at: "2026-08-01T22:00:00.000Z",
	ended_at: "2026-08-01T23:00:00.000Z",
	attendance: [
		attendance(7, 2, 1, 3, 1, true),
		attendance(8, 0, 0, 3, 0, false),
	],
};

const second = {
	id: 2,
	championship_id: 9,
	starts_at: "2026-08-08T22:00:00.000Z",
	ended_at: "2026-08-08T23:00:00.000Z",
	attendance: [attendance(7, 3, 0, 3, 2, false)],
};

const openEvent = {
	id: 3,
	championship_id: 9,
	starts_at: "2026-08-14T22:00:00.000Z",
	ended_at: null,
	attendance: [attendance(7, 9, 9, 3, 3, true)],
};

check(
	championshipCountHistoryChart([player(7)], [openEvent], ROSTER_COLUMN.goals)
		.rows.length === 0,
	"open only empty",
);

const goals = championshipCountHistoryChart(
	[player(7), player(8), player(9)],
	[openEvent, first, second],
	ROSTER_COLUMN.goals,
);

check(goals.rows.length === 2, "ended rounds only");
check(goals.series.length === 2, "skip player without presence");
check(goals.rows[0]?.p7 === 2, "player 7 first goals");
check(goals.rows[0]?.p8 === 0, "zero goals still plots");
check(goals.rows[1]?.p7 === 5, "player 7 cumulative");
check(goals.rows[1]?.p8 === 0, "player 8 carry when absent");

const involvement = championshipCountHistoryChart(
	[player(7)],
	[first, second],
	ROSTER_COLUMN.goalInvolvement,
);
check(involvement.rows[0]?.p7 === 3, "pg first round goals plus assists");
check(involvement.rows[1]?.p7 === 6, "pg cumulative per round");

const mvps = championshipCountHistoryChart(
	[player(7)],
	[first, second],
	ROSTER_COLUMN.mvps,
);
check(mvps.rows[0]?.p7 === 1, "mvp count first");
check(mvps.rows[1]?.p7 === 1, "mvp carry when not highlighted");

const matches = championshipCountHistoryChart(
	[player(7)],
	[first, second],
	ROSTER_COLUMN.matches,
);
check(matches.rows[1]?.p7 === 6, "matches total in window");

const assists = championshipCountHistoryChart(
	[player(7)],
	[first, second],
	ROSTER_COLUMN.assists,
);
check(assists.rows[0]?.p7 === 1, "assists first");
check(assists.rows[1]?.p7 === 1, "assists carry");

const served = championshipCountHistoryChart(
	[player(7)],
	[first, second],
	ROSTER_COLUMN.assisted_goals,
);
check(served.rows[0]?.p7 === 1, "assisted goals first");
check(served.rows[1]?.p7 === 2, "assisted goals cumulative");

const ownGoals = championshipCountHistoryChart(
	[player(7)],
	[first, second],
	ROSTER_COLUMN.own_goals,
);
check(ownGoals.rows[0]?.p7 === 0, "own goals zero plots");
check(ownGoals.rows[1]?.p7 === 0, "own goals carry");

const wins = championshipCountHistoryChart(
	[player(7)],
	[first, second],
	ROSTER_COLUMN.wins,
);
check(wins.rows[0]?.p7 === 1, "wins first");
check(wins.rows[1]?.p7 === 3, "wins cumulative");

console.log("championship-count-history ok");
