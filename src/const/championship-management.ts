import type { ChampionshipPlayer } from "../types/championship.ts";
import type { ChampionshipEvent } from "../types/championship-event.ts";
import { formatEventStartsAt } from "./championship-event.ts";
import { playerVisibleName } from "./player-name.ts";
import {
	formatRosterCount,
	formatRosterWinRate,
	rosterSafeCount,
	rosterWinRate,
} from "./roster-stats.ts";

export const MANAGEMENT_LABEL = {
	tab: "Gestão",
	summary: "Resumo",
	frequency: "Frequência",
	alerts: "Alertas",
	empty: "Nenhuma rodada ainda",
	emptyFrequency: "Nenhum jogador no elenco",
	noAlerts: "Nada pendente",
	neverPlayed: "Ainda não jogou",
} as const;

export const MANAGEMENT_SUMMARY = {
	endedEvents: "endedEvents",
	averageAttendance: "averageAttendance",
	openEvents: "openEvents",
	openMatches: "openMatches",
} as const;

export type ManagementSummaryId =
	(typeof MANAGEMENT_SUMMARY)[keyof typeof MANAGEMENT_SUMMARY];

export const MANAGEMENT_SUMMARY_LABEL = {
	[MANAGEMENT_SUMMARY.endedEvents]: "Rodadas encerradas",
	[MANAGEMENT_SUMMARY.averageAttendance]: "Média presente",
	[MANAGEMENT_SUMMARY.openEvents]: "Rodadas abertas",
	[MANAGEMENT_SUMMARY.openMatches]: "Partidas abertas",
} as const;

export const MANAGEMENT_COLUMN = {
	player: "player",
	present: "present",
	events: "events",
	rate: "rate",
	streak: "streak",
	lastPlayed: "lastPlayed",
} as const;

export type ManagementColumnId =
	(typeof MANAGEMENT_COLUMN)[keyof typeof MANAGEMENT_COLUMN];

export const MANAGEMENT_COLUMN_ABBR = {
	[MANAGEMENT_COLUMN.player]: "Jog",
	[MANAGEMENT_COLUMN.present]: "P",
	[MANAGEMENT_COLUMN.events]: "R",
	[MANAGEMENT_COLUMN.rate]: "Freq",
	[MANAGEMENT_COLUMN.streak]: "Seq",
	[MANAGEMENT_COLUMN.lastPlayed]: "Última",
} as const;

export const MANAGEMENT_COLUMN_LABEL = {
	[MANAGEMENT_COLUMN.player]: "Jogador",
	[MANAGEMENT_COLUMN.present]: "Presenças",
	[MANAGEMENT_COLUMN.events]: "Rodadas",
	[MANAGEMENT_COLUMN.rate]: "Frequência",
	[MANAGEMENT_COLUMN.streak]: "Sequência",
	[MANAGEMENT_COLUMN.lastPlayed]: "Última presença",
} as const;

export const MANAGEMENT_STAT_COLUMNS = [
	MANAGEMENT_COLUMN.present,
	MANAGEMENT_COLUMN.events,
	MANAGEMENT_COLUMN.rate,
	MANAGEMENT_COLUMN.streak,
	MANAGEMENT_COLUMN.lastPlayed,
] as const;

export type ManagementStatColumnId = (typeof MANAGEMENT_STAT_COLUMNS)[number];

export const MANAGEMENT_COLUMNS = [
	MANAGEMENT_COLUMN.player,
	...MANAGEMENT_STAT_COLUMNS,
] as const;

export const MANAGEMENT_LEGEND = MANAGEMENT_COLUMNS.map((id) => ({
	id,
	abbr: MANAGEMENT_COLUMN_ABBR[id],
	label: MANAGEMENT_COLUMN_LABEL[id],
}));

export const MANAGEMENT_STAT_COLUMN_OPTIONS = MANAGEMENT_STAT_COLUMNS.map(
	(id) => ({
		id,
		label: MANAGEMENT_COLUMN_LABEL[id],
	}),
);

export const MANAGEMENT_ALERT = {
	openEvent: "openEvent",
	openMatch: "openMatch",
	endedWithoutAttendance: "endedWithoutAttendance",
	resultMismatch: "resultMismatch",
} as const;

