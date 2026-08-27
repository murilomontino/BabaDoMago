import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { AUDIT_ACTION, type AuditAction } from "@/const/championship-audit";
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
