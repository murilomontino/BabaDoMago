import type { ChampionshipPlayer } from "../types/championship.ts";
import type { ChampionshipEvent } from "../types/championship-event.ts";
import {
	aggregatePodiumPlayersFromEvents,
	eventMatchesPodiumPeriod,
	formatPodiumMetric,
	isPodiumAllMonthsSelected,
	isPodiumCurrentMonthSelected,
	isPodiumPlayerMetric,
	PODIUM_DEFAULT_METRIC,
	PODIUM_DISPLAY_ORDER,
	PODIUM_FILTER_LABEL,
	PODIUM_LABEL,
	PODIUM_METRIC,
	PODIUM_METRICS,
	PODIUM_MONTHS,
	PODIUM_PLACE,
	PODIUM_PLACES,
	PODIUM_PLAYER_METRIC_OPTIONS,
	PODIUM_SEASON_YEAR,
	PODIUM_SEMESTER,
	parsePodiumMetric,
	parsePodiumMonth,
	podiumStandings,
	rankPodiumRows,
	selectPodiumAllMonths,
	selectPodiumCurrentMonth,
	togglePodiumMonth,
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
check(
	parsePodiumMetric("assisted_goals") === ROSTER_COLUMN.assisted_goals,
	"parse assisted goals",
);
check(parsePodiumMetric("rating") === ROSTER_COLUMN.rating, "parse rating");
check(parsePodiumMetric("synergy") === PODIUM_METRIC.synergy, "parse synergy");
check(parsePodiumMetric("nope") === PODIUM_DEFAULT_METRIC, "parse fallback");
check(PODIUM_METRICS[0] === ROSTER_COLUMN.rating, "rating first in select");
check(PODIUM_METRICS.length === 13, "podium metrics frozen");
check(
	PODIUM_PLAYER_METRIC_OPTIONS.length === PODIUM_METRICS.length - 1,
	"event podium skips synergy",
);
check(isPodiumPlayerMetric(ROSTER_COLUMN.goals), "goals is player metric");
check(!isPodiumPlayerMetric(PODIUM_METRIC.synergy), "synergy is not player");
check(formatPodiumMetric(ROSTER_COLUMN.rating, 8) === "8", "format rating");
check(formatPodiumMetric(ROSTER_COLUMN.goals, 4) === "4", "format goals");
check(
	formatPodiumMetric(PODIUM_METRIC.synergy, 0.5) === "50%",
	"format synergy",
);

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
		assisted_goals: 0,
		own_goals: 0,
		wins: 0,
		losses: 0,
		draws: 0,
		matches: 0,
		mvps: 0,
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
check(standings.length === 2, "two distinct goal totals");
check(standings[0]?.place === PODIUM_PLACE.first, "first standing");
check(
	standings[0]?.rows.map((row) => row.display_name).join(",") === "Bruno,Ana",
	"tied first bruno and ana",
);
check(standings[1]?.place === PODIUM_PLACE.second, "second standing");
check(standings[1]?.rows[0]?.display_name === "Caio", "caio second");

const secondTie = podiumStandings(
	rankPodiumRows(
		[
			toRosterRow(player(1, "Ana", { goals: 5 })),
			toRosterRow(player(2, "Bruno", { goals: 3 })),
			toRosterRow(player(3, "Caio", { goals: 3 })),
			toRosterRow(player(4, "Dora", { goals: 2 })),
		],
		ROSTER_COLUMN.goals,
	),
	ROSTER_COLUMN.goals,
);
check(secondTie.length === 3, "three distinct scores");
check(secondTie[0]?.rows[0]?.display_name === "Ana", "solo first");
check(
	secondTie[1]?.rows.map((row) => row.display_name).join(",") === "Bruno,Caio",
	"tied second",
);
check(secondTie[2]?.rows[0]?.display_name === "Dora", "third after tie");

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
check(partial[0]?.rows[0]?.display_name === "Ana", "only ana on podium");

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
check(skipped[0]?.rows[0]?.display_name === "Ana", "scorer first");
check(skipped[1]?.place === PODIUM_PLACE.second, "next scorer is second");
check(skipped[1]?.rows[0]?.display_name === "Caio", "caio second not third");

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
check(
	ratingStandings[0]?.rows[0]?.display_name === "Dora",
	"highest rating first",
);
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
check(PODIUM_FILTER_LABEL.currentMonth === "Mês atual", "current month label");
check(PODIUM_FILTER_LABEL.allMonths === "Todos", "all months label");
check(PODIUM_MONTHS.length === 12, "twelve months");

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

check(parsePodiumMonth(8) === 8, "parse august");
check(parsePodiumMonth(0) === null, "parse invalid month");
check(togglePodiumMonth([], 3).join(",") === "3", "select march");
check(togglePodiumMonth([3], 7).join(",") === "3,7", "add july");
check(togglePodiumMonth([3, 7], 3).join(",") === "7", "deselect march");
check(
	selectPodiumCurrentMonth(8).join(",") === "8",
	"current month only august",
);
check(isPodiumCurrentMonthSelected([8], 8), "current month selected");
check(!isPodiumCurrentMonthSelected([8, 9], 8), "current month not exclusive");
check(!isPodiumCurrentMonthSelected([], 8), "empty is not current month");
check(
	selectPodiumAllMonths().join(",") === "1,2,3,4,5,6,7,8,9,10,11,12",
	"all months",
);
check(
	isPodiumAllMonthsSelected(selectPodiumAllMonths()),
	"all months selected",
);
check(!isPodiumAllMonthsSelected([1, 2]), "partial is not all months");
check(!isPodiumAllMonthsSelected([]), "empty is not all months");
check(
	eventMatchesPodiumPeriod(march, PODIUM_SEASON_YEAR, null, [3]),
	"month filter march",
);
check(
	!eventMatchesPodiumPeriod(july, PODIUM_SEASON_YEAR, null, [3]),
	"month filter drops july",
);
check(
	eventMatchesPodiumPeriod(
		july,
		PODIUM_SEASON_YEAR,
		PODIUM_SEMESTER.first,
		[7],
	),
	"months override semester",
);

function attendanceRow(
	playerId: number,
	stats: {
		goals: number;
		assists: number;
		assisted_goals?: number;
		own_goals: number;
		wins: number;
		losses?: number;
		draws?: number;
		matches: number;
		rating: number;
		is_mvp?: boolean;
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
		losses: stats.losses ?? 0,
		draws: stats.draws ?? 0,
		assisted_goals: stats.assisted_goals ?? 0,
		is_mvp: stats.is_mvp === true,
		mvp_overridden: false,
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
		skip_guest_goalkeeper_matches: true,
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
				assisted_goals: 1,
				own_goals: 0,
				wins: 1,
				matches: 2,
				rating: 6,
				is_mvp: true,
			}),
		]),
		eventAt(2, july, [
			attendanceRow(1, {
				goals: 3,
				assists: 0,
				assisted_goals: 2,
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
check(anaAgg?.assisted_goals === 3, "ana assisted goals summed");
check(anaAgg?.own_goals === 1, "ana own goals summed");
check(anaAgg?.wins === 3, "ana wins summed");
check(anaAgg?.mvps === 1, "ana mvps summed");
check(anaAgg?.matches === 5, "ana matches summed");
check(anaAgg?.rating === 9, "ana rating stays live");
check(brunoAgg?.goals === 1, "bruno july only");
check(brunoAgg?.rating === 9, "bruno rating stays live");
check(anaAgg?.goals !== 99, "ignores championship totals");

const h1Only = aggregatePodiumPlayersFromEvents(
	[anaPlayer, brunoPlayer],
	[
		eventAt(1, march, [
			attendanceRow(1, {
				goals: 2,
				assists: 1,
				assisted_goals: 1,
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

const julyOnly = aggregatePodiumPlayersFromEvents(
	[anaPlayer, brunoPlayer],
	[
		eventAt(1, march, [
			attendanceRow(1, {
				goals: 2,
				assists: 1,
				assisted_goals: 1,
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
	null,
	[7],
);
check(julyOnly.length === 1, "july month drops ana");
check(julyOnly[0]?.id === 2, "july month keeps bruno");

console.log("podium ok");
