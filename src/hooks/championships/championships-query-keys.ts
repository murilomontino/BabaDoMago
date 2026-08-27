import type { QueryClient } from "@tanstack/react-query";
import {
	EVENT_REALTIME_CHANGE,
	patchChampionshipEventRealtime,
} from "@/const/championship-event-realtime";
import {
	CHAMPIONSHIP_BY_ID_QUERY_KEY,
	CHAMPIONSHIP_BY_INVITE_QUERY_KEY,
	CHAMPIONSHIP_EVENTS_QUERY_KEY,
	CHAMPIONSHIPS_QUERY_KEY,
	championshipEventsChampionshipQueryKey,
	championshipIdFromEventsKey,
	eventIdFromDetailKey,
	isChampionshipEventsListKey,
} from "@/const/championships-query-key";
import type { ChampionshipWithPlayers } from "@/types/championship";
import type { ChampionshipEvent } from "@/types/championship-event";

export {
	CHAMPIONSHIP_BY_ID_QUERY_KEY,
	CHAMPIONSHIP_BY_INVITE_QUERY_KEY,
	CHAMPIONSHIP_EVENTS_QUERY_KEY,
	CHAMPIONSHIP_EVENTS_SCOPE,
	CHAMPIONSHIPS_QUERY_KEY,
	championshipEventDetailQueryKey,
	championshipEventsChampionshipQueryKey,
	championshipEventsListQueryKey,
	championshipIdFromEventsKey,
	eventIdFromDetailKey,
	isChampionshipEventDetailKey,
	isChampionshipEventsListKey,
} from "@/const/championships-query-key";

function championshipIdForCachedEvent(
	queryClient: QueryClient,
	eventId: number,
): number | null {
	const cached = queryClient.getQueriesData({
		queryKey: CHAMPIONSHIP_EVENTS_QUERY_KEY,
	});
	const match = cached.find(([queryKey]) => {
		return eventIdFromDetailKey(queryKey) === eventId;
	});
	if (!match) {
		return null;
	}

	return championshipIdFromEventsKey(match[0]);
}

export async function invalidateChampionshipQueries(queryClient: QueryClient) {
	await Promise.all([
		queryClient.invalidateQueries({ queryKey: CHAMPIONSHIPS_QUERY_KEY }),
		queryClient.invalidateQueries({ queryKey: CHAMPIONSHIP_BY_ID_QUERY_KEY }),
		queryClient.invalidateQueries({
			queryKey: CHAMPIONSHIP_BY_INVITE_QUERY_KEY,
		}),
	]);
}

export async function invalidateChampionshipEvents(
	queryClient: QueryClient,
	championshipId: number,
) {
	await queryClient.invalidateQueries({
		queryKey: championshipEventsChampionshipQueryKey(championshipId),
	});
}

export async function invalidateChampionshipEvent(
	queryClient: QueryClient,
	championshipId: number,
	eventId: number,
) {
	await Promise.all([
		queryClient.invalidateQueries({
			predicate: (query) =>
				isChampionshipEventsListKey(query.queryKey) &&
				championshipIdFromEventsKey(query.queryKey) === championshipId,
		}),
		queryClient.invalidateQueries({
			predicate: (query) => eventIdFromDetailKey(query.queryKey) === eventId,
		}),
	]);
}

export async function invalidateChampionshipEventByEventId(
	queryClient: QueryClient,
	eventId: number,
) {
	const championshipId = championshipIdForCachedEvent(queryClient, eventId);
	if (championshipId === null) {
		await queryClient.invalidateQueries({
			queryKey: CHAMPIONSHIP_EVENTS_QUERY_KEY,
		});
		return;
	}

	await invalidateChampionshipEvent(queryClient, championshipId, eventId);
}

export async function invalidateChampionshipEventQueries(
	queryClient: QueryClient,
) {
	await queryClient.invalidateQueries({
		queryKey: CHAMPIONSHIP_EVENTS_QUERY_KEY,
	});
}

function realtimePayloadRow(
	eventType: string,
	payload: {
		eventType?: string;
		new?: Record<string, unknown>;
		old?: Record<string, unknown>;
	},
): Record<string, unknown> {
	if (eventType === EVENT_REALTIME_CHANGE.delete) {
		return payload.old ?? payload.new ?? {};
	}

	return payload.new ?? payload.old ?? {};
}

export function patchCachedChampionshipEvent(
	queryClient: QueryClient,
	eventId: number,
	table: string,
	payload: {
		eventType?: string;
		new?: Record<string, unknown>;
		old?: Record<string, unknown>;
	},
): void {
	const eventType = payload.eventType ?? EVENT_REALTIME_CHANGE.update;
	const row = realtimePayloadRow(eventType, payload);

	queryClient.setQueriesData<ChampionshipEvent>(
		{
			predicate: (query) => eventIdFromDetailKey(query.queryKey) === eventId,
		},
		(current) => {
			if (!current) {
				return current;
			}

			return patchChampionshipEventRealtime(current, table, eventType, row);
		},
	);
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
