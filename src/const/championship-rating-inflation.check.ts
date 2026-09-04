import type { ChampionshipPlayer } from "../types/championship.ts";
import type { ChampionshipEvent } from "../types/championship-event.ts";
import {
	championshipRatingInflation,
	championshipRatingInflationChart,
} from "./championship-rating-inflation.ts";
import { trendsAudiencePlayerScope } from "./championship-trends-player-scope.ts";
import { TRENDS_AUDIENCE } from "./championship-trends-window.ts";
import { PLAYER_RATING } from "./player-rating.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

function attendance(
	playerId: number,
	rating: number,
	ratingDelta: number,
	voteDelta = 0,
) {
	return {
		id: playerId,
		event_id: 1,
		player_id: playerId,
		display_name: `P${playerId}`,
		is_goalkeeper: false,
		event_date: "2026-01-01",
		goals: 0,
		assists: 0,
		assisted_goals: 0,
		own_goals: 0,
		wins: 3,
		losses: 0,
		draws: 0,
		matches: 3,
		rating,
		rating_delta: ratingDelta,
		goalkeeper_rating: 0,
		goalkeeper_rating_delta: 0,
		vote_rating_delta: voteDelta,
		goalkeeper_vote_rating_delta: 0,
		is_mvp: false,
		mvp_overridden: false,
	};
}

function eventRow(
	id: number,
	day: string,
	rows: ReturnType<typeof attendance>[],
): ChampionshipEvent {
	return {
		id,
		championship_id: 1,
		starts_at: `${day}T22:00:00.000Z`,
		players_per_team: 5,
		skip_guest_goalkeeper_matches: false,
		ended_at: `${day}T23:00:00.000Z`,
		attendance: rows,
		rsvps: [],
		teams: [],
		matches: [],
	};
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

const players = [player(1, "Ana", 5), player(2, "Bruno", 6)];

const events = [
	eventRow(1, "2026-01-01", [
		attendance(1, 4, 0),
		attendance(2, 6, 0),
	]),
	eventRow(2, "2026-01-08", [attendance(1, 4.5, 0.5)]),
];

const summary = championshipRatingInflation(players, events);
check(summary.events === 2, "two chart rows");
check(summary.rows[0]?.averageRating === 5, "average 4 and 6");
check(summary.rows[0]?.ceiling === 6, "ceiling max 6");
check(summary.rows[0]?.floor === 4, "floor min 4");
check(summary.rows[1]?.averageRating === 5, "second round average");

const sentinelEvent = eventRow(3, "2026-01-15", [
	attendance(1, PLAYER_RATING.default, 0),
]);
const sentinelSummary = championshipRatingInflation(players, [
	...events,
	sentinelEvent,
]);
check(sentinelSummary.events === 2, "sentinel skips row");

const monthlyPlayers = [
	player(1, "Ana", 5, true),
	player(2, "Bruno", 6, false),
	player(3, "Carla", 7, true),
];
const monthlyEvents = [
	eventRow(1, "2026-01-01", [
		attendance(1, 4, 0),
		attendance(2, 6, 0),
		attendance(3, 7, 0),
	]),
];
const monthlyScope = trendsAudiencePlayerScope(
	monthlyPlayers,
	TRENDS_AUDIENCE.monthly,
);
const monthlySummary = championshipRatingInflation(
	monthlyPlayers,
	monthlyEvents,
	monthlyScope,
);
check(monthlySummary.events === 1, "monthly inflation row");
check(monthlySummary.rows[0]?.averageRating === 5.5, "monthly average 4 and 7");
check(monthlySummary.rows[0]?.ceiling === 7, "monthly ceiling");
check(monthlySummary.rows[0]?.floor === 4, "monthly floor");

const chart = championshipRatingInflationChart(summary);
check(chart.length === 2, "chart points");
check(chart[0]?.floorLabel.length > 0, "floor label");

console.log("championship-rating-inflation.check.ts ok");
