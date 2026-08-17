export const SKELETON_CLASS = "animate-pulse rounded-md bg-line";

export const SKELETON_LABEL = {
	session: "Carregando sessão",
	championships: "Carregando campeonatos",
	championship: "Carregando campeonato",
	events: "Carregando rodadas",
	event: "Carregando rodada",
	match: "Carregando partida",
	player: "Carregando perfil",
	chart: "Carregando gráfico",
	podium: "Carregando pódio",
	logoCrop: "Carregando recorte",
} as const;

export const LIST_ROW_SKELETON_VARIANT = {
	championship: "championship",
	event: "event",
} as const;

export type ListRowSkeletonVariant =
	(typeof LIST_ROW_SKELETON_VARIANT)[keyof typeof LIST_ROW_SKELETON_VARIANT];

export const SKELETON_LIST_ROWS = [0, 1, 2, 3] as const;

export const SKELETON_TABLE_ROWS = [0, 1, 2, 3, 4, 5] as const;

const SKELETON_LEADING_COLUMNS = {
	withPlayer: 2,
	withoutPlayer: 1,
} as const;

export function skeletonStatHeaders(
	headers: readonly string[],
	withPlayerColumn: boolean,
): string[] {
	if (withPlayerColumn) {
		return [...headers.slice(SKELETON_LEADING_COLUMNS.withPlayer)];
	}

	return [...headers.slice(SKELETON_LEADING_COLUMNS.withoutPlayer)];
}

export const SKELETON_TEAM_CARDS = [0, 1, 2] as const;

export const SKELETON_TEAM_SLOTS = [0, 1, 2, 3, 4] as const;

export function skeletonClassName(className?: string): string {
	if (!className) {
		return `${SKELETON_CLASS} h-4 w-full`;
	}

	return `${SKELETON_CLASS} ${className}`;
}
