export const CHAMPIONSHIP_VISIBILITY = {
	default: true,
	hiddenLabel: "Oculto",
	listLabel: "Visível na lista inicial",
	title: "Alterar visibilidade",
	changeLabel: "Mudar visibilidade",
	listedStatus: "Este campeonato aparece na lista inicial.",
	hiddenStatus: "Este campeonato está oculto.",
} as const;

export const CHAMPIONSHIP_VISIBILITY_OPTIONS = [
	{
		id: "visible",
		isVisible: true,
		label: CHAMPIONSHIP_VISIBILITY.listLabel,
	},
	{
		id: "hidden",
		isVisible: false,
		label: CHAMPIONSHIP_VISIBILITY.hiddenLabel,
	},
] as const;

export function championshipVisibilityStatus(isVisible: boolean): string {
	if (isVisible) {
		return CHAMPIONSHIP_VISIBILITY.listedStatus;
	}

	return CHAMPIONSHIP_VISIBILITY.hiddenStatus;
}

export function isChampionshipListed(
	championship: { is_visible: boolean; created_by: string },
	userId: string,
): boolean {
	return championship.is_visible || championship.created_by === userId;
}
