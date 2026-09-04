import { parseAsStringEnum } from "nuqs";

export const CHAMPIONSHIP_TAB = {
	roster: "roster",
	events: "events",
	standings: "standings",
	podium: "podium",
	trends: "trends",
	drawSim: "drawSim",
	monthly: "monthly",
	management: "management",
} as const;

export type ChampionshipTab =
	(typeof CHAMPIONSHIP_TAB)[keyof typeof CHAMPIONSHIP_TAB];

export const CHAMPIONSHIP_TABS_DESKTOP_MEDIA = "(min-width: 768px)" as const;

export const CHAMPIONSHIP_TAB_SEARCH_KEY = "tab" as const;

export const CHAMPIONSHIP_TAB_SEARCH = {
	tab: parseAsStringEnum<ChampionshipTab>(Object.values(CHAMPIONSHIP_TAB)),
};

export const CHAMPIONSHIP_TAB_LABEL = {
	roster: "Elenco",
	events: "Rodadas",
	standings: "Classificação",
	podium: "Pódio",
	trends: "Tendências",
	drawSim: "Simular Sorteio",
	monthly: "Mensalistas",
	management: "Gestão",
	deactivated: "Desativados",
	settings: "Configuração",
	more: "Mais",
} as const;

export const CHAMPIONSHIP_MORE_TAB_ID = "more" as const;

type ChampionshipTabItem = {
	id: ChampionshipTab;
	label: string;
};

export const CHAMPIONSHIP_PRIMARY_TABS = [
	{
		id: CHAMPIONSHIP_TAB.roster,
		label: CHAMPIONSHIP_TAB_LABEL.roster,
	},
	{
		id: CHAMPIONSHIP_TAB.events,
		label: CHAMPIONSHIP_TAB_LABEL.events,
	},
] as const satisfies readonly ChampionshipTabItem[];

export const CHAMPIONSHIP_MORE_TABS = [
	{
		id: CHAMPIONSHIP_TAB.standings,
		label: CHAMPIONSHIP_TAB_LABEL.standings,
	},
	{
		id: CHAMPIONSHIP_TAB.podium,
		label: CHAMPIONSHIP_TAB_LABEL.podium,
	},
	{
		id: CHAMPIONSHIP_TAB.trends,
		label: CHAMPIONSHIP_TAB_LABEL.trends,
	},
	{
		id: CHAMPIONSHIP_TAB.drawSim,
		label: CHAMPIONSHIP_TAB_LABEL.drawSim,
	},
] as const satisfies readonly ChampionshipTabItem[];

export const CHAMPIONSHIP_TABS = [
	...CHAMPIONSHIP_PRIMARY_TABS,
	...CHAMPIONSHIP_MORE_TABS,
] as const;

export function championshipMoreTabs(
	includeManagement: boolean,
): ChampionshipTabItem[] {
	if (!includeManagement) {
		return [...CHAMPIONSHIP_MORE_TABS];
	}

	return [
		...CHAMPIONSHIP_MORE_TABS,
		{
			id: CHAMPIONSHIP_TAB.monthly,
			label: CHAMPIONSHIP_TAB_LABEL.monthly,
		},
		{
			id: CHAMPIONSHIP_TAB.management,
			label: CHAMPIONSHIP_TAB_LABEL.management,
		},
	];
}

export function championshipTabs(includeManagement: boolean) {
	if (!includeManagement) {
		return CHAMPIONSHIP_TABS;
	}

	return [
		...CHAMPIONSHIP_TABS,
		{
			id: CHAMPIONSHIP_TAB.monthly,
			label: CHAMPIONSHIP_TAB_LABEL.monthly,
		},
		{
			id: CHAMPIONSHIP_TAB.management,
			label: CHAMPIONSHIP_TAB_LABEL.management,
		},
	];
}

export function isChampionshipMoreTab(
	tab: ChampionshipTab,
	includeManagement: boolean,
): boolean {
	return championshipMoreTabs(includeManagement).some(
		(item) => item.id === tab,
	);
}

export function championshipTabBarItems() {
	return [
		...CHAMPIONSHIP_PRIMARY_TABS,
		{
			id: CHAMPIONSHIP_MORE_TAB_ID,
			label: CHAMPIONSHIP_TAB_LABEL.more,
		},
	] as const;
}

export function visibleChampionshipTab(
	requestedTab: ChampionshipTab,
	canViewManagement: boolean,
): ChampionshipTab {
	if (
		(requestedTab === CHAMPIONSHIP_TAB.management ||
			requestedTab === CHAMPIONSHIP_TAB.monthly) &&
		!canViewManagement
	) {
		return CHAMPIONSHIP_TAB.roster;
	}

	return requestedTab;
}

export function keepChampionshipTabMounted(
	selectedTab: ChampionshipTab,
	tab: ChampionshipTab,
	alreadyMounted: boolean,
): boolean {
	if (alreadyMounted) {
		return true;
	}

	return selectedTab === tab;
}

export function rememberChampionshipTab(
	mounted: Readonly<Partial<Record<ChampionshipTab, boolean>>>,
	selectedTab: ChampionshipTab,
): Partial<Record<ChampionshipTab, boolean>> {
	if (mounted[selectedTab]) {
		return mounted;
	}

	return {
		...mounted,
		[selectedTab]: true,
	};
}
