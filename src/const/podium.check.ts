import type { ChampionshipPlayer } from "../types/championship.ts";
import type { ChampionshipEvent } from "../types/championship-event.ts";
import {
	aggregatePodiumPlayersFromEvents,
	eventMatchesPodiumPeriod,
	formatPodiumMetric,
	PODIUM_DEFAULT_METRIC,
	PODIUM_DISPLAY_ORDER,
	PODIUM_FILTER_LABEL,
	PODIUM_LABEL,
	PODIUM_METRICS,
	PODIUM_PLACE,
	PODIUM_PLACES,
	PODIUM_SEASON_YEAR,
	PODIUM_SEMESTER,
	parsePodiumMetric,
	podiumStandings,
	rankPodiumRows,
	togglePodiumSeason,
	togglePodiumSemester,
} from "./podium.ts";
import { ROSTER_COLUMN, toRosterRow } from "./roster-stats.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

check(PODIUM_PLACE.first === 1, "first place");
check(PODIUM_PLACE.second === 2, "second place");
check(PODIUM_PLACE.third === 3, "third place");
check(PODIUM_PLACES.join(",") === "1,2,3", "places order");
check(PODIUM_DISPLAY_ORDER.join(",") === "2,1,3", "display 2-1-3");
check(PODIUM_DEFAULT_METRIC === ROSTER_COLUMN.goals, "default goals");
check(PODIUM_LABEL.tab === "Pódio", "tab label");
check(parsePodiumMetric("goals") === ROSTER_COLUMN.goals, "parse goals");
check(parsePodiumMetric("assists") === ROSTER_COLUMN.assists, "parse assists");
check(parsePodiumMetric("rating") === ROSTER_COLUMN.rating, "parse rating");
check(parsePodiumMetric("nope") === PODIUM_DEFAULT_METRIC, "parse fallback");
check(PODIUM_METRICS[0] === ROSTER_COLUMN.rating, "rating first in select");
check(formatPodiumMetric(ROSTER_COLUMN.rating, 8) === "8", "format rating");
check(formatPodiumMetric(ROSTER_COLUMN.goals, 4) === "4", "format goals");

function player(
	id: number,
	displayName: string,
	stats: Partial<ChampionshipPlayer>,
): ChampionshipPlayer {
	return {
		id,
		championship_id: 1,
		user_id: null,
		display_name: displayName,
		nickname: null,
		avatar_url: null,
		rating: 5,
		role: "member",
		deleted_at: null,
		goals: 0,
		assists: 0,
		own_goals: 0,
		wins: 0,
		matches: 0,
		...stats,
	};
}

const ana = toRosterRow(player(1, "Ana", { goals: 4, rating: 6 }));
const bruno = toRosterRow(player(2, "Bruno", { goals: 4, rating: 8 }));
const caio = toRosterRow(player(3, "Caio", { goals: 1, rating: 7 }));
const dora = toRosterRow(
	player(4, "Dora", { goals: 0, rating: 9, nickname: "Dora" }),
);

const ranked = rankPodiumRows([ana, bruno, caio, dora], ROSTER_COLUMN.goals);
check(
	ranked.map((row) => row.display_name).join(",") === "Bruno,Ana,Caio,Dora",
	"goals then rating then name",
);

const standings = podiumStandings(ranked, ROSTER_COLUMN.goals);
check(standings.length === 3, "top three with goals");
check(standings[0]?.place === PODIUM_PLACE.first, "first standing");
check(standings[0]?.row.display_name === "Bruno", "first is bruno");
check(standings[1]?.row.display_name === "Ana", "second is ana");
check(standings[2]?.row.display_name === "Caio", "third is caio");

const zeros = rankPodiumRows(
	[
		toRosterRow(player(1, "Ana", { goals: 0 })),
		toRosterRow(player(2, "Bruno", { goals: 0 })),
	],
	ROSTER_COLUMN.goals,
);
check(podiumStandings(zeros, ROSTER_COLUMN.goals).length === 0, "empty podium");

