import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type {
	EventAttendanceStatsDraft,
	PlayerEventStatsDraft,
} from "@/const/championship-event";
import {
	clampMatchDurationMinutes,
	EVENT_MATCH_DURATION,
	matchDurationSeconds,
} from "@/const/championship-event-match";
import type { EventTeamColor } from "@/const/event-team-color";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/lib/supabase";
import {
	addChampionshipEventTeam,
	createChampionshipEvent,
	deleteChampionshipEvent,
	deleteChampionshipEventMatch,
	deleteChampionshipEventTeam,
	endChampionshipEvent,
	endChampionshipEventMatch,
	ensureChampionshipEventAttendancePlayer,
	getChampionshipEventById,
	listChampionshipEvents,
	promoteChampionshipEventRsvpGoing,
	reopenChampionshipEventMatch,
	saveChampionshipEventAttendance,
	saveChampionshipEventAttendanceStats,
	saveChampionshipEventTeams,
	saveChampionshipPlayerEventStats,
	setChampionshipEventMvps,
	startChampionshipEventMatch,
	swapChampionshipEventMatchTeam,
	updateChampionshipEventTeam,
	upsertChampionshipEventRsvp,
} from "@/services/championship-events";
import {
	CHAMPIONSHIP_EVENTS_QUERY_KEY,
	invalidateChampionshipEventQueries,
	invalidateChampionshipQueries,
} from "./championships-query-keys";
import { CHAMPIONSHIP_AUDIT_QUERY_KEY } from "./use-championship-audit-logs";

export function useChampionshipEvents(championshipId: number) {
	const { user } = useAuth();

	return useQuery({
		queryKey: [...CHAMPIONSHIP_EVENTS_QUERY_KEY, championshipId, user?.id],
		queryFn: () => listChampionshipEvents(championshipId),
		enabled: Number.isFinite(championshipId) && Boolean(user),
	});
}

export function useChampionshipEvent(championshipId: number, eventId: number) {
	const { user } = useAuth();

	return useQuery({
		queryKey: [
			...CHAMPIONSHIP_EVENTS_QUERY_KEY,
			championshipId,
			eventId,
			user?.id,
		],
		queryFn: () => getChampionshipEventById(championshipId, eventId),
		enabled:
			Number.isFinite(championshipId) &&
			Number.isFinite(eventId) &&
			Boolean(user),
	});
}

export function useCreateChampionshipEvent(championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			eventDate,
			eventTime,
		}: {
			eventDate: string;
			eventTime: string;
		}) => createChampionshipEvent(championshipId, eventDate, eventTime),
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
			isDraw,
		}: {
			eventId: number;
			presentPlayerIds: readonly number[];
			teams: readonly {
				color: EventTeamColor | null;
				playerIds: readonly number[];
				goalkeeperId: number;
				isActive?: boolean;
			}[];
			goalkeeperPlayerIds: readonly number[];
			isDraw?: boolean;
		}) =>
			saveChampionshipEventTeams(
				eventId,
				presentPlayerIds,
				teams,
				goalkeeperPlayerIds,
				isDraw,
			),
		onSuccess: async (_data, variables) => {
			await invalidateChampionshipEventQueries(queryClient);
			if (!variables.isDraw) {
				return;
			}

			await queryClient.invalidateQueries({
				queryKey: CHAMPIONSHIP_AUDIT_QUERY_KEY,
			});
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

export function useEnsureChampionshipEventAttendancePlayer(
	_championshipId: number,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			eventId,
			playerId,
		}: {
			eventId: number;
			playerId: number;
		}) => ensureChampionshipEventAttendancePlayer(eventId, playerId),
		onSuccess: async () => {
			await Promise.all([
				invalidateChampionshipEventQueries(queryClient),
				invalidateChampionshipQueries(queryClient),
			]);
		},
	});
}

export function useUpsertChampionshipEventRsvp(_championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ eventId, status }: { eventId: number; status: string }) =>
			upsertChampionshipEventRsvp(eventId, status),
		onSuccess: async () => {
			await invalidateChampionshipEventQueries(queryClient);
		},
	});
}

export function usePromoteChampionshipEventRsvpGoing(_championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (eventId: number) => promoteChampionshipEventRsvpGoing(eventId),
		onSuccess: async () => {
			await Promise.all([
				invalidateChampionshipEventQueries(queryClient),
				invalidateChampionshipQueries(queryClient),
			]);
		},
	});
}

