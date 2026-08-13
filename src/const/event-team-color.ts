export const EVENT_TEAM_COLOR = {
	white: "white",
	black: "black",
	red: "red",
	blue: "blue",
	yellow: "yellow",
	green: "green",
	orange: "orange",
	pink: "pink",
} as const;

export type EventTeamColor =
	(typeof EVENT_TEAM_COLOR)[keyof typeof EVENT_TEAM_COLOR];

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

export const EVENT_TEAM_COLOR_LABEL = {
	white: "Branco",
	black: "Preto",
	red: "Vermelho",
	blue: "Azul",
	yellow: "Amarelo",
	green: "Verde",
	orange: "Laranja",
	pink: "Rosa",
} as const;

export const EVENT_TEAM_COLOR_CLASS = {
	white: "border border-line bg-white text-stone-900",
	black: "bg-stone-900 text-white",
	red: "bg-red-600 text-white",
	blue: "bg-blue-600 text-white",
	yellow: "bg-yellow-400 text-stone-900",
	green: "bg-pitch text-white",
	orange: "bg-orange-500 text-white",
	pink: "bg-pink-500 text-white",
} as const;

export function isEventTeamColor(value: string): value is EventTeamColor {
	return EVENT_TEAM_COLORS.some((color) => color === value);
}
