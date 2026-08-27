import { queryClient, queryPersister } from "@/lib/query-client";

function nextMacrotask(): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, 0);
	});
}

export async function clearQueryCache(): Promise<void> {
	await queryClient.cancelQueries();
	queryClient.clear();
	await queryPersister.removeClient();
	await nextMacrotask();
	await queryPersister.removeClient();
}
