import type { ChampionshipPlayer } from "../types/championship.ts";
import type { ChampionshipEvent } from "../types/championship-event.ts";
import {
	championshipPredictedVsRealized,
	formatPredictedVsRealizedSigned,
	formatPredictedVsRealizedValue,
	PREDICTED_VS_REALIZED_QUALITY,
	PREDICTED_VS_REALIZED_ROSTER,
	PREDICTED_VS_REALIZED_WINDOW,
	predictedVsRealizedQuality,
} from "./championship-predicted-vs-realized.ts";
import { EVENT_TEAM_COLOR } from "./event-team-color.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

function almostEqual(left: number, right: number, epsilon = 1e-9): boolean {
	return Math.abs(left - right) <= epsilon;
}

function player(
	id: number,
	isMonthly: boolean,
	rating = 0,
): ChampionshipPlayer {
	return {
		id,
		championship_id: 1,
		user_id: null,
		display_name: `P${id}`,
		nickname: null,
		nickname_tags: [],
		avatar_url: null,
		rating,
		goalkeeper_rating: 0,
		role: "player",
		is_goalkeeper: false,
		is_monthly: isMonthly,
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

function attendance(
	id: number,
	playerId: number,
	rating: number,
	goalkeeperRating = 0,
	isGoalkeeper = false,
) {
	return {
		id,
		event_id: 1,
		player_id: playerId,
		display_name: `P${playerId}`,
		is_goalkeeper: isGoalkeeper,
		event_date: "2026-08-01",
		goals: 0,
		assists: 0,
		assisted_goals: 0,
		own_goals: 0,
		wins: 0,
		losses: 0,
		draws: 0,
		matches: 1,
		rating,
		rating_delta: 0,
		goalkeeper_rating: goalkeeperRating,
		goalkeeper_rating_delta: 0,
		vote_rating_delta: 0,
		goalkeeper_vote_rating_delta: 0,
		is_mvp: false,
		mvp_overridden: false,
	};
}

function teamPlayer(id: number, teamId: number, playerId: number) {
	return {
		id,
		event_id: 1,
		team_id: teamId,
		player_id: playerId,
		display_name: `P${playerId}`,
		is_goalkeeper: false,
	};
}

function baseEvent(): ChampionshipEvent {
	return {
		id: 1,
		championship_id: 1,
		starts_at: "2026-08-01T22:00:00.000Z",
		players_per_team: 2,
		skip_guest_goalkeeper_matches: true,
		ended_at: "2026-08-01T23:00:00.000Z",
		attendance: [
			attendance(1, 1, 5),
			attendance(2, 2, 4),
			attendance(3, 3, 3),
			attendance(4, 4, 2),
		],
		rsvps: [],
		teams: [
			{
				id: 10,
				event_id: 1,
				color: EVENT_TEAM_COLOR.white,
				sort_order: 0,
				is_active: true,
				template_player_ids: [],
				template_goalkeeper_id: 0,
				players: [teamPlayer(1, 10, 1), teamPlayer(2, 10, 2)],
			},
			{
				id: 20,
				event_id: 1,
				color: EVENT_TEAM_COLOR.black,
				sort_order: 1,
				is_active: true,
				template_player_ids: [],
				template_goalkeeper_id: 0,
				players: [teamPlayer(3, 20, 3), teamPlayer(4, 20, 4)],
			},
		],
		matches: [
			{
				id: 100,
				event_id: 1,
				team_a_id: 10,
				team_b_id: 20,
				created_at: "2026-08-01T22:00:00.000Z",
				ended_at: "2026-08-01T22:10:00.000Z",
				winner_team_id: 10,
				duration_seconds: 600,
				started_at: "2026-08-01T22:00:00.000Z",
				paused_at: null,
				pause_accumulated_seconds: 0,
				players: [
					{
						id: 1,
						match_id: 100,
						event_id: 1,
						team_id: 10,
						player_id: 1,
						display_name: "P1",
						is_goalkeeper: false,
						slot: 0,
						is_substituted: false,
						include_stats: true,
					},
					{
						id: 2,
						match_id: 100,
						event_id: 1,
						team_id: 10,
						player_id: 2,
						display_name: "P2",
						is_goalkeeper: false,
						slot: 1,
						is_substituted: false,
						include_stats: true,
					},
					{
						id: 3,
						match_id: 100,
						event_id: 1,
						team_id: 20,
						player_id: 3,
						display_name: "P3",
						is_goalkeeper: false,
						slot: 0,
						is_substituted: false,
						include_stats: true,
					},
					{
						id: 4,
						match_id: 100,
						event_id: 1,
						team_id: 20,
						player_id: 4,
						display_name: "P4",
						is_goalkeeper: false,
						slot: 1,
						is_substituted: false,
						include_stats: true,
					},
				],
				goals: [
					{
						id: 1,
						match_id: 100,
						event_id: 1,
						scorer_player_id: 1,
						assist_player_id: null,
						is_own_goal: false,
						elapsed_seconds: 30,
						created_at: "2026-08-01T22:01:00.000Z",
					},
					{
						id: 2,
						match_id: 100,
						event_id: 1,
						scorer_player_id: 1,
						assist_player_id: null,
						is_own_goal: false,
						elapsed_seconds: 60,
						created_at: "2026-08-01T22:02:00.000Z",
					},
					{
						id: 3,
						match_id: 100,
						event_id: 1,
						scorer_player_id: 1,
						assist_player_id: null,
						is_own_goal: false,
						elapsed_seconds: 90,
						created_at: "2026-08-01T22:03:00.000Z",
					},
					{
						id: 4,
						match_id: 100,
						event_id: 1,
						scorer_player_id: 3,
						assist_player_id: null,
						is_own_goal: false,
						elapsed_seconds: 120,
						created_at: "2026-08-01T22:04:00.000Z",
					},
					{
						id: 5,
						match_id: 100,
						event_id: 1,
						scorer_player_id: 3,
						assist_player_id: null,
						is_own_goal: false,
						elapsed_seconds: 150,
						created_at: "2026-08-01T22:05:00.000Z",
					},
				],
			},
		],
	};
}

const players = [
	player(1, true, 9),
	player(2, true, 9),
	player(3, false, 9),
	player(4, true, 9),
];

const result = championshipPredictedVsRealized(players, [baseEvent()], {
	window: PREDICTED_VS_REALIZED_WINDOW.all,
	roster: PREDICTED_VS_REALIZED_ROSTER.all,
});

check(result.matches.length === 1, "one match");
const row = result.matches[0];
check(row !== undefined, "match row");
// Team A: 5+4=9, Team B: 3+2=5 → predicted 4; score 3-2 → realized 1
check(almostEqual(row?.predictedDifference ?? -1, 4), "predicted sum diff");
check(almostEqual(row?.realizedDifference ?? -1, 1), "realized margin");
check(almostEqual(row?.error ?? 0, -3), "signed error");
check(almostEqual(row?.absoluteError ?? 0, 3), "absolute error");
check(row?.favoriteTeamId === 10, "favorite is team A");
check(row?.favoriteWon === true, "favorite won");
check(almostEqual(result.summary.meanAbsoluteError, 3), "mae");
check(almostEqual(result.summary.meanError, -3), "bias");
check(result.summary.withinOneGoalRate === 0, "within ±1 false");
check(
	predictedVsRealizedQuality(0.5, 3) === PREDICTED_VS_REALIZED_QUALITY.good,
	"quality good",
);
check(
	predictedVsRealizedQuality(1.5, 3) === PREDICTED_VS_REALIZED_QUALITY.watch,
	"quality watch",
);
check(
	predictedVsRealizedQuality(2.5, 3) === PREDICTED_VS_REALIZED_QUALITY.high,
	"quality high",
);

const drawEvent = baseEvent();
const drawMatch = drawEvent.matches[0];
if (!drawMatch) {
	throw new Error("draw fixture");
}
drawMatch.goals = [
	{
		id: 1,
		match_id: 100,
		event_id: 1,
		scorer_player_id: 1,
		assist_player_id: null,
		is_own_goal: false,
		elapsed_seconds: 30,
		created_at: "2026-08-01T22:01:00.000Z",
	},
	{
		id: 2,
		match_id: 100,
		event_id: 1,
		scorer_player_id: 3,
		assist_player_id: null,
		is_own_goal: false,
		elapsed_seconds: 60,
		created_at: "2026-08-01T22:02:00.000Z",
	},
];
drawMatch.winner_team_id = null;
const drawResult = championshipPredictedVsRealized(players, [drawEvent], {
	window: PREDICTED_VS_REALIZED_WINDOW.all,
	roster: PREDICTED_VS_REALIZED_ROSTER.all,
});
check(drawResult.matches[0]?.realizedDifference === 0, "draw realized 0");
check(drawResult.matches[0]?.favoriteWon === null, "draw favorite null");

const openEvent = baseEvent();
openEvent.ended_at = null;
check(
	championshipPredictedVsRealized(players, [openEvent], {
		window: PREDICTED_VS_REALIZED_WINDOW.all,
		roster: PREDICTED_VS_REALIZED_ROSTER.all,
	}).matches.length === 0,
	"open event ignored",
);

const openMatch = baseEvent();
const openMatchRow = openMatch.matches[0];
if (!openMatchRow) {
	throw new Error("open match fixture");
}
openMatchRow.ended_at = null;
check(
	championshipPredictedVsRealized(players, [openMatch], {
		window: PREDICTED_VS_REALIZED_WINDOW.all,
		roster: PREDICTED_VS_REALIZED_ROSTER.all,
	}).matches.length === 0,
	"open match ignored",
);

const discarded = baseEvent();
discarded.matches = [];
check(
	championshipPredictedVsRealized(players, [discarded], {
		window: PREDICTED_VS_REALIZED_WINDOW.all,
		roster: PREDICTED_VS_REALIZED_ROSTER.all,
	}).matches.length === 0,
	"discarded match ignored",
);

const snapshotEvent = baseEvent();
const snapshotResult = championshipPredictedVsRealized(
	[
		player(1, true, 99),
		player(2, true, 99),
		player(3, false, 99),
		player(4, true, 99),
	],
	[snapshotEvent],
	{
		window: PREDICTED_VS_REALIZED_WINDOW.all,
		roster: PREDICTED_VS_REALIZED_ROSTER.all,
	},
);
check(
	almostEqual(snapshotResult.matches[0]?.predictedDifference ?? -1, 4),
	"current rating does not change historical predicted",
);

const monthly = championshipPredictedVsRealized(players, [baseEvent()], {
	window: PREDICTED_VS_REALIZED_WINDOW.all,
	roster: PREDICTED_VS_REALIZED_ROSTER.monthly,
});
// Team A monthly: 1+2 → 5+4=9; Team B monthly: only 4 → 2; predicted 7
check(monthly.matches.length === 1, "monthly keeps match");
check(
	almostEqual(monthly.matches[0]?.predictedDifference ?? -1, 7),
	"monthly filter rebuilds sums",
);

const withinEvent = baseEvent();
const withinMatch = withinEvent.matches[0];
if (!withinMatch) {
	throw new Error("within fixture");
}
// predicted 4, make realized 4 → error 0, within ±1
withinMatch.goals = [
	{
		id: 1,
		match_id: 100,
		event_id: 1,
		scorer_player_id: 1,
		assist_player_id: null,
		is_own_goal: false,
		elapsed_seconds: 10,
		created_at: "2026-08-01T22:01:00.000Z",
	},
	{
		id: 2,
		match_id: 100,
		event_id: 1,
		scorer_player_id: 1,
		assist_player_id: null,
		is_own_goal: false,
		elapsed_seconds: 20,
		created_at: "2026-08-01T22:02:00.000Z",
	},
	{
		id: 3,
		match_id: 100,
		event_id: 1,
		scorer_player_id: 1,
		assist_player_id: null,
		is_own_goal: false,
		elapsed_seconds: 30,
		created_at: "2026-08-01T22:03:00.000Z",
	},
	{
		id: 4,
		match_id: 100,
		event_id: 1,
		scorer_player_id: 1,
		assist_player_id: null,
		is_own_goal: false,
		elapsed_seconds: 40,
		created_at: "2026-08-01T22:04:00.000Z",
	},
];
withinMatch.winner_team_id = 10;
const within = championshipPredictedVsRealized(players, [withinEvent], {
	window: PREDICTED_VS_REALIZED_WINDOW.all,
	roster: PREDICTED_VS_REALIZED_ROSTER.all,
});
check(within.summary.withinOneGoalRate === 1, "within ±1 true");
check(almostEqual(within.summary.meanAbsoluteError, 0), "mae zero");

const second = baseEvent();
second.id = 2;
second.starts_at = "2026-08-08T22:00:00.000Z";
second.ended_at = "2026-08-08T23:00:00.000Z";
second.matches = second.matches.map((match) => ({
	...match,
	id: 200,
	event_id: 2,
}));
const windowed = championshipPredictedVsRealized(
	players,
	[baseEvent(), second],
	{
		window: PREDICTED_VS_REALIZED_WINDOW.last3,
		roster: PREDICTED_VS_REALIZED_ROSTER.all,
	},
	"2026-08-10T00:00:00.000Z",
);
check(windowed.matches.length === 2, "window includes both");
check(windowed.rounds.length === 2, "two rounds");
check(
	almostEqual(windowed.rounds[1]?.cumulativeMeanAbsoluteError ?? -1, 3),
	"cumulative mae",
);

const zeroRating = baseEvent();
zeroRating.attendance = [
	attendance(1, 1, 0),
	attendance(2, 2, 4),
	attendance(3, 3, 0),
	attendance(4, 4, 2),
];
const seeded = championshipPredictedVsRealized(players, [zeroRating], {
	window: PREDICTED_VS_REALIZED_WINDOW.all,
	roster: PREDICTED_VS_REALIZED_ROSTER.all,
});
// present rated avg = (4+2)/2 = 3; A: 3+4=7, B: 3+2=5 → predicted 2
check(
	almostEqual(seeded.matches[0]?.predictedDifference ?? -1, 2),
	"rating 0 uses draw average",
);

const upset = baseEvent();
const upsetMatch = upset.matches[0];
if (!upsetMatch) {
	throw new Error("upset fixture");
}
upsetMatch.winner_team_id = 20;
const upsetResult = championshipPredictedVsRealized(players, [upset], {
	window: PREDICTED_VS_REALIZED_WINDOW.all,
	roster: PREDICTED_VS_REALIZED_ROSTER.all,
});
check(upsetResult.matches[0]?.favoriteWon === false, "favorite lost");
check(upsetResult.summary.favoriteWinRate === 0, "favorite wr 0");

check(formatPredictedVsRealizedValue(1.25) === "1.3", "format value");
check(formatPredictedVsRealizedSigned(-1.2) === "-1.2", "format signed neg");
check(formatPredictedVsRealizedSigned(1.2) === "+1.2", "format signed pos");

const gkEvent = baseEvent();
gkEvent.attendance = [
	attendance(1, 1, 5, 8, true),
	attendance(2, 2, 4),
	attendance(3, 3, 3),
	attendance(4, 4, 2),
];
const gk = championshipPredictedVsRealized(players, [gkEvent], {
	window: PREDICTED_VS_REALIZED_WINDOW.all,
	roster: PREDICTED_VS_REALIZED_ROSTER.all,
});
// A: 8+4=12, B: 3+2=5 → 7
check(
	almostEqual(gk.matches[0]?.predictedDifference ?? -1, 7),
	"goalkeeper snapshot rating",
);

console.log("championship-predicted-vs-realized.check.ts ok");
