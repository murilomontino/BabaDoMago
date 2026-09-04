import {
	CHAMPIONSHIP_MORE_TAB_ID,
	CHAMPIONSHIP_MORE_TABS,
	CHAMPIONSHIP_PRIMARY_TABS,
	CHAMPIONSHIP_TAB,
	CHAMPIONSHIP_TAB_LABEL,
	CHAMPIONSHIP_TABS_DESKTOP_MEDIA,
	championshipMoreTabs,
	championshipTabBarItems,
	isChampionshipMoreTab,
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
	visibleChampionshipTab(CHAMPIONSHIP_TAB.monthly, false) ===
		CHAMPIONSHIP_TAB.roster,
	"monthly without permission falls back to roster",
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

check(CHAMPIONSHIP_PRIMARY_TABS.length === 2, "primary has roster and events");
check(
	CHAMPIONSHIP_PRIMARY_TABS[0]?.id === CHAMPIONSHIP_TAB.roster,
	"primary starts with roster",
);
check(
	CHAMPIONSHIP_PRIMARY_TABS[1]?.id === CHAMPIONSHIP_TAB.events,
	"primary ends with events",
);
check(CHAMPIONSHIP_MORE_TABS.length === 4, "more has four base tabs");
check(CHAMPIONSHIP_TAB_LABEL.more === "Mais", "more label");
check(CHAMPIONSHIP_MORE_TAB_ID === "more", "more tab bar id");
check(
	CHAMPIONSHIP_TABS_DESKTOP_MEDIA === "(min-width: 768px)",
	"desktop media matches md",
);

check(
	championshipMoreTabs(false).length === 4,
	"more without management stays at four",
);
check(
	championshipMoreTabs(true).length === 6,
	"more with permission has monthly and management",
);
check(
	championshipMoreTabs(true).some(
		(item) => item.id === CHAMPIONSHIP_TAB.monthly,
	),
	"more with permission includes monthly",
);
check(
	championshipMoreTabs(true).some(
		(item) => item.id === CHAMPIONSHIP_TAB.management,
	),
	"more with permission includes management",
);
check(
	!championshipMoreTabs(false).some(
		(item) => item.id === CHAMPIONSHIP_TAB.monthly,
	),
	"more without permission excludes monthly",
);
check(
	!championshipMoreTabs(false).some(
		(item) => item.id === CHAMPIONSHIP_TAB.management,
	),
	"more without permission excludes management",
);

check(
	isChampionshipMoreTab(CHAMPIONSHIP_TAB.standings, false),
	"standings is more",
);
check(
	!isChampionshipMoreTab(CHAMPIONSHIP_TAB.roster, false),
	"roster is not more",
);
check(
	!isChampionshipMoreTab(CHAMPIONSHIP_TAB.management, false),
	"management without permission is not more",
);
check(
	isChampionshipMoreTab(CHAMPIONSHIP_TAB.management, true),
	"management with permission is more",
);
check(
	!isChampionshipMoreTab(CHAMPIONSHIP_TAB.monthly, false),
	"monthly without permission is not more",
);
check(
	isChampionshipMoreTab(CHAMPIONSHIP_TAB.monthly, true),
	"monthly with permission is more",
);
check(CHAMPIONSHIP_TAB.monthly === "monthly", "monthly tab id");
check(CHAMPIONSHIP_TAB_LABEL.monthly === "Mensalistas", "monthly label");

const bar = championshipTabBarItems();
check(bar.length === 3, "tab bar has primary plus more");
check(bar[2]?.id === CHAMPIONSHIP_MORE_TAB_ID, "tab bar ends with more");
check(bar[2]?.label === CHAMPIONSHIP_TAB_LABEL.more, "tab bar more label");

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
