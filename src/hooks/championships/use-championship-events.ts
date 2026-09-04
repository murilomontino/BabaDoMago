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
import {
	EVENT_PLAYER_VOTE,
	type EventPlayerVoteChoice,
} from "@/const/event-player-vote";
import type { EventTeamColor } from "@/const/event-team-color";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/lib/supabase";
import {
	addChampionshipEventTeam,
	type ChampionshipEventPlayerVoteCountsPayload,
	type ChampionshipEventPlayerVoteRow,
	closeChampionshipEventPlayerVotes,
	createChampionshipEvent,
	deleteChampionshipEvent,
	deleteChampionshipEventMatch,
	deleteChampionshipEventTeam,
	endChampionshipEvent,
	endChampionshipEventMatch,
	ensureChampionshipEventAttendancePlayer,
	getChampionshipEventById,
	listChampionshipEventPlayerVoteCounts,
	listChampionshipEvents,
	listMyChampionshipEventPlayerVotes,
	promoteChampionshipEventRsvpGoing,
	reopenChampionshipEventMatch,
	reopenChampionshipEventPlayerVotes,
	saveChampionshipEventAttendance,
	saveChampionshipEventAttendanceStats,
	saveChampionshipEventTeams,
	saveChampionshipPlayerEventStats,
	setChampionshipEventMvps,
	startChampionshipEventMatch,
	submitChampionshipEventPlayerVotes,
	swapChampionshipEventMatchTeam,
	updateChampionshipEventTeam,
	upsertChampionshipEventRsvp,
	voidChampionshipEventPlayerVotes,
	voteChampionshipEventPlayer,
} from "@/services/championship-events";
import type { ChampionshipEvent } from "@/types/championship-event";
import {
	championshipEventDetailQueryKey,
	championshipEventMyVotesQueryKey,
	championshipEventsListQueryKey,
	championshipEventVoteCountsQueryKey,
	eventIdFromDetailKey,
	invalidateChampionshipEvent,
	invalidateChampionshipEvents,
	invalidateChampionshipQueries,
	isChampionshipEventMyVotesKey,
	patchCachedChampionshipEvent,
} from "./championships-query-keys";
import { CHAMPIONSHIP_AUDIT_QUERY_KEY } from "./use-championship-audit-logs";

export function useChampionshipEvents(championshipId: number) {
	const { user } = useAuth();

	return useQuery({
		queryKey: championshipEventsListQueryKey(championshipId, user?.id),
		queryFn: () => listChampionshipEvents(championshipId),
		enabled: Number.isFinite(championshipId) && Boolean(user),
	});
}

export function useChampionshipEvent(championshipId: number, eventId: number) {
	const { user } = useAuth();

	return useQuery({
		queryKey: championshipEventDetailQueryKey(
			championshipId,
			eventId,
			user?.id,
		),
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
			await invalidateChampionshipEvents(queryClient, championshipId);
		},
	});
}

export function useSaveChampionshipEventTeams(championshipId: number) {
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
			await invalidateChampionshipEvents(queryClient, championshipId);
			if (!variables.isDraw) {
				return;
			}

			await queryClient.invalidateQueries({
				queryKey: CHAMPIONSHIP_AUDIT_QUERY_KEY,
			});
		},
	});
}

export function useSaveChampionshipEventAttendance(championshipId: number) {
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
				invalidateChampionshipEvents(queryClient, championshipId),
				invalidateChampionshipQueries(queryClient),
			]);
		},
	});
}

export function useEnsureChampionshipEventAttendancePlayer(
	championshipId: number,
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
				invalidateChampionshipEvents(queryClient, championshipId),
				invalidateChampionshipQueries(queryClient),
			]);
		},
	});
}

export function useUpsertChampionshipEventRsvp(championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ eventId, status }: { eventId: number; status: string }) =>
			upsertChampionshipEventRsvp(eventId, status),
		onSuccess: async () => {
			await invalidateChampionshipEvents(queryClient, championshipId);
		},
	});
}

export function usePromoteChampionshipEventRsvpGoing(championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (eventId: number) => promoteChampionshipEventRsvpGoing(eventId),
		onSuccess: async () => {
			await Promise.all([
				invalidateChampionshipEvents(queryClient, championshipId),
				invalidateChampionshipQueries(queryClient),
			]);
		},
	});
}

