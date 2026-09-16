import type {
	ChampionshipEvent,
	ChampionshipEventAttendance,
	ChampionshipEventGoal,
	ChampionshipEventMatch,
	ChampionshipEventMatchPlayer,
	ChampionshipEventTeam,
} from "../types/championship-event.ts";
import { eventRatingRate } from "./event-rating-adjustment.ts";
import { EVENT_TEAM_COLOR } from "./event-team-color.ts";
import {
	calculatePlayerPerformance20,
	PLAYER_PERFORMANCE_EVIDENCE_LEVEL,
	PLAYER_PERFORMANCE_WINDOW,
	playerPerformanceEvidence,
	playerPerformanceMatchSeries,
	playerPerformanceSeats,
} from "./player-performance-20.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

function matchPlayer(
	overrides: Partial<ChampionshipEventMatchPlayer> &
		Pick<ChampionshipEventMatchPlayer, "player_id" | "team_id">,
): ChampionshipEventMatchPlayer {
	return {
		id: overrides.id ?? overrides.player_id,
		match_id: 1,
		event_id: 1,
		display_name: String(overrides.player_id),
		is_goalkeeper: false,
		slot: 1,
		is_substituted: false,
		include_stats: true,
		...overrides,
	};
}

function match(
	overrides: Partial<ChampionshipEventMatch> & {
		players: ChampionshipEventMatchPlayer[];
	},
): ChampionshipEventMatch {
	return {
		id: 1,
		event_id: 1,
		team_a_id: 10,
		team_b_id: 20,
		created_at: "2026-08-14T22:00:00.000Z",
		ended_at: "2026-08-14T22:10:00.000Z",
		winner_team_id: 10,
		duration_seconds: 420,
		started_at: "2026-08-14T22:00:00.000Z",
		paused_at: null,
		pause_accumulated_seconds: 0,
		goals: [],
		...overrides,
	};
}

function team(id: number, playerIds: readonly number[]): ChampionshipEventTeam {
	return {
		id,
		event_id: 1,
		color: EVENT_TEAM_COLOR.white,
		sort_order: id,
		is_active: true,
		template_player_ids: [],
		template_goalkeeper_id: 0,
		players: playerIds.map((playerId) => ({
			id: playerId,
			event_id: 1,
			team_id: id,
			player_id: playerId,
			display_name: String(playerId),
			is_goalkeeper: false,
		})),
	};
}

function attendance(
	playerId: number,
	partial: Partial<ChampionshipEventAttendance> = {},
): ChampionshipEventAttendance {
	return {
		id: playerId,
		event_id: 1,
		player_id: playerId,
		display_name: String(playerId),
		is_goalkeeper: false,
		event_date: "2026-01-01",
		goals: 0,
		assists: 0,
		assisted_goals: 0,
		own_goals: 0,
		wins: 0,
		losses: 0,
		draws: 0,
		matches: 1,
		rating: 5,
		rating_delta: 0,
		goalkeeper_rating: 0,
		goalkeeper_rating_delta: 0,
		vote_rating_delta: 0,
		goalkeeper_vote_rating_delta: 0,
		is_mvp: false,
		mvp_overridden: false,
		...partial,
	};
}

function eventOf(
	id: number,
	startsAt: string,
	matches: ChampionshipEventMatch[],
	opts: {
		ended?: boolean;
		attendanceRows?: ChampionshipEventAttendance[];
		teams?: ChampionshipEventTeam[];
	} = {},
): ChampionshipEvent {
	const ended = opts.ended !== false;
	return {
		id,
		championship_id: 1,
		starts_at: startsAt,
		players_per_team: 5,
		skip_guest_goalkeeper_matches: false,
		ended_at: ended ? startsAt : null,
		attendance: opts.attendanceRows ?? [],
		rsvps: [],
		teams: opts.teams ?? [team(10, [1]), team(20, [2])],
		matches: matches.map((row) => ({ ...row, event_id: id })),
	};
}

