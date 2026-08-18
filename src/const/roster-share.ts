import type { ChampionshipPlayer } from "../types/championship.ts";
import { CHAMPIONSHIP_TAB_LABEL } from "./championship-tab.ts";
import { playerVisibleName } from "./player-name.ts";
import { PLAYER_RATING } from "./player-rating.ts";
import { PLAYER_SEARCH } from "./player-search.ts";
import {
	formatRosterStat,
	isRosterOptionalColumn,
	ROSTER_COLUMN,
	ROSTER_COLUMN_ABBR,
	ROSTER_COLUMN_LABEL,
	ROSTER_DEFAULT_COLUMN_VISIBILITY,
	ROSTER_STAT_COLUMNS,
	type RosterRow,
	type RosterStatColumnId,
	toRosterRow,
} from "./roster-stats.ts";
import { shareFileDateStamp, sharePngFileName } from "./share-file-name.ts";

export const ROSTER_SHARE = {
	width: 1080,
	padding: 32,
	gap: 16,
	columnGap: 12,
	headerHeight: 72,
	tableHeaderHeight: 40,
	rowHeight: 56,
	avatar: 40,
	star: 18,
	playerColumnWidth: 280,
	legendLineHeight: 22,
	legendMaxChars: 72,
	filePrefix: "elenco",
	fileName: "elenco.png",
	mimePng: "image/png",
	title: CHAMPIONSHIP_TAB_LABEL.roster,
	goalkeeperAbbr: "GOL",
} as const;

export const ROSTER_SHARE_LABEL = {
	share: "Compartilhar elenco",
	sharing: "Gerando imagem...",
	shareFailed: "Não foi possível compartilhar o elenco",
} as const;

export const ROSTER_SHARE_COLOR = {
	field: "#fafaf9",
	surface: "#ffffff",
	fg: "#1c1917",
	fgMuted: "#57534e",
	fgSubtle: "#a8a29e",
	line: "#e7e5e4",
	pitch: "#166534",
	pitchSoft: "#ecfdf5",
	starEmpty: "#a8a29e",
	starFill: "#fbbf24",
	avatar: "#e7e5e4",
} as const;

export const ROSTER_SHARE_STAT_COLUMNS = ROSTER_STAT_COLUMNS.filter(
	(column) => {
		if (!isRosterOptionalColumn(column)) {
			return true;
		}

		return ROSTER_DEFAULT_COLUMN_VISIBILITY[column];
	},
);

export type RosterShareStatColumnId =
	(typeof ROSTER_SHARE_STAT_COLUMNS)[number];

export const ROSTER_SHARE_COLUMNS = [
	ROSTER_COLUMN.player,
	ROSTER_COLUMN.rating,
	...ROSTER_SHARE_STAT_COLUMNS,
] as const;

export const ROSTER_SHARE_LEGEND_ITEMS = ROSTER_SHARE_COLUMNS.map((id) => ({
	id,
	abbr: ROSTER_COLUMN_ABBR[id],
	label: ROSTER_COLUMN_LABEL[id],
}));

export type RosterShareStat = {
	id: RosterShareStatColumnId;
	abbr: string;
	value: string;
};

export type RosterSharePlayer = {
	id: number;
	name: string;
	rating: number;
	avatarUrl: string | null;
	stats: RosterShareStat[];
};

export type RosterShareCard = {
	championshipName: string;
	title: string;
	players: RosterSharePlayer[];
	legend: typeof ROSTER_SHARE_LEGEND_ITEMS;
};

export type RosterShareSort = {
	id: string;
	desc: boolean;
};

const ROSTER_SHARE_STAT_IDS = new Set<string>(ROSTER_STAT_COLUMNS);

function isRosterShareStatColumn(
	columnId: string,
): columnId is RosterStatColumnId {
	return ROSTER_SHARE_STAT_IDS.has(columnId);
}

function rosterShareColumnValue(
	row: RosterRow,
	columnId: string,
): string | number | null {
	if (columnId === ROSTER_COLUMN.player) {
		return row.display_name;
	}

	if (columnId === ROSTER_COLUMN.rating) {
		return row.rating;
	}

	if (!isRosterShareStatColumn(columnId)) {
		return null;
	}

	return row[columnId];
}

function compareRosterShareValues(
	left: string | number,
	right: string | number,
): number {
	if (typeof left === "string" && typeof right === "string") {
		return left.localeCompare(right, "pt-BR");
	}

	if (typeof left === "number" && typeof right === "number") {
		return left - right;
	}

	return 0;
}

