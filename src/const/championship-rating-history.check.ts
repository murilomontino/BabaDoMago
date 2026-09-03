import {
	CHAMPIONSHIP_RATING_CHART_COLOR,
	CHAMPIONSHIP_RATING_HISTORY_LABEL,
	championshipRatingChartColor,
	championshipRatingChartDataKey,
	championshipRatingHistoryAllSelected,
	championshipRatingHistoryChart,
	championshipRatingHistoryEmptyLabel,
	championshipRatingHistoryPlayerIds,
	championshipRatingHistorySelection,
	championshipRatingHistoryTickLabel,
	officialEventRating,
	toggleChampionshipRatingHistoryPlayer,
	visibleChampionshipRatingHistorySeries,
} from "./championship-rating-history.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

function attendance(
	playerId: number,
	rating: number,
	ratingDelta: number,
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
		goals: 0,
		assists: 0,
		assisted_goals: 0,
		own_goals: 0,
		wins: 1,
		losses: 1,
		draws: 0,
		matches: 3,
		rating,
		rating_delta: ratingDelta,
	};
}

function player(
	id: number,
	rating: number,
	nickname: string | null = null,
): {
	id: number;
	display_name: string;
	nickname: string | null;
	avatar_url: string | null;
	rating: number;
} {
	return {
		id,
		display_name: `Player ${id}`,
		nickname,
		avatar_url: null,
		rating,
	};
}

const openEvent = {
	id: 1,
	championship_id: 9,
	starts_at: "2026-08-14T22:00:00.000Z",
	ended_at: null,
	attendance: [attendance(7, 50, 0)],
};

const endedOlder = {
	id: 3,
	championship_id: 9,
	starts_at: "2026-08-01T22:00:00.000Z",
	ended_at: "2026-08-01T23:00:00.000Z",
	attendance: [attendance(7, 50, -0.5), attendance(8, 40, 1.2)],
};

const endedNewer = {
	id: 4,
	championship_id: 9,
	starts_at: "2026-08-08T22:00:00.000Z",
	ended_at: "2026-08-08T23:00:00.000Z",
	attendance: [attendance(7, 49.5, 1.2)],
};

const sentinelEvent = {
	id: 5,
	championship_id: 9,
	starts_at: "2026-08-15T22:00:00.000Z",
	ended_at: "2026-08-15T23:00:00.000Z",
	attendance: [attendance(9, 0, 0)],
};

const nowIso = "2026-08-16T13:00:00.000Z";

check(CHAMPIONSHIP_RATING_HISTORY_LABEL.title === "Evolução da nota", "title");
check(championshipRatingChartDataKey(7) === "p7", "data key");
check(officialEventRating(0) === null, "sentinel null");
check(officialEventRating(3.5) === 3.5, "official rating");
check(
	championshipRatingChartColor(7) === CHAMPIONSHIP_RATING_CHART_COLOR[7],
	"color by id",
);
check(
	championshipRatingChartColor(7) === championshipRatingChartColor(19),
	"color wraps",
);

check(
	championshipRatingHistoryChart([], [], nowIso).rows.length === 0,
	"empty events",
);
check(
	championshipRatingHistoryEmptyLabel(
		championshipRatingHistoryChart([player(7, 51)], [openEvent], nowIso),
	) === CHAMPIONSHIP_RATING_HISTORY_LABEL.empty,
	"open only empty",
);

const chart = championshipRatingHistoryChart(
	[player(7, 51, "Ana"), player(8, 41.2), player(9, 0)],
	[openEvent, endedOlder, endedNewer, sentinelEvent],
	nowIso,
);

