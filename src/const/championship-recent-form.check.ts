import type { ChampionshipPlayer } from "../types/championship.ts";
import type {
	ChampionshipEvent,
	ChampionshipEventAttendance,
} from "../types/championship-event.ts";
import {
	championshipRecentForm,
	formatRecentFormDelta,
	formatRecentFormRate,
	RECENT_FORM_TREND,
} from "./championship-recent-form.ts";
import {
	EVENT_RATING_ADJUSTMENT,
	eventRatingInDeadZone,
	eventRatingRate,
} from "./event-rating-adjustment.ts";
import { PLAYER_RATING } from "./player-rating.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

function player(id: number, name: string): ChampionshipPlayer {
	return {
		id,
		championship_id: 1,
		user_id: null,
		display_name: name,
		nickname: null,
		nickname_tags: [],
		avatar_url: null,
		role: "member",
		rating: 3,
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
		vote_rating_delta: partial.vote_rating_delta ?? 0,
		is_mvp: partial.is_mvp ?? false,
		mvp_overridden: false,
	};
}

function eventWith(
	id: number,
	rows: ChampionshipEventAttendance[],
): ChampionshipEvent {
	return {
		id,
		championship_id: 1,
		starts_at: `2026-01-${String(id).padStart(2, "0")}`,
		players_per_team: 5,
		skip_guest_goalkeeper_matches: false,
		ended_at: `2026-01-${String(id).padStart(2, "0")}`,
		attendance: rows,
		rsvps: [],
		teams: [],
		matches: [],
	};
}

const players = [player(1, "Joao"), player(2, "Pedro"), player(3, "Ana")];

const upEvent = eventWith(1, [
	attendance({
		player_id: 1,
		wins: 4,
		draws: 0,
		losses: 2,
		matches: 6,
		rating_delta: 0.4,
	}),
]);
const upRows = championshipRecentForm(players, [upEvent]);
check(upRows[0]?.trend === RECENT_FORM_TREND.up, "4V/2D is up");
check(upRows[0]?.rate === eventRatingRate(4, 0, 2, 6), "up rate");

const downEvent = eventWith(1, [
	attendance({
		player_id: 2,
		wins: 1,
		draws: 0,
		losses: 2,
		matches: 3,
		rating_delta: -0.4,
	}),
]);
const downRows = championshipRecentForm(players, [downEvent]);
check(downRows[0]?.trend === RECENT_FORM_TREND.down, "1V/2D is down");

const deadEvent = eventWith(1, [
	attendance({
		player_id: 1,
		wins: 1,
		draws: 2,
		losses: 1,
		matches: 4,
		rating_delta: 0.1,
		is_mvp: true,
	}),
]);
check(eventRatingInDeadZone(1, 2, 1, 4), "50% is dead zone formula");
const deadRows = championshipRecentForm(players, [deadEvent]);
check(deadRows[0]?.trend === RECENT_FORM_TREND.deadZone, "dead zone not down");
check(deadRows[0]?.ratingDeltaSum === 0.1, "mvp delta still shown");

const seedEvent = eventWith(1, [
	attendance({
		player_id: 3,
		wins: 3,
		draws: 0,
		losses: 0,
		matches: 3,
		rating: PLAYER_RATING.default,
		rating_delta: 3.5,
	}),
]);
const seedRows = championshipRecentForm(players, [seedEvent]);
check(seedRows[0]?.trend === RECENT_FORM_TREND.seed, "sentinel seed not up");

const voteEvent = eventWith(1, [
	attendance({
		player_id: 1,
		wins: 1,
		draws: 2,
		losses: 1,
		matches: 4,
		rating_delta: 0,
		vote_rating_delta: 0.5,
	}),
]);
const voteRows = championshipRecentForm(players, [voteEvent]);
check(
	voteRows[0]?.trend === RECENT_FORM_TREND.deadZone,
	"vote does not flip up",
);
check(voteRows[0]?.voteDeltaSum === 0.5, "vote sum shown");

const drawBonus = eventWith(1, [
	attendance({
		player_id: 1,
		wins: 0,
		draws: 3,
		losses: 0,
		matches: 3,
	}),
]);
const drawRows = championshipRecentForm(players, [drawBonus]);
check(
	drawRows[0]?.rate === eventRatingRate(0, 3, 0, 3),
	"3 draws use 1.5 points",
);
check(drawRows[0]?.rate === 4.5 / 9, "draw bonus rate 50%");
check(drawRows[0]?.trend === RECENT_FORM_TREND.deadZone, "3 draws dead zone");

const shortEvent = eventWith(1, [
	attendance({
		player_id: 1,
		wins: 2,
		draws: 0,
		losses: 0,
		matches: 2,
	}),
]);
const shortRows = championshipRecentForm(players, [shortEvent]);
check(
	shortRows[0]?.trend === RECENT_FORM_TREND.insufficient,
	"below min matches",
);
check(
	shortRows[0]?.matches < EVENT_RATING_ADJUSTMENT.minMatches,
	"insufficient matches",
);

check(formatRecentFormRate(0.667).endsWith("%"), "rate format");
check(formatRecentFormDelta(0.4) === "+0.4", "positive delta");
check(formatRecentFormDelta(-0.4) === "-0.4", "negative delta");

console.log("championship-recent-form ok");
