import { parseAsStringEnum } from "nuqs";

export const EVENT_TAB = {
	event: "event",
	podium: "podium",
} as const;

export type EventTab = (typeof EVENT_TAB)[keyof typeof EVENT_TAB];

export const EVENT_TAB_LABEL = {
	event: "Evento",
	podium: "Pódio",
} as const;

export const EVENT_TABS = [
	{
		id: EVENT_TAB.event,
		label: EVENT_TAB_LABEL.event,
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
