import {
	EVENT_TEAM_COLOR,
	EVENT_TEAM_COLOR_NONE,
	EVENT_TEAM_COLOR_RAINBOW_GRADIENT,
	EVENT_TEAM_FG,
	EVENT_TEAM_PASTEL,
	eventTeamColorFg,
	eventTeamColorOrNone,
	eventTeamColorPastel,
	eventTeamColorStyle,
	eventTeamCustomColorPreview,
	eventTeamName,
	isEventTeamColor,
	normalizeEventTeamColor,
	usedEventTeamColors,
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
check(normalizeEventTeamColor(EVENT_TEAM_COLOR_NONE), EVENT_TEAM_COLOR_NONE);
check(eventTeamName(EVENT_TEAM_COLOR_NONE, 0), "Time 1");
check(eventTeamName(EVENT_TEAM_COLOR.red, 0), "Vermelho");
check(eventTeamName("#7c3aed", 2), "Time 3");
check(EVENT_TEAM_FG.hover, "#e7e5e4");
check(eventTeamColorFg("#ffffff"), EVENT_TEAM_FG.dark);
check(eventTeamColorFg("#1c1917"), EVENT_TEAM_FG.light);
check(eventTeamColorFg("#facc15"), EVENT_TEAM_FG.dark);
check(eventTeamColorFg("#dc2626"), EVENT_TEAM_FG.light);
check(EVENT_TEAM_PASTEL.mix, 0.55);
check(eventTeamColorPastel("#ffffff"), "#ffffff");
check(
	eventTeamColorPastel(EVENT_TEAM_COLOR.red) === EVENT_TEAM_COLOR.red,
	false,
);
check(
	eventTeamColorFg(eventTeamColorPastel(EVENT_TEAM_COLOR.red)),
	EVENT_TEAM_FG.dark,
);
check(eventTeamColorStyle("#ffffff").backgroundColor, "#ffffff");
check(eventTeamColorStyle("#ffffff").color, EVENT_TEAM_FG.dark);
check(eventTeamColorStyle(EVENT_TEAM_COLOR_NONE).backgroundColor, undefined);
check(
	eventTeamColorStyle(EVENT_TEAM_COLOR.red).backgroundColor,
	eventTeamColorPastel(EVENT_TEAM_COLOR.red),
);
check(eventTeamColorStyle(EVENT_TEAM_COLOR.red).color, EVENT_TEAM_FG.dark);
check(eventTeamColorOrNone(null), null);
check(eventTeamColorOrNone(EVENT_TEAM_COLOR.red), EVENT_TEAM_COLOR.red);
check(eventTeamColorOrNone("nope"), null);
check(usedEventTeamColors(null).join(","), "");
check(
	usedEventTeamColors(EVENT_TEAM_COLOR.red).join(","),
	EVENT_TEAM_COLOR.red,
);
check(
	eventTeamCustomColorPreview(false, null).backgroundImage,
	EVENT_TEAM_COLOR_RAINBOW_GRADIENT,
);
check(
	eventTeamCustomColorPreview(true, EVENT_TEAM_COLOR.red).backgroundColor,
	EVENT_TEAM_COLOR.red,
);
check(
	eventTeamCustomColorPreview(true, EVENT_TEAM_COLOR.red).backgroundImage,
	undefined,
);

console.log("event-team-color ok");
