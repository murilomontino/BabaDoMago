import {
	EVENT_TEAM_COLORS,
	type EventTeamColor,
	isEventTeamColor,
} from "./event-team-color.ts";

export const CHAMPIONSHIP_EVENT = {
	timeZone: "America/Sao_Paulo",
	defaultTime: "19:00",
	playersPerTeamMin: 3,
	playersPerTeamMax: 11,
	playersPerTeamDefault: 5,
	minTeams: 2,
} as const;

export const EVENT_STATUS = {
	open: "open",
	ended: "ended",
} as const;

export type EventStatus = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS];

export const EVENT_STATUS_LABEL = {
	open: "Aberto",
	ended: "Encerrado",
} as const;

export const EVENT_ERROR_MESSAGE = {
	"event already exists": "Já existe evento neste dia",
	"invalid teams": "Times inválidos",
	"invalid team color": "Cor inválida",
	"duplicate team color": "Cores repetidas",
	"duplicate player": "Jogador em mais de um time",
	"invalid team size": "Time fora do limite",
	"invalid event date": "Data inválida",
	"invalid event time": "Hora inválida",
	"invalid players per team": "Limite inválido",
	"same team": "Escolha dois times",
	"team not in event": "Time não pertence ao evento",
	"event not found": "Evento não encontrado",
} as const;

export type EventTeamDraft = {
	color: EventTeamColor;
	playerIds: number[];
};

export const EVENT_TEAM_MESSAGE = {
	minTeams: "Monte pelo menos dois times",
	colorDuplicate: "Cores repetidas",
	colorInvalid: "Cor inválida",
	playerDuplicate: "Jogador em mais de um time",
	playerEmpty: "Time sem jogador",
	playerLimit: "Time acima do limite",
} as const;

export function parseEventTime(value: unknown): string {
	if (typeof value !== "string" || value.length < 5) {
		return CHAMPIONSHIP_EVENT.defaultTime;
	}

	return value.slice(0, 5);
}

export function parsePlayersPerTeam(value: unknown): number {
	const parsed = Number(value);
	if (
		!Number.isInteger(parsed) ||
		parsed < CHAMPIONSHIP_EVENT.playersPerTeamMin ||
		parsed > CHAMPIONSHIP_EVENT.playersPerTeamMax
	) {
		return CHAMPIONSHIP_EVENT.playersPerTeamDefault;
	}

	return parsed;
}

export function championshipEventToday(): string {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: CHAMPIONSHIP_EVENT.timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(new Date());
}

export function formatEventStartsAt(iso: string): {
	date: string;
	time: string;
} {
	const date = new Date(iso);

	return {
		date: new Intl.DateTimeFormat("pt-BR", {
			timeZone: CHAMPIONSHIP_EVENT.timeZone,
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		}).format(date),
		time: new Intl.DateTimeFormat("pt-BR", {
			timeZone: CHAMPIONSHIP_EVENT.timeZone,
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		}).format(date),
	};
}

export function eventStatus(endedAt: string | null): EventStatus {
	if (endedAt) {
		return EVENT_STATUS.ended;
	}

	return EVENT_STATUS.open;
}

export function championshipEventErrorMessage(message: string): string {
	const known = Object.entries(EVENT_ERROR_MESSAGE).find(([code]) =>
		message.includes(code),
	);

	if (!known) {
		return message;
	}

	return known[1];
}

export function unusedEventTeamColor(
	used: readonly EventTeamColor[],
): EventTeamColor | null {
	return EVENT_TEAM_COLORS.find((color) => !used.includes(color)) ?? null;
}

export function validateEventTeams(
	teams: readonly EventTeamDraft[],
	playersPerTeam: number,
): string | null {
	if (teams.length < CHAMPIONSHIP_EVENT.minTeams) {
		return EVENT_TEAM_MESSAGE.minTeams;
	}

	const colors = new Set<EventTeamColor>();
	const players = new Set<number>();

	for (const team of teams) {
		if (!isEventTeamColor(team.color)) {
			return EVENT_TEAM_MESSAGE.colorInvalid;
		}

		if (colors.has(team.color)) {
			return EVENT_TEAM_MESSAGE.colorDuplicate;
		}

		colors.add(team.color);

		if (team.playerIds.length === 0) {
			return EVENT_TEAM_MESSAGE.playerEmpty;
		}

		if (team.playerIds.length > playersPerTeam) {
			return EVENT_TEAM_MESSAGE.playerLimit;
		}

		if (team.playerIds.some((playerId) => players.has(playerId))) {
			return EVENT_TEAM_MESSAGE.playerDuplicate;
		}

		for (const playerId of team.playerIds) {
			players.add(playerId);
		}
	}

	return null;
}