export type ManagementAlertKind =
	(typeof MANAGEMENT_ALERT)[keyof typeof MANAGEMENT_ALERT];

export const MANAGEMENT_ALERT_LABEL = {
	[MANAGEMENT_ALERT.openEvent]: "Rodada aberta",
	[MANAGEMENT_ALERT.openMatch]: "Partida aberta",
	[MANAGEMENT_ALERT.endedWithoutAttendance]: "Rodada encerrada sem presença",
	[MANAGEMENT_ALERT.resultMismatch]: "Resultado acima dos jogos",
} as const;

export type ManagementSummary = {
	endedEvents: number;
	averageAttendance: number;
	openEvents: number;
	openMatches: number;
};

export type ManagementFrequencyRow = {
	player: ChampionshipPlayer;
	present: number;
	events: number;
	rate: number;
	streak: number;
	lastPlayedAt: string | null;
};

export type ManagementAlert = {
	id: string;
	kind: ManagementAlertKind;
	eventId: number;
	label: string;
};

export function endedChampionshipEvents(
	events: readonly ChampionshipEvent[],
): ChampionshipEvent[] {
	return events.filter((event) => event.ended_at !== null);
}

export function openChampionshipMatches(events: readonly ChampionshipEvent[]) {
	return events.flatMap((event) =>
		event.matches.flatMap((match) => {
			if (match.ended_at !== null) {
				return [];
			}

			return [{ event, match }];
		}),
	);
}

export function managementSummary(
	events: readonly ChampionshipEvent[],
): ManagementSummary {
	const ended = endedChampionshipEvents(events);
	const attendanceTotal = ended.reduce(
		(sum, event) => sum + event.attendance.length,
		0,
	);

	return {
		endedEvents: ended.length,
		averageAttendance: ended.length === 0 ? 0 : attendanceTotal / ended.length,
		openEvents: events.filter((event) => event.ended_at === null).length,
		openMatches: openChampionshipMatches(events).length,
	};
}

export function formatManagementAverage(value: number): string {
	return rosterSafeCount(value).toFixed(1);
}

export function formatManagementSummary(
	id: ManagementSummaryId,
	value: number,
): string {
	switch (id) {
		case MANAGEMENT_SUMMARY.averageAttendance:
			return formatManagementAverage(value);
		case MANAGEMENT_SUMMARY.endedEvents:
		case MANAGEMENT_SUMMARY.openEvents:
		case MANAGEMENT_SUMMARY.openMatches:
			return formatRosterCount(value);
		default: {
			const _exhaustive: never = id;
			return _exhaustive;
		}
	}
}

function playerPresentAt(event: ChampionshipEvent, playerId: number): boolean {
	return event.attendance.some((row) => row.player_id === playerId);
}

function playerPresenceStreak(
	endedNewestFirst: readonly ChampionshipEvent[],
	playerId: number,
): number {
	return endedNewestFirst.reduce((streak, event, index) => {
		if (index !== streak) {
			return streak;
		}

		if (!playerPresentAt(event, playerId)) {
			return streak;
		}

		return streak + 1;
	}, 0);
}

function playerLastPlayedAt(
	endedNewestFirst: readonly ChampionshipEvent[],
	playerId: number,
): string | null {
	const last = endedNewestFirst.find((event) =>
		playerPresentAt(event, playerId),
	);
	if (!last) {
		return null;
	}

	return last.starts_at;
}

export function managementFrequencyRows(
	players: readonly ChampionshipPlayer[],
	events: readonly ChampionshipEvent[],
): ManagementFrequencyRow[] {
	const endedNewestFirst = [...endedChampionshipEvents(events)].sort(
		(left, right) => {
			if (left.starts_at === right.starts_at) {
				return right.id - left.id;
			}

			return left.starts_at < right.starts_at ? 1 : -1;
		},
	);
	const eventCount = endedNewestFirst.length;

	return players.map((player) => {
		const present = endedNewestFirst.filter((event) =>
			playerPresentAt(event, player.id),
		).length;

		return {
			player,
			present,
			events: eventCount,
			rate: rosterWinRate(present, eventCount),
			streak: playerPresenceStreak(endedNewestFirst, player.id),
			lastPlayedAt: playerLastPlayedAt(endedNewestFirst, player.id),
		};
	});
}

