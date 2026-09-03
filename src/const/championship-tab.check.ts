import {
	CHAMPIONSHIP_TAB,
	keepChampionshipTabMounted,
	rememberChampionshipTab,
	visibleChampionshipTab,
} from "./championship-tab.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

check(
	visibleChampionshipTab(CHAMPIONSHIP_TAB.management, false) ===
		CHAMPIONSHIP_TAB.roster,
	"management without permission falls back to roster",
);
check(
	visibleChampionshipTab(CHAMPIONSHIP_TAB.events, false) ===
		CHAMPIONSHIP_TAB.events,
	"other tabs stay",
);
check(
	visibleChampionshipTab(CHAMPIONSHIP_TAB.standings, false) ===
		CHAMPIONSHIP_TAB.standings,
	"standings stays",
);
check(
	visibleChampionshipTab(CHAMPIONSHIP_TAB.trends, false) ===
		CHAMPIONSHIP_TAB.trends,
	"trends stays for member",
);
check(CHAMPIONSHIP_TAB.trends === "trends", "trends tab id");
check(CHAMPIONSHIP_TAB.drawSim === "drawSim", "drawSim tab id");
check(
	visibleChampionshipTab(CHAMPIONSHIP_TAB.drawSim, false) ===
		CHAMPIONSHIP_TAB.drawSim,
	"drawSim stays for member",
);

check(
	keepChampionshipTabMounted(
		CHAMPIONSHIP_TAB.roster,
		CHAMPIONSHIP_TAB.roster,
		false,
	),
	"mounts on first visit",
);
check(
	!keepChampionshipTabMounted(
		CHAMPIONSHIP_TAB.events,
		CHAMPIONSHIP_TAB.roster,
		false,
	),
	"skips until visited",
);
check(
	keepChampionshipTabMounted(
		CHAMPIONSHIP_TAB.events,
		CHAMPIONSHIP_TAB.roster,
		true,
	),
	"keeps after visit",
);

const afterRoster = rememberChampionshipTab({}, CHAMPIONSHIP_TAB.roster);
check(afterRoster.roster === true, "remembers roster visit");
check(afterRoster.events === undefined, "does not mount events yet");
const afterEvents = rememberChampionshipTab(
	afterRoster,
	CHAMPIONSHIP_TAB.events,
);
check(afterEvents.roster === true, "keeps roster after events visit");
check(afterEvents.events === true, "remembers events visit");
check(
	rememberChampionshipTab(afterEvents, CHAMPIONSHIP_TAB.events) === afterEvents,
	"same object when already remembered",
);

console.log("championship-tab ok");
