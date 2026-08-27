import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { del, get, set } from "idb-keyval";
import type { ReactNode } from "react";
import { isMatchClockOnline } from "@/const/championship-event-match";

export const QUERY_CACHE = {
	storageKey: "baba-query-cache",
	buster: __QUERY_CACHE_BUSTER__,
	maxAgeMs: 1000 * 60 * 60 * 24,
} as const;

export function shouldRetryQuery(failureCount: number): boolean {
	if (!isMatchClockOnline(globalThis.navigator?.onLine)) {
		return false;
	}

	return failureCount < 3;
}

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5,
			gcTime: QUERY_CACHE.maxAgeMs,
			refetchOnWindowFocus: false,
			networkMode: "offlineFirst",
			retry: shouldRetryQuery,
		},
	},
});

export const queryPersister = createAsyncStoragePersister({
	key: QUERY_CACHE.storageKey,
	storage: {
		getItem: (key) => get(key),
		setItem: (key, value) => set(key, value),
		removeItem: (key) => del(key),
	},
});

export function AppQueryClientProvider({ children }: { children: ReactNode }) {
	return (
		<PersistQueryClientProvider
			client={queryClient}
			persistOptions={{
				persister: queryPersister,
				maxAge: QUERY_CACHE.maxAgeMs,
				buster: QUERY_CACHE.buster,
				dehydrateOptions: {
					shouldDehydrateMutation: () => false,
				},
			}}
		>
			{children}
			{import.meta.env.DEV && (
				<ReactQueryDevtools
					buttonPosition="bottom-left"
					initialIsOpen={false}
				/>
			)}
		</PersistQueryClientProvider>
	);
}
