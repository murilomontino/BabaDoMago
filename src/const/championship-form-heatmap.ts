import type { ChampionshipPlayer } from "../types/championship.ts";
import type {
	ChampionshipEvent,
	ChampionshipEventAttendance,
} from "../types/championship-event.ts";
import {
	EVENT_RATING_ADJUSTMENT,
	eventRatingInDeadZone,
	eventRatingRate,
} from "./event-rating-adjustment.ts";
import { playerVisibleName } from "./player-name.ts";
import {
	formatRosterCount,
	formatRosterWinRate,
	rosterSafeCount,
} from "./roster-stats.ts";

export const FORM_HEATMAP_CELL = {
	absent: "absent",
	insufficient: "insufficient",
	up: "up",
	down: "down",
	deadZone: "deadZone",
} as const;

export type FormHeatmapCellKind =
	(typeof FORM_HEATMAP_CELL)[keyof typeof FORM_HEATMAP_CELL];

export const FORM_HEATMAP_LABEL = {
	title: "Heatmap de forma",
	empty: "Ninguém com jogos na janela",
	hint: "Aproveitamento por rodada na janela. Máximo de 20 jogadores.",
	limitNote: "Mostrando os 20 com melhor aproveitamento agregado.",
	legend: "Legenda",
	[FORM_HEATMAP_CELL.up]: "Em alta",
	[FORM_HEATMAP_CELL.down]: "Em baixa",
	[FORM_HEATMAP_CELL.deadZone]: "Zona morta",
	[FORM_HEATMAP_CELL.insufficient]: "Poucos jogos",
	[FORM_HEATMAP_CELL.absent]: "Ausente",
} as const;

export const FORM_HEATMAP_MAX_ROWS = 20 as const;

export type FormHeatmapColumn = {
	eventId: number;
	startsAt: string;
};

export type FormHeatmapCell = {
	kind: FormHeatmapCellKind;
	rate: number | null;
	wins: number;
	draws: number;
	losses: number;
	matches: number;
};

export type FormHeatmapRow = {
	player: ChampionshipPlayer;
	aggregateRate: number;
	matches: number;
	cells: FormHeatmapCell[];
};

export type FormHeatmapGrid = {
	columns: FormHeatmapColumn[];
	rows: FormHeatmapRow[];
	truncated: boolean;
};

export function championshipFormHeatmap(
	players: readonly ChampionshipPlayer[],
	events: readonly ChampionshipEvent[],
): FormHeatmapGrid {
	const columns = events.flatMap((event) => {
		if (event.ended_at === null) {
			return [];
		}

		return [
			{
				eventId: event.id,
				startsAt: event.starts_at,
			},
		];
	});

	const attendanceByEvent = new Map(
		events.map((event) => [event.id, event.attendance]),
	);

	const rows = players.flatMap((player) => {
		const cells = columns.map((column) => {
			const attendance = attendanceByEvent
				.get(column.eventId)
				?.find((row) => row.player_id === player.id);
			if (!attendance) {
				return absentFormHeatmapCell();
			}

			return eventAttendanceFormCell(attendance);
		});

		const aggregate = aggregateFormHeatmap(player.id, events);
		if (!aggregate || aggregate.matches === 0) {
			return [];
		}

		return [
			{
				player,
				aggregateRate: aggregate.rate,
				matches: aggregate.matches,
				cells,
			},
		];
	});

	const sorted = rows.sort(compareFormHeatmapRows);
	const truncated = sorted.length > FORM_HEATMAP_MAX_ROWS;
	const limited = sorted.slice(0, FORM_HEATMAP_MAX_ROWS);

	return {
		columns,
		rows: limited,
		truncated,
	};
}

export function eventAttendanceFormCell(
	row: Pick<
		ChampionshipEventAttendance,
		"wins" | "draws" | "losses" | "matches"
	>,
): FormHeatmapCell {
	const wins = rosterSafeCount(row.wins);
	const draws = rosterSafeCount(row.draws);
	const losses = rosterSafeCount(row.losses);
	const matches = rosterSafeCount(row.matches);

	if (matches < EVENT_RATING_ADJUSTMENT.minMatches) {
		return {
			kind: FORM_HEATMAP_CELL.insufficient,
			rate: null,
			wins,
			draws,
			losses,
			matches,
		};
	}

	const rate = eventRatingRate(wins, draws, losses, matches);
	const kind = formHeatmapCellKind(wins, draws, losses, matches, rate);

	return {
		kind,
		rate,
		wins,
		draws,
		losses,
		matches,
	};
}

export function formHeatmapCellLabel(kind: FormHeatmapCellKind): string {
	return FORM_HEATMAP_LABEL[kind];
}

export function formHeatmapCellTitle(cell: FormHeatmapCell): string {
	if (cell.kind === FORM_HEATMAP_CELL.absent) {
		return FORM_HEATMAP_LABEL.absent;
	}

	if (cell.rate === null) {
		return `${FORM_HEATMAP_LABEL.insufficient} · ${formatRosterCount(cell.matches)} j`;
	}

	return `${formatRosterWinRate(cell.rate)} · ${formatRosterCount(cell.wins)}V ${formatRosterCount(cell.draws)}E ${formatRosterCount(cell.losses)}D`;
}

function absentFormHeatmapCell(): FormHeatmapCell {
	return {
		kind: FORM_HEATMAP_CELL.absent,
		rate: null,
		wins: 0,
		draws: 0,
		losses: 0,
		matches: 0,
	};
}

function aggregateFormHeatmap(
	playerId: number,
	events: readonly ChampionshipEvent[],
): { rate: number; matches: number } | null {
	let wins = 0;
	let draws = 0;
	let losses = 0;
	let matches = 0;

	for (const event of events) {
		const row = event.attendance.find((item) => item.player_id === playerId);
		if (!row) {
			continue;
		}

		wins += rosterSafeCount(row.wins);
		draws += rosterSafeCount(row.draws);
		losses += rosterSafeCount(row.losses);
		matches += rosterSafeCount(row.matches);
	}

	if (matches === 0) {
		return null;
	}

	return {
		rate: eventRatingRate(wins, draws, losses, matches),
		matches,
	};
}

function formHeatmapCellKind(
	wins: number,
	draws: number,
	losses: number,
	matches: number,
	rate: number,
): FormHeatmapCellKind {
	if (eventRatingInDeadZone(wins, draws, losses, matches)) {
		return FORM_HEATMAP_CELL.deadZone;
	}

	if (rate > EVENT_RATING_ADJUSTMENT.upThreshold) {
		return FORM_HEATMAP_CELL.up;
	}

	if (rate < EVENT_RATING_ADJUSTMENT.downThreshold) {
		return FORM_HEATMAP_CELL.down;
	}

	return FORM_HEATMAP_CELL.deadZone;
}

function compareFormHeatmapRows(
	left: FormHeatmapRow,
	right: FormHeatmapRow,
): number {
	if (right.aggregateRate !== left.aggregateRate) {
		return right.aggregateRate - left.aggregateRate;
	}

	if (right.matches !== left.matches) {
		return right.matches - left.matches;
	}

	return playerVisibleName(left.player).localeCompare(
		playerVisibleName(right.player),
		"pt",
	);
}
