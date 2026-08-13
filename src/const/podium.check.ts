import type { ChampionshipPlayer } from "../types/championship.ts";
import {
	PODIUM_DEFAULT_METRIC,
	PODIUM_DISPLAY_ORDER,
	PODIUM_LABEL,
	PODIUM_PLACE,
	PODIUM_PLACES,
	parsePodiumMetric,
	podiumStandings,
	rankPodiumRows,
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
check(parsePodiumMetric("nope") === PODIUM_DEFAULT_METRIC, "parse fallback");

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

console.log("podium ok");
