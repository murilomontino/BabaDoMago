export const PLAYER_NICKNAME = {
	maxLength: 40,
} as const;

export const PLAYER_LABEL = {
	nickname: "Apelido",
	nicknamePlaceholder: "Apelido no baba",
	eventStats: "Stats da rodada",
	player: "Jogador",
	goalkeeper: "Goleiro",
} as const;

export const PLAYER_KIND = {
	player: "player",
	goalkeeper: "goalkeeper",
} as const;

export type PlayerKind = (typeof PLAYER_KIND)[keyof typeof PLAYER_KIND];

export const PLAYER_KIND_OPTIONS = [
	PLAYER_KIND.player,
	PLAYER_KIND.goalkeeper,
] as const;

export const PLAYER_KIND_LABEL = {
	player: PLAYER_LABEL.player,
	goalkeeper: PLAYER_LABEL.goalkeeper,
} as const;

export function playerKindFromGoalkeeper(isGoalkeeper: boolean): PlayerKind {
	if (isGoalkeeper) {
		return PLAYER_KIND.goalkeeper;
	}

	return PLAYER_KIND.player;
}

export function isGoalkeeperKind(kind: PlayerKind): boolean {
	return kind === PLAYER_KIND.goalkeeper;
}

export function playerVisibleName(player: {
	nickname: string | null;
	display_name: string;
}): string {
	const nickname = player.nickname?.trim();
	if (nickname) {
		return nickname;
	}

	return player.display_name;
}

export function comparePlayersByVisibleName(
	left: { nickname: string | null; display_name: string },
	right: { nickname: string | null; display_name: string },
): number {
	return playerVisibleName(left).localeCompare(
		playerVisibleName(right),
		"pt-BR",
	);
}

export function confirmClaimPlayerMessage(name: string): string {
	return `Você é ${name}?`;
}
