export const PLAYER_SEARCH = {
	label: "Buscar",
	placeholder: "vitinho, murilo",
	empty: "Nenhum jogador encontrado",
} as const;

function normalizePlayerSearch(value: string): string {
	return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function filterPlayersBySearch<
	T extends { display_name: string; nickname?: string | null },
>(players: readonly T[], query: string): T[] {
	const tokens = query
		.split(",")
		.map((token) => normalizePlayerSearch(token.trim()))
		.filter((token) => token.length > 0);

	if (tokens.length === 0) {
		return [...players];
	}

	return players.filter((player) => {
		const name = normalizePlayerSearch(player.display_name);
		const nickname = normalizePlayerSearch(player.nickname ?? "");
		return tokens.some(
			(token) => name.includes(token) || nickname.includes(token),
		);
	});
}
