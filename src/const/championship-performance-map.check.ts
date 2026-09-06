import type { ChampionshipPlayer } from "../types/championship.ts";
import type {
	ChampionshipEvent,
	ChampionshipEventAttendance,
} from "../types/championship-event.ts";
import {
	championshipPerformanceMap,
	championshipPerformanceMapVisible,
	formatPerformanceMapGap,
	PERFORMANCE_MAP_STATE,
	PERFORMANCE_MAP_WINDOW,
	performanceMapEvents,
	performanceMapRatingMedian,
} from "./championship-performance-map.ts";
import { eventRatingRate } from "./event-rating-adjustment.ts";
import { PLAYER_RATING } from "./player-rating.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

function player(
	id: number,
	name: string,
	rating: number,
	isMonthly = false,
): ChampionshipPlayer {
	return {
		id,
		championship_id: 1,
		user_id: null,
		display_name: name,
		nickname: null,
		nickname_tags: [],
		avatar_url: null,
		role: "member",
		rating,
		goalkeeper_rating: 0,
		goals: 0,
		assists: 0,
		assisted_goals: 0,
		own_goals: 0,
		wins: 0,
		losses: 0,
		draws: 0,
		matches: 0,
		mvps: 0,
		is_goalkeeper: false,
		is_monthly: isMonthly,
		deleted_at: null,
	} as ChampionshipPlayer;
}

function attendance(
	partial: Partial<ChampionshipEventAttendance> & {
		player_id: number;
		wins: number;
		draws: number;
		losses: number;
		matches: number;
	},
): ChampionshipEventAttendance {
	return {
		id: partial.player_id,
		event_id: 1,
		player_id: partial.player_id,
		display_name: "x",
		is_goalkeeper: false,
		event_date: "2026-01-01",
		goals: 0,
		assists: 0,
		assisted_goals: 0,
		own_goals: 0,
		wins: partial.wins,
		losses: partial.losses,
		draws: partial.draws,
		matches: partial.matches,
		rating: partial.rating ?? 3,
		rating_delta: partial.rating_delta ?? 0,
		goalkeeper_rating: partial.goalkeeper_rating ?? 0,
		goalkeeper_rating_delta: partial.goalkeeper_rating_delta ?? 0,
		vote_rating_delta: partial.vote_rating_delta ?? 0,
		goalkeeper_vote_rating_delta: partial.goalkeeper_vote_rating_delta ?? 0,
		is_mvp: partial.is_mvp ?? false,
		mvp_overridden: false,
	};
}

function eventWith(
	id: number,
	rows: ChampionshipEventAttendance[],
	ended = true,
	startsAt = `2026-08-${String(id).padStart(2, "0")}T22:00:00.000Z`,
): ChampionshipEvent {
	return {
		id,
		championship_id: 1,
		starts_at: startsAt,
		players_per_team: 5,
		skip_guest_goalkeeper_matches: false,
		ended_at: ended ? startsAt : null,
		attendance: rows,
		rsvps: [],
		teams: [],
		matches: [],
	};
}

const lowRated = player(1, "Joao", 4.2);
const highRated = player(2, "Pedro", 7.4);
const midRated = player(3, "Ana", 5.6);
const unrated = player(4, "Novo", PLAYER_RATING.default);
const monthly = player(5, "Mensal", 4.0, true);

check(performanceMapRatingMedian([4, 5, 6]) === 5, "median odd");
check(performanceMapRatingMedian([4, 6]) === 5, "median even");
check(performanceMapRatingMedian([]) === null, "median empty");

const risingEvent = eventWith(1, [
	attendance({
		player_id: 1,
		wins: 5,
		draws: 0,
		losses: 1,
		matches: 6,
		rating_delta: 0.4,
	}),
	attendance({
		player_id: 2,
		wins: 1,
		draws: 0,
		losses: 5,
		matches: 6,
		rating_delta: -0.4,
	}),
]);

const risingMap = championshipPerformanceMap(
	[lowRated, highRated],
	[risingEvent],
	PERFORMANCE_MAP_WINDOW.last5,
);
const joao = risingMap.points.find((point) => point.playerId === 1);
const pedro = risingMap.points.find((point) => point.playerId === 2);
check(joao?.state === PERFORMANCE_MAP_STATE.rising, "68%+ low rating → rising");
check(
	pedro?.state === PERFORMANCE_MAP_STATE.falling,
	"low rate + high → falling",
);
check(
	risingMap.median !== null && Math.abs(risingMap.median - 5.8) < 1e-9,
	"median of 4.2 and 7.4",
);

const eliteEvent = eventWith(1, [
	attendance({
		player_id: 2,
		wins: 5,
		draws: 1,
		losses: 2,
		matches: 8,
	}),
	attendance({
		player_id: 1,
		wins: 1,
		draws: 0,
		losses: 5,
		matches: 6,
	}),
]);
const eliteMap = championshipPerformanceMap(
	[lowRated, highRated],
	[eliteEvent],
);
check(
	eliteMap.points.find((point) => point.playerId === 2)?.state ===
		PERFORMANCE_MAP_STATE.elite,
	"high rate + high rating → elite",
);
check(
	eliteMap.points.find((point) => point.playerId === 1)?.state ===
		PERFORMANCE_MAP_STATE.low,
	"low rate + low rating → low",
);

const neutralEvent = eventWith(1, [
	attendance({
		player_id: 3,
		wins: 1,
		draws: 2,
		losses: 1,
		matches: 4,
	}),
	attendance({
		player_id: 2,
		wins: 2,
		draws: 0,
		losses: 2,
		matches: 4,
	}),
]);
const neutralMap = championshipPerformanceMap(
	[midRated, highRated],
	[neutralEvent],
);
check(
	neutralMap.points.find((point) => point.playerId === 3)?.state ===
		PERFORMANCE_MAP_STATE.neutral,
	"50% → neutral",
);

