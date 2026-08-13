import {
	CHAMPIONSHIP_VISIBILITY,
	CHAMPIONSHIP_VISIBILITY_OPTIONS,
	championshipVisibilityStatus,
	isChampionshipListed,
} from "./championship-visibility.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

const ownerId = "owner-id";
const memberId = "member-id";
const visible = { is_visible: true, created_by: ownerId };
const hidden = { is_visible: false, created_by: ownerId };

check(CHAMPIONSHIP_VISIBILITY.default === true, "default is visible");
check(
	championshipVisibilityStatus(true) === CHAMPIONSHIP_VISIBILITY.listedStatus,
	"listed status",
);
check(
	championshipVisibilityStatus(false) === CHAMPIONSHIP_VISIBILITY.hiddenStatus,
	"hidden status",
);
check(CHAMPIONSHIP_VISIBILITY_OPTIONS.length === 2, "two visibility options");

check(isChampionshipListed(visible, ownerId), "owner sees visible");
check(isChampionshipListed(visible, memberId), "member sees visible");
check(isChampionshipListed(hidden, ownerId), "owner sees hidden");
check(!isChampionshipListed(hidden, memberId), "member misses hidden");
check(!isChampionshipListed(hidden, ""), "empty user misses hidden");

console.log("championship-visibility ok");
