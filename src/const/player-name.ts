export const PLAYER_NICKNAME = {
	maxLength: 40,
} as const;

export const PLAYER_LABEL = {
	nickname: "Apelido",
	nicknamePlaceholder: "Apelido no baba",
	eventStats: "Stats da rodada",
} as const;

export function playerVisibleName(player: {
	nickname: string | null;
	display_name: string;
}): string {
	const nickname = player.nickname?.trim();
	return nickname ? nickname : player.display_name;
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
