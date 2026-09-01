import { championshipRatioHistoryChart } from "./championship-ratio-history.ts";
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
	wins: number,
	matches: number,
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
} {
	return {
		player_id: playerId,
		goals,
		assists,
		assisted_goals: 0,
		own_goals: 0,
		wins,
		losses: 0,
		draws: 0,
		matches,
		rating: 3,
		rating_delta: 0,
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
	attendance: [attendance(7, 2, 1, 1, 2), attendance(8, 0, 0, 0, 2)],
};

const second = {
	id: 2,
	championship_id: 9,
	starts_at: "2026-08-08T22:00:00.000Z",
	ended_at: "2026-08-08T23:00:00.000Z",
	attendance: [attendance(7, 2, 3, 2, 2)],
};

const goalsAverage = championshipRatioHistoryChart(
	[player(7), player(8)],
	[first, second],
	ROSTER_COLUMN.goalsAverage,
);

check(goalsAverage.rows.length === 2, "ended rounds");
check(goalsAverage.rows[0]?.p7 === 1, "2 goals / 2 matches");
check(goalsAverage.rows[1]?.p7 === 1, "4 goals / 4 matches");
check(goalsAverage.rows[0]?.p8 === 0, "zero average plots");
check(goalsAverage.rows[1]?.p8 === 0, "absent keeps average");

const assistsAverage = championshipRatioHistoryChart(
	[player(7)],
	[first, second],
	ROSTER_COLUMN.assistsAverage,
);
check(assistsAverage.rows[0]?.p7 === 0.5, "1 assist / 2 matches");
check(assistsAverage.rows[1]?.p7 === 1, "4 assists / 4 matches");

const winRate = championshipRatioHistoryChart(
	[player(7)],
	[first, second],
	ROSTER_COLUMN.winRate,
);
check(winRate.rows[0]?.p7 === 0.5, "1 win / 2 matches");
check(winRate.rows[1]?.p7 === 0.75, "3 wins / 4 matches");

const zeroMatches = championshipRatioHistoryChart(
	[player(7)],
	[
		{
			id: 9,
			championship_id: 9,
			starts_at: "2026-07-01T22:00:00.000Z",
			ended_at: "2026-07-01T23:00:00.000Z",
			attendance: [attendance(7, 1, 0, 0, 0)],
		},
	],
	ROSTER_COLUMN.goalsAverage,
);
check(zeroMatches.rows[0]?.p7 === null, "null while matches are 0");

console.log("championship-ratio-history ok");
