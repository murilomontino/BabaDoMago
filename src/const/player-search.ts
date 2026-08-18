import { parsePlayerNameList } from "./player-name-list.ts";

export const PLAYER_SEARCH = {
	label: "Buscar",
	placeholder: "vitinho, murilo",
	empty: "Nenhum jogador encontrado",
	countLabel: "jogadores",
	filteredLabel: "filtrados",
} as const;

function normalizePlayerSearch(value: string): string {
	return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function filterPlayersBySearch<
	T extends {
		display_name: string;
		nickname?: string | null;
		nickname_tags?: readonly string[] | null;
	},
>(players: readonly T[], query: string): T[] {
	const tokens = parsePlayerNameList(query)
		.flatMap((name) => name.split(","))
		.map((token) => normalizePlayerSearch(token.trim()))
		.filter((token) => token.length > 0);

	if (tokens.length === 0) {
		return [...players];
	}

	return players.filter((player) => {
		const haystack = [
			player.display_name,
			player.nickname ?? "",
			...(player.nickname_tags ?? []),
		].map(normalizePlayerSearch);
		return tokens.some((token) =>
			haystack.some((value) => value.includes(token)),
		);
	});
}