function linePair(
	matchId: number,
	playerId: number,
	opponentId: number,
	winnerTeamId: number | null,
	goals: ChampionshipEventGoal[] = [],
	endedAt: string | null = "2026-08-14T22:10:00.000Z",
): ChampionshipEventMatch {
	return match({
		id: matchId,
		created_at: `2026-08-14T${String(20 + (matchId % 9)).padStart(2, "0")}:00:00.000Z`,
		ended_at: endedAt,
		winner_team_id: winnerTeamId,
		players: [
			matchPlayer({ player_id: playerId, team_id: 10, match_id: matchId }),
			matchPlayer({ player_id: opponentId, team_id: 20, match_id: matchId }),
		],
		goals,
	});
}

check(
	playerPerformanceEvidence(0) ===
		PLAYER_PERFORMANCE_EVIDENCE_LEVEL.insufficient,
	"0 games",
);
check(
	playerPerformanceEvidence(2) ===
		PLAYER_PERFORMANCE_EVIDENCE_LEVEL.insufficient,
	"2 games",
);
check(
	playerPerformanceEvidence(3) === PLAYER_PERFORMANCE_EVIDENCE_LEVEL.initial,
	"3 games",
);
check(
	playerPerformanceEvidence(4) === PLAYER_PERFORMANCE_EVIDENCE_LEVEL.initial,
	"4 games",
);
check(
	playerPerformanceEvidence(5) === PLAYER_PERFORMANCE_EVIDENCE_LEVEL.moderate,
	"5 games",
);
check(
	playerPerformanceEvidence(7) === PLAYER_PERFORMANCE_EVIDENCE_LEVEL.moderate,
	"7 games",
);
check(
	playerPerformanceEvidence(8) === PLAYER_PERFORMANCE_EVIDENCE_LEVEL.strong,
	"8 games",
);
check(
	playerPerformanceEvidence(20) === PLAYER_PERFORMANCE_EVIDENCE_LEVEL.strong,
	"20 games",
);

const e1 = eventOf(1, "2026-08-01T12:00:00.000Z", [
	linePair(1, 1, 2, 10, [
		{
			id: 1,
			match_id: 1,
			event_id: 1,
			scorer_player_id: 1,
			assist_player_id: null,
			is_own_goal: false,
			elapsed_seconds: 10,
			created_at: "2026-08-01T12:01:00.000Z",
		},
	]),
	linePair(2, 1, 2, null),
	linePair(3, 1, 2, 20),
]);
const e2 = eventOf(2, "2026-08-08T12:00:00.000Z", [
	linePair(4, 1, 2, 10),
	linePair(5, 3, 2, 10),
]);
const open = eventOf(3, "2026-08-15T12:00:00.000Z", [linePair(6, 1, 2, 10)], {
	ended: false,
});
const openMatch = eventOf(4, "2026-08-22T12:00:00.000Z", [
	linePair(7, 1, 2, 10, [], null),
]);

const events = [e1, e2, open, openMatch];
const seats = playerPerformanceSeats(
	events,
	1,
	PLAYER_PERFORMANCE_WINDOW.default,
);
check(seats.length === 4, "four seats for player 1");
check(
	seats.every((row) => row.match.ended_at != null),
	"only ended matches",
);
check(
	!seats.some((row) => row.eventId === 3 || row.eventId === 4),
	"skip open event and open match",
);
check(!seats.some((row) => row.match.id === 5), "skip absent match");

const perf = calculatePlayerPerformance20(events, 1);
check(perf.games === 4, "games");
check(perf.wins === 2, "wins");
check(perf.draws === 1, "draws");
check(perf.losses === 1, "losses");
check(perf.winRate === 0.5, "winRate");
check(
	Math.abs(perf.pointsRate - eventRatingRate(2, 1, 1, 4)) < 1e-9,
	"pointsRate official",
);
check(perf.goals === 1, "goals");
check(perf.assists === 0, "assists");
check(perf.goalsPerGame === 0.25, "goalsPerGame");
check(perf.evidence === PLAYER_PERFORMANCE_EVIDENCE_LEVEL.initial, "evidence");

const noGoalEvent = eventOf(
	10,
	"2026-07-01T12:00:00.000Z",
	[linePair(100, 1, 2, 10)],
	{
		attendanceRows: [attendance(1, { rating: 4.8, rating_delta: 0.2 })],
	},
);
const noGoalPerf = calculatePlayerPerformance20([noGoalEvent], 1);
check(
	noGoalPerf.goalParticipation === null,
	"no team goals → null participation",
);
check(noGoalPerf.rating === 4.8, "rating snapshot");
check(noGoalPerf.ratingDelta === 0.2, "rating delta");

