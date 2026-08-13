import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EventTeamColor } from "@/const/event-team-color";
import {
	addChampionshipEventMatch,
	createChampionshipEvent,
	deleteChampionshipEvent,
	endChampionshipEvent,
	getChampionshipEventById,
	listChampionshipEvents,
	saveChampionshipEventTeams,
} from "@/services/championship-events";
import {
	CHAMPIONSHIP_EVENTS_QUERY_KEY,
	invalidateChampionshipEventQueries,
} from "./championships-query-keys";

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

export function useCreateChampionshipEvent(championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (eventDate: string) =>
			createChampionshipEvent(championshipId, eventDate),
		onSuccess: async () => {
			await invalidateChampionshipEventQueries(queryClient);
		},
	});
}

export function useSaveChampionshipEventTeams(_championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			eventId,
			presentPlayerIds,
			teams,
		}: {
			eventId: number;
			presentPlayerIds: readonly number[];
			teams: readonly {
				color: EventTeamColor;
				playerIds: readonly number[];
				goalkeeperId: number;
			}[];
		}) => saveChampionshipEventTeams(eventId, presentPlayerIds, teams),
		onSuccess: async () => {
			await invalidateChampionshipEventQueries(queryClient);
		},
	});
}

export function useAddChampionshipEventMatch(_championshipId: number) {
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
			await invalidateChampionshipEventQueries(queryClient);
		},
	});
}

export function useEndChampionshipEvent(_championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (eventId: number) => endChampionshipEvent(eventId),
		onSuccess: async () => {
			await invalidateChampionshipEventQueries(queryClient);
		},
	});
}

export function useDeleteChampionshipEvent(_championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (eventId: number) => deleteChampionshipEvent(eventId),
		onSuccess: async () => {
			await invalidateChampionshipEventQueries(queryClient);
		},
	});
}