export function useSaveChampionshipEventAttendanceStats(
	championshipId: number,
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
				invalidateChampionshipEvents(queryClient, championshipId),
				invalidateChampionshipQueries(queryClient),
			]);
		},
	});
}

export function useSaveChampionshipPlayerEventStats(championshipId: number) {
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
				invalidateChampionshipEvents(queryClient, championshipId),
				invalidateChampionshipQueries(queryClient),
			]);
		},
	});
}

export function useAddChampionshipEventTeam(championshipId: number) {
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
			await invalidateChampionshipEvents(queryClient, championshipId);
		},
	});
}

export function useUpdateChampionshipEventTeam(championshipId: number) {
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
			await invalidateChampionshipEvents(queryClient, championshipId);
		},
	});
}

export function useDeleteChampionshipEventTeam(championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (teamId: number) => deleteChampionshipEventTeam(teamId),
		onSuccess: async () => {
			await invalidateChampionshipEvents(queryClient, championshipId);
		},
	});
}

export function useStartChampionshipEventMatch(championshipId: number) {
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
			await invalidateChampionshipEvents(queryClient, championshipId);
		},
	});
}

export function useAddChampionshipEventMatch(championshipId: number) {
	return useStartChampionshipEventMatch(championshipId);
}

export function useSwapChampionshipEventMatchTeam(championshipId: number) {
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
			await invalidateChampionshipEvents(queryClient, championshipId);
		},
	});
}

export function useEndChampionshipEventMatch(championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (matchId: number) => endChampionshipEventMatch(matchId),
		onSuccess: async () => {
			await Promise.all([
				invalidateChampionshipEvents(queryClient, championshipId),
				invalidateChampionshipQueries(queryClient),
			]);
		},
	});
}

export function useReopenChampionshipEventMatch(championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (matchId: number) => reopenChampionshipEventMatch(matchId),
		onSuccess: async () => {
			await Promise.all([
				invalidateChampionshipEvents(queryClient, championshipId),
				invalidateChampionshipQueries(queryClient),
			]);
		},
	});
}

export function useDeleteChampionshipEventMatch(championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (matchId: number) => deleteChampionshipEventMatch(matchId),
		onSuccess: async () => {
			await Promise.all([
				invalidateChampionshipEvents(queryClient, championshipId),
				invalidateChampionshipQueries(queryClient),
			]);
		},
	});
}

export function useEndChampionshipEvent(championshipId: number) {
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
				invalidateChampionshipEvents(queryClient, championshipId),
				invalidateChampionshipQueries(queryClient),
			]);
		},
	});
}

export function useSetChampionshipEventMvps(championshipId: number) {
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
				invalidateChampionshipEvents(queryClient, championshipId),
				invalidateChampionshipQueries(queryClient),
			]);
		},
	});
}

export function useDeleteChampionshipEvent(championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (eventId: number) => deleteChampionshipEvent(eventId),
		onSuccess: async () => {
			await invalidateChampionshipEvents(queryClient, championshipId);
		},
	});
}

export function useMyChampionshipEventPlayerVotes(eventId: number) {
	const { user } = useAuth();

	return useQuery({
		queryKey: championshipEventMyVotesQueryKey(eventId, user?.id),
		queryFn: () => listMyChampionshipEventPlayerVotes(eventId),
		enabled: Number.isFinite(eventId) && Boolean(user),
	});
}

export function useChampionshipEventPlayerVoteCounts(
	eventId: number,
	enabled: boolean,
	live: boolean,
) {
	return useQuery<ChampionshipEventPlayerVoteCountsPayload>({
		queryKey: championshipEventVoteCountsQueryKey(eventId),
		queryFn: () => listChampionshipEventPlayerVoteCounts(eventId),
		enabled: Number.isFinite(eventId) && enabled,
		refetchInterval:
			enabled && live ? EVENT_PLAYER_VOTE.ownerCountsPollMs : false,
	});
}

