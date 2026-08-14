import type { ChampionshipPlayer } from "../types/championship.ts";
import { PODIUM_PLACE, podiumStandings, rankPodiumRows } from "./podium.ts";
import {
	PODIUM_SHARE,
	podiumShareAllText,
	podiumShareCardFromStandings,
	podiumShareCardsFromPlayers,
	podiumShareFileName,
	podiumShareHeading,
	podiumSharePlacesInDisplayOrder,
	podiumShareText,
} from "./podium-share.ts";
import { ROSTER_COLUMN, toRosterRow } from "./roster-stats.ts";

function check(actual: unknown, expected: unknown): void {
	if (actual !== expected) {
		throw new Error(`expected ${String(expected)}, got ${String(actual)}`);
	}
}

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

check(podiumShareHeading(ROSTER_COLUMN.goals), "Pódio · Gols");
check(podiumShareFileName(ROSTER_COLUMN.goals), "podio-goals.png");
check(podiumShareFileName(ROSTER_COLUMN.own_goals), "podio-own_goals.png");
check(PODIUM_SHARE.fileAll, "podio-tudo.png");

const bruno = toRosterRow(player(2, "Bruno", { goals: 4, rating: 8 }));
const ana = toRosterRow(
	player(1, "Ana Souza", { goals: 3, rating: 6, nickname: "Nena" }),
);
const caio = toRosterRow(player(3, "Caio", { goals: 1, rating: 7 }));
const ranked = rankPodiumRows([ana, bruno, caio], ROSTER_COLUMN.goals);
const standings = podiumStandings(ranked, ROSTER_COLUMN.goals);
const card = podiumShareCardFromStandings(standings, ROSTER_COLUMN.goals);

check(card?.title, "Pódio · Gols");
check(card?.places.length, 3);
check(card?.places[0]?.place, PODIUM_PLACE.first);
check(card?.places[0]?.name, "Bruno");
check(card?.places[0]?.value, "4");
check(card?.places[1]?.name, "Nena");
if (!card) {
	throw new Error("expected card");
}

check(
	podiumShareText(card),
	"Pódio · Gols\n1º Bruno — 4\n2º Nena — 3\n3º Caio — 1",
);

const display = podiumSharePlacesInDisplayOrder(card?.places ?? []);
check(display.map((place) => place.place).join(","), "2,1,3");

check(podiumShareCardFromStandings([], ROSTER_COLUMN.goals), null);

const cards = podiumShareCardsFromPlayers([
	player(1, "Ana", { goals: 4, assists: 0 }),
	player(2, "Bruno", { goals: 2, assists: 3 }),
]);
check(
	cards.some((item) => item.metric === ROSTER_COLUMN.goals),
	true,
);
check(
	cards.some((item) => item.metric === ROSTER_COLUMN.assists),
	true,
);
check(
	cards.some((item) => item.metric === ROSTER_COLUMN.own_goals),
	false,
);
check(
	podiumShareAllText(
		cards.filter((item) => item.metric === ROSTER_COLUMN.goals),
	),
	"Pódio · Gols\n1º Ana — 4\n2º Bruno — 2",
);
