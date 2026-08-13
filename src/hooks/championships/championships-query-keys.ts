import type { QueryClient } from "@tanstack/react-query";

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
