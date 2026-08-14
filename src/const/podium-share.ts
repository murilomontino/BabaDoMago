import type { ChampionshipPlayer } from "../types/championship.ts";
import { playerVisibleName } from "./player-name.ts";
import {
	formatPodiumMetric,
	PODIUM_DISPLAY_ORDER,
	PODIUM_LABEL,
	PODIUM_METRICS,
	type PodiumMetricId,
	type PodiumPlace,
	type PodiumStanding,
	podiumStandings,
	rankPodiumRows,
} from "./podium.ts";
import {
	ROSTER_COLUMN_LABEL,
	type RosterRow,
	toRosterRow,
} from "./roster-stats.ts";

export const PODIUM_SHARE = {
	width: 1080,
	padding: 40,
	gap: 28,
	headerHeight: 64,
	avatar: 80,
	star: 22,
	filePrefix: "podio",
	fileAll: "podio-tudo.png",
	mimePng: "image/png",
	title: PODIUM_LABEL.tab,
} as const;

export const PODIUM_SHARE_LABEL = {
	shareOne: "Compartilhar",
	shareAll: "Compartilhar tudo",
	sharing: "Gerando imagem...",
	shareFailed: "Não foi possível compartilhar o pódio",
} as const;

export const PODIUM_SHARE_COLOR = {
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

export const PODIUM_SHARE_MEDAL = {
	1: "#fbbf24",
	2: "#a8a29e",
	3: "#d6d3d1",
} as const;

export type PodiumSharePlace = {
	place: PodiumPlace;
	name: string;
	rating: number;
	value: string;
	avatarUrl: string | null;
};

export type PodiumShareCard = {
	metric: PodiumMetricId;
	title: string;
	places: PodiumSharePlace[];
};

export function podiumShareHeading(metric: PodiumMetricId): string {
	return `${PODIUM_SHARE.title} · ${ROSTER_COLUMN_LABEL[metric]}`;
}

export function podiumShareFileName(metric: PodiumMetricId): string {
	return `${PODIUM_SHARE.filePrefix}-${metric}.png`;
}

export function podiumSharePlacesInDisplayOrder(
	places: readonly PodiumSharePlace[],
): PodiumSharePlace[] {
	const byPlace = new Map(places.map((place) => [place.place, place]));
	return PODIUM_DISPLAY_ORDER.flatMap((place) => {
		const item = byPlace.get(place);
		if (!item) {
			return [];
		}

		return [item];
	});
}

export function podiumShareText(card: PodiumShareCard): string {
	const lines = [...card.places]
		.sort((left, right) => left.place - right.place)
		.map((place) => `${place.place}º ${place.name} — ${place.value}`);
	return [card.title, ...lines].join("\n");
}

export function podiumShareAllText(cards: readonly PodiumShareCard[]): string {
	return cards.map(podiumShareText).join("\n\n");
}

export function podiumShareCardFromStandings(
	standings: readonly PodiumStanding[],
	metric: PodiumMetricId,
): PodiumShareCard | null {
	if (standings.length === 0) {
		return null;
	}

	return {
		metric,
		title: podiumShareHeading(metric),
		places: standings.map((standing) => ({
			place: standing.place,
			name: playerVisibleName(standing.row),
			rating: standing.row.rating,
			value: formatPodiumMetric(metric, standing.row[metric]),
			avatarUrl: standing.row.avatar_url,
		})),
	};
}

export function podiumShareCardsFromRows(
	rows: readonly RosterRow[],
	metrics: readonly PodiumMetricId[] = PODIUM_METRICS,
): PodiumShareCard[] {
	return metrics.flatMap((metric) => {
		const card = podiumShareCardFromStandings(
			podiumStandings(rankPodiumRows(rows, metric), metric),
			metric,
		);
		if (!card) {
			return [];
		}

		return [card];
	});
}

export function podiumShareCardsFromPlayers(
	players: readonly ChampionshipPlayer[],
	metrics: readonly PodiumMetricId[] = PODIUM_METRICS,
): PodiumShareCard[] {
	return podiumShareCardsFromRows(
		players.map((player) => toRosterRow(player)),
		metrics,
	);
}
