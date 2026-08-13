export const CHAMPIONSHIP_TAB = {
	roster: "roster",
	events: "events",
	podium: "podium",
	deactivated: "deactivated",
	settings: "settings",
} as const;

export type ChampionshipTab =
	(typeof CHAMPIONSHIP_TAB)[keyof typeof CHAMPIONSHIP_TAB];

export const CHAMPIONSHIP_TAB_LABEL = {
	roster: "Elenco",
	events: "Eventos",
	podium: "Pódio",
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
	{
		id: CHAMPIONSHIP_TAB.deactivated,
		label: CHAMPIONSHIP_TAB_LABEL.deactivated,
	},
	{
		id: CHAMPIONSHIP_TAB.settings,
		label: CHAMPIONSHIP_TAB_LABEL.settings,
	},
] as const;
