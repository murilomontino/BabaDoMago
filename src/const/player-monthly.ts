import type { ChampionshipPlayer } from "@/types/championship";

export const PLAYER_MONTHLY_LABEL = {
	badge: "Mensalista",
	title: "Mensalistas",
	countLabel: "mensalistas",
	add: "Adicionar",
	addTitle: "Adicionar mensalista",
	addEmpty: "Todos do elenco já são mensalistas",
	remove: "Remover",
	removeTitle: "Remover mensalista",
	removeHint: "Remover {name} dos mensalistas?",
	cancel: "Cancelar",
	empty: "Nenhum mensalista",
} as const;

export function monthlyRemoveHint(name: string): string {
	return PLAYER_MONTHLY_LABEL.removeHint.replace("{name}", name);
}

export function monthlyRosterPlayers(
	players: readonly ChampionshipPlayer[],
): ChampionshipPlayer[] {
	return players.filter((player) => player.is_monthly);
}

export function monthlyEligiblePlayers(
	players: readonly ChampionshipPlayer[],
): ChampionshipPlayer[] {
	return players.filter((player) => !player.is_monthly);
}
