import {
	CHAMPIONSHIP_METRIC_HISTORY_LABEL,
	CHAMPIONSHIP_METRIC_HISTORY_TITLE,
	championshipMetricHistoryEmptyLabel,
	championshipMetricHistoryFormat,
	championshipMetricHistoryNowIso,
	championshipMetricHistoryTitle,
	championshipMetricHistoryYDomain,
	championshipPodiumHistoryChart,
	championshipPodiumHistoryMetric,
} from "./championship-metric-history.ts";
import { PODIUM_METRIC, PODIUM_SEMESTER } from "./podium.ts";
import { ROSTER_COLUMN } from "./roster-stats.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

function attendance(
	playerId: number,
	goals: number,
	rating: number,
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
		assists: 0,
		assisted_goals: 0,
		own_goals: 0,
		wins: 1,
		losses: 0,
		draws: 0,
		matches: 3,
		rating,
		rating_delta: 0.5,
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
		rating: 4,
	};
}

const ended = {
	id: 3,
	championship_id: 9,
	starts_at: "2026-08-01T22:00:00.000Z",
	ended_at: "2026-08-01T23:00:00.000Z",
	attendance: [attendance(7, 2, 3.5)],
};

const nowIso = "2026-08-16T13:00:00.000Z";

check(
	championshipMetricHistoryTitle(ROSTER_COLUMN.rating) ===
		CHAMPIONSHIP_METRIC_HISTORY_TITLE.rating,
	"rating title",
);
check(
	championshipMetricHistoryTitle(ROSTER_COLUMN.goals) === "Evolução dos gols",
	"goals title",
);

const ratingChart = championshipPodiumHistoryChart(
	ROSTER_COLUMN.rating,
	[player(7)],
	[ended],
	nowIso,
);
check(ratingChart.rows.length === 3, "rating entry plus event plus now");

const goalsChart = championshipPodiumHistoryChart(
	ROSTER_COLUMN.goals,
	[player(7)],
	[ended],
	nowIso,
);
check(goalsChart.rows.length === 1, "count has no now");
check(goalsChart.rows[0]?.p7 === 2, "goals accumulated");

const winRateChart = championshipPodiumHistoryChart(
	ROSTER_COLUMN.winRate,
	[player(7)],
	[ended],
	null,
);
check(winRateChart.rows[0]?.p7 === 1 / 3, "win rate from attendance");

check(
	championshipMetricHistoryEmptyLabel(
		{ rows: [], series: [] },
		ROSTER_COLUMN.goals,
	) === CHAMPIONSHIP_METRIC_HISTORY_LABEL.empty,
	"empty rounds",
);
check(
	championshipMetricHistoryEmptyLabel(
		{ rows: [{ x: 0, startsAt: ended.starts_at }], series: [] },
		ROSTER_COLUMN.goals,
	) === CHAMPIONSHIP_METRIC_HISTORY_LABEL.emptyStats,
	"empty stats",
);
check(
	championshipMetricHistoryEmptyLabel(
		{ rows: [{ x: 0, startsAt: ended.starts_at }], series: [] },
		ROSTER_COLUMN.rating,
	) === CHAMPIONSHIP_METRIC_HISTORY_LABEL.emptyRatings,
	"empty ratings",
);

check(
	championshipMetricHistoryFormat(ROSTER_COLUMN.rating, 3.5) === "3.5",
	"rating format",
);
check(
	championshipMetricHistoryFormat(ROSTER_COLUMN.goals, 2) === "2",
	"goals format",
);
check(
	championshipMetricHistoryFormat(ROSTER_COLUMN.winRate, 0.5) === "50%",
	"win rate format",
);

check(
	championshipMetricHistoryYDomain(ROSTER_COLUMN.winRate, winRateChart, 5).join(
		",",
	) === "0,1",
	"win rate domain",
);
check(
	championshipMetricHistoryYDomain(ROSTER_COLUMN.goals, goalsChart, 5).join(
		",",
	) === "0,2",
	"goals domain from max",
);

check(
	championshipMetricHistoryNowIso(
		ROSTER_COLUMN.goals,
		nowIso,
		2026,
		null,
		[],
	) === null,
	"now only for rating",
);
check(
	championshipMetricHistoryNowIso(
		ROSTER_COLUMN.rating,
		nowIso,
		2026,
		null,
		[],
	) === nowIso,
	"now inside year",
);
check(
	championshipMetricHistoryNowIso(
		ROSTER_COLUMN.rating,
		nowIso,
		2026,
		PODIUM_SEMESTER.first,
		[],
	) === null,
	"now outside semester",
);

check(
	championshipPodiumHistoryMetric(ROSTER_COLUMN.goals) === ROSTER_COLUMN.goals,
	"player metric kept",
);
check(
	championshipPodiumHistoryMetric(PODIUM_METRIC.synergy) === null,
	"synergy has no chart",
);
check(
	championshipPodiumHistoryMetric(ROSTER_COLUMN.ratingEvolution) === null,
	"rating evolution has no chart",
);
check(
	championshipPodiumHistoryChart(
		ROSTER_COLUMN.ratingEvolution,
		[player(7)],
		[ended],
		nowIso,
	).rows.length === 0,
	"rating evolution chart empty",
);

console.log("championship-metric-history ok");
