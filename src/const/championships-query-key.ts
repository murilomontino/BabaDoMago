export const CHAMPIONSHIPS_QUERY_KEY = ["championships"] as const;

export const CHAMPIONSHIP_BY_ID_QUERY_KEY = ["championship"] as const;

export const CHAMPIONSHIP_BY_INVITE_QUERY_KEY = [
	"championshipByInvite",
] as const;

export const CHAMPIONSHIP_EVENTS_QUERY_KEY = ["championshipEvents"] as const;

export const CHAMPIONSHIP_EVENTS_SCOPE = {
	list: "list",
	detail: "detail",
	myVotes: "my-votes",
} as const;

export function championshipEventMyVotesQueryKey(
	eventId: number,
	userId: string | undefined,
): readonly unknown[] {
	return [
		...CHAMPIONSHIP_EVENTS_QUERY_KEY,
		CHAMPIONSHIP_EVENTS_SCOPE.myVotes,
		eventId,
		userId,
	];
}

export function isChampionshipEventMyVotesKey(
	queryKey: readonly unknown[],
	eventId: number,
): boolean {
	return (
		queryKey[0] === CHAMPIONSHIP_EVENTS_QUERY_KEY[0] &&
		queryKey[1] === CHAMPIONSHIP_EVENTS_SCOPE.myVotes &&
		queryKey[2] === eventId
	);
}

export function championshipEventsListQueryKey(
	championshipId: number,
	userId: string | undefined,
): readonly unknown[] {
	return [
		...CHAMPIONSHIP_EVENTS_QUERY_KEY,
		championshipId,
		CHAMPIONSHIP_EVENTS_SCOPE.list,
		userId,
	];
}

export function championshipEventDetailQueryKey(
	championshipId: number,
	eventId: number,
	userId: string | undefined,
): readonly unknown[] {
	return [
		...CHAMPIONSHIP_EVENTS_QUERY_KEY,
		championshipId,
		CHAMPIONSHIP_EVENTS_SCOPE.detail,
		eventId,
		userId,
	];
}

export function championshipEventsChampionshipQueryKey(
	championshipId: number,
): readonly unknown[] {
	return [...CHAMPIONSHIP_EVENTS_QUERY_KEY, championshipId];
}

function isChampionshipEventsKey(queryKey: readonly unknown[]): boolean {
	return queryKey[0] === CHAMPIONSHIP_EVENTS_QUERY_KEY[0];
}

export function isChampionshipEventsListKey(
	queryKey: readonly unknown[],
): boolean {
	return (
		isChampionshipEventsKey(queryKey) &&
		queryKey[2] === CHAMPIONSHIP_EVENTS_SCOPE.list
	);
}

export function isChampionshipEventDetailKey(
	queryKey: readonly unknown[],
): boolean {
	return (
		isChampionshipEventsKey(queryKey) &&
		queryKey[2] === CHAMPIONSHIP_EVENTS_SCOPE.detail
	);
}

export function championshipIdFromEventsKey(
	queryKey: readonly unknown[],
): number | null {
	if (!isChampionshipEventsKey(queryKey)) {
		return null;
	}

	const championshipId = queryKey[1];
	if (typeof championshipId !== "number") {
		return null;
	}

	return championshipId;
}

export function eventIdFromDetailKey(
	queryKey: readonly unknown[],
): number | null {
	if (!isChampionshipEventDetailKey(queryKey)) {
		return null;
	}

	const eventId = queryKey[3];
	if (typeof eventId !== "number") {
		return null;
	}

	return eventId;
}