const withGoals = eventOf(11, "2026-07-08T12:00:00.000Z", [
	linePair(101, 1, 2, 10, [
		{
			id: 2,
			match_id: 101,
			event_id: 11,
			scorer_player_id: 1,
			assist_player_id: 2,
			is_own_goal: false,
			elapsed_seconds: 20,
			created_at: "2026-07-08T12:01:00.000Z",
		},
		{
			id: 3,
			match_id: 101,
			event_id: 11,
			scorer_player_id: 1,
			assist_player_id: null,
			is_own_goal: false,
			elapsed_seconds: 40,
			created_at: "2026-07-08T12:02:00.000Z",
		},
	]),
]);
const part = calculatePlayerPerformance20([withGoals], 1);
check(part.goalParticipation === 1, "full participation");
check(part.cleanSheetRate === 1, "clean sheet");
check(part.goalsConcededPerGame === 0, "no conceded");

const gkEvent = eventOf(12, "2026-07-15T12:00:00.000Z", [
	match({
		id: 200,
		winner_team_id: 10,
		players: [
			matchPlayer({
				player_id: 1,
				team_id: 10,
				match_id: 200,
				is_goalkeeper: true,
			}),
			matchPlayer({ player_id: 2, team_id: 20, match_id: 200 }),
		],
		goals: [],
	}),
	match({
		id: 201,
		winner_team_id: 10,
		players: [
			matchPlayer({
				player_id: 1,
				team_id: 10,
				match_id: 201,
				is_goalkeeper: true,
			}),
			matchPlayer({ player_id: 2, team_id: 20, match_id: 201 }),
		],
		goals: [],
	}),
	match({
		id: 202,
		winner_team_id: 20,
		players: [
			matchPlayer({
				player_id: 1,
				team_id: 10,
				match_id: 202,
				is_goalkeeper: true,
			}),
			matchPlayer({ player_id: 2, team_id: 20, match_id: 202 }),
		],
		goals: [
			{
				id: 9,
				match_id: 202,
				event_id: 12,
				scorer_player_id: 2,
				assist_player_id: null,
				is_own_goal: false,
				elapsed_seconds: 5,
				created_at: "2026-07-15T12:01:00.000Z",
			},
		],
	}),
]);
const gkPerf = calculatePlayerPerformance20([gkEvent], 1);
check(gkPerf.goalkeeperMetrics !== null, "gk metrics with 3 matches");
check(gkPerf.goalkeeperMetrics?.matches === 3, "gk matches");
check(gkPerf.goalkeeperMetrics?.wins === 2, "gk wins");
check(gkPerf.lineGames === 0, "line games zero as gk");
check(gkPerf.goalsPerGame === null, "no line goals as gk");

const thinGk = calculatePlayerPerformance20(
	[
		eventOf(13, "2026-07-20T12:00:00.000Z", [
			match({
				id: 300,
				winner_team_id: 10,
				players: [
					matchPlayer({
						player_id: 1,
						team_id: 10,
						match_id: 300,
						is_goalkeeper: true,
					}),
					matchPlayer({ player_id: 2, team_id: 20, match_id: 300 }),
				],
			}),
		]),
	],
	1,
);
check(thinGk.goalkeeperMetrics === null, "gk null under 3");

const seriesEvents = [
	eventOf(
		20,
		"2026-06-01T12:00:00.000Z",
		[linePair(400, 1, 2, 10), linePair(401, 1, 2, 10)],
		{ attendanceRows: [attendance(1, { rating: 4.8, rating_delta: 0 })] },
	),
	eventOf(21, "2026-06-08T12:00:00.000Z", [linePair(402, 1, 2, 10)], {
		attendanceRows: [attendance(1, { rating: 5.2, rating_delta: 0.4 })],
	}),
];
const series = playerPerformanceMatchSeries(seriesEvents, 1);
check(series.length === 3, "series length");
check(series[0]?.ratingSnapshot === 4.8, "rating flat start");
check(series[1]?.ratingSnapshot === 4.8, "rating flat same event");
check(series[2]?.ratingSnapshot === 5.2, "rating after next event");
check(series[0]?.index === 1 && series[2]?.index === 3, "index ascending");

console.log("player-performance-20.check.ts ok");