check(
	chart.rows.length === 5,
	"entry row plus two rounds plus sentinel date plus now",
);
check(chart.series.length === 2, "skip sentinel player");
check(chart.series[0]?.playerId === 7, "first player order");
check(chart.series[0]?.name === "Ana", "visible name");
check(chart.series[0]?.dataKey === "p7", "series key");
check(chart.rows[0]?.startsAt === endedOlder.starts_at, "oldest first");
check(chart.rows[0]?.p7 === 50, "player 7 rating from");
check(chart.rows[0]?.p8 === 40, "player 8 rating from");
check(chart.rows[1]?.p7 === 49.5, "player 7 first to");
check(chart.rows[1]?.p8 === 41.2, "player 8 first to");
check(chart.rows[2]?.p7 === 50.7, "player 7 second to");
check(chart.rows[2]?.p8 === 41.2, "player 8 carry-forward");
check(chart.rows[3]?.p7 === 50.7, "player 7 carry on missed sentinel event");
check(chart.rows[3]?.p8 === 41.2, "player 8 carry on missed sentinel event");
check(chart.rows[4]?.startsAt === nowIso, "now point");
check(chart.rows[4]?.p7 === 51, "player 7 current");
check(chart.rows[4]?.p8 === 41.2, "player 8 current");
check(
	championshipRatingHistoryChart(
		[player(7, 51, "Ana"), player(8, 41.2), player(9, 0)],
		[openEvent, endedOlder, endedNewer, sentinelEvent],
		null,
	).rows.length === 4,
	"no now row outside period",
);
check(
	championshipRatingHistoryTickLabel(chart.rows, 0) === "",
	"hidden duplicate entry tick",
);
check(
	championshipRatingHistoryTickLabel(chart.rows, 1) === "01/08/2026",
	"oldest tick",
);
check(
	championshipRatingHistoryTickLabel(chart.rows, 2) === "08/08/2026",
	"newer tick",
);

const player8OnlyLater = championshipRatingHistoryChart(
	[player(8, 41.2)],
	[
		{
			id: 10,
			championship_id: 9,
			starts_at: "2026-07-01T22:00:00.000Z",
			ended_at: "2026-07-01T23:00:00.000Z",
			attendance: [attendance(7, 50, -0.5)],
		},
		endedOlder,
	],
	nowIso,
);
check(player8OnlyLater.rows.length === 3, "no extra row when debut is later");
check(player8OnlyLater.rows[0]?.p8 === 40, "rating from on previous slot");
check(player8OnlyLater.rows[1]?.p8 === 41.2, "value after first presence");

const seededDebut = {
	id: 11,
	championship_id: 9,
	starts_at: "2026-08-20T22:00:00.000Z",
	ended_at: "2026-08-20T23:00:00.000Z",
	attendance: [attendance(11, 0, 3)],
};
const seeded = championshipRatingHistoryChart(
	[player(11, 3)],
	[seededDebut],
	nowIso,
);
check(seeded.rows.length === 2, "no extra row for sentinel from");
check(seeded.rows[0]?.p11 === 3, "seeded debut starts at to");

check(
	championshipRatingHistoryChart([player(9, 0)], [sentinelEvent], nowIso).series
		.length === 0,
	"skip all-zero series",
);
check(
	championshipRatingHistoryEmptyLabel(
		championshipRatingHistoryChart([player(9, 0)], [sentinelEvent], nowIso),
	) === CHAMPIONSHIP_RATING_HISTORY_LABEL.emptyRatings,
	"empty ratings label",
);

const ids = championshipRatingHistoryPlayerIds(chart.series);
check(ids.join(",") === "7,8", "player ids");
check(
	championshipRatingHistoryAllSelected(
		ids,
		championshipRatingHistorySelection(null, ids),
	),
	"initial all selected",
);
const toggled = toggleChampionshipRatingHistoryPlayer(
	championshipRatingHistorySelection(null, ids),
	7,
);
check(!toggled.has(7) && toggled.has(8), "toggle off");
check(
	visibleChampionshipRatingHistorySeries(chart.series, toggled)
		.map((item) => item.playerId)
		.join(",") === "8",
	"visible subset",
);
check(toggleChampionshipRatingHistoryPlayer(toggled, 7).has(7), "toggle on");

console.log("championship-rating-history ok");
