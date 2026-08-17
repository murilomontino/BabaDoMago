import { parseAsStringEnum } from "nuqs";

export const CHAMPIONSHIP_TAB = {
	roster: "roster",
	events: "events",
	podium: "podium",
	management: "management",
} as const;

export type ChampionshipTab =
	(typeof CHAMPIONSHIP_TAB)[keyof typeof CHAMPIONSHIP_TAB];

export const CHAMPIONSHIP_TAB_SEARCH_KEY = "tab" as const;

export const CHAMPIONSHIP_TAB_SEARCH = {
	tab: parseAsStringEnum<ChampionshipTab>(Object.values(CHAMPIONSHIP_TAB)),
};

export const CHAMPIONSHIP_TAB_LABEL = {
	roster: "Elenco",
	events: "Rodadas",
	podium: "Pódio",
	management: "Gestão",
	deactivated: "Desativados",
	settings: "Configuração",
} as const;

export const CHAMPIONSHIP_TABS = [
	{
		id: CHAMPIONSHIP_TAB.roster,
		label: CHAMPIONSHIP_TAB_LABEL.roster,
	},
	{
		id: CHAMPIONSHIP_TAB.events,
		label: CHAMPIONSHIP_TAB_LABEL.events,
	},
	{
		id: CHAMPIONSHIP_TAB.podium,
		label: CHAMPIONSHIP_TAB_LABEL.podium,
	},
] as const;

export function championshipTabs(includeManagement: boolean) {
	if (!includeManagement) {
		return CHAMPIONSHIP_TABS;
	}

	return [
		...CHAMPIONSHIP_TABS,
		{
			id: CHAMPIONSHIP_TAB.management,
			label: CHAMPIONSHIP_TAB_LABEL.management,
		},
	];
}
