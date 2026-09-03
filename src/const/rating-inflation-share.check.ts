import {
	championshipRatingInflation,
	championshipRatingInflationChart,
} from "./championship-rating-inflation.ts";
import {
	RATING_INFLATION_SHARE,
	RATING_INFLATION_SHARE_LABEL,
	RATING_INFLATION_SHARE_SERIES,
	ratingInflationShareCard,
	ratingInflationShareContext,
	ratingInflationShareFileName,
	ratingInflationShareImageHeight,
	ratingInflationShareSeriesLabel,
	ratingInflationShareText,
	ratingInflationShareYDomain,
} from "./rating-inflation-share.ts";
import type { ChampionshipPlayer } from "../types/championship.ts";
import type { ChampionshipEvent } from "../types/championship-event.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

function attendance(playerId: number, rating: number) {
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
		rating_delta: 0,
		vote_rating_delta: 0,
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

function player(id: number, name: string, rating: number): ChampionshipPlayer {
	return {
		id,
		championship_id: 1,
		user_id: null,
		display_name: name,
		nickname: null,
		nickname_tags: [],
		avatar_url: null,
		rating,
		role: "player",
		is_goalkeeper: false,
		is_monthly: false,
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
	eventRow(1, "2026-01-01", [attendance(1, 4), attendance(2, 6)]),
	eventRow(2, "2026-01-08", [attendance(1, 4.5), attendance(2, 6)]),
];
const summary = championshipRatingInflation(players, events);
const chart = championshipRatingInflationChart(summary);
const card = ratingInflationShareCard(
	summary,
	"Baba do Mago",
	"Mensalistas",
);

check(card.points.length === 2, "two share points");
check(card.title === RATING_INFLATION_SHARE.title, "title");
check(card.points[0]?.averageLabel.length > 0, "average label");
check(
	ratingInflationShareSeriesLabel(RATING_INFLATION_SHARE_SERIES.ceiling) ===
		"Teto",
	"ceiling label",
);
check(
	ratingInflationShareContext(["Todas as rodadas", "Mensalistas"]) ===
		"Todas as rodadas · Mensalistas",
	"context",
);
check(ratingInflationShareText(card).includes("Inflação da nota"), "share text");
check(
	ratingInflationShareFileName({
		championshipName: "Baba do Mago",
		generatedAt: "2026-09-03T12:00:00.000Z",
	}).endsWith(".png"),
	"png",
);
check(ratingInflationShareImageHeight() > RATING_INFLATION_SHARE.chartHeight, "height");
check(ratingInflationShareYDomain(card.points).max >= 6, "y domain");
check(chart.length === card.points.length, "chart sync");
check(RATING_INFLATION_SHARE_LABEL.share === "Compartilhar", "share label");

console.log("rating-inflation-share.check.ts ok");
