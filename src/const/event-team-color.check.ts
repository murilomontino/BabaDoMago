import {
	EVENT_TEAM_COLOR,
	EVENT_TEAM_COLOR_NONE,
	EVENT_TEAM_COLOR_RAINBOW_GRADIENT,
	EVENT_TEAM_FG,
	EVENT_TEAM_PASTEL,
	EVENT_TEAM_WASH,
	eventTeamColorBadgeStyle,
	eventTeamColorFg,
	eventTeamColorOrNone,
	eventTeamColorPastel,
	eventTeamColorPastelCss,
	eventTeamColorStyle,
	eventTeamColorWash,
	eventTeamColorWashStyle,
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
check(
	eventTeamColorPastel(EVENT_TEAM_COLOR.red, EVENT_TEAM_PASTEL.dark) ===
		EVENT_TEAM_COLOR.red,
	false,
);
check(
	eventTeamColorFg(
		eventTeamColorPastel(EVENT_TEAM_COLOR.red, EVENT_TEAM_PASTEL.dark),
	),
	EVENT_TEAM_FG.light,
);
check(
	eventTeamColorPastelCss(EVENT_TEAM_COLOR.red),
	`color-mix(in srgb, ${EVENT_TEAM_COLOR.red} ${EVENT_TEAM_PASTEL.mix * 100}%, var(--color-team-pastel-base))`,
);
check(
	eventTeamColorStyle("#ffffff").backgroundColor,
	eventTeamColorPastelCss("#ffffff"),
);
check(
	"color" in (eventTeamColorStyle("#ffffff") as Record<string, unknown>),
	false,
);
check(eventTeamColorStyle(EVENT_TEAM_COLOR_NONE).backgroundColor, undefined);
check(
	eventTeamColorStyle(EVENT_TEAM_COLOR.red).backgroundColor,
	eventTeamColorPastelCss(EVENT_TEAM_COLOR.red),
);
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
check(EVENT_TEAM_WASH.alpha, 0.1);
check(
	eventTeamColorWash(EVENT_TEAM_COLOR.red),
	`rgba(220, 38, 38, ${EVENT_TEAM_WASH.alpha})`,
);
check(
	eventTeamColorWashStyle(EVENT_TEAM_COLOR.blue).backgroundColor,
	eventTeamColorWash(EVENT_TEAM_COLOR.blue),
);
check(eventTeamColorWashStyle(EVENT_TEAM_COLOR_NONE).backgroundColor, undefined);
check(
	eventTeamColorBadgeStyle(EVENT_TEAM_COLOR.red).backgroundColor,
	EVENT_TEAM_COLOR.red,
);
check(
	eventTeamColorBadgeStyle(EVENT_TEAM_COLOR.red).color,
	EVENT_TEAM_FG.light,
);
check(eventTeamColorBadgeStyle(EVENT_TEAM_COLOR_NONE).backgroundColor, undefined);

console.log("event-team-color ok");
