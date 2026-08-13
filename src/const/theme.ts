export const THEME_MODE = {
	light: "light",
	dark: "dark",
	system: "system",
} as const;

export type ThemeMode = (typeof THEME_MODE)[keyof typeof THEME_MODE];

export const THEME_APPEARANCE = {
	light: "light",
	dark: "dark",
} as const;

export type ThemeAppearance =
	(typeof THEME_APPEARANCE)[keyof typeof THEME_APPEARANCE];

export const THEME_STORAGE_KEY = "baba-theme";

export const THEME_DARK_CLASS = "dark";

export const THEME_MODE_ORDER = [
	THEME_MODE.light,
	THEME_MODE.dark,
	THEME_MODE.system,
] as const;

export const THEME_MODE_LABEL = {
	light: "Tema claro",
	dark: "Tema escuro",
	system: "Tema do sistema",
} as const;

export function isThemeMode(value: string | null): value is ThemeMode {
	return THEME_MODE_ORDER.some((mode) => mode === value);
}

export function parseThemeMode(value: string | null): ThemeMode {
	if (isThemeMode(value)) {
		return value;
	}

	return THEME_MODE.system;
}

export function nextThemeMode(mode: ThemeMode): ThemeMode {
	switch (mode) {
		case THEME_MODE.light:
			return THEME_MODE.dark;
		case THEME_MODE.dark:
			return THEME_MODE.system;
		case THEME_MODE.system:
			return THEME_MODE.light;
		default: {
			const exhaustive: never = mode;
			throw new Error(`Unhandled theme mode: ${exhaustive}`);
		}
	}
}

export function resolveTheme(
	mode: ThemeMode,
	prefersDark: boolean,
): ThemeAppearance {
	switch (mode) {
		case THEME_MODE.light:
			return THEME_APPEARANCE.light;
		case THEME_MODE.dark:
			return THEME_APPEARANCE.dark;
		case THEME_MODE.system:
			return prefersDark ? THEME_APPEARANCE.dark : THEME_APPEARANCE.light;
		default: {
			const exhaustive: never = mode;
			throw new Error(`Unhandled theme mode: ${exhaustive}`);
		}
	}
}

export function applyThemeClass(
	appearance: ThemeAppearance,
	root: HTMLElement,
): void {
	const isDark = appearance === THEME_APPEARANCE.dark;
	root.classList.toggle(THEME_DARK_CLASS, isDark);
	root.style.colorScheme = appearance;
}
