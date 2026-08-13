import {
	EVENT_TEAM_COLORS,
	type EventTeamColor,
	isEventTeamColor,
	normalizeEventTeamColor,
} from "./event-team-color.ts";

export const CHAMPIONSHIP_EVENT = {
	timeZone: "America/Sao_Paulo",
	defaultTime: "19:00",
	playersPerTeamMin: 3,
	playersPerTeamMax: 11,
	playersPerTeamDefault: 5,
	minTeams: 2,
	minAttendance: 2,
} as const;

export const EVENT_BUILDER_STEP = {
	attendance: "attendance",
	teams: "teams",
} as const;

export type EventBuilderStep =
	(typeof EVENT_BUILDER_STEP)[keyof typeof EVENT_BUILDER_STEP];

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
	"invalid attendance": "Lista de presença inválida",
	"duplicate attendance": "Jogador repetido na presença",
	"player not present": "Jogador não está presente",
	"invalid goalkeeper": "Informe o goleiro",
	"event already ended": "Evento já encerrado",
	"event has matches": "Evento já tem partidas",
} as const;

export const EVENT_ACTION = {
	create: "Criar evento",
	saveTeams: "Salvar times",
	editTeams: "Editar times",
	newEvent: "Novo evento",
} as const;

export const EVENT_TEAM_POSITION = {
	goalkeeper: "goalkeeper",
	player: "player",
} as const;

export type EventTeamPosition =
	(typeof EVENT_TEAM_POSITION)[keyof typeof EVENT_TEAM_POSITION];

export const EVENT_TEAM_POSITION_LABEL = {
	goalkeeper: "gol",
	player: "jog",
} as const;

export type EventTeamDraft = {
	color: EventTeamColor;
	playerIds: number[];
	goalkeeperId: number;
};

export const EVENT_TEAM_MESSAGE = {
	minTeams: "Monte pelo menos dois times",
	colorDuplicate: "Cores repetidas",
	colorInvalid: "Cor inválida",
	playerDuplicate: "Jogador em mais de um time",
	playerEmpty: "Time sem jogador",
	playerLimit: "Time acima do limite",
	playerNotPresent: "Jogador não está presente",
	goalkeeperMissing: "Informe o goleiro",
} as const;

export const EVENT_ATTENDANCE_MESSAGE = {
	minPresent: "Marque pelo menos dois presentes",
	notInRoster: "Jogador fora do elenco",
	duplicate: "Jogador repetido na presença",
} as const;

export const EVENT_ATTENDANCE_COLUMN = {
	present: "present",
	player: "player",
	rating: "rating",
	count: "count",
} as const;

export const EVENT_ATTENDANCE_COLUMN_LABEL = {
	present: "Presente",
	player: "Jogador",
	rating: "Rating",
	count: "Presenças",
} as const;

