export const PLAYER_NICKNAME = {
	maxLength: 40,
	maxTags: 8,
} as const;

export const PLAYER_LABEL = {
	nickname: "Apelido",
	nicknamePlaceholder: "Apelido no baba",
	nicknameTags: "Apelidos para busca",
	nicknameTagsPlaceholder: "vita, vitin",
	nicknameTagRemove: "Remover",
	eventStats: "Stats da rodada",
	player: "Jogador",
	goalkeeper: "Goleiro",
	add: "add",
	addAria: "Adicionar jogador",
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

export function normalizeNicknameTags(tags: readonly string[]): string[] {
	const seen = new Set<string>();
	return tags.flatMap((raw) => {
		const tag = raw.trim();
		if (tag.length === 0 || tag.length > PLAYER_NICKNAME.maxLength) {
			return [];
		}

		const key = tag.toLowerCase();
		if (seen.has(key)) {
			return [];
		}

		if (seen.size >= PLAYER_NICKNAME.maxTags) {
			return [];
		}

		seen.add(key);
		return [tag];
	});
}

export function playerVisibleName(player: {
	nickname: string | null;
	display_name: string;
}): string {
	const nickname = player.nickname?.trim();
	if (nickname) {
		return nickname;
	}

	const displayName = player.display_name.trim();
	if (displayName) {
		return displayName;
	}

	return PLAYER_LABEL.player;
}

export function matchOpDisplayName(
	playerId: number | null,
	players: readonly {
		id: number;
		nickname: string | null;
		display_name: string;
	}[],
	attendance: readonly { player_id: number; display_name: string }[] = [],
): string {
	if (playerId === null) {
		return "";
	}

	const rosterPlayer = players.find((row) => row.id === playerId);
	if (rosterPlayer) {
		return playerVisibleName(rosterPlayer);
	}

	const present = attendance.find((row) => row.player_id === playerId);
	if (!present) {
		return PLAYER_LABEL.player;
	}

	return playerVisibleName({
		nickname: null,
		display_name: present.display_name,
	});
}

export function legalNameIfDifferent(
	visibleName: string,
	displayName: string,
): string | null {
	if (visibleName === displayName) {
		return null;
	}

	return displayName;
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
