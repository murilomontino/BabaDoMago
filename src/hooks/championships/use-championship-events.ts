import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type {
	EventAttendanceStatsDraft,
	PlayerEventStatsDraft,
} from "@/const/championship-event";
import {
	MATCH_CLOCK_ACTION,
	type MatchClockAction,
	type MatchClockFields,
} from "@/const/championship-event-match";
import type { EventTeamColor } from "@/const/event-team-color";
import { useMatchClockStore } from "@/hooks/match-clock-store";
import { enqueueMatchClockFlush } from "@/hooks/match-clock-sync";
import { supabase } from "@/lib/supabase";
import {
	addChampionshipEventGoal,
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
	setChampionshipEventMatchGoalkeeper,
	setChampionshipEventMatchPlayer,
	setChampionshipEventMvps,
	startChampionshipEventMatch,
	undoChampionshipEventGoal,
	updateChampionshipEventTeam,
	upsertChampionshipEventRsvp,
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
			includeStats,
		}: {
			matchId: number;
			teamId: number;
			slot: number;
			playerId: number | null;
			includeStats?: boolean;
		}) =>
			setChampionshipEventMatchPlayer(
				matchId,
				teamId,
				slot,
				playerId,
				includeStats,
			),
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
			elapsedSeconds,
		}: {
			matchId: number;
			scorerPlayerId: number;
			assistPlayerId: number | null;
			isOwnGoal: boolean;
			elapsedSeconds: number | null;
		}) =>
			addChampionshipEventGoal(
				matchId,
				scorerPlayerId,
				assistPlayerId,
				isOwnGoal,
				elapsedSeconds,
			),
		onSuccess: async () => {
			await invalidateChampionshipEventQueries(queryClient);
		},
	});
}

export function useUndoChampionshipEventGoal(_championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ matchId, goalId }: { matchId: number; goalId: number }) =>
			undoChampionshipEventGoal(matchId, goalId),
		onSuccess: async () => {
			await invalidateChampionshipEventQueries(queryClient);
		},
	});
}

function useMatchClockMutation(action: MatchClockAction) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			matchId,
		}: {
			matchId: number;
			seed: MatchClockFields;
		}) => {
			await enqueueMatchClockFlush(matchId);
		},
		onMutate: ({ matchId, seed }) => {
			useMatchClockStore.getState().apply(matchId, action, Date.now(), seed);
		},
		onSuccess: async () => {
			await invalidateChampionshipEventQueries(queryClient);
		},
	});
}

export function useStartChampionshipEventClock(_championshipId: number) {
	return useMatchClockMutation(MATCH_CLOCK_ACTION.start);
}

export function usePauseChampionshipEventMatch(_championshipId: number) {
	return useMatchClockMutation(MATCH_CLOCK_ACTION.pause);
}

export function useResumeChampionshipEventMatch(_championshipId: number) {
	return useMatchClockMutation(MATCH_CLOCK_ACTION.resume);
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
