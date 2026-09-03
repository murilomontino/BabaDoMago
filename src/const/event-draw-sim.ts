import {
	EVENT_ACTION,
	EVENT_TEAM_MESSAGE,
	EVENT_WEEKDAY,
	type EventWeekday,
} from "./championship-event.ts";

export const EVENT_DRAW_SIM_LABEL = {
	title: "Sorteio",
	hint: "Prévia local. Não grava presença nem times na rodada.",
	drawBalanced: EVENT_ACTION.drawTeams,
	drawPots: EVENT_ACTION.openPotDraw,
	drawing: EVENT_TEAM_MESSAGE.drawing,
	drawFailed: EVENT_TEAM_MESSAGE.drawFailed,
	emptyTeams: "Sorteie para ver os times",
} as const;

export const EVENT_DRAW_SIM_MODE = {
	balanced: "balanced",
	pots: "pots",
} as const;

export type EventDrawSimMode =
	(typeof EVENT_DRAW_SIM_MODE)[keyof typeof EVENT_DRAW_SIM_MODE];

const EVENT_WEEKDAY_VALUES = new Set<number>(Object.values(EVENT_WEEKDAY));

export function drawSimSeedWeekday(
	value: number | null | undefined,
): EventWeekday | null {
	if (value === null || value === undefined) {
		return null;
	}

	if (!EVENT_WEEKDAY_VALUES.has(value)) {
		return null;
	}

	return value as EventWeekday;
}