const fewEvent = eventWith(1, [
	attendance({
		player_id: 1,
		wins: 2,
		draws: 0,
		losses: 0,
		matches: 2,
	}),
	attendance({
		player_id: 2,
		wins: 3,
		draws: 0,
		losses: 0,
		matches: 3,
	}),
]);
const fewMap = championshipPerformanceMap([lowRated, highRated], [fewEvent]);
const fewPoint = fewMap.points.find((point) => point.playerId === 1);
check(fewPoint?.state === PERFORMANCE_MAP_STATE.few_matches, "2 jogos → few");
check(
	championshipPerformanceMapVisible(fewMap, false).every(
		(point) => point.playerId !== 1,
	),
	"few matches hidden by default",
);
check(
	championshipPerformanceMapVisible(fewMap, true).some(
		(point) => point.playerId === 1,
	),
	"few matches shown with toggle",
);

const absentMap = championshipPerformanceMap(
	[lowRated, highRated],
	[
		eventWith(1, [
			attendance({
				player_id: 2,
				wins: 3,
				draws: 0,
				losses: 0,
				matches: 3,
			}),
		]),
	],
);
check(
	absentMap.points.every((point) => point.playerId !== 1),
	"ausente não aparece",
);

const openRound = championshipPerformanceMap(
	[lowRated],
	[
		eventWith(
			1,
			[
				attendance({
					player_id: 1,
					wins: 5,
					draws: 0,
					losses: 0,
					matches: 5,
				}),
			],
			false,
		),
	],
);
check(openRound.points.length === 0, "rodada aberta não entra");

const nowMs = Date.parse("2026-09-02T15:00:00.000Z");
const windowEvents = [
	eventWith(1, [], true, "2026-07-01T22:00:00.000Z"),
	eventWith(2, [], true, "2026-08-01T22:00:00.000Z"),
	eventWith(3, [], true, "2026-08-08T22:00:00.000Z"),
	eventWith(4, [], true, "2026-08-15T22:00:00.000Z"),
	eventWith(5, [], true, "2026-08-22T22:00:00.000Z"),
	eventWith(6, [], true, "2026-08-29T22:00:00.000Z"),
	eventWith(7, [], false, "2026-09-01T22:00:00.000Z"),
];
const last5 = performanceMapEvents(
	windowEvents,
	PERFORMANCE_MAP_WINDOW.last5,
	nowMs,
);
check(last5.length === 5, "last5 five ended");
check(last5[0]?.id === 2, "last5 oldest id 2");
check(last5[4]?.id === 6, "last5 newest id 6");

const drawBonusEvent = eventWith(1, [
	attendance({
		player_id: 1,
		wins: 0,
		draws: 3,
		losses: 0,
		matches: 3,
	}),
	attendance({
		player_id: 2,
		wins: 0,
		draws: 0,
		losses: 3,
		matches: 3,
	}),
]);
const drawMap = championshipPerformanceMap(
	[lowRated, highRated],
	[drawBonusEvent],
);
const drawPoint = drawMap.points.find((point) => point.playerId === 1);
check(
	drawPoint?.rate === eventRatingRate(0, 3, 0, 3),
	"empates usam regra oficial",
);
check(drawPoint?.rate === 4.5 / 9, "draw bonus 50%");
check(drawPoint?.state === PERFORMANCE_MAP_STATE.neutral, "3 draws neutral");

const unratedEvent = eventWith(1, [
	attendance({
		player_id: 4,
		wins: 3,
		draws: 0,
		losses: 0,
		matches: 3,
		rating: PLAYER_RATING.default,
	}),
	attendance({
		player_id: 2,
		wins: 1,
		draws: 0,
		losses: 2,
		matches: 3,
	}),
]);
const unratedMap = championshipPerformanceMap(
	[unrated, highRated],
	[unratedEvent],
);
const unratedPoint = unratedMap.points.find((point) => point.playerId === 4);
check(
	unratedPoint?.state === PERFORMANCE_MAP_STATE.unrated,
	"rating 0 → unrated",
);
check(
	championshipPerformanceMapVisible(unratedMap, true).every(
		(point) => point.playerId !== 4,
	),
	"unrated never visible",
);
check(unratedMap.median === 7.4, "rating 0 fora da mediana");

const monthlyOnly = championshipPerformanceMap(
	[monthly],
	[
		eventWith(1, [
			attendance({
				player_id: 5,
				wins: 4,
				draws: 0,
				losses: 0,
				matches: 4,
			}),
			attendance({
				player_id: 2,
				wins: 0,
				draws: 0,
				losses: 4,
				matches: 4,
			}),
		]),
	],
);
check(
	monthlyOnly.points.length === 1 && monthlyOnly.points[0]?.playerId === 5,
	"mensalistas: só players filtrados",
);
check(
	monthlyOnly.points[0]?.state === PERFORMANCE_MAP_STATE.rising ||
		monthlyOnly.points[0]?.state === PERFORMANCE_MAP_STATE.elite,
	"mensalista classificado",
);

check(formatPerformanceMapGap(0.12) === "+12 pp", "gap positive");
check(formatPerformanceMapGap(-0.21) === "-21 pp", "gap negative");

const gapPoint = risingMap.points.find((point) => point.playerId === 1);
check(
	gapPoint !== undefined &&
		Math.abs(gapPoint.gap - (gapPoint.rate - gapPoint.ratingRelative)) < 1e-9,
	"gap = rate − ratingRelative",
);

console.log("championship-performance-map ok");
