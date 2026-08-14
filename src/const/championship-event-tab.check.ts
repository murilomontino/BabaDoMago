import { showEventDetailTabs } from "./championship-event-tab.ts";

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

console.log("championship-event-tab ok");