const onlyOne = rankPodiumRows(
	[
		toRosterRow(player(1, "Ana", { goals: 2 })),
		toRosterRow(player(2, "Bruno", { goals: 0 })),
		toRosterRow(player(3, "Caio", { goals: 0 })),
	],
	ROSTER_COLUMN.goals,
);
const partial = podiumStandings(onlyOne, ROSTER_COLUMN.goals);
check(partial.length === 1, "partial podium");
check(partial[0]?.row.display_name === "Ana", "only ana on podium");

const skippedZero = rankPodiumRows(
	[
		toRosterRow(player(1, "Ana", { goals: 5 })),
		toRosterRow(player(2, "Bruno", { goals: 0 })),
		toRosterRow(player(3, "Caio", { goals: 3 })),
	],
	ROSTER_COLUMN.goals,
);
const skipped = podiumStandings(skippedZero, ROSTER_COLUMN.goals);
check(skipped.length === 2, "skips zero between scorers");
check(skipped[0]?.row.display_name === "Ana", "scorer first");
check(skipped[1]?.place === PODIUM_PLACE.second, "next scorer is second");
check(skipped[1]?.row.display_name === "Caio", "caio second not third");

const nickTie = rankPodiumRows(
	[
		toRosterRow(
			player(1, "Ana Souza", { goals: 3, rating: 5, nickname: "Zeca" }),
		),
		toRosterRow(player(2, "Bruno", { goals: 3, rating: 5, nickname: "Bia" })),
	],
	ROSTER_COLUMN.goals,
);
check(nickTie[0]?.nickname === "Bia", "tie uses visible name");

const byRating = rankPodiumRows([ana, bruno, caio, dora], ROSTER_COLUMN.rating);
check(
	byRating.map((row) => row.display_name).join(",") === "Dora,Bruno,Caio,Ana",
	"rating order",
);
const ratingStandings = podiumStandings(byRating, ROSTER_COLUMN.rating);
check(ratingStandings.length === 3, "rating podium top three");
check(ratingStandings[0]?.row.display_name === "Dora", "highest rating first");
check(
	podiumStandings(
		rankPodiumRows(
			[
				toRosterRow(player(1, "Ana", { rating: 0 })),
				toRosterRow(player(2, "Bruno", { rating: 0 })),
			],
			ROSTER_COLUMN.rating,
		),
		ROSTER_COLUMN.rating,
	).length === 0,
	"zero rating empty podium",
);

check(PODIUM_SEASON_YEAR === 2026, "season year");
check(PODIUM_FILTER_LABEL.season === "Temporada 2026", "season label");
check(
	PODIUM_FILTER_LABEL[PODIUM_SEMESTER.first] === "Primeiro Semestre",
	"first semester label",
);
check(
	PODIUM_FILTER_LABEL[PODIUM_SEMESTER.second] === "Segundo Semestre",
	"second semester label",
);

const march = "2026-03-15T12:00:00.000Z";
const july = "2026-07-15T12:00:00.000Z";
const lastYear = "2025-03-15T12:00:00.000Z";
check(
	eventMatchesPodiumPeriod(march, PODIUM_SEASON_YEAR, null),
	"march in season",
);
check(
	eventMatchesPodiumPeriod(july, PODIUM_SEASON_YEAR, null),
	"july in season",
);
check(
	!eventMatchesPodiumPeriod(lastYear, PODIUM_SEASON_YEAR, null),
	"last year out",
);
check(
	eventMatchesPodiumPeriod(march, PODIUM_SEASON_YEAR, PODIUM_SEMESTER.first),
	"march in h1",
);
check(
	!eventMatchesPodiumPeriod(july, PODIUM_SEASON_YEAR, PODIUM_SEMESTER.first),
	"july out of h1",
);
check(
	eventMatchesPodiumPeriod(july, PODIUM_SEASON_YEAR, PODIUM_SEMESTER.second),
	"july in h2",
);
check(
	!eventMatchesPodiumPeriod(march, PODIUM_SEASON_YEAR, PODIUM_SEMESTER.second),
	"march out of h2",
);