export function formatManagementLastPlayed(startsAt: string | null): string {
	if (!startsAt) {
		return MANAGEMENT_LABEL.neverPlayed;
	}

	return formatEventStartsAt(startsAt).date;
}

export function formatManagementStat(
	column: ManagementStatColumnId,
	row: ManagementFrequencyRow,
): string {
	switch (column) {
		case MANAGEMENT_COLUMN.present:
			return formatRosterCount(row.present);
		case MANAGEMENT_COLUMN.events:
			return formatRosterCount(row.events);
		case MANAGEMENT_COLUMN.rate:
			return formatRosterWinRate(row.rate);
		case MANAGEMENT_COLUMN.streak:
			return formatRosterCount(row.streak);
		case MANAGEMENT_COLUMN.lastPlayed:
			return formatManagementLastPlayed(row.lastPlayedAt);
		default: {
			const _exhaustive: never = column;
			return _exhaustive;
		}
	}
}

function eventWhenLabel(event: ChampionshipEvent): string {
	const when = formatEventStartsAt(event.starts_at);
	return `${when.date} · ${when.time}`;
}

export function managementAlerts(
	events: readonly ChampionshipEvent[],
): ManagementAlert[] {
	const openEvents = events.flatMap((event) => {
		if (event.ended_at !== null) {
			return [];
		}

		return [
			{
				id: `${MANAGEMENT_ALERT.openEvent}:${event.id}`,
				kind: MANAGEMENT_ALERT.openEvent,
				eventId: event.id,
				label: `${MANAGEMENT_ALERT_LABEL[MANAGEMENT_ALERT.openEvent]} · ${eventWhenLabel(event)}`,
			},
		];
	});
	const openMatches = openChampionshipMatches(events).map(
		({ event, match }) => ({
			id: `${MANAGEMENT_ALERT.openMatch}:${match.id}`,
			kind: MANAGEMENT_ALERT.openMatch,
			eventId: event.id,
			label: `${MANAGEMENT_ALERT_LABEL[MANAGEMENT_ALERT.openMatch]} · ${eventWhenLabel(event)}`,
		}),
	);
	const endedWithoutAttendance = endedChampionshipEvents(events).flatMap(
		(event) => {
			if (event.attendance.length > 0) {
				return [];
			}

			return [
				{
					id: `${MANAGEMENT_ALERT.endedWithoutAttendance}:${event.id}`,
					kind: MANAGEMENT_ALERT.endedWithoutAttendance,
					eventId: event.id,
					label: `${MANAGEMENT_ALERT_LABEL[MANAGEMENT_ALERT.endedWithoutAttendance]} · ${eventWhenLabel(event)}`,
				},
			];
		},
	);
	const resultMismatch = events.flatMap((event) =>
		event.attendance.flatMap((row) => {
			const wins = rosterSafeCount(row.wins);
			const losses = rosterSafeCount(row.losses);
			const draws = rosterSafeCount(row.draws);
			const matches = rosterSafeCount(row.matches);
			if (wins + losses + draws <= matches) {
				return [];
			}

			return [
				{
					id: `${MANAGEMENT_ALERT.resultMismatch}:${event.id}:${row.player_id}`,
					kind: MANAGEMENT_ALERT.resultMismatch,
					eventId: event.id,
					label: `${MANAGEMENT_ALERT_LABEL[MANAGEMENT_ALERT.resultMismatch]} · ${row.display_name}`,
				},
			];
		}),
	);

	return [
		...openEvents,
		...openMatches,
		...endedWithoutAttendance,
		...resultMismatch,
	];
}

export function rankManagementFrequencyRows(
	rows: readonly ManagementFrequencyRow[],
): ManagementFrequencyRow[] {
	return [...rows].sort((left, right) => {
		const rateDiff = right.rate - left.rate;
		if (rateDiff !== 0) {
			return rateDiff;
		}

		const presentDiff = right.present - left.present;
		if (presentDiff !== 0) {
			return presentDiff;
		}

		return playerVisibleName(left.player).localeCompare(
			playerVisibleName(right.player),
			"pt",
		);
	});
}
