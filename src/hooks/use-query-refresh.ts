import {
	type QueryKey,
	useIsFetching,
	useQueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";
import { QUERY_REFRESH } from "@/const/query-refresh";
import { useMediaQuery } from "@/hooks/use-media-query";

export function useQueryRefreshDesktop(): boolean {
	return useMediaQuery(QUERY_REFRESH.mediaQuery);
}

export function useQueryRefresh(queryKey: QueryKey) {
	const queryClient = useQueryClient();
	const fetchingCount = useIsFetching({ queryKey });
	const refresh = useCallback(() => {
		return queryClient.invalidateQueries({ queryKey });
	}, [queryClient, queryKey]);

	return {
		refresh,
		isRefreshing: fetchingCount > 0,
	};
}
