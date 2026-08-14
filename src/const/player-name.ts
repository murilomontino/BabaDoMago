export const PLAYER_NICKNAME = {
	maxLength: 40,
} as const;

export const PLAYER_LABEL = {
	nickname: "Apelido",
	nicknamePlaceholder: "Apelido no baba",
	eventStats: "Stats do evento",
} as const;

export function playerVisibleName(player: {
	nickname: string | null;
	display_name: string;
}): string {
	const nickname = player.nickname?.trim();
	return nickname ? nickname : player.display_name;
}

export function confirmClaimPlayerMessage(name: string): string {
	return `Você é ${name}?`;
}
