import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EventTeamColor } from "@/const/event-team-color";
import {
	addChampionshipEventGoal,
	addChampionshipEventTeam,
	createChampionshipEvent,
	deleteChampionshipEvent,
	deleteChampionshipEventMatch,
	deleteChampionshipEventTeam,
	endChampionshipEvent,
	endChampionshipEventMatch,
	getChampionshipEventById,
	listChampionshipEvents,
	saveChampionshipEventAttendance,
	saveChampionshipEventTeams,
	setChampionshipEventMatchGoalkeeper,
	setChampionshipEventMatchPlayer,
	startChampionshipEventMatch,
	updateChampionshipEventTeam,
} from "@/services/championship-events";
import {
	CHAMPIONSHIP_EVENTS_QUERY_KEY,
	invalidateChampionshipEventQueries,
	invalidateChampionshipQueries,
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
			goalkeeperPlayerIds,
		}: {
			eventId: number;
			presentPlayerIds: readonly number[];
			teams: readonly {
				color: EventTeamColor | null;
				playerIds: readonly number[];
				goalkeeperId: number;
			}[];
			goalkeeperPlayerIds: readonly number[];
		}) =>
			saveChampionshipEventTeams(
				eventId,
				presentPlayerIds,
				teams,
				goalkeeperPlayerIds,
			),
		onSuccess: async () => {
			await invalidateChampionshipEventQueries(queryClient);
		},
	});
}

export function useSaveChampionshipEventAttendance(_championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			eventId,
			presentPlayerIds,
			goalkeeperPlayerIds,
		}: {
			eventId: number;
			presentPlayerIds: readonly number[];
			goalkeeperPlayerIds: readonly number[];
		}) =>
			saveChampionshipEventAttendance(
				eventId,
				presentPlayerIds,
				goalkeeperPlayerIds,
			),
		onSuccess: async () => {
			await Promise.all([
				invalidateChampionshipEventQueries(queryClient),
				invalidateChampionshipQueries(queryClient),
			]);
		},
	});
}

export function useAddChampionshipEventTeam(_championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			eventId,
			color,
			playerIds,
			goalkeeperId,
		}: {
			eventId: number;
			color: EventTeamColor | null;
			playerIds: readonly number[];
			goalkeeperId: number;
		}) =>
			addChampionshipEventTeam(eventId, {
				color,
				playerIds,
				goalkeeperId,
			}),
		onSuccess: async () => {
			await invalidateChampionshipEventQueries(queryClient);
		},
	});
}

export function useUpdateChampionshipEventTeam(_championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			teamId,
			color,
			playerIds,
			goalkeeperId,
		}: {
			teamId: number;
			color: EventTeamColor | null;
			playerIds: readonly number[];
			goalkeeperId: number;
		}) =>
			updateChampionshipEventTeam(teamId, {
				color,
				playerIds,
				goalkeeperId,
			}),
		onSuccess: async () => {
			await invalidateChampionshipEventQueries(queryClient);
		},
	});
}

export function useDeleteChampionshipEventTeam(_championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (teamId: number) => deleteChampionshipEventTeam(teamId),
		onSuccess: async () => {
			await invalidateChampionshipEventQueries(queryClient);
		},
	});
}

export function useStartChampionshipEventMatch(_championshipId: number) {
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
		}) => startChampionshipEventMatch(eventId, teamAId, teamBId),
		onSuccess: async () => {
			await invalidateChampionshipEventQueries(queryClient);
		},
	});
}

export function useAddChampionshipEventMatch(_championshipId: number) {
	return useStartChampionshipEventMatch(_championshipId);
}

export function useSetChampionshipEventMatchPlayer(_championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			matchId,
			teamId,
			slot,
			playerId,
		}: {
			matchId: number;
			teamId: number;
			slot: number;
			playerId: number | null;
		}) => setChampionshipEventMatchPlayer(matchId, teamId, slot, playerId),
		onSuccess: async () => {
			await invalidateChampionshipEventQueries(queryClient);
		},
	});
}

export function useSetChampionshipEventMatchGoalkeeper(
	_championshipId: number,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			matchId,
			teamId,
			playerId,
		}: {
			matchId: number;
			teamId: number;
			playerId: number;
		}) => setChampionshipEventMatchGoalkeeper(matchId, teamId, playerId),
		onSuccess: async () => {
			await invalidateChampionshipEventQueries(queryClient);
		},
	});
}

export function useAddChampionshipEventGoal(_championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			matchId,
			scorerPlayerId,
			assistPlayerId,
			isOwnGoal,
		}: {
			matchId: number;
			scorerPlayerId: number;
			assistPlayerId: number | null;
			isOwnGoal: boolean;
		}) =>
			addChampionshipEventGoal(
				matchId,
				scorerPlayerId,
				assistPlayerId,
				isOwnGoal,
			),
		onSuccess: async () => {
			await invalidateChampionshipEventQueries(queryClient);
		},
	});
}

export function useEndChampionshipEventMatch(_championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (matchId: number) => endChampionshipEventMatch(matchId),
		onSuccess: async () => {
			await Promise.all([
				invalidateChampionshipEventQueries(queryClient),
				invalidateChampionshipQueries(queryClient),
			]);
		},
	});
}

export function useDeleteChampionshipEventMatch(_championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (matchId: number) => deleteChampionshipEventMatch(matchId),
		onSuccess: async () => {
			await Promise.all([
				invalidateChampionshipEventQueries(queryClient),
				invalidateChampionshipQueries(queryClient),
			]);
		},
	});
}

export function useEndChampionshipEvent(_championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			eventId,
			presentPlayerIds,
		}: {
			eventId: number;
			presentPlayerIds: readonly number[] | null;
		}) => endChampionshipEvent(eventId, presentPlayerIds),
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
