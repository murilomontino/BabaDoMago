import {
	EVENT_TAB,
	eventDetailSelectedTab,
	showEventDetailTabs,
} from "./championship-event-tab.ts";

function check(actual: unknown, expected: unknown): void {
	if (actual !== expected) {
		throw new Error(`expected ${String(expected)}, got ${String(actual)}`);
	}
}

check(
	showEventDetailTabs({ showTeamBuilder: true, attendanceCount: 0 }),
	false,
);
check(
	showEventDetailTabs({ showTeamBuilder: true, attendanceCount: 4 }),
	false,
);
check(
	showEventDetailTabs({ showTeamBuilder: false, attendanceCount: 0 }),
	false,
);
check(
	showEventDetailTabs({ showTeamBuilder: false, attendanceCount: 4 }),
	true,
);

check(eventDetailSelectedTab(false, EVENT_TAB.podium), EVENT_TAB.event);
check(eventDetailSelectedTab(true, EVENT_TAB.podium), EVENT_TAB.podium);
check(eventDetailSelectedTab(true, EVENT_TAB.sim), EVENT_TAB.sim);
check(eventDetailSelectedTab(false, EVENT_TAB.sim), EVENT_TAB.event);
check(eventDetailSelectedTab(true, EVENT_TAB.event), EVENT_TAB.event);
check(eventDetailSelectedTab(true, null), EVENT_TAB.event);

console.log("championship-event-tab ok");
