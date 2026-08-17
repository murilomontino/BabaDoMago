export const EVENT_TEAM_COLOR = {
	white: "#ffffff",
	black: "#1c1917",
	red: "#dc2626",
	blue: "#2563eb",
	yellow: "#facc15",
	green: "#166534",
	orange: "#f97316",
	pink: "#ec4899",
} as const;

export type EventTeamColor = `#${string}`;

export const EVENT_TEAM_COLORS = [
	EVENT_TEAM_COLOR.white,
	EVENT_TEAM_COLOR.black,
	EVENT_TEAM_COLOR.red,
	EVENT_TEAM_COLOR.blue,
	EVENT_TEAM_COLOR.yellow,
	EVENT_TEAM_COLOR.green,
	EVENT_TEAM_COLOR.orange,
	EVENT_TEAM_COLOR.pink,
] as const;

export const EVENT_TEAM_COLOR_NONE = null;

export const EVENT_TEAM_COLOR_LABEL: Record<string, string> = {
	[EVENT_TEAM_COLOR.white]: "Branco",
	[EVENT_TEAM_COLOR.black]: "Preto",
	[EVENT_TEAM_COLOR.red]: "Vermelho",
	[EVENT_TEAM_COLOR.blue]: "Azul",
	[EVENT_TEAM_COLOR.yellow]: "Amarelo",
	[EVENT_TEAM_COLOR.green]: "Verde",
	[EVENT_TEAM_COLOR.orange]: "Laranja",
	[EVENT_TEAM_COLOR.pink]: "Rosa",
};

export const EVENT_TEAM_COLOR_NONE_LABEL = "Sem cor";
export const EVENT_TEAM_COLOR_CUSTOM_LABEL = "Cor personalizada";
export const EVENT_TEAM_COLOR_RAINBOW_GRADIENT =
	"conic-gradient(#dc2626, #facc15, #166534, #2563eb, #ec4899, #dc2626)";

export const EVENT_TEAM_FG = {
	light: "#ffffff",
	dark: "#1c1917",
	hover: "#e7e5e4",
} as const;

export const EVENT_TEAM_PASTEL = {
	mix: 0.55,
	white: "#ffffff",
} as const;

const EVENT_TEAM_COLOR_HEX = /^#[0-9a-f]{6}$/;

export function normalizeEventTeamColor(value: string | null): string | null {
	if (value === null) {
		return null;
	}

	return value.toLowerCase();
}

export function eventTeamName(color: string | null, sortOrder: number): string {
	if (color === null) {
		return `Time ${sortOrder + 1}`;
	}

	return EVENT_TEAM_COLOR_LABEL[color] ?? `Time ${sortOrder + 1}`;
}

export function isEventTeamColor(value: string): value is EventTeamColor {
	return EVENT_TEAM_COLOR_HEX.test(value);
}

export function eventTeamColorOrNone(
	color: string | null,
): EventTeamColor | null {
	if (color === null) {
		return null;
	}

	if (!isEventTeamColor(color)) {
		return null;
	}

	return color;
}

export function usedEventTeamColors<T extends string>(color: T | null): T[] {
	if (color === null) {
		return [];
	}

	return [color];
}

export function eventTeamCustomColorPreview(
	isCustom: boolean,
	color: string | null,
): { backgroundColor: string; backgroundImage?: string } {
	if (!isCustom) {
		return {
			backgroundColor: "transparent",
			backgroundImage: EVENT_TEAM_COLOR_RAINBOW_GRADIENT,
		};
	}

	return {
		backgroundColor: color ?? "transparent",
	};
}

function hexChannel(hex: string, offset: number): number {
	return Number.parseInt(hex.slice(offset, offset + 2), 16);
}

function hexRgb(hex: string): { r: number; g: number; b: number } {
	return {
		r: hexChannel(hex, 1),
		g: hexChannel(hex, 3),
		b: hexChannel(hex, 5),
	};
}

function toHexChannel(value: number): string {
	return Math.round(value).toString(16).padStart(2, "0");
}

function rgbToHex(r: number, g: number, b: number): string {
	return `#${toHexChannel(r)}${toHexChannel(g)}${toHexChannel(b)}`;
}

function srgbChannel(value: number): number {
	const srgb = value / 255;
	if (srgb <= 0.04045) {
		return srgb / 12.92;
	}

	return ((srgb + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
	const { r, g, b } = hexRgb(hex);
	return (
		0.2126 * srgbChannel(r) + 0.7152 * srgbChannel(g) + 0.0722 * srgbChannel(b)
	);
}

function contrastRatio(left: number, right: number): number {
	const max = Math.max(left, right);
	const min = Math.min(left, right);
	return (max + 0.05) / (min + 0.05);
}

export function eventTeamColorPastel(hex: string): string {
	const source = hexRgb(hex);
	const white = hexRgb(EVENT_TEAM_PASTEL.white);
	const mix = EVENT_TEAM_PASTEL.mix;
	const rest = 1 - mix;

	return rgbToHex(
		source.r * mix + white.r * rest,
		source.g * mix + white.g * rest,
		source.b * mix + white.b * rest,
	);
}

export function eventTeamColorFg(hex: string): string {
	const background = relativeLuminance(hex);
	const light = relativeLuminance(EVENT_TEAM_FG.light);
	const dark = relativeLuminance(EVENT_TEAM_FG.dark);

	if (contrastRatio(background, light) >= contrastRatio(background, dark)) {
		return EVENT_TEAM_FG.light;
	}

	return EVENT_TEAM_FG.dark;
}

export function eventTeamColorStyle(hex: string | null): {
	backgroundColor?: string;
	color?: string;
} {
	if (hex === null) {
		return {};
	}

	const backgroundColor = eventTeamColorPastel(hex);

	return {
		backgroundColor,
		color: eventTeamColorFg(backgroundColor),
	};
}
