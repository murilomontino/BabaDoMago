import {
	appearanceFromPreference,
	nextThemeMode,
	parseThemeMode,
	resolveTheme,
	THEME_APPEARANCE,
	THEME_MODE,
} from "./theme.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

check(parseThemeMode("light") === THEME_MODE.light, "parses light");
check(parseThemeMode("dark") === THEME_MODE.dark, "parses dark");
check(parseThemeMode("system") === THEME_MODE.system, "parses system");
check(parseThemeMode(null) === THEME_MODE.system, "null is system");
check(parseThemeMode("nope") === THEME_MODE.system, "invalid is system");

check(nextThemeMode(THEME_MODE.light) === THEME_MODE.dark, "light to dark");
check(nextThemeMode(THEME_MODE.dark) === THEME_MODE.system, "dark to system");
check(nextThemeMode(THEME_MODE.system) === THEME_MODE.light, "system to light");

check(
	resolveTheme(THEME_MODE.light, true) === THEME_APPEARANCE.light,
	"light ignores system dark",
);
check(
	resolveTheme(THEME_MODE.dark, false) === THEME_APPEARANCE.dark,
	"dark ignores system light",
);
check(
	resolveTheme(THEME_MODE.system, true) === THEME_APPEARANCE.dark,
	"system follows dark",
);
check(
	resolveTheme(THEME_MODE.system, false) === THEME_APPEARANCE.light,
	"system follows light",
);
check(appearanceFromPreference(true) === THEME_APPEARANCE.dark, "prefers dark");
check(
	appearanceFromPreference(false) === THEME_APPEARANCE.light,
	"prefers light",
);

console.log("theme ok");