export function useCloseChampionshipEventPlayerVotes(championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (eventId: number) => closeChampionshipEventPlayerVotes(eventId),
		onSuccess: async (result) => {
			queryClient.setQueriesData<ChampionshipEvent>(
				{
					predicate: (query) =>
						eventIdFromDetailKey(query.queryKey) === result.event_id,
				},
				(current) => {
					if (!current) {
						return current;
					}

					return {
						...current,
						player_votes_closed_at: result.player_votes_closed_at,
					};
				},
			);

			await Promise.all([
				invalidateChampionshipEvent(
					queryClient,
					championshipId,
					result.event_id,
				),
				invalidateChampionshipQueries(queryClient),
			]);
		},
	});
}

export function useVoidChampionshipEventPlayerVotes(championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (eventId: number) => voidChampionshipEventPlayerVotes(eventId),
		onSuccess: async (result) => {
			queryClient.setQueriesData<ChampionshipEvent>(
				{
					predicate: (query) =>
						eventIdFromDetailKey(query.queryKey) === result.event_id,
				},
				(current) => {
					if (!current) {
						return current;
					}

					return {
						...current,
						player_votes_voided_at: result.player_votes_voided_at,
					};
				},
			);

			await Promise.all([
				invalidateChampionshipEvent(
					queryClient,
					championshipId,
					result.event_id,
				),
				invalidateChampionshipQueries(queryClient),
			]);
		},
	});
}

export function useReopenChampionshipEventPlayerVotes(championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (eventId: number) =>
			reopenChampionshipEventPlayerVotes(eventId),
		onSuccess: async (result) => {
			queryClient.setQueriesData<ChampionshipEvent>(
				{
					predicate: (query) =>
						eventIdFromDetailKey(query.queryKey) === result.event_id,
				},
				(current) => {
					if (!current) {
						return current;
					}

					return {
						...current,
						player_votes_voided_at: result.player_votes_voided_at,
						player_votes_closed_at: result.player_votes_closed_at,
						attendance: current.attendance.map((row) => ({
							...row,
							vote_rating_delta: 0,
						})),
					};
				},
			);

			queryClient.removeQueries({
				predicate: (query) =>
					isChampionshipEventMyVotesKey(query.queryKey, result.event_id),
			});

			await Promise.all([
				invalidateChampionshipEvent(
					queryClient,
					championshipId,
					result.event_id,
				),
				invalidateChampionshipQueries(queryClient),
			]);
		},
	});
}

export function useSubmitChampionshipEventPlayerVotes(
	championshipId: number,
	eventId: number,
) {
	const queryClient = useQueryClient();
	const { user } = useAuth();

	return useMutation({
		mutationFn: (
			votes: { target_player_id: number; value: EventPlayerVoteChoice }[],
		) => submitChampionshipEventPlayerVotes(eventId, votes),
		onSuccess: async (result) => {
			const deltaByPlayerId = new Map(
				result.attendance.map((row) => [row.player_id, row.vote_rating_delta]),
			);

			queryClient.setQueriesData<ChampionshipEvent>(
				{
					predicate: (query) =>
						eventIdFromDetailKey(query.queryKey) === eventId,
				},
				(current) => {
					if (!current) {
						return current;
					}

					return {
						...current,
						attendance: current.attendance.map((row) => {
							const voteRatingDelta = deltaByPlayerId.get(row.player_id);
							if (voteRatingDelta === undefined) {
								return row;
							}

							return {
								...row,
								vote_rating_delta: voteRatingDelta,
							};
						}),
					};
				},
			);

			queryClient.setQueryData(
				championshipEventMyVotesQueryKey(eventId, user?.id),
				result.votes,
			);

			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: championshipEventVoteCountsQueryKey(eventId),
				}),
				invalidateChampionshipEvent(queryClient, championshipId, eventId),
				invalidateChampionshipQueries(queryClient),
			]);
		},
	});
}

