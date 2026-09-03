import { parseAsStringEnum } from "nuqs";

export const EVENT_TAB = {
	event: "event",
	sim: "sim",
	podium: "podium",
} as const;

export type EventTab = (typeof EVENT_TAB)[keyof typeof EVENT_TAB];

export const EVENT_TAB_LABEL = {
	event: "Rodada",
	sim: "Simulação",
	podium: "Pódio",
} as const;

export const EVENT_TABS = [
	{
		id: EVENT_TAB.event,
		label: EVENT_TAB_LABEL.event,
	},
	{
		id: EVENT_TAB.sim,
		label: EVENT_TAB_LABEL.sim,
	},
	{
		id: EVENT_TAB.podium,
		label: EVENT_TAB_LABEL.podium,
	},
] as const;

export const EVENT_TAB_SEARCH_KEY = "tab" as const;

export const EVENT_TAB_SEARCH = {
	tab: parseAsStringEnum<EventTab>(Object.values(EVENT_TAB)),
};

export function showEventDetailTabs(input: {
	showTeamBuilder: boolean;
	attendanceCount: number;
}): boolean {
	return !input.showTeamBuilder && input.attendanceCount > 0;
}

export function eventDetailSelectedTab(
	showEventTabs: boolean,
	tab: EventTab | null,
): EventTab {
	if (!showEventTabs || tab === null || tab === EVENT_TAB.event) {
		return EVENT_TAB.event;
	}

	return tab;
}
