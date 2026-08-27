import {
	championshipEventDetailQueryKey,
	championshipEventsChampionshipQueryKey,
	championshipEventsListQueryKey,
	championshipIdFromEventsKey,
	eventIdFromDetailKey,
	isChampionshipEventDetailKey,
	isChampionshipEventsListKey,
} from "./championships-query-key.ts";

function check(actual: unknown, expected: unknown, message: string): void {
	if (actual !== expected) {
		throw new Error(`${message}: ${String(actual)} !== ${String(expected)}`);
	}
}

function isPrefix(
	prefix: readonly unknown[],
	key: readonly unknown[],
): boolean {
	return prefix.every((part, index) => key[index] === part);
}

const listKey = championshipEventsListQueryKey(1, "user-a");
const detailKey = championshipEventDetailQueryKey(1, 9, "user-a");
const otherList = championshipEventsListQueryKey(2, "user-a");
const championshipKey = championshipEventsChampionshipQueryKey(1);

check(isChampionshipEventsListKey(listKey), true, "list key is list");
check(isChampionshipEventDetailKey(detailKey), true, "detail key is detail");
check(isChampionshipEventsListKey(detailKey), false, "detail is not list");
check(isChampionshipEventDetailKey(listKey), false, "list is not detail");
check(isPrefix(listKey, detailKey), false, "list is not prefix of detail");
check(isPrefix(detailKey, listKey), false, "detail is not prefix of list");
check(isPrefix(championshipKey, listKey), true, "championship prefixes list");
check(
	isPrefix(championshipKey, detailKey),
	true,
	"championship prefixes detail",
);
check(
	isPrefix(championshipKey, otherList),
	false,
	"championship does not prefix other championship",
);
check(championshipIdFromEventsKey(listKey), 1, "list championship id");
check(eventIdFromDetailKey(detailKey), 9, "detail event id");
check(eventIdFromDetailKey(listKey), null, "list has no event id");

console.log("championships-query-key ok");
