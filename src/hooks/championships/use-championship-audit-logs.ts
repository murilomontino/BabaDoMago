import {
	useInfiniteQuery,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";
import { AUDIT_ACTION, type AuditAction } from "@/const/championship-audit";
import {
	EVENT_DRAW_REVEAL,
	eventDrawRevealAuditChannelName,
} from "@/const/event-draw-reveal";
import { invalidateChampionshipEvents } from "@/hooks/championships/championships-query-keys";
import { supabase } from "@/lib/supabase";
import {
	listChampionshipAuditLogs,
	listChampionshipEventDrawLogs,
} from "@/services/championship-audit";

export const CHAMPIONSHIP_AUDIT_QUERY_KEY = ["championshipAudit"] as const;

export function useChampionshipAuditLogs(
	championshipId: number,
	action: AuditAction | null,
) {
	return useInfiniteQuery({
		queryKey: [...CHAMPIONSHIP_AUDIT_QUERY_KEY, championshipId, action],
		queryFn: ({ pageParam }) =>
			listChampionshipAuditLogs(championshipId, action, pageParam),
		initialPageParam: null as number | null,
		getNextPageParam: (lastPage) => lastPage.nextCursor,
		enabled: Number.isFinite(championshipId),
	});
}

export function useChampionshipEventDrawLogs(
	championshipId: number,
	eventId: number,
) {
	const queryClient = useQueryClient();

	useEffect(() => {
		if (!Number.isFinite(eventId) || !Number.isFinite(championshipId)) {
			return;
		}

		let timeout: ReturnType<typeof setTimeout> | null = null;
		function invalidate() {
			if (timeout) {
				clearTimeout(timeout);
			}

			timeout = setTimeout(() => {
				void queryClient.invalidateQueries({
					queryKey: [
						...CHAMPIONSHIP_AUDIT_QUERY_KEY,
						AUDIT_ACTION.drawEventTeams,
						championshipId,
						eventId,
					],
				});
				void invalidateChampionshipEvents(queryClient, championshipId);
			}, EVENT_DRAW_REVEAL.realtimeDebounceMs);
		}

		const channel = supabase
			.channel(eventDrawRevealAuditChannelName(eventId))
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "championship_audit_logs",
					filter: `entity_id=eq.${eventId}`,
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
	}, [championshipId, eventId, queryClient]);

	return useQuery({
		queryKey: [
			...CHAMPIONSHIP_AUDIT_QUERY_KEY,
			AUDIT_ACTION.drawEventTeams,
			championshipId,
			eventId,
		],
		queryFn: () => listChampionshipEventDrawLogs(championshipId, eventId),
		enabled: Number.isFinite(championshipId) && Number.isFinite(eventId),
	});
}