check(togglePodiumSeason(true).seasonOn === false, "season off");
check(togglePodiumSeason(true).semester === null, "season off clears semester");
check(togglePodiumSeason(false).seasonOn === true, "season on");
check(
	togglePodiumSemester(null, PODIUM_SEMESTER.first).semester ===
		PODIUM_SEMESTER.first,
	"select h1",
);
check(
	togglePodiumSemester(null, PODIUM_SEMESTER.first).seasonOn === true,
	"semester enables season",
);
check(
	togglePodiumSemester(PODIUM_SEMESTER.first, PODIUM_SEMESTER.first)
		.semester === null,
	"same semester clears",
);
check(
	togglePodiumSemester(PODIUM_SEMESTER.first, PODIUM_SEMESTER.second)
		.semester === PODIUM_SEMESTER.second,
	"switch semester",
);

function attendanceRow(
	playerId: number,
	stats: {
		goals: number;
		assists: number;
		own_goals: number;
		wins: number;
		matches: number;
		rating: number;
	},
) {
	return {
		id: playerId,
		event_id: 1,
		player_id: playerId,
		display_name: "x",
		is_goalkeeper: false,
		event_date: "2026-03-15",
		rating_delta: 0,
		...stats,
	};
}

function eventAt(
	id: number,
	startsAt: string,
	attendance: ChampionshipEvent["attendance"],
): ChampionshipEvent {
	return {
		id,
		championship_id: 1,
		starts_at: startsAt,
		players_per_team: 5,
		ended_at: null,
		attendance,
		teams: [],
		matches: [],
	};
}

const anaPlayer = player(1, "Ana", { goals: 99, rating: 9 });
const brunoPlayer = player(2, "Bruno", { goals: 99, rating: 9 });
const aggregated = aggregatePodiumPlayersFromEvents(
	[anaPlayer, brunoPlayer],
	[
		eventAt(1, march, [
			attendanceRow(1, {
				goals: 2,
				assists: 1,
				own_goals: 0,
				wins: 1,
				matches: 2,
				rating: 6,
			}),
		]),
		eventAt(2, july, [
			attendanceRow(1, {
				goals: 3,
				assists: 0,
				own_goals: 1,
				wins: 2,
				matches: 3,
				rating: 8,
			}),
			attendanceRow(2, {
				goals: 1,
				assists: 0,
				own_goals: 0,
				wins: 0,
				matches: 1,
				rating: 4,
			}),
		]),
		eventAt(3, lastYear, [
			attendanceRow(1, {
				goals: 50,
				assists: 50,
				own_goals: 50,
				wins: 50,
				matches: 50,
				rating: 50,
			}),
		]),
	],
	PODIUM_SEASON_YEAR,
	null,
);
check(aggregated.length === 2, "season has two players");
const anaAgg = aggregated.find((row) => row.id === 1);
const brunoAgg = aggregated.find((row) => row.id === 2);
check(anaAgg?.goals === 5, "ana goals summed");
check(anaAgg?.assists === 1, "ana assists summed");
check(anaAgg?.own_goals === 1, "ana own goals summed");
check(anaAgg?.wins === 3, "ana wins summed");
check(anaAgg?.matches === 5, "ana matches summed");
check(anaAgg?.rating === 7, "ana rating averaged");
check(brunoAgg?.goals === 1, "bruno july only");
check(anaAgg?.goals !== 99, "ignores championship totals");

const h1Only = aggregatePodiumPlayersFromEvents(
	[anaPlayer, brunoPlayer],
	[
		eventAt(1, march, [
			attendanceRow(1, {
				goals: 2,
				assists: 1,
				own_goals: 0,
				wins: 1,
				matches: 2,
				rating: 6,
			}),
		]),
		eventAt(2, july, [
			attendanceRow(2, {
				goals: 1,
				assists: 0,
				own_goals: 0,
				wins: 0,
				matches: 1,
				rating: 4,
			}),
		]),
	],
	PODIUM_SEASON_YEAR,
	PODIUM_SEMESTER.first,
);
check(h1Only.length === 1, "h1 drops bruno");
check(h1Only[0]?.id === 1, "h1 keeps ana");
check(h1Only[0]?.goals === 2, "h1 ana march only");

console.log("podium ok");
