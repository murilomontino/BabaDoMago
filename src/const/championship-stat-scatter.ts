import { championshipRatingChartColor } from "./championship-rating-history.ts";
import { playerVisibleName } from "./player-name.ts";
import type { PlayerProfileEventInput } from "./player-profile.ts";
import {
	ROSTER_COLUMN,
	ROSTER_COLUMN_LABEL,
	rosterSafeCount,
} from "./roster-stats.ts";

export const CHAMPIONSHIP_STAT_SCATTER_AXIS = {
	goalsAssists: "goalsAssists",
	assistsGoals: "assistsGoals",
} as const;

export type ChampionshipStatScatterAxis =
	(typeof CHAMPIONSHIP_STAT_SCATTER_AXIS)[keyof typeof CHAMPIONSHIP_STAT_SCATTER_AXIS];

export const CHAMPIONSHIP_STAT_SCATTER_LABEL = {
	title: "Gols × assistências",
	invert: "Inverter eixos",
	empty: "Ainda sem estatística",
	goals: ROSTER_COLUMN_LABEL.goals,
	assists: ROSTER_COLUMN_LABEL.assists,
} as const;

export const CHAMPIONSHIP_STAT_SCATTER_CHART = {
	height: 280,
	goalsKey: ROSTER_COLUMN.goals,
	assistsKey: ROSTER_COLUMN.assists,
	nameKey: "name",
	dotRadius: 5,
	labelOffset: 8,
	labelFontSize: 11,
	margin: { top: 24, right: 28, bottom: 24, left: 0 },
	domainPad: 1,
	axisWidth: 36,
	fallbackMax: 1,
} as const;

export type ChampionshipStatScatterPlayer = {
	id: number;
	display_name: string;
	nickname: string | null;
	avatar_url: string | null;
};

export type ChampionshipStatScatterPoint = {
	playerId: number;
	name: string;
	avatarUrl: string | null;
	color: string;
	goals: number;
	assists: number;
};

export type ChampionshipStatScatterAxisKeys = {
	xKey: typeof ROSTER_COLUMN.goals | typeof ROSTER_COLUMN.assists;
	yKey: typeof ROSTER_COLUMN.goals | typeof ROSTER_COLUMN.assists;
	xLabel: string;
	yLabel: string;
};

export type ChampionshipStatScatterDomain = {
	min: number;
	max: number;
};

export function championshipStatScatterPoints(
	players: readonly ChampionshipStatScatterPlayer[],
	events: readonly PlayerProfileEventInput[],
): ChampionshipStatScatterPoint[] {
	return players.flatMap((player) => {
		const totals = playerPeriodStatTotals(events, player.id);
		if (!totals) {
			return [];
		}

		return [
			{
				playerId: player.id,
				name: playerVisibleName(player),
				avatarUrl: player.avatar_url,
				color: championshipRatingChartColor(player.id),
				goals: totals.goals,
				assists: totals.assists,
			},
		];
	});
}

export function championshipStatScatterEmptyLabel(
	points: readonly ChampionshipStatScatterPoint[],
): string | null {
	if (points.length === 0) {
		return CHAMPIONSHIP_STAT_SCATTER_LABEL.empty;
	}

	return null;
}

export function championshipStatScatterAxisKeys(
	mode: ChampionshipStatScatterAxis,
): ChampionshipStatScatterAxisKeys {
	if (mode === CHAMPIONSHIP_STAT_SCATTER_AXIS.assistsGoals) {
		return {
			xKey: ROSTER_COLUMN.goals,
			yKey: ROSTER_COLUMN.assists,
			xLabel: CHAMPIONSHIP_STAT_SCATTER_LABEL.goals,
			yLabel: CHAMPIONSHIP_STAT_SCATTER_LABEL.assists,
		};
	}

	return {
		xKey: ROSTER_COLUMN.assists,
		yKey: ROSTER_COLUMN.goals,
		xLabel: CHAMPIONSHIP_STAT_SCATTER_LABEL.assists,
		yLabel: CHAMPIONSHIP_STAT_SCATTER_LABEL.goals,
	};
}

export function toggleChampionshipStatScatterAxis(
	mode: ChampionshipStatScatterAxis,
): ChampionshipStatScatterAxis {
	if (mode === CHAMPIONSHIP_STAT_SCATTER_AXIS.goalsAssists) {
		return CHAMPIONSHIP_STAT_SCATTER_AXIS.assistsGoals;
	}

	return CHAMPIONSHIP_STAT_SCATTER_AXIS.goalsAssists;
}

export function championshipStatScatterDomain(
	points: readonly ChampionshipStatScatterPoint[],
	key: typeof ROSTER_COLUMN.goals | typeof ROSTER_COLUMN.assists,
): ChampionshipStatScatterDomain {
	const values = points.map((point) => point[key]);
	if (values.length === 0) {
		return {
			min: 0,
			max: CHAMPIONSHIP_STAT_SCATTER_CHART.fallbackMax,
		};
	}

	const rawMax = Math.max(...values);
	const pad = CHAMPIONSHIP_STAT_SCATTER_CHART.domainPad;
	const max = Math.max(pad, rawMax + pad);

	return { min: 0, max };
}

function playerPeriodStatTotals(
	events: readonly PlayerProfileEventInput[],
	playerId: number,
): { goals: number; assists: number } | null {
	const attended = events.some((event) =>
		event.attendance.some((row) => row.player_id === playerId),
	);
	if (!attended) {
		return null;
	}

	return events.reduce(
		(acc, event) => {
			const row = event.attendance.find(
				(attendance) => attendance.player_id === playerId,
			);
			if (!row) {
				return acc;
			}

			return {
				goals: acc.goals + rosterSafeCount(row.goals),
				assists: acc.assists + rosterSafeCount(row.assists),
			};
		},
		{ goals: 0, assists: 0 },
	);
}