export function sameRosterShareSort(
	left: RosterShareSort | null,
	right: RosterShareSort | null,
): boolean {
	if (left === null || right === null) {
		return left === right;
	}

	return left.id === right.id && left.desc === right.desc;
}

export function sortRosterSharePlayers(
	players: readonly ChampionshipPlayer[],
	sort: RosterShareSort | null,
): ChampionshipPlayer[] {
	if (!sort) {
		return [...players];
	}

	return [...players].sort((left, right) => {
		const leftValue = rosterShareColumnValue(toRosterRow(left), sort.id);
		const rightValue = rosterShareColumnValue(toRosterRow(right), sort.id);
		if (leftValue === null || rightValue === null) {
			return 0;
		}

		const result = compareRosterShareValues(leftValue, rightValue);
		if (result === 0) {
			return 0;
		}

		if (sort.desc) {
			return -result;
		}

		return result;
	});
}

export function rosterShareHeading(count: number): string {
	return `${ROSTER_SHARE.title} · ${count} ${PLAYER_SEARCH.countLabel}`;
}

export function rosterSharePlayerName(player: {
	nickname: string | null;
	display_name: string;
	is_goalkeeper: boolean;
}): string {
	const name = playerVisibleName(player);
	if (!player.is_goalkeeper) {
		return name;
	}

	return `${name} ${ROSTER_SHARE.goalkeeperAbbr}`;
}

export function rosterShareLegendLines(
	items: readonly { abbr: string; label: string }[] = ROSTER_SHARE_LEGEND_ITEMS,
): string[] {
	const lines: string[] = [];
	for (const item of items) {
		const part = `${item.abbr} ${item.label}`;
		const last = lines.at(-1);
		if (!last) {
			lines.push(part);
			continue;
		}

		const next = `${last} · ${part}`;
		if (next.length <= ROSTER_SHARE.legendMaxChars) {
			lines[lines.length - 1] = next;
			continue;
		}

		lines.push(part);
	}

	return lines;
}

export function rosterShareStarsWidth(): number {
	return ROSTER_SHARE.star * PLAYER_RATING.starCount;
}

export function rosterShareStatColumnWidth(): number {
	const inner = ROSTER_SHARE.width - ROSTER_SHARE.padding * 2;
	const used =
		ROSTER_SHARE.playerColumnWidth +
		rosterShareStarsWidth() +
		ROSTER_SHARE.columnGap;
	return (inner - used) / ROSTER_SHARE_STAT_COLUMNS.length;
}

export function rosterShareImageHeight(
	playerCount: number,
	legendLineCount: number,
): number {
	const {
		padding,
		headerHeight,
		tableHeaderHeight,
		rowHeight,
		gap,
		legendLineHeight,
	} = ROSTER_SHARE;

	return (
		padding * 2 +
		headerHeight +
		tableHeaderHeight +
		playerCount * rowHeight +
		gap +
		legendLineCount * legendLineHeight
	);
}

export function rosterShareFileName({
	championshipName,
	generatedAt,
}: {
	championshipName: string;
	generatedAt: string;
}): string {
	return sharePngFileName([
		ROSTER_SHARE.filePrefix,
		championshipName,
		shareFileDateStamp(generatedAt),
	]);
}

export function rosterShareText(card: RosterShareCard): string {
	const lines = card.players.map((player) => {
		const stats = player.stats
			.map((stat) => `${stat.abbr} ${stat.value}`)
			.join(" ");
		return `${player.name} — ${stats}`;
	});

	return [card.championshipName, card.title, ...lines]
		.filter((line) => line.length > 0)
		.join("\n");
}

export function rosterShareCard(
	players: readonly ChampionshipPlayer[],
	championshipName: string,
	sort: RosterShareSort | null = null,
): RosterShareCard {
	const sorted = sortRosterSharePlayers(players, sort);

	return {
		championshipName,
		title: rosterShareHeading(sorted.length),
		legend: ROSTER_SHARE_LEGEND_ITEMS,
		players: sorted.map((player) => {
			const row = toRosterRow(player);
			return {
				id: player.id,
				name: rosterSharePlayerName(player),
				rating: player.rating,
				avatarUrl: player.avatar_url,
				stats: ROSTER_SHARE_STAT_COLUMNS.map((column) => ({
					id: column,
					abbr: ROSTER_COLUMN_ABBR[column],
					value: formatRosterStat(column, row[column]),
				})),
			};
		}),
	};
}