export function useSaveChampionshipEventAttendanceStats(
	_championshipId: number,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			eventId,
			stats,
		}: {
			eventId: number;
			stats: readonly EventAttendanceStatsDraft[];
		}) => saveChampionshipEventAttendanceStats(eventId, stats),
		onSuccess: async () => {
			await Promise.all([
				invalidateChampionshipEventQueries(queryClient),
				invalidateChampionshipQueries(queryClient),
			]);
		},
	});
}

export function useSaveChampionshipPlayerEventStats(_championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			playerId,
			eventId,
			stats,
		}: {
			playerId: number;
			eventId: number;
			stats: PlayerEventStatsDraft;
		}) => saveChampionshipPlayerEventStats(playerId, eventId, stats),
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
			durationMinutes,
		}: {
			eventId: number;
			teamAId: number;
			teamBId: number;
			durationMinutes?: number;
		}) =>
			startChampionshipEventMatch(
				eventId,
				teamAId,
				teamBId,
				matchDurationSeconds(
					clampMatchDurationMinutes(
						durationMinutes ?? EVENT_MATCH_DURATION.defaultMinutes,
					),
				),
			),
		onSuccess: async () => {
			await invalidateChampionshipEventQueries(queryClient);
		},
	});
}

export function useAddChampionshipEventMatch(_championshipId: number) {
	return useStartChampionshipEventMatch(_championshipId);
}

export function useSwapChampionshipEventMatchTeam(_championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			matchId,
			outgoingTeamId,
			incomingTeamId,
		}: {
			matchId: number;
			outgoingTeamId: number;
			incomingTeamId: number;
		}) =>
			swapChampionshipEventMatchTeam(matchId, outgoingTeamId, incomingTeamId),
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

export function useReopenChampionshipEventMatch(_championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (matchId: number) => reopenChampionshipEventMatch(matchId),
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
			mvpPlayerIds,
		}: {
			eventId: number;
			presentPlayerIds: readonly number[] | null;
			mvpPlayerIds?: readonly number[] | null;
		}) => endChampionshipEvent(eventId, presentPlayerIds, mvpPlayerIds ?? null),
		onSuccess: async () => {
			await Promise.all([
				invalidateChampionshipEventQueries(queryClient),
				invalidateChampionshipQueries(queryClient),
			]);
		},
	});
}

export function useSetChampionshipEventMvps(_championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			eventId,
			playerIds,
		}: {
			eventId: number;
			playerIds: readonly number[];
		}) => setChampionshipEventMvps(eventId, playerIds),
		onSuccess: async () => {
			await Promise.all([
				invalidateChampionshipEventQueries(queryClient),
				invalidateChampionshipQueries(queryClient),
			]);
		},
	});
}

export function useDeleteChampionshipEvent(_championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (eventId: number) => deleteChampionshipEvent(eventId),
		onSuccess: async (_void, eventId) => {
			await queryClient.invalidateQueries({
				queryKey: CHAMPIONSHIP_EVENTS_QUERY_KEY,
				predicate: (query) => query.queryKey[2] !== eventId,
			});
		},
	});
}

const EVENT_MATCH_REALTIME_DEBOUNCE_MS = 50;

export function useChampionshipEventRealtime(
	_championshipId: number,
	eventId: number,
) {
	const queryClient = useQueryClient();

	useEffect(() => {
		if (!Number.isFinite(eventId)) {
			return;
		}

		let timeout: ReturnType<typeof setTimeout> | null = null;
		function invalidate() {
			if (timeout) {
				clearTimeout(timeout);
			}

			timeout = setTimeout(() => {
				void invalidateChampionshipEventQueries(queryClient);
			}, EVENT_MATCH_REALTIME_DEBOUNCE_MS);
		}

		const filter = `event_id=eq.${eventId}`;
		const channel = supabase
			.channel(`event-match:${eventId}`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "championship_event_matches",
					filter,
				},
				invalidate,
			)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "championship_event_match_players",
					filter,
				},
				invalidate,
			)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "championship_event_goals",
					filter,
				},
				invalidate,
			)
			.subscribe();

		return () => {
			if (timeout) {
				clearTimeout(timeout);
			}

			void supabase.removeChannel(channel);
		};
	}, [eventId, queryClient]);
}
