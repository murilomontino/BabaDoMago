import {
	type QueryKey,
	useIsFetching,
	useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useSyncExternalStore } from "react";
import { QUERY_REFRESH } from "@/const/query-refresh";

function subscribeQueryRefreshDesktop(onStoreChange: () => void) {
	const media = window.matchMedia(QUERY_REFRESH.mediaQuery);
	media.addEventListener("change", onStoreChange);
	return () => media.removeEventListener("change", onStoreChange);
}

function getQueryRefreshDesktop() {
	return window.matchMedia(QUERY_REFRESH.mediaQuery).matches;
}

export function useQueryRefreshDesktop(): boolean {
	return useSyncExternalStore(
		subscribeQueryRefreshDesktop,
		getQueryRefreshDesktop,
		() => false,
	);
}

export function useQueryRefresh(queryKey: QueryKey) {
	const queryClient = useQueryClient();
	const fetchingCount = useIsFetching({ queryKey });
	const refresh = useCallback(() => {
		return queryClient.invalidateQueries({ queryKey });
	}, [queryClient, queryKey]);

	// #region agent log
	if (fetchingCount > 0) {
		fetch("http://127.0.0.1:7501/ingest/7aa36caa-8689-4af1-a425-f57dce975cbd", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Debug-Session-Id": "c0754f",
			},
			body: JSON.stringify({
				sessionId: "c0754f",
				runId: "pre-fix",
				hypothesisId: "D",
				location: "use-query-refresh.ts:useQueryRefresh",
				message: "query refresh fetching",
				data: { queryKey, fetchingCount },
				timestamp: Date.now(),
			}),
		}).catch(() => {});
	}
	// #endregion

	return {
		refresh,
		isRefreshing: fetchingCount > 0,
	};
}