export const EVENT_ATTENDANCE_ACTION = {
	selectAll: "Selecionar todos",
	deselectAll: "Desselecionar todos",
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

export function eventTeamCount(
	playerCount: number,
	playersPerTeam: number,
): number {
	if (playersPerTeam < 1) {
		return CHAMPIONSHIP_EVENT.minTeams;
	}

	return Math.max(
		CHAMPIONSHIP_EVENT.minTeams,
		Math.ceil(playerCount / playersPerTeam),
	);
}

export function nextEventTeamColor(
	used: readonly EventTeamColor[],
): EventTeamColor {
	const unused = unusedEventTeamColor(used);
	if (unused) {
		return unused;
	}

	const taken = new Set(used);
	// ponytail: walk 24-bit hex; ceiling 16M unique colors, upgrade: named extra palette
	const found = Array.from({ length: 4096 }, (_, index) => {
		const n = (index * 9973 + 0x1a6b3c) % 0x1000000;
		return `#${n.toString(16).padStart(6, "0")}`;
	}).find(
		(color): color is EventTeamColor =>
			isEventTeamColor(color) && !taken.has(color),
	);

	return found ?? EVENT_TEAM_COLORS[0];
}

export type EventTeamBuilderTeam = {
	key: string;
	color: EventTeamColor;
	slots: string[];
};

export function emptyTeamSlots(count: number): string[] {
	return Array.from({ length: count }, () => "");
}

export function keepPresentSlots(
	slots: readonly string[],
	present: ReadonlySet<number>,
): string[] {
	return slots.map((slot) => {
		if (!slot) {
			return "";
		}

		const playerId = Number(slot);
		if (!present.has(playerId)) {
			return "";
		}

		return slot;
	});
}

export function initialBuilderTeams(
	playersPerTeam: number,
	teamCount: number = CHAMPIONSHIP_EVENT.minTeams,
): EventTeamBuilderTeam[] {
	const count = Math.max(CHAMPIONSHIP_EVENT.minTeams, teamCount);
	const used: EventTeamColor[] = [];

	return Array.from({ length: count }, (_, index) => {
		const color = nextEventTeamColor(used);
		used.push(color);
		return {
			key: `team-${index}`,
			color,
			slots: emptyTeamSlots(playersPerTeam),
		};
	});
}

export function resizeBuilderTeams(
	teams: readonly EventTeamBuilderTeam[],
	teamCount: number,
	playersPerTeam: number,
	present: ReadonlySet<number>,
): EventTeamBuilderTeam[] {
	const count = Math.max(CHAMPIONSHIP_EVENT.minTeams, teamCount);
	const kept = teams.slice(0, count).map((team) => ({
		...team,
		slots: keepPresentSlots(team.slots, present),
	}));

	if (kept.length >= count) {
		return kept;
	}

	const used = kept.map((team) => team.color);
	const extra = Array.from({ length: count - kept.length }, (_, index) => {
		const color = nextEventTeamColor(used);
		used.push(color);
		return {
			key: `team-${kept.length + index}`,
			color,
			slots: emptyTeamSlots(playersPerTeam),
		};
	});

	return [...kept, ...extra];
}

export function builderTeamsFromEvent(
	teams: readonly {
		id: number;
		color: EventTeamColor;
		players: readonly { player_id: number; is_goalkeeper: boolean }[];
	}[],
	playersPerTeam: number,
	presentCount: number = 0,
): EventTeamBuilderTeam[] {
	if (teams.length < CHAMPIONSHIP_EVENT.minTeams) {
		return initialBuilderTeams(
			playersPerTeam,
			eventTeamCount(presentCount, playersPerTeam),
		);
	}

	return teams.map((team) => {
		const slots = emptyTeamSlots(playersPerTeam);
		const goalkeeper = team.players.find((player) => player.is_goalkeeper);
		const others = team.players.filter((player) => !player.is_goalkeeper);

		if (goalkeeper) {
			slots[0] = String(goalkeeper.player_id);
		}

		return {
			key: `team-${team.id}`,
			color: team.color,
			slots: others.reduce((next, player, index) => {
				const slot = index + 1;
				if (slot >= next.length) {
					return next;
				}

				next[slot] = String(player.player_id);
				return next;
			}, slots),
		};
	});
}

export function canEditEventTeams(event: {
	ended_at: string | null;
	matches: readonly unknown[];
}): boolean {
	return event.ended_at === null && event.matches.length === 0;
}

export function teamSlotsToPlayerIds(slots: readonly string[]): number[] {
	return slots.filter(Boolean).map(Number);
}

export function eventTeamSlotPosition(slot: number): EventTeamPosition {
	if (slot === 0) {
		return EVENT_TEAM_POSITION.goalkeeper;
	}

	return EVENT_TEAM_POSITION.player;
}

export function eventTeamPlayerPosition(
	isGoalkeeper: boolean,
): EventTeamPosition {
	if (isGoalkeeper) {
		return EVENT_TEAM_POSITION.goalkeeper;
	}

	return EVENT_TEAM_POSITION.player;
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
		const color = normalizeEventTeamColor(team.color);
		if (!isEventTeamColor(color)) {
			return EVENT_TEAM_MESSAGE.colorInvalid;
		}

		if (colors.has(color)) {
			return EVENT_TEAM_MESSAGE.colorDuplicate;
		}

		colors.add(color);

		if (team.playerIds.length === 0) {
			return EVENT_TEAM_MESSAGE.playerEmpty;
		}

		if (team.playerIds.length > playersPerTeam) {
			return EVENT_TEAM_MESSAGE.playerLimit;
		}

		if (team.playerIds.some((playerId) => players.has(playerId))) {
			return EVENT_TEAM_MESSAGE.playerDuplicate;
		}

		if (!team.playerIds.includes(team.goalkeeperId)) {
			return EVENT_TEAM_MESSAGE.goalkeeperMissing;
		}

		for (const playerId of team.playerIds) {
			players.add(playerId);
		}
	}

	return null;
}

export function validateEventAttendance(
	presentIds: readonly number[],
	rosterIds: readonly number[],
): string | null {
	if (presentIds.length < CHAMPIONSHIP_EVENT.minAttendance) {
		return EVENT_ATTENDANCE_MESSAGE.minPresent;
	}

	const roster = new Set(rosterIds);
	const seen = new Set<number>();

	for (const playerId of presentIds) {
		if (seen.has(playerId)) {
			return EVENT_ATTENDANCE_MESSAGE.duplicate;
		}

		if (!roster.has(playerId)) {
			return EVENT_ATTENDANCE_MESSAGE.notInRoster;
		}

		seen.add(playerId);
	}

	return null;
}

export function validateTeamsInAttendance(
	teams: readonly EventTeamDraft[],
	presentIds: readonly number[],
): string | null {
	const present = new Set(presentIds);

	const missing = teams.some((team) =>
		team.playerIds.some((playerId) => !present.has(playerId)),
	);

	if (missing) {
		return EVENT_TEAM_MESSAGE.playerNotPresent;
	}

	return null;
}

export function countPlayerAttendance(
	events: readonly {
		attendance: readonly { player_id: number }[];
	}[],
): Map<number, number> {
	const counts = new Map<number, number>();

	for (const event of events) {
		for (const row of event.attendance) {
			counts.set(row.player_id, (counts.get(row.player_id) ?? 0) + 1);
		}
	}

	return counts;
}

export function compareByAttendanceCount(
	a: { attendanceCount: number; display_name: string },
	b: { attendanceCount: number; display_name: string },
): number {
	if (b.attendanceCount !== a.attendanceCount) {
		return b.attendanceCount - a.attendanceCount;
	}

	return a.display_name.localeCompare(b.display_name, "pt-BR");
}

export function applyVisibleAttendance(
	presentIds: readonly number[],
	visibleIds: readonly number[],
	present: boolean,
): number[] {
	if (!present) {
		const visible = new Set(visibleIds);
		return presentIds.filter((id) => !visible.has(id));
	}

	return [...new Set([...presentIds, ...visibleIds])];
}

export function areAllVisiblePresent(
	presentIds: readonly number[],
	visibleIds: readonly number[],
): boolean {
	if (visibleIds.length === 0) {
		return false;
	}

	const present = new Set(presentIds);
	return visibleIds.every((id) => present.has(id));
}
