import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import type { ReactNode } from "react";

export const QUERY_CACHE = {
	storageKey: "baba-query-cache",
	buster: __QUERY_CACHE_BUSTER__,
	maxAgeMs: 1000 * 60 * 60 * 24,
} as const;

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5,
			gcTime: QUERY_CACHE.maxAgeMs,
			refetchOnWindowFocus: false,
		},
	},
});

export const queryPersister = createSyncStoragePersister({
	key: QUERY_CACHE.storageKey,
	storage: window.localStorage,
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
