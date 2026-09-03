import {
	CHAMPIONSHIP_STAT_SCATTER_AXIS,
	CHAMPIONSHIP_STAT_SCATTER_LABEL,
	championshipStatScatterAxisKeys,
	championshipStatScatterDomain,
	championshipStatScatterEmptyLabel,
	championshipStatScatterPoints,
	toggleChampionshipStatScatterAxis,
} from "./championship-stat-scatter.ts";
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
		wins: 1,
		losses: 0,
		draws: 0,
		matches: 1,
		rating: 3,
		rating_delta: 0,
	};
}

function player(id: number): {
	id: number;
	display_name: string;
	nickname: string | null;
	avatar_url: string | null;
} {
	return {
		id,
		display_name: `Player ${id}`,
		nickname: null,
		avatar_url: null,
	};
}

const eventA = {
	id: 1,
	championship_id: 9,
	starts_at: "2026-08-01T22:00:00.000Z",
	ended_at: "2026-08-01T23:00:00.000Z",
	attendance: [attendance(1, 3, 1), attendance(2, 0, 2)],
};

const eventB = {
	id: 2,
	championship_id: 9,
	starts_at: "2026-08-08T22:00:00.000Z",
	ended_at: "2026-08-08T23:00:00.000Z",
	attendance: [attendance(1, 2, 1)],
};

const points = championshipStatScatterPoints(
	[player(1), player(2), player(3)],
	[eventA, eventB],
);
check(points.length === 2, "only attended players");
check(points[0]?.goals === 5, "player 1 goals summed");
check(points[0]?.assists === 2, "player 1 assists summed");
check(points[1]?.goals === 0, "player 2 goals");
check(points[1]?.assists === 2, "player 2 assists");

const defaultKeys = championshipStatScatterAxisKeys(
	CHAMPIONSHIP_STAT_SCATTER_AXIS.goalsAssists,
);
check(defaultKeys.xKey === ROSTER_COLUMN.assists, "default X assists");
check(defaultKeys.yKey === ROSTER_COLUMN.goals, "default Y goals");
check(
	defaultKeys.xLabel === CHAMPIONSHIP_STAT_SCATTER_LABEL.assists,
	"default X label",
);

const invertedKeys = championshipStatScatterAxisKeys(
	CHAMPIONSHIP_STAT_SCATTER_AXIS.assistsGoals,
);
check(invertedKeys.xKey === ROSTER_COLUMN.goals, "inverted X goals");
check(invertedKeys.yKey === ROSTER_COLUMN.assists, "inverted Y assists");

check(
	toggleChampionshipStatScatterAxis(
		CHAMPIONSHIP_STAT_SCATTER_AXIS.goalsAssists,
	) === CHAMPIONSHIP_STAT_SCATTER_AXIS.assistsGoals,
	"toggle to inverted",
);
check(
	toggleChampionshipStatScatterAxis(
		CHAMPIONSHIP_STAT_SCATTER_AXIS.assistsGoals,
	) === CHAMPIONSHIP_STAT_SCATTER_AXIS.goalsAssists,
	"toggle back",
);

const empty = championshipStatScatterPoints([], []);
check(
	championshipStatScatterEmptyLabel(empty) ===
		CHAMPIONSHIP_STAT_SCATTER_LABEL.empty,
	"empty label",
);

const goalsDomain = championshipStatScatterDomain(points, ROSTER_COLUMN.goals);
check(goalsDomain.min === 0, "domain min zero");
check(goalsDomain.max >= 5, "domain covers goals");

console.log("championship-stat-scatter ok");
