import type { QueryClient } from "@tanstack/react-query";
import type { ChampionshipWithPlayers } from "@/types/championship";

export const CHAMPIONSHIPS_QUERY_KEY = ["championships"] as const;

export const CHAMPIONSHIP_BY_ID_QUERY_KEY = ["championship"] as const;

export const CHAMPIONSHIP_BY_INVITE_QUERY_KEY = [
	"championshipByInvite",
] as const;

export const CHAMPIONSHIP_EVENTS_QUERY_KEY = ["championshipEvents"] as const;

export async function invalidateChampionshipQueries(queryClient: QueryClient) {
	await Promise.all([
		queryClient.invalidateQueries({ queryKey: CHAMPIONSHIPS_QUERY_KEY }),
		queryClient.invalidateQueries({ queryKey: CHAMPIONSHIP_BY_ID_QUERY_KEY }),
		queryClient.invalidateQueries({
			queryKey: CHAMPIONSHIP_BY_INVITE_QUERY_KEY,
		}),
	]);
}

export async function invalidateChampionshipEventQueries(
	queryClient: QueryClient,
) {
	await queryClient.invalidateQueries({
		queryKey: CHAMPIONSHIP_EVENTS_QUERY_KEY,
	});
}

export function withChampionshipPlayerGoalkeeper(
	championship: ChampionshipWithPlayers,
	playerId: number,
	isGoalkeeper: boolean,
): ChampionshipWithPlayers {
	return {
		...championship,
		players: championship.players.map((player) => {
			if (player.id !== playerId) {
				return player;
			}

			return { ...player, is_goalkeeper: isGoalkeeper };
		}),
	};
}
