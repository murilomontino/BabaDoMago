import { useInfiniteQuery } from "@tanstack/react-query";
import type { AuditAction } from "@/const/championship-audit";
import { listChampionshipAuditLogs } from "@/services/championship-audit";

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
