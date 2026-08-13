import {
	CHAMPIONSHIP_QUOTA,
	championshipQuotaErrorMessage,
	championshipQuotaHint,
	isChampionshipQuotaReached,
	ownedChampionshipCount,
} from "./championship-quota.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

const userId = "owner-id";
const owned = [
	{ created_by: userId },
	{ created_by: userId },
	{ created_by: "other-id" },
];

check(CHAMPIONSHIP_QUOTA.maxOwned === 3, "max owned is 3");
check(
	CHAMPIONSHIP_QUOTA.exceededCode === "championship quota exceeded",
	"sql exception token",
);

check(ownedChampionshipCount(owned, userId) === 2, "counts owned only");
check(ownedChampionshipCount(owned, "nobody") === 0, "unknown owner is 0");
check(ownedChampionshipCount([], userId) === 0, "empty list is 0");

check(!isChampionshipQuotaReached(2), "2 is under limit");
check(isChampionshipQuotaReached(3), "3 is at limit");
check(isChampionshipQuotaReached(4), "4 is over limit");

check(
	championshipQuotaErrorMessage().includes("3"),
	"error message uses max owned",
);
check(championshipQuotaHint().includes("3"), "hint uses max owned");

console.log("championship-quota ok");
