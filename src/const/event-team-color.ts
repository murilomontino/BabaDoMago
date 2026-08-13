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

export const EVENT_TEAM_COLOR_CUSTOM_LABEL = "Cor personalizada";

export const EVENT_TEAM_FG = {
	light: "#ffffff",
	dark: "#1c1917",
} as const;

const EVENT_TEAM_COLOR_HEX = /^#[0-9a-f]{6}$/;

export function normalizeEventTeamColor(value: string): string {
	return value.toLowerCase();
}

export function isEventTeamColor(value: string): value is EventTeamColor {
	return EVENT_TEAM_COLOR_HEX.test(value);
}

export function eventTeamColorFg(hex: string): string {
	const r = Number.parseInt(hex.slice(1, 3), 16);
	const g = Number.parseInt(hex.slice(3, 5), 16);
	const b = Number.parseInt(hex.slice(5, 7), 16);
	const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

	if (luminance > 0.55) {
		return EVENT_TEAM_FG.dark;
	}

	return EVENT_TEAM_FG.light;
}

export function eventTeamColorStyle(hex: string): {
	backgroundColor: string;
	color: string;
} {
	return {
		backgroundColor: hex,
		color: eventTeamColorFg(hex),
	};
}
