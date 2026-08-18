import type { ChampionshipPlayer } from "../types/championship.ts";
import { PLAYER_SEARCH } from "./player-search.ts";
import {
	ROSTER_SHARE,
	ROSTER_SHARE_LABEL,
	ROSTER_SHARE_STAT_COLUMNS,
	rosterShareCard,
	rosterShareFileName,
	rosterShareHeading,
	rosterShareImageHeight,
	rosterShareLegendLines,
	rosterSharePlayerName,
	rosterShareStatColumnWidth,
	rosterShareText,
} from "./roster-share.ts";
import { ROSTER_COLUMN } from "./roster-stats.ts";

function check(actual: unknown, expected: unknown): void {
	if (actual !== expected) {
		throw new Error(`expected ${String(expected)}, got ${String(actual)}`);
	}
}

function player(
	id: number,
	displayName: string,
	stats: Partial<ChampionshipPlayer> = {},
): ChampionshipPlayer {
	return {
		id,
		championship_id: 1,
		user_id: null,
		display_name: displayName,
		nickname: null,
		nickname_tags: [],
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

check(ROSTER_SHARE.title, "Elenco");
check(ROSTER_SHARE_LABEL.share, "Compartilhar elenco");
check(rosterShareHeading(2), `Elenco · 2 ${PLAYER_SEARCH.countLabel}`);
check(
	rosterSharePlayerName(player(1, "Ana Souza", { nickname: "Nena" })),
	"Nena",
);
check(
	rosterSharePlayerName(
		player(2, "Bruno", { is_goalkeeper: true, nickname: null }),
	),
	"Bruno GOL",
);

check(ROSTER_SHARE_STAT_COLUMNS.includes(ROSTER_COLUMN.goals), true);
check(ROSTER_SHARE_STAT_COLUMNS.includes(ROSTER_COLUMN.assists), true);
check(ROSTER_SHARE_STAT_COLUMNS.includes(ROSTER_COLUMN.goalInvolvement), true);
check(ROSTER_SHARE_STAT_COLUMNS.includes(ROSTER_COLUMN.wins), true);
check(ROSTER_SHARE_STAT_COLUMNS.includes(ROSTER_COLUMN.mvps), true);
check(ROSTER_SHARE_STAT_COLUMNS.includes(ROSTER_COLUMN.matches), true);
check(ROSTER_SHARE_STAT_COLUMNS.includes(ROSTER_COLUMN.goalsAverage), true);
check(ROSTER_SHARE_STAT_COLUMNS.includes(ROSTER_COLUMN.assistsAverage), true);
check(ROSTER_SHARE_STAT_COLUMNS.includes(ROSTER_COLUMN.winRate), true);
check(ROSTER_SHARE_STAT_COLUMNS.includes(ROSTER_COLUMN.own_goals), true);
check(ROSTER_SHARE_STAT_COLUMNS.includes(ROSTER_COLUMN.assisted_goals), false);
check(ROSTER_SHARE_STAT_COLUMNS.includes(ROSTER_COLUMN.losses), false);
check(ROSTER_SHARE_STAT_COLUMNS.includes(ROSTER_COLUMN.draws), false);

const card = rosterShareCard(
	[
		player(1, "Ana Souza", {
			nickname: "Nena",
			rating: 6,
			goals: 4,
			assists: 2,
			matches: 6,
			wins: 3,
			is_goalkeeper: true,
			avatar_url: "https://example.com/ana.png",
		}),
		player(2, "Bruno", { rating: 8, goals: 1, matches: 4, wins: 2 }),
		player(3, "Caio", { rating: 8, goals: 0, matches: 2, wins: 1 }),
	],
	"Baba do Mago",
);

check(card.championshipName, "Baba do Mago");
check(card.title, rosterShareHeading(3));
check(card.players.length, 3);
check(card.players[0]?.name, "Bruno");
check(card.players[0]?.rating, 8);
check(card.players[1]?.name, "Caio");
check(card.players[2]?.name, "Nena GOL");
check(card.players[2]?.avatarUrl, "https://example.com/ana.png");
check(card.players[2]?.stats[0]?.id, ROSTER_COLUMN.goals);
check(card.players[2]?.stats[0]?.abbr, "G");
check(card.players[2]?.stats[0]?.value, "4");

const goalsIndex = card.players[0]?.stats.findIndex(
	(stat) => stat.id === ROSTER_COLUMN.goals,
);
const winRateIndex = card.players[0]?.stats.findIndex(
	(stat) => stat.id === ROSTER_COLUMN.winRate,
);
check(card.players[0]?.stats[goalsIndex ?? -1]?.value, "1");
check(card.players[0]?.stats[winRateIndex ?? -1]?.value, "50%");

check(
	rosterShareFileName({
		championshipName: "Baba do Mago",
		generatedAt: "2026-08-14T13:00:00.000Z",
	}),
	"elenco-baba-do-mago-14-08-2026.png",
);
check(
	rosterShareFileName({
		championshipName: "",
		generatedAt: "nope",
	}),
	ROSTER_SHARE.fileName,
);

const text = rosterShareText(card);
check(text.startsWith("Baba do Mago\nElenco · 3 jogadores\nBruno —"), true);
check(text.includes("Nena GOL —"), true);
check(text.includes("G 4"), true);

const emptyCard = rosterShareCard([], "");
check(emptyCard.players.length, 0);
check(emptyCard.title, rosterShareHeading(0));
check(rosterShareText(emptyCard), "Elenco · 0 jogadores");

const legendLines = rosterShareLegendLines();
check(legendLines.length > 0, true);
check(legendLines[0]?.startsWith("Jog Jogador"), true);

check(rosterShareStatColumnWidth() > 0, true);
check(
	rosterShareImageHeight(0, 1),
	ROSTER_SHARE.padding * 2 +
		ROSTER_SHARE.headerHeight +
		ROSTER_SHARE.tableHeaderHeight +
		ROSTER_SHARE.gap +
		ROSTER_SHARE.legendLineHeight,
);
check(
	rosterShareImageHeight(2, 2),
	ROSTER_SHARE.padding * 2 +
		ROSTER_SHARE.headerHeight +
		ROSTER_SHARE.tableHeaderHeight +
		ROSTER_SHARE.rowHeight * 2 +
		ROSTER_SHARE.gap +
		ROSTER_SHARE.legendLineHeight * 2,
);
