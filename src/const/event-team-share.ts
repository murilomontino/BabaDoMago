import {
	type EventTeamBuilderTeam,
	formatEventStartsAt,
} from "./championship-event.ts";
import { eventTeamName } from "./event-team-color.ts";
import { playerVisibleName } from "./player-name.ts";

export const EVENT_TEAM_SHARE = {
	width: 1080,
	columns: 2,
	padding: 32,
	gap: 24,
	headerHeight: 52,
	rowHeight: 64,
	cardPadding: 16,
	avatar: 48,
	star: 22,
	fileName: "times.png",
	filePrefix: "times",
	mimePng: "image/png",
	title: "Times",
} as const;

export const EVENT_TEAM_SHARE_LABEL = {
	shareTeams: "Compartilhar times",
	sharing: "Gerando imagem...",
	shareFailed: "Não foi possível compartilhar os times",
} as const;

export const EVENT_TEAM_SHARE_COLOR = {
	field: "#fafaf9",
	surface: "#ffffff",
	fg: "#1c1917",
	fgMuted: "#57534e",
	fgSubtle: "#a8a29e",
	line: "#e7e5e4",
	starEmpty: "#a8a29e",
	starFill: "#fbbf24",
	avatar: "#e7e5e4",
} as const;

export type EventTeamSharePlayer = {
	id: number;
	number: number;
	name: string;
	rating: number;
	avatarUrl: string | null;
};

export type EventTeamShareCard = {
	title: string;
	color: string | null;
	players: EventTeamSharePlayer[];
};

type EventTeamShareRosterPlayer = {
	id: number;
	nickname: string | null;
	display_name: string;
	rating: number;
	avatar_url: string | null;
};

export function eventTeamShareFileName(startsAt: string): string {
	const parsed = new Date(startsAt);
	if (Number.isNaN(parsed.getTime())) {
		return EVENT_TEAM_SHARE.fileName;
	}

	const stamp = formatEventStartsAt(startsAt).date.replaceAll("/", "-");
	return `${EVENT_TEAM_SHARE.filePrefix}-${stamp}.png`;
}

export function eventTeamsShareText(
	cards: readonly EventTeamShareCard[],
	startsAt: string,
): string {
	const parsed = new Date(startsAt);
	const heading = Number.isNaN(parsed.getTime())
		? EVENT_TEAM_SHARE.title
		: `${EVENT_TEAM_SHARE.title} ${formatEventStartsAt(startsAt).date}`;
	const blocks = cards.map((card) => {
		const lines = [
			card.title,
			...card.players.map((player) => `${player.number} - ${player.name}`),
		];
		return lines.join("\n");
	});

	return [heading, ...blocks].join("\n\n");
}

export function eventTeamShareCardHeight(playerCount: number): number {
	return (
		EVENT_TEAM_SHARE.cardPadding * 2 +
		EVENT_TEAM_SHARE.headerHeight +
		playerCount * EVENT_TEAM_SHARE.rowHeight
	);
}

export function eventTeamShareCardWidth(): number {
	const { width, padding, gap, columns } = EVENT_TEAM_SHARE;
	return (width - padding * 2 - gap * (columns - 1)) / columns;
}

export function eventTeamShareImageHeight(
	playerCounts: readonly number[],
): number {
	if (playerCounts.length === 0) {
		return EVENT_TEAM_SHARE.padding * 2;
	}

	const { columns, padding, gap } = EVENT_TEAM_SHARE;
	const rowCount = Math.ceil(playerCounts.length / columns);
	const rowHeights = Array.from({ length: rowCount }, (_, row) => {
		const start = row * columns;
		const counts = playerCounts.slice(start, start + columns);
		return Math.max(...counts.map(eventTeamShareCardHeight));
	});
	const gaps = Math.max(0, rowHeights.length - 1) * gap;
	const content = rowHeights.reduce((sum, height) => sum + height, 0);
	return padding * 2 + content + gaps;
}

export function eventTeamsShareCards(
	teams: readonly EventTeamBuilderTeam[],
	players: readonly EventTeamShareRosterPlayer[],
): EventTeamShareCard[] {
	const byId = new Map(players.map((player) => [player.id, player]));

	return teams.map((team, teamIndex) => ({
		title: eventTeamName(team.color, teamIndex),
		color: team.color,
		players: team.slots.flatMap((slot, slotIndex) => {
			if (!slot) {
				return [];
			}

			const player = byId.get(Number(slot));
			if (!player) {
				return [];
			}

			return [
				{
					id: player.id,
					number: slotIndex + 1,
					name: playerVisibleName(player),
					rating: player.rating,
					avatarUrl: player.avatar_url,
				},
			];
		}),
	}));
}
