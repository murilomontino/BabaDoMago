export const CHAMPIONSHIP_TAB = {
	roster: "roster",
	settings: "settings",
} as const;

export type ChampionshipTab =
	(typeof CHAMPIONSHIP_TAB)[keyof typeof CHAMPIONSHIP_TAB];

export const CHAMPIONSHIP_TAB_LABEL = {
	roster: "Elenco",
	settings: "Configuração",
} as const;

export const CHAMPIONSHIP_TABS = [
	{
		id: CHAMPIONSHIP_TAB.roster,
		label: CHAMPIONSHIP_TAB_LABEL.roster,
	},
	{
		id: CHAMPIONSHIP_TAB.settings,
		label: CHAMPIONSHIP_TAB_LABEL.settings,
	},
] as const;
