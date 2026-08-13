import {
	EVENT_TEAM_COLOR,
	EVENT_TEAM_FG,
	eventTeamColorFg,
	eventTeamColorStyle,
	isEventTeamColor,
	normalizeEventTeamColor,
} from "./event-team-color.ts";

function check(actual: unknown, expected: unknown): void {
	if (actual !== expected) {
		throw new Error(`expected ${String(expected)}, got ${String(actual)}`);
	}
}

check(isEventTeamColor(EVENT_TEAM_COLOR.white), true);
check(isEventTeamColor("#7c3aed"), true);
check(isEventTeamColor("white"), false);
check(isEventTeamColor("#FFFFFF"), false);
check(isEventTeamColor("#fff"), false);
check(normalizeEventTeamColor("#ABC123"), "#abc123");
check(eventTeamColorFg("#ffffff"), EVENT_TEAM_FG.dark);
check(eventTeamColorFg("#1c1917"), EVENT_TEAM_FG.light);
check(eventTeamColorStyle("#ffffff").backgroundColor, "#ffffff");
check(eventTeamColorStyle("#ffffff").color, EVENT_TEAM_FG.dark);
