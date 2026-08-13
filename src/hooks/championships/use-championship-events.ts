import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EventTeamColor } from "@/const/event-team-color";
import {
	addChampionshipEventMatch,
	endChampionshipEvent,
	getChampionshipEventById,
	listChampionshipEvents,
	startChampionshipEvent,
} from "@/services/championship-events";
import { CHAMPIONSHIP_EVENTS_QUERY_KEY } from "./championships-query-keys";

export function useChampionshipEvents(championshipId: number) {
	return useQuery({
		queryKey: [...CHAMPIONSHIP_EVENTS_QUERY_KEY, championshipId],
		queryFn: () => listChampionshipEvents(championshipId),
		enabled: Number.isFinite(championshipId),
	});
}

export function useChampionshipEvent(championshipId: number, eventId: number) {
	return useQuery({
		queryKey: [...CHAMPIONSHIP_EVENTS_QUERY_KEY, championshipId, eventId],
		queryFn: () => getChampionshipEventById(championshipId, eventId),
		enabled: Number.isFinite(championshipId) && Number.isFinite(eventId),
	});
}

export function useStartChampionshipEvent(championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			eventDate,
			presentPlayerIds,
			teams,
		}: {
			eventDate: string;
			presentPlayerIds: readonly number[];
			teams: readonly { color: EventTeamColor; playerIds: readonly number[] }[];
		}) =>
			startChampionshipEvent(
				championshipId,
				eventDate,
				presentPlayerIds,
				teams,
			),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: CHAMPIONSHIP_EVENTS_QUERY_KEY,
			});
		},
	});
}

export function useAddChampionshipEventMatch(championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			eventId,
			teamAId,
			teamBId,
		}: {
			eventId: number;
			teamAId: number;
			teamBId: number;
		}) => addChampionshipEventMatch(eventId, teamAId, teamBId),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: [...CHAMPIONSHIP_EVENTS_QUERY_KEY, championshipId],
			});
		},
	});
}

export function useEndChampionshipEvent(championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (eventId: number) => endChampionshipEvent(eventId),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: [...CHAMPIONSHIP_EVENTS_QUERY_KEY, championshipId],
			});
		},
	});
}
