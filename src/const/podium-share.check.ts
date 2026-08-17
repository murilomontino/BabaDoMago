import type { ChampionshipPlayer } from "../types/championship.ts";
import {
	PODIUM_METRIC,
	PODIUM_PLACE,
	PODIUM_SEMESTER,
	podiumStandings,
	rankPodiumRows,
	selectPodiumAllMonths,
} from "./podium.ts";
import {
	PODIUM_SHARE,
	podiumShareAllFileName,
	podiumShareAllText,
	podiumShareCardFromStandings,
	podiumShareCardsFromPlayers,
	podiumShareFileName,
	podiumShareHeading,
	podiumSharePeriodSlug,
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
		is_goalkeeper: false,
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

check(podiumShareHeading(ROSTER_COLUMN.goals), "Pódio · Gols");
check(podiumShareHeading(PODIUM_METRIC.synergy), "Pódio · Sinergia");
check(podiumSharePeriodSlug(null, []), "Temporada 2026");
check(podiumSharePeriodSlug(PODIUM_SEMESTER.first, []), "Primeiro Semestre");
check(podiumSharePeriodSlug(null, [8]), "Agosto");
check(podiumSharePeriodSlug(null, [1, 3]), "Janeiro-Março");
check(podiumSharePeriodSlug(null, selectPodiumAllMonths()), "Temporada 2026");

const shareParts = {
	championshipName: "Baba do Mago",
	context: podiumSharePeriodSlug(null, []),
	generatedAt: "2026-08-14T13:00:00.000Z",
};
check(
	podiumShareFileName(ROSTER_COLUMN.goals, shareParts),
	"podio-baba-do-mago-gols-temporada-2026-14-08-2026.png",
);
check(
	podiumShareFileName(PODIUM_METRIC.synergy, shareParts),
	"podio-baba-do-mago-sinergia-temporada-2026-14-08-2026.png",
);
check(
	podiumShareFileName(ROSTER_COLUMN.own_goals, shareParts),
	"podio-baba-do-mago-gols-contra-temporada-2026-14-08-2026.png",
);
check(
	podiumShareFileName(ROSTER_COLUMN.assists, {
		...shareParts,
		context: podiumSharePeriodSlug(PODIUM_SEMESTER.first, []),
	}),
	"podio-baba-do-mago-assistencias-primeiro-semestre-14-08-2026.png",
);
check(
	podiumShareFileName(ROSTER_COLUMN.goals, {
		...shareParts,
		context: podiumSharePeriodSlug(null, [8]),
	}),
	"podio-baba-do-mago-gols-agosto-14-08-2026.png",
);
check(
	podiumShareAllFileName(shareParts),
	"podio-baba-do-mago-tudo-temporada-2026-14-08-2026.png",
);
check(PODIUM_SHARE.fileAll, "tudo");

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

const tied = toRosterRow(player(4, "Dora", { goals: 4, rating: 6 }));
const tiedRanked = rankPodiumRows([ana, bruno, tied], ROSTER_COLUMN.goals);
const tiedCard = podiumShareCardFromStandings(
	podiumStandings(tiedRanked, ROSTER_COLUMN.goals),
	ROSTER_COLUMN.goals,
);
if (!tiedCard) {
	throw new Error("expected tied card");
}
check(
	podiumShareText(tiedCard),
	"Pódio · Gols\n1º Bruno — 4\n1º Dora — 4\n2º Nena — 3",
);
const tiedDisplay = podiumSharePlacesInDisplayOrder(tiedCard.places);
check(
	tiedDisplay.map((place) => `${place.place}:${place.name}`).join("|"),
	"2:Nena|1:Bruno|1:Dora",
);

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
	cards.some((item) => item.metric === ROSTER_COLUMN.assisted_goals),
	false,
);
check(
	cards.some((item) => item.metric === ROSTER_COLUMN.own_goals),
	false,
);
check(
	podiumShareCardsFromPlayers([player(1, "Ana", { assisted_goals: 2 })]).some(
		(item) => item.metric === ROSTER_COLUMN.assisted_goals,
	),
	true,
);
check(
	podiumShareAllText(
		cards.filter((item) => item.metric === ROSTER_COLUMN.goals),
	),
	"Pódio · Gols\n1º Ana — 4\n2º Bruno — 2",
);