export function useVoteChampionshipEventPlayer(
	championshipId: number,
	eventId: number,
) {
	const queryClient = useQueryClient();
	const { user } = useAuth();

	return useMutation({
		mutationFn: ({
			targetPlayerId,
			value,
		}: {
			targetPlayerId: number;
			value: EventPlayerVoteChoice | null;
		}) => voteChampionshipEventPlayer(eventId, targetPlayerId, value),
		onSuccess: async (result) => {
			queryClient.setQueriesData<ChampionshipEvent>(
				{
					predicate: (query) =>
						eventIdFromDetailKey(query.queryKey) === eventId,
				},
				(current) => {
					if (!current) {
						return current;
					}

					return {
						...current,
						attendance: current.attendance.map((row) => {
							if (row.player_id !== result.target_player_id) {
								return row;
							}

							return {
								...row,
								vote_rating_delta: result.vote_rating_delta,
							};
						}),
					};
				},
			);

			queryClient.setQueryData(
				championshipEventMyVotesQueryKey(eventId, user?.id),
				(current: ChampionshipEventPlayerVoteRow[] | undefined) => {
					const without = (current ?? []).filter(
						(row) => row.target_player_id !== result.target_player_id,
					);
					if (!result.my_value) {
						return without;
					}

					return [
						...without,
						{
							target_player_id: result.target_player_id,
							value: result.my_value,
						},
					];
				},
			);

			await Promise.all([
				invalidateChampionshipEvent(queryClient, championshipId, eventId),
				invalidateChampionshipQueries(queryClient),
			]);
		},
	});
}

const EVENT_MATCH_REALTIME_DEBOUNCE_MS = 500;

type EventRealtimePayload = {
	eventType?: string;
	new?: Record<string, unknown>;
	old?: Record<string, unknown>;
};

function subscribeEventMatchChannel(
	eventId: number,
	onChange: (table: string, payload: EventRealtimePayload) => void,
) {
	const filter = `event_id=eq.${eventId}`;
	return supabase
		.channel(`event-match:${eventId}`)
		.on(
			"postgres_changes",
			{
				event: "*",
				schema: "public",
				table: "championship_event_matches",
				filter,
			},
			(payload) => {
				onChange("championship_event_matches", payload);
			},
		)
		.on(
			"postgres_changes",
			{
				event: "*",
				schema: "public",
				table: "championship_event_match_players",
				filter,
			},
			(payload) => {
				onChange("championship_event_match_players", payload);
			},
		)
		.on(
			"postgres_changes",
			{
				event: "*",
				schema: "public",
				table: "championship_event_goals",
				filter,
			},
			(payload) => {
				onChange("championship_event_goals", payload);
			},
		)
		.on(
			"postgres_changes",
			{
				event: "*",
				schema: "public",
				table: "championship_event_attendance",
				filter,
			},
			(payload) => {
				onChange("championship_event_attendance", payload);
			},
		)
		.subscribe();
}

export function useChampionshipEventRealtime(
	championshipId: number,
	eventId: number,
) {
	const queryClient = useQueryClient();

	useEffect(() => {
		if (!Number.isFinite(eventId) || !Number.isFinite(championshipId)) {
			return;
		}

		let timeout: ReturnType<typeof setTimeout> | null = null;
		let channel: ReturnType<typeof subscribeEventMatchChannel> | null = null;
		const pending: Array<{ table: string; payload: EventRealtimePayload }> = [];

		function flushPatches() {
			timeout = null;
			const batch = pending.splice(0, pending.length);
			for (const item of batch) {
				patchCachedChampionshipEvent(
					queryClient,
					eventId,
					item.table,
					item.payload,
				);
			}
		}

		function onChange(table: string, payload: EventRealtimePayload) {
			pending.push({ table, payload });
			if (timeout) {
				clearTimeout(timeout);
			}

			timeout = setTimeout(flushPatches, EVENT_MATCH_REALTIME_DEBOUNCE_MS);
		}

		function subscribe() {
			if (channel) {
				return;
			}

			channel = subscribeEventMatchChannel(eventId, onChange);
		}

		function unsubscribe() {
			if (!channel) {
				return;
			}

			void supabase.removeChannel(channel);
			channel = null;
		}

		function onVisibility() {
			if (document.visibilityState !== "visible") {
				unsubscribe();
				return;
			}

			subscribe();
			void invalidateChampionshipEvent(queryClient, championshipId, eventId);
		}

		if (document.visibilityState === "visible") {
			subscribe();
		}

		document.addEventListener("visibilitychange", onVisibility);
		return () => {
			document.removeEventListener("visibilitychange", onVisibility);
			if (timeout) {
				clearTimeout(timeout);
			}

			unsubscribe();
		};
	}, [championshipId, eventId, queryClient]);
}
