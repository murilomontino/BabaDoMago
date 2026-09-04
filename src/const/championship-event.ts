import { includeWhen } from "../lib/include-when.ts";
import {
	EVENT_TEAM_COLOR_NONE,
	EVENT_TEAM_COLORS,
	type EventTeamColor,
	isEventTeamColor,
	normalizeEventTeamColor,
} from "./event-team-color.ts";
import { PLAYER_RATING } from "./player-rating.ts";

export const CHAMPIONSHIP_EVENT = {
	timeZone: "America/Sao_Paulo",
	defaultTime: "19:00",
	playersPerTeamMin: 3,
	playersPerTeamMax: 11,
	playersPerTeamDefault: 5,
	minTeams: 2,
	minAttendance: 2,
	skipGuestGoalkeeperMatchesDefault: true,
	ratingDropGoalShareDefault: false,
	ratingDropShareExcludeTopDefault: false,
	playerVoteQuorumMin: 1,
	playerVoteQuorumMax: 10,
	playerVoteQuorumDefault: 3,
	playerVoteAllowSelfDefault: true,
	locationMaxLength: 120,
} as const;

export const EVENT_WEEKDAY = {
	monday: 1,
	tuesday: 2,
	wednesday: 3,
	thursday: 4,
	friday: 5,
	saturday: 6,
	sunday: 7,
} as const;

export type EventWeekday = (typeof EVENT_WEEKDAY)[keyof typeof EVENT_WEEKDAY];

export const EVENT_WEEKDAY_LABEL = {
	[EVENT_WEEKDAY.monday]: "segunda",
	[EVENT_WEEKDAY.tuesday]: "terça",
	[EVENT_WEEKDAY.wednesday]: "quarta",
	[EVENT_WEEKDAY.thursday]: "quinta",
	[EVENT_WEEKDAY.friday]: "sexta",
	[EVENT_WEEKDAY.saturday]: "sábado",
	[EVENT_WEEKDAY.sunday]: "domingo",
} as const;

export const EVENT_WEEKDAY_OPTIONS = [
	{ value: EVENT_WEEKDAY.monday, label: "Segunda" },
	{ value: EVENT_WEEKDAY.tuesday, label: "Terça" },
	{ value: EVENT_WEEKDAY.wednesday, label: "Quarta" },
	{ value: EVENT_WEEKDAY.thursday, label: "Quinta" },
	{ value: EVENT_WEEKDAY.friday, label: "Sexta" },
	{ value: EVENT_WEEKDAY.saturday, label: "Sábado" },
	{ value: EVENT_WEEKDAY.sunday, label: "Domingo" },
] as const;

export const EVENT_CONFIG_LABEL = {
	eventWeekday: "Dia da semana",
	eventWeekdayNone: "Não definido",
	location: "Local",
	skipGuestGoalkeeperMatches: "Goleiro de outro time",
	skipGuestGoalkeeperMatchesHint:
		"Partida do goleiro emprestado só conta se o time vencer.",
	ratingDropGoalShare: "Amortecer queda por gols",
	ratingDropGoalShareHint:
		"Quem cai de nota perde menos se tiver mais de 40% dos gols do próprio time (G+A).",
	ratingDropShareExcludeTop: "Não proteger os 10 melhores",
	ratingDropShareExcludeTopHint:
		"Os 10 com maior nota da liga não recebem o amortecimento de queda.",
	playerVoteQuorum: "Votos para fechar jogador",
	playerVoteQuorumHint:
		"Like ou dislike precisa desse total (e superar o outro polo) para aplicar ±0,5.",
	playerVoteAllowSelf: "Permitir voto em si",
	playerVoteAllowSelfHint:
		"Quem vota pode dar like, dislike ou manter na própria linha.",
} as const;

export const EVENT_BUILDER_STEP = {
	attendance: "attendance",
	teams: "teams",
} as const;

export type EventBuilderStep =
	(typeof EVENT_BUILDER_STEP)[keyof typeof EVENT_BUILDER_STEP];

export const EVENT_BUILDER_STEP_LABEL = {
	attendance: "Presença",
	teams: "Times",
} as const;

export const EVENT_BUILDER_TABS = [
	{
		id: EVENT_BUILDER_STEP.attendance,
		label: EVENT_BUILDER_STEP_LABEL.attendance,
	},
	{
		id: EVENT_BUILDER_STEP.teams,
		label: EVENT_BUILDER_STEP_LABEL.teams,
	},
] as const;

export function isEventBuilderStep(value: unknown): value is EventBuilderStep {
	return Object.values(EVENT_BUILDER_STEP).includes(value as EventBuilderStep);
}

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
	"event already exists": "Já existe rodada neste dia",
	"invalid teams": "Times inválidos",
	"invalid team color": "Cor inválida",
	"duplicate team color": "Cores repetidas",
	"duplicate player": "Jogador repetido no time",
	"invalid team size": "Time fora do limite",
	"invalid event date": "Data inválida",
	"invalid event time": "Hora inválida",
	"invalid event weekday": "Dia da semana inválido",
	"invalid location": "Local inválido",
	"invalid players per team": "Limite inválido",
	"same team": "Escolha dois times",
	"team not in event": "Time não pertence à rodada",
	"event not found": "Rodada não encontrada",
	"invalid attendance": "Lista de presença inválida",
	"duplicate attendance": "Jogador repetido na presença",
	"player not present": "Jogador não está presente",
	"invalid goalkeeper": "Informe o goleiro",
	"event already ended": "Rodada já encerrada",
	"event has matches": "Rodada já tem partidas",
	"team has matches": "Time já tem partidas",
	"match already open": "Já tem partida em andamento",
	"match already ended": "Partida já encerrada",
	"match not found": "Partida não encontrada",
	"player already in match": "Jogador já está na partida",
	"player has goals": "Jogador já tem gol nesta partida",
	"invalid slot": "Vaga inválida",
	"team not in match": "Time não está na partida",
	"player not in match": "Jogador não está na partida",
	"player substituted": "Jogador já foi substituído",
	"assist not in team": "Assistência de outro time",
	"no goal to undo": "Nenhum gol para desfazer",
	"goal not found": "Gol não encontrado",
	"invalid attendance stats": "Números inválidos",
	"wins exceed matches": "Vitórias acima dos jogos",
	"result stats mismatch": "Resultado acima dos jogos",
	"invalid rating": "Nota inválida",
	"event still open": "Rodada ainda aberta",
	"invalid rsvp": "Confirmação inválida",
	"not event day": "Check-in só no dia da rodada",
	"team inactive": "Time inativo",
	"team in open match": "Time em partida aberta",
	"player conflict": "Jogadores já estão em outro time",
	"shared player": "Times com jogador em comum",
	"invalid vote": "Voto inválido",
	"cannot vote self": "Não dá para votar em si",
	"voter not present": "Você precisa estar na presença",
	"not allowed": "Sem permissão",
	"not authenticated": "Faça login",
	"vote closed": "Voto deste jogador já fechou",
} as const;

export const EVENT_ACTION = {
	create: "Criar rodada",
	saveTeams: "Salvar times",
	editTeams: "Editar times",
	newEvent: "Nova rodada",
	addAttendance: "Adicionar presença",
	lateJoin: "Chegou agora",
	checkIn: "Cheguei",
	promoteRsvp: "Promover quem vai",
	addMatch: "Adicionar partida",
	startMatch: "Ir para nova partida",
	continue: "Continuar",
	continueMatch: "Continuar partida",
	nextMatch: "Próxima partida",
	endMatch: "Encerrar",
	undoGoal: "Desfazer gol",
	editMatch: "Editar partida",
	copyMatchLink: "Copiar link",
	markGoal: "Marcar gol",
	swapPlayer: "Trocar",
	swapTeam: "Trocar time",
	removePlayer: "Remover",
	fillSlot: "Adicionar",
	setGoalkeeper: "Goleiro",
	addTeam: "Adicionar time",
	editTeam: "Editar time",
	saveTeam: "Salvar time",
	saveAttendance: "Salvar presença",
	markAttendanceStats: "Marcar stats",
	saveAttendanceStats: "Salvar stats",
	editPlayerEventStats: "Corrigir stats",
	savePlayerEventStats: "Salvar stats",
	removeAttendance: "Excluir presença",
	removeMatch: "Excluir partida",
	removeTeam: "Excluir time",
	drawTeams: "Sortear times",
	openDraw: "Abrir sorteio",
	openPotDraw: "Sorteio por potes",
	copyDrawLink: "Copiar link do sorteio",
	endEvent: "Encerrar Rodada",
	setMvp: "Escolher MVP",
	deleteEvent: "Excluir rodada",
} as const;

export const EVENT_LIST_ACTIONS_LABEL = {
	cancel: "Cancelar",
} as const;

export const EVENT_CARD_LONG_PRESS = {
	ms: 500,
	movePx: 8,
} as const;

export const EVENT_SECTION_LABEL = {
	matches: "Histórico da partida",
	attendance: "Presentes",
} as const;

export const EVENT_END_LABEL = {
	title: "Encerrar rodada",
	hint: "A rodada fica marcada como encerrada. Ainda dá para adicionar partidas depois.",
	confirm: "Encerrar",
	cancel: "Cancelar",
} as const;

export const EVENT_CREATE_OPEN_LABEL = {
	title: "Rodadas em aberto",
	hint: "Há rodadas sem encerrar. Encerrar aplica a nota com MVP automático.",
	closeAndCreate: "Encerrar e criar",
	createOnly: "Criar sem encerrar",
	cancel: "Cancelar",
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

export const EVENT_TEAM_AVERAGE_LABEL = "Média";

export type EventTeamDraft = {
	color: EventTeamColor | null;
	playerIds: number[];
	goalkeeperId: number;
	isActive?: boolean;
};

export const EVENT_TEAM_MESSAGE = {
	minTeams: "Monte pelo menos dois times",
	colorDuplicate: "Cores repetidas",
	colorInvalid: "Cor inválida",
	playerDuplicate: "Jogador repetido no time",
	playerEmpty: "Time sem jogador",
	playerLimit: "Time acima do limite",
	playerNotPresent: "Jogador não está presente",
	goalkeeperMissing: "Informe o goleiro",
	needAttendance: "Marque a presença primeiro",
	drawing: "Buscando melhor cenário...",
	drawFailed: "Não foi possível sortear os times",
	drawReplaceTitle: "Sortear times de novo?",
	drawReplaceHint: "Os times atuais serão substituídos.",
	drawReplaceCancel: "Cancelar",
	sharedPlayers: "Times com jogador em comum",
} as const;

export const EVENT_TEAM_DRAW_LABEL = {
	countOne: "Sorteado 1 vez",
	countMany: "Sorteado {count} vezes",
} as const;

export function eventTeamDrawCountLabel(count: number): string {
	if (count === 1) {
		return EVENT_TEAM_DRAW_LABEL.countOne;
	}

	return EVENT_TEAM_DRAW_LABEL.countMany.replace("{count}", String(count));
}

export const EVENT_ATTENDANCE_MESSAGE = {
	minPresent: "Marque pelo menos dois presentes",
	notInRoster: "Jogador fora do elenco",
	duplicate: "Jogador repetido na presença",
	invalidStats: "Números inválidos",
	winsExceedMatches: "Vitórias acima dos jogos",
	resultStatsMismatch: "Resultado acima dos jogos",
} as const;

export const ATTENDANCE_SEED = {
	lastEvent: "lastEvent",
	habitual: "habitual",
	clear: "clear",
} as const;

export type AttendanceSeedMode =
	(typeof ATTENDANCE_SEED)[keyof typeof ATTENDANCE_SEED];

export const ATTENDANCE_SEED_LABEL = {
	[ATTENDANCE_SEED.lastEvent]: "Última rodada",
	[ATTENDANCE_SEED.habitual]: "Habituais",
	[ATTENDANCE_SEED.clear]: "Limpar",
} as const;

export const ATTENDANCE_SEED_HINT = {
	[ATTENDANCE_SEED.lastEvent]:
		"Marca quem estava presente na última rodada encerrada deste dia da semana.",
	[ATTENDANCE_SEED.habitual]:
		"Marca quem veio em pelo menos metade das últimas 5 rodadas deste dia da semana.",
	[ATTENDANCE_SEED.clear]: "Remove todos os presentes marcados.",
} as const;

export const ATTENDANCE_SEED_HABITUAL = {
	minRate: 0.5,
	windowEvents: 5,
} as const;

export const EVENT_ATTENDANCE_DRAFT_STORAGE_KEY = "baba-event-attendance-draft";

export const EVENT_LATE_JOIN_LABEL = {
	action: "Chegou agora",
	title: "Chegou agora",
	hint: "Adiciona o jogador à presença da rodada.",
	empty: "Todos do elenco já estão marcados.",
	confirm: "Adicionar",
	cancel: "Cancelar",
} as const;

export const EVENT_END_MISSING_ATTENDANCE_LABEL = {
	hint: "Há jogadores em partida fora da presença. Eles serão incluídos ao encerrar.",
} as const;

export const EVENT_RSVP_STATUS = {
	going: "going",
	out: "out",
} as const;

export type EventRsvpStatus =
	(typeof EVENT_RSVP_STATUS)[keyof typeof EVENT_RSVP_STATUS];

export const EVENT_RSVP_STATUS_LABEL = {
	[EVENT_RSVP_STATUS.going]: "Vou",
	[EVENT_RSVP_STATUS.out]: "Não vou",
} as const;

export const EVENT_RSVP_CHOICES = [
	EVENT_RSVP_STATUS.going,
	EVENT_RSVP_STATUS.out,
] as const;

export function eventRsvpButtonVariant(
	status: EventRsvpStatus,
	selected: boolean,
): "primary" | "secondary" | "danger" | "ghost" {
	if (!selected) {
		return "secondary";
	}

	if (status === EVENT_RSVP_STATUS.out) {
		return "danger";
	}

	return "primary";
}

export const EVENT_RSVP_LABEL = {
	section: "Confirmação",
	promoteGoing: "Promover quem vai",
	promoteHint: "Marca na presença quem respondeu Vou.",
	none: "Nenhuma confirmação ainda.",
} as const;

export const EVENT_CHECK_IN_LABEL = {
	action: "Cheguei",
	hint: "Marca você na presença desta rodada.",
	alreadyPresent: "Você já está na presença.",
	notEventDay: "Check-in só no dia da rodada.",
} as const;

export const EVENT_ATTENDANCE_COLUMN = {
	present: "present",
	goalkeeper: "goalkeeper",
	player: "player",
	rating: "rating",
	count: "count",
	eventDate: "eventDate",
	goals: "goals",
	assists: "assists",
	assistedGoals: "assistedGoals",
	ownGoals: "ownGoals",
	wins: "wins",
	losses: "losses",
	draws: "draws",
	matches: "matches",
} as const;

export const EVENT_ATTENDANCE_COLUMN_LABEL = {
	present: "Presente",
	goalkeeper: "Goleiro",
	player: "Jogador",
	rating: "Rating",
	count: "Presenças",
	eventDate: "Data",
	goals: "Gols",
	assists: "Assistências",
	assistedGoals: "Gols servidos",
	ownGoals: "Gols contra",
	wins: "Vitórias",
	losses: "Derrotas",
	draws: "Empates",
	mvp: "MVP",
	matches: "Jogos",
} as const;

export const EVENT_ATTENDANCE_STAT_ABBR = {
	goals: "G",
	assists: "A",
	assistedGoals: "GS",
	ownGoals: "GC",
	wins: "V",
	losses: "D",
	draws: "E",
	matches: "J",
} as const;

export const ATTENDANCE_STAT = {
	goals: "goals",
	assists: "assists",
	ownGoals: "own_goals",
	wins: "wins",
	losses: "losses",
	draws: "draws",
	matches: "matches",
} as const;

export type AttendanceStatField =
	(typeof ATTENDANCE_STAT)[keyof typeof ATTENDANCE_STAT];

export const ATTENDANCE_STAT_META = [
	{
		id: ATTENDANCE_STAT.goals,
		abbr: EVENT_ATTENDANCE_STAT_ABBR.goals,
		label: EVENT_ATTENDANCE_COLUMN_LABEL.goals,
	},
	{
		id: ATTENDANCE_STAT.assists,
		abbr: EVENT_ATTENDANCE_STAT_ABBR.assists,
		label: EVENT_ATTENDANCE_COLUMN_LABEL.assists,
	},
	{
		id: ATTENDANCE_STAT.ownGoals,
		abbr: EVENT_ATTENDANCE_STAT_ABBR.ownGoals,
		label: EVENT_ATTENDANCE_COLUMN_LABEL.ownGoals,
	},
	{
		id: ATTENDANCE_STAT.wins,
		abbr: EVENT_ATTENDANCE_STAT_ABBR.wins,
		label: EVENT_ATTENDANCE_COLUMN_LABEL.wins,
	},
	{
		id: ATTENDANCE_STAT.losses,
		abbr: EVENT_ATTENDANCE_STAT_ABBR.losses,
		label: EVENT_ATTENDANCE_COLUMN_LABEL.losses,
	},
	{
		id: ATTENDANCE_STAT.draws,
		abbr: EVENT_ATTENDANCE_STAT_ABBR.draws,
		label: EVENT_ATTENDANCE_COLUMN_LABEL.draws,
	},
	{
		id: ATTENDANCE_STAT.matches,
		abbr: EVENT_ATTENDANCE_STAT_ABBR.matches,
		label: EVENT_ATTENDANCE_COLUMN_LABEL.matches,
	},
] as const;

export const PLAYER_EVENT_STAT_META = [
	{
		id: ATTENDANCE_STAT.goals,
		abbr: EVENT_ATTENDANCE_STAT_ABBR.goals,
		label: EVENT_ATTENDANCE_COLUMN_LABEL.goals,
	},
	{
		id: ATTENDANCE_STAT.assists,
		abbr: EVENT_ATTENDANCE_STAT_ABBR.assists,
		label: EVENT_ATTENDANCE_COLUMN_LABEL.assists,
	},
	{
		id: ATTENDANCE_STAT.wins,
		abbr: EVENT_ATTENDANCE_STAT_ABBR.wins,
		label: EVENT_ATTENDANCE_COLUMN_LABEL.wins,
	},
	{
		id: ATTENDANCE_STAT.losses,
		abbr: EVENT_ATTENDANCE_STAT_ABBR.losses,
		label: EVENT_ATTENDANCE_COLUMN_LABEL.losses,
	},
	{
		id: ATTENDANCE_STAT.draws,
		abbr: EVENT_ATTENDANCE_STAT_ABBR.draws,
		label: EVENT_ATTENDANCE_COLUMN_LABEL.draws,
	},
	{
		id: ATTENDANCE_STAT.matches,
		abbr: EVENT_ATTENDANCE_STAT_ABBR.matches,
		label: EVENT_ATTENDANCE_COLUMN_LABEL.matches,
	},
] as const;

export type PlayerEventStatField =
	(typeof PLAYER_EVENT_STAT_META)[number]["id"];

export type PlayerEventStatsDraft = {
	goals: number;
	assists: number;
	wins: number;
	losses: number;
	draws: number;
	matches: number;
};

export const PLAYER_EVENT_STATS_LABEL = {
	title: "Stats da rodada",
	event: "Rodada",
	emptyEvents: "Nenhuma rodada encerrada",
	ratingHint:
		"O rate só muda neste jogador se ainda não tinha sido aplicado nesta rodada.",
} as const;

export type EventAttendanceStatsDraft = {
	player_id: number;
	goals: number;
	assists: number;
	own_goals: number;
	wins: number;
	losses: number;
	draws: number;
	matches: number;
};

export const ATTENDANCE_STATS_TEAM_FILTER = {
	all: "all",
	none: "none",
} as const;

export type AttendanceStatsTeamFilter =
	| (typeof ATTENDANCE_STATS_TEAM_FILTER)[keyof typeof ATTENDANCE_STATS_TEAM_FILTER]
	| number;

export const ATTENDANCE_STATS_TEAM_FILTER_LABEL = {
	group: "Time",
	all: "Todos",
	none: "Sem time",
} as const;

export const EVENT_ATTENDANCE_ACTION = {
	selectAll: "Selecionar todos",
	deselectAll: "Desselecionar todos",
	selectMonthly: "Mensalistas",
	deselectMonthly: "Desmarcar mensalistas",
	hideSelected: "Ocultar selecionados",
	selectedList: "Selecionados",
	unselectAria: "Remover da presença",
	addPlayer: "Adicionar",
	addPlayerPlaceholder: "Nome do jogador",
	addPlayerAria: "Adicionar jogador",
} as const;

export function parseEventTime(value: unknown): string {
	if (typeof value !== "string" || value.length < 5) {
		return CHAMPIONSHIP_EVENT.defaultTime;
	}

	return value.slice(0, 5);
}

export function parseEventWeekday(value: unknown): EventWeekday | null {
	const parsed = Number(value);
	if (
		!Number.isInteger(parsed) ||
		parsed < EVENT_WEEKDAY.monday ||
		parsed > EVENT_WEEKDAY.sunday
	) {
		return null;
	}

	return parsed as EventWeekday;
}

export function parseChampionshipLocation(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const trimmed = value.trim();
	if (!trimmed) {
		return null;
	}

	return trimmed.slice(0, CHAMPIONSHIP_EVENT.locationMaxLength);
}

export function isEventWeekday(value: unknown): value is EventWeekday {
	return parseEventWeekday(value) !== null;
}

export function jsSundayToEventWeekday(utcDay: number): EventWeekday {
	if (utcDay === 0) {
		return EVENT_WEEKDAY.sunday;
	}

	return utcDay as EventWeekday;
}

export function isoWeekdayFromYmd(ymd: string): EventWeekday {
	const [year, month, day] = ymd.split("-").map(Number);
	const utcDay = new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).getUTCDay();
	return jsSundayToEventWeekday(utcDay);
}

export function addDaysToYmd(ymd: string, days: number): string {
	const [year, month, day] = ymd.split("-").map(Number);
	const next = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
	const y = next.getUTCFullYear();
	const m = String(next.getUTCMonth() + 1).padStart(2, "0");
	const d = String(next.getUTCDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

export function nextEventDate(weekday: EventWeekday, fromYmd: string): string {
	const fromWeekday = isoWeekdayFromYmd(fromYmd);
	const delta = (weekday - fromWeekday + 7) % 7;
	return addDaysToYmd(fromYmd, delta);
}

export function createEventDate(
	weekday: EventWeekday | null,
	todayYmd = championshipEventToday(),
): string {
	if (!weekday) {
		return todayYmd;
	}

	return nextEventDate(weekday, todayYmd);
}

export function formatEventTimeShort(value: unknown): string {
	const time = parseEventTime(value);
	const [hour, minute] = time.split(":");
	if (minute === "00") {
		return `${Number(hour)}h`;
	}

	return `${Number(hour)}h${minute}`;
}

export function formatNextPeladaShortcut(input: {
	weekday: EventWeekday;
	eventTime: string;
}): string {
	return `Criar ${EVENT_WEEKDAY_LABEL[input.weekday]}, ${formatEventTimeShort(input.eventTime)}`;
}

export function formatChampionshipSchedule(input: {
	weekday: EventWeekday | null;
	eventTime: string;
	location: string | null;
}): string | null {
	const parts: string[] = [];
	if (input.weekday) {
		const weekday = EVENT_WEEKDAY_LABEL[input.weekday];
		parts.push(`${weekday[0]?.toUpperCase() ?? ""}${weekday.slice(1)}`);
	}

	parts.push(formatEventTimeShort(input.eventTime));

	const location = parseChampionshipLocation(input.location);
	if (location) {
		parts.push(location);
	}

	if (!input.weekday && !location) {
		return null;
	}

	return parts.join(" · ");
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

export function parsePlayerVoteQuorum(value: unknown): number {
	const parsed = Number(value);
	if (
		!Number.isInteger(parsed) ||
		parsed < CHAMPIONSHIP_EVENT.playerVoteQuorumMin ||
		parsed > CHAMPIONSHIP_EVENT.playerVoteQuorumMax
	) {
		return CHAMPIONSHIP_EVENT.playerVoteQuorumDefault;
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

export function eventDateYmd(iso: string): string {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: CHAMPIONSHIP_EVENT.timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(new Date(iso));
}

export function eventIsoWeekday(iso: string): EventWeekday {
	return isoWeekdayFromYmd(eventDateYmd(iso));
}

export function isEventDayToday(startsAt: string, todayYmd?: string): boolean {
	return eventDateYmd(startsAt) === (todayYmd ?? championshipEventToday());
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

export function openChampionshipEvents<
	T extends { id: number; starts_at: string; ended_at: string | null },
>(events: readonly T[]): T[] {
	return events
		.filter((event) => event.ended_at === null)
		.sort(compareStartsAtOldestFirst);
}

export function championshipEventErrorMessage(message: string): string {
	const known = Object.entries(EVENT_ERROR_MESSAGE)
		.filter(([code]) => message.includes(code))
		.sort((left, right) => right[0].length - left[0].length)[0];

	if (!known) {
		return message;
	}

	return known[1];
}

export function isMatchAlreadyOpenError(message: string): boolean {
	return (
		championshipEventErrorMessage(message) ===
		EVENT_ERROR_MESSAGE["match already open"]
	);
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

export function eventRatedAverage(ratings: readonly number[]): number {
	const rated = ratings.filter((rating) => rating !== PLAYER_RATING.default);
	if (rated.length === 0) {
		return PLAYER_RATING.default;
	}

	return rated.reduce((sum, rating) => sum + rating, 0) / rated.length;
}

export function eventDrawRating(rating: number, ratedAverage: number): number {
	if (rating !== PLAYER_RATING.default) {
		return rating;
	}

	return ratedAverage;
}

export function eventTeamRatingAverage(
	ratings: readonly number[],
	presentRatings: readonly number[] = ratings,
): number {
	if (ratings.length === 0) {
		return 0;
	}

	const ratedAverage = eventRatedAverage(presentRatings);
	return (
		ratings.reduce(
			(sum, rating) => sum + eventDrawRating(rating, ratedAverage),
			0,
		) / ratings.length
	);
}

export function formatEventTeamRatingAverage(average: number): string {
	return average.toFixed(1);
}

type EventTeamPartition = {
	capacity: number;
	playerIds: number[];
	sum: number;
};

const EVENT_TEAM_RATING_EPSILON = 1e-9;

export const EVENT_TEAM_DRAW_ALGORITHM_VERSION = 1;

function extraSlotForLargerTeam(index: number, largerTeams: number): number {
	if (index < largerTeams) {
		return 1;
	}

	return 0;
}

function eventTeamCapacities(playerCount: number, teamCount: number): number[] {
	const minimum = Math.floor(playerCount / teamCount);
	const largerTeams = playerCount % teamCount;
	return Array.from(
		{ length: teamCount },
		(_, index) => minimum + extraSlotForLargerTeam(index, largerTeams),
	);
}

function eventTeamRatingSpread(teams: readonly EventTeamPartition[]): number {
	const averages = teams.map((team) => team.sum / team.capacity);
	return Math.max(...averages) - Math.min(...averages);
}

function minimumTheoreticalRatingSpread(
	ratings: readonly number[],
	capacities: readonly number[],
): number {
	const ratingQuantum =
		ratings.reduce((divisor, rating) => {
			let left = divisor;
			let right = rating;
			while (right !== 0) {
				const remainder = left % right;
				left = right;
				right = remainder;
			}
			return left;
		}, 0) || 1;
	const totalRating = ratings.reduce((sum, rating) => sum + rating, 0);
	const possibleAverages = [
		...new Set(
			capacities.flatMap((capacity) =>
				Array.from(
					{
						length:
							Math.floor((capacity * PLAYER_RATING.max * 10) / ratingQuantum) +
							1,
					},
					(_, index) => (index * ratingQuantum) / capacity,
				),
			),
		),
	].sort((left, right) => left - right);
	let best = Number.POSITIVE_INFINITY;
	let right = 0;

	possibleAverages.forEach((minimum, left) => {
		const minimumTotal = capacities.reduce(
			(sum, capacity) =>
				sum +
				Math.ceil(
					(minimum * capacity - EVENT_TEAM_RATING_EPSILON) / ratingQuantum,
				) *
					ratingQuantum,
			0,
		);
		if (minimumTotal > totalRating) {
			return;
		}

		right = Math.max(right, left);
		while (right < possibleAverages.length) {
			const maximum = possibleAverages[right];
			if (maximum === undefined) {
				return;
			}

			const maximumTotal = capacities.reduce(
				(sum, capacity) =>
					sum +
					Math.floor(
						(maximum * capacity + EVENT_TEAM_RATING_EPSILON) / ratingQuantum,
					) *
						ratingQuantum,
				0,
			);
			if (maximumTotal >= totalRating) {
				best = Math.min(best, maximum - minimum);
				return;
			}

			right += 1;
		}
	});

	return best;
}

function initialEventTeamPartition(
	players: readonly { id: number; rating: number }[],
	capacities: readonly number[],
	random: () => number,
): EventTeamPartition[] {
	const teams = capacities.map((capacity) => ({
		capacity,
		playerIds: [] as number[],
		sum: 0,
	}));

	players.forEach((player) => {
		const candidates = teams
			.map((team, index) => ({ index, random: random(), team }))
			.filter(({ team }) => team.playerIds.length < team.capacity)
			.sort((left, right) => {
				const leftLoad = left.team.sum / left.team.capacity;
				const rightLoad = right.team.sum / right.team.capacity;
				if (leftLoad !== rightLoad) {
					return leftLoad - rightLoad;
				}

				return left.random - right.random;
			});
		const selected = candidates[0]?.team;
		if (!selected) {
			return;
		}

		selected.playerIds.push(player.id);
		selected.sum += player.rating;
	});

	return teams;
}

function minimumPossibleRatingSpread(
	teams: readonly EventTeamPartition[],
	remainingRatings: readonly number[],
): number {
	let highestMinimum = Number.NEGATIVE_INFINITY;
	let lowestMaximum = Number.POSITIVE_INFINITY;

	teams.forEach((team) => {
		const slots = team.capacity - team.playerIds.length;
		if (slots === 0) {
			const average = team.sum / team.capacity;
			highestMinimum = Math.max(highestMinimum, average);
			lowestMaximum = Math.min(lowestMaximum, average);
			return;
		}

		const highestAddition = remainingRatings
			.slice(0, slots)
			.reduce((sum, rating) => sum + rating, 0);
		const lowestAddition = remainingRatings
			.slice(-slots)
			.reduce((sum, rating) => sum + rating, 0);
		const minimum = (team.sum + lowestAddition) / team.capacity;
		const maximum = (team.sum + highestAddition) / team.capacity;
		highestMinimum = Math.max(highestMinimum, minimum);
		lowestMaximum = Math.min(lowestMaximum, maximum);
	});

	return Math.max(0, highestMinimum - lowestMaximum);
}

function eventTeamPartitionKey(
	index: number,
	teams: readonly EventTeamPartition[],
): string {
	const state = teams
		.map(
			(team) =>
				`${team.capacity}:${team.playerIds.length}:${team.sum.toFixed(1)}`,
		)
		.sort()
		.join("|");
	return `${index}-${state}`;
}

export function pickTeamGoalkeeper(
	playerIds: readonly number[],
	playersPerTeam: number,
	volunteerIds: readonly number[] = [],
): number {
	if (playerIds.length < playersPerTeam) {
		return 0;
	}

	const volunteers = new Set(volunteerIds);
	return (
		playerIds.find((playerId) => volunteers.has(playerId)) ?? playerIds[0] ?? 0
	);
}

export function eventDrawInputRating(
	player: { rating: number; goalkeeper_rating: number },
	isGoalkeeperVolunteer: boolean,
): number {
	if (isGoalkeeperVolunteer) {
		return player.goalkeeper_rating;
	}

	return player.rating;
}

export function eventDrawRatings(
	players: readonly { id: number; rating: number }[],
): readonly { id: number; rating: number }[] {
	const ratings = players.map((player) => player.rating);
	const ratedAverage = eventRatedAverage(ratings);
	if (
		ratedAverage === PLAYER_RATING.default ||
		ratings.every((rating) => rating !== PLAYER_RATING.default)
	) {
		return players;
	}

	return players.map((player) => ({
		id: player.id,
		rating: eventDrawRating(player.rating, ratedAverage),
	}));
}

export function drawBalancedEventTeams(
	players: readonly { id: number; rating: number }[],
	playersPerTeam: number,
	random: () => number = Math.random,
	volunteerIds: readonly number[] = [],
): EventTeamDraft[] {
	const teamCount = eventTeamCount(players.length, playersPerTeam);
	const capacities = eventTeamCapacities(players.length, teamCount);
	const ordered = eventDrawRatings(players)
		.map((player) => ({
			id: player.id,
			random: random(),
			rating: Math.round(player.rating * 10),
		}))
		.sort((left, right) => {
			if (left.rating !== right.rating) {
				return right.rating - left.rating;
			}

			return left.random - right.random;
		});
	let best = initialEventTeamPartition(ordered, capacities, random);
	let bestSpread = eventTeamRatingSpread(best);
	const theoreticalSpread = minimumTheoreticalRatingSpread(
		ordered.map((player) => player.rating),
		capacities,
	);
	const teams = capacities.map((capacity) => ({
		capacity,
		playerIds: [] as number[],
		sum: 0,
	}));
	const visited = new Set<string>();

	function search(index: number): void {
		if (bestSpread - theoreticalSpread <= EVENT_TEAM_RATING_EPSILON) {
			return;
		}

		if (index === ordered.length) {
			const spread = eventTeamRatingSpread(teams);
			if (spread < bestSpread) {
				bestSpread = spread;
				best = teams.map((team) => ({
					...team,
					playerIds: [...team.playerIds],
				}));
			}
			return;
		}

		const remainingRatings = ordered
			.slice(index)
			.map((player) => player.rating);
		if (minimumPossibleRatingSpread(teams, remainingRatings) >= bestSpread) {
			return;
		}

		const stateKey = eventTeamPartitionKey(index, teams);
		if (visited.has(stateKey)) {
			return;
		}
		visited.add(stateKey);

		const player = ordered[index];
		if (!player) {
			return;
		}

		const seen = new Set<string>();
		const candidates = teams
			.map((team, teamIndex) => ({
				load: (team.sum + player.rating) / team.capacity,
				random: random(),
				team,
				teamIndex,
			}))
			.filter(({ team }) => team.playerIds.length < team.capacity)
			.filter(({ team }) => {
				const key = `${team.capacity}:${team.playerIds.length}:${team.sum}`;
				if (seen.has(key)) {
					return false;
				}

				seen.add(key);
				return true;
			})
			.sort((left, right) => {
				if (left.load !== right.load) {
					return left.load - right.load;
				}

				return left.random - right.random;
			});

		candidates.forEach(({ teamIndex }) => {
			const team = teams[teamIndex];
			if (!team) {
				return;
			}

			team.playerIds.push(player.id);
			team.sum += player.rating;
			search(index + 1);
			team.sum -= player.rating;
			team.playerIds.pop();
		});
	}

	search(0);

	return best.map((team) => ({
		color: EVENT_TEAM_COLOR_NONE,
		playerIds: team.playerIds,
		goalkeeperId: pickTeamGoalkeeper(
			team.playerIds,
			playersPerTeam,
			volunteerIds,
		),
	}));
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
	color: EventTeamColor | null;
	slots: string[];
	isActive: boolean;
};

export function eventTeamDraftIsActive(team: { isActive?: boolean }): boolean {
	return team.isActive !== false;
}

export function activeEventTeams<T extends { is_active: boolean }>(
	teams: readonly T[],
): T[] {
	return teams.filter((team) => team.is_active);
}

export function eventActiveTeamCount(
	teams: readonly { is_active: boolean }[],
): number {
	return activeEventTeams(teams).length;
}

export function eventTeamsAreReady(
	teams: readonly {
		is_active: boolean;
		players: readonly unknown[];
	}[],
): boolean {
	return (
		activeEventTeams(teams).filter((team) => team.players.length > 0).length >=
		CHAMPIONSHIP_EVENT.minTeams
	);
}

export function eventTeamSourcePlayers(team: {
	is_active: boolean;
	players: readonly { player_id: number; is_goalkeeper: boolean }[];
	template_player_ids: readonly number[];
	template_goalkeeper_id: number;
}): readonly { player_id: number; is_goalkeeper: boolean }[] {
	if (team.is_active) {
		return team.players;
	}

	return team.template_player_ids.map((playerId) => ({
		player_id: playerId,
		is_goalkeeper:
			team.template_goalkeeper_id !== 0 &&
			playerId === team.template_goalkeeper_id,
	}));
}

export function emptyTeamSlots(count: number): string[] {
	return Array.from({ length: count }, () => "");
}

export function replaceSlotAt(
	slots: readonly string[],
	slot: number,
	value: string,
): string[] {
	return slots.map((item, index) => {
		if (index !== slot) {
			return item;
		}

		return value;
	});
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

	return Array.from({ length: count }, (_, index) => ({
		key: `team-${index}`,
		color: EVENT_TEAM_COLOR_NONE,
		slots: emptyTeamSlots(playersPerTeam),
		isActive: true,
	}));
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

	const extra = Array.from({ length: count - kept.length }, (_, index) => ({
		key: `team-${kept.length + index}`,
		color: EVENT_TEAM_COLOR_NONE,
		slots: emptyTeamSlots(playersPerTeam),
		isActive: true,
	}));

	return [...kept, ...extra];
}

export function builderTeamsFromEvent(
	teams: readonly {
		id: number;
		color: EventTeamColor | null;
		is_active: boolean;
		players: readonly { player_id: number; is_goalkeeper: boolean }[];
		template_player_ids: readonly number[];
		template_goalkeeper_id: number;
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

	return teams.map((team) => ({
		key: `team-${team.id}`,
		color: team.color,
		slots: teamPlayerSlots(eventTeamSourcePlayers(team), playersPerTeam),
		isActive: team.is_active,
	}));
}

export function teamPlayerSlots(
	players: readonly { player_id: number; is_goalkeeper: boolean }[],
	playersPerTeam: number,
): string[] {
	const slots = emptyTeamSlots(playersPerTeam);
	const goalkeeper = players.find((player) => player.is_goalkeeper);
	const others = players.filter((player) => !player.is_goalkeeper);

	if (goalkeeper) {
		slots[0] = String(goalkeeper.player_id);
	}

	return others.reduce((next, player, index) => {
		const slot = index + 1;
		if (slot >= next.length) {
			return next;
		}

		next[slot] = String(player.player_id);
		return next;
	}, slots);
}

export function initialTeamSlots(
	team:
		| {
				players: readonly { player_id: number; is_goalkeeper: boolean }[];
		  }
		| null
		| undefined,
	playersPerTeam: number,
): string[] {
	if (!team) {
		return emptyTeamSlots(playersPerTeam);
	}

	return teamPlayerSlots(team.players, playersPerTeam);
}

export function builderTeamsFromDrafts(
	teams: readonly EventTeamDraft[],
	playersPerTeam: number,
): EventTeamBuilderTeam[] {
	return teams.map((team, index) => ({
		key: `team-draw-${index}`,
		color: team.color,
		slots: teamPlayerSlots(
			team.playerIds.map((playerId) => ({
				player_id: playerId,
				is_goalkeeper:
					team.goalkeeperId !== 0 && playerId === team.goalkeeperId,
			})),
			playersPerTeam,
		),
		isActive: eventTeamDraftIsActive(team),
	}));
}

export function teamHasMatches(
	teamId: number,
	matches: readonly { team_a_id: number; team_b_id: number }[],
): boolean {
	return matches.some(
		(match) => match.team_a_id === teamId || match.team_b_id === teamId,
	);
}

export function canEditEventTeams(
	event: {
		ended_at: string | null;
		matches: readonly unknown[];
	},
	canOverrideEnded = false,
): boolean {
	if (event.matches.length > 0) {
		return false;
	}

	if (event.ended_at === null) {
		return true;
	}

	return canOverrideEnded;
}

export function eventTeamPlayerIds(
	teams: readonly {
		players: readonly { player_id: number }[];
	}[],
): number[] {
	return [
		...new Set(
			teams.flatMap((team) => team.players.map((player) => player.player_id)),
		),
	];
}

export function keepTeamPlayersPresent(
	presentIds: readonly number[],
	teamPlayerIds: readonly number[],
): number[] {
	return [...new Set([...presentIds, ...teamPlayerIds])];
}

export function canRemoveEventAttendance(
	playerId: number,
	presentCount: number,
	teamPlayerIds: readonly number[],
): boolean {
	if (presentCount <= CHAMPIONSHIP_EVENT.minAttendance) {
		return false;
	}

	return !teamPlayerIds.includes(playerId);
}

export function canStartEventMatch(options: {
	ended: boolean;
	teamCount: number;
}): boolean {
	if (options.teamCount < CHAMPIONSHIP_EVENT.minTeams) {
		return false;
	}

	return !options.ended;
}

export function eventMatchTeamCount(
	teams: readonly { is_active: boolean }[],
): number {
	return eventActiveTeamCount(teams);
}

export function eventListActionFlags(input: {
	canManage: boolean;
	canSetMvp: boolean;
	ended: boolean;
	teamCount: number;
	attendanceCount: number;
}) {
	const showStartMatch = canStartEventMatch({
		ended: input.ended,
		teamCount: input.teamCount,
	});

	return {
		showStartMatch,
		canEnd: input.canManage && !input.ended,
		canSetMvp: input.canSetMvp && input.ended && input.attendanceCount > 0,
		canDelete: input.canManage,
	};
}

export function hasEventListActions(
	flags: ReturnType<typeof eventListActionFlags>,
): boolean {
	return (
		flags.showStartMatch || flags.canEnd || flags.canSetMvp || flags.canDelete
	);
}

export function canAddEventMatch(options: {
	ended: boolean;
	teamCount: number;
}): boolean {
	return canStartEventMatch(options);
}

export function draftAttendanceForEnd(
	builderOpen: boolean,
	presentIds: readonly number[],
): number[] | null {
	if (!builderOpen) {
		return null;
	}

	if (presentIds.length < CHAMPIONSHIP_EVENT.minAttendance) {
		return null;
	}

	return [...presentIds];
}

export function matchPlayerIdsMissingFromAttendance(
	matches: readonly {
		players: readonly { player_id: number }[];
	}[],
	attendanceIds: readonly number[],
): number[] {
	const present = new Set(attendanceIds);
	const missing = new Set<number>();

	for (const match of matches) {
		for (const row of match.players) {
			if (!present.has(row.player_id)) {
				missing.add(row.player_id);
			}
		}
	}

	return [...missing];
}

export function mergePresentIdsForEnd(
	draftIds: number[] | null,
	attendanceIds: readonly number[],
	missingMatchPlayerIds: readonly number[],
): number[] | null {
	if (missingMatchPlayerIds.length === 0) {
		return draftIds;
	}

	const base = draftIds ?? [...attendanceIds];
	return [...new Set([...base, ...missingMatchPlayerIds])];
}

export function attendanceDraftStorageKey(eventId: number): string {
	return `${EVENT_ATTENDANCE_DRAFT_STORAGE_KEY}:${eventId}`;
}

export function readAttendanceDraft(eventId: number): number[] | null {
	if (typeof localStorage === "undefined") {
		return null;
	}

	try {
		const raw = localStorage.getItem(attendanceDraftStorageKey(eventId));
		if (!raw) {
			return null;
		}

		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) {
			return null;
		}

		const ids = parsed.filter(
			(value): value is number =>
				typeof value === "number" && Number.isInteger(value),
		);
		if (ids.length === 0) {
			return null;
		}

		return [...new Set(ids)];
	} catch {
		return null;
	}
}

export function writeAttendanceDraft(
	eventId: number,
	presentIds: readonly number[],
): void {
	if (typeof localStorage === "undefined") {
		return;
	}

	localStorage.setItem(
		attendanceDraftStorageKey(eventId),
		JSON.stringify([...new Set(presentIds)]),
	);
}

export function clearAttendanceDraft(eventId: number): void {
	if (typeof localStorage === "undefined") {
		return;
	}

	localStorage.removeItem(attendanceDraftStorageKey(eventId));
}

export function resolveBuilderInitialPresentIds(
	savedAttendanceIds: readonly number[],
	eventId: number,
): number[] {
	if (savedAttendanceIds.length > 0) {
		return [...savedAttendanceIds];
	}

	return readAttendanceDraft(eventId) ?? [];
}

type AttendanceSeedEvent = {
	id: number;
	ended_at: string | null;
	starts_at: string;
	attendance: readonly { player_id: number }[];
};

function endedEventsNewestFirst(
	events: readonly AttendanceSeedEvent[],
	weekday: EventWeekday | null,
): AttendanceSeedEvent[] {
	return events
		.filter((event) => {
			if (event.ended_at === null) {
				return false;
			}

			if (weekday === null) {
				return true;
			}

			return eventIsoWeekday(event.starts_at) === weekday;
		})
		.sort(compareStartsAtNewestFirst);
}

export function seedPresentIdsFromLastEvent(
	events: readonly AttendanceSeedEvent[],
	rosterIds: readonly number[],
	options: { weekday?: EventWeekday | null } = {},
): number[] {
	const roster = new Set(rosterIds);
	const weekday = options.weekday ?? null;
	const last = endedEventsNewestFirst(events, weekday)[0];
	if (!last) {
		return [];
	}

	return last.attendance.flatMap((row) =>
		includeWhen(roster.has(row.player_id), row.player_id),
	);
}

export function seedPresentIdsFromHabitual(
	events: readonly AttendanceSeedEvent[],
	rosterIds: readonly number[],
	options: {
		weekday?: EventWeekday | null;
		minRate?: number;
		windowEvents?: number;
	} = {},
): number[] {
	const weekday = options.weekday ?? null;
	const minRate = options.minRate ?? ATTENDANCE_SEED_HABITUAL.minRate;
	const windowEvents =
		options.windowEvents ?? ATTENDANCE_SEED_HABITUAL.windowEvents;
	const window = endedEventsNewestFirst(events, weekday).slice(0, windowEvents);
	if (window.length === 0) {
		return [];
	}

	const roster = new Set(rosterIds);
	return rosterIds.flatMap((playerId) => {
		if (!roster.has(playerId)) {
			return [];
		}

		const presentCount = window.filter((event) =>
			event.attendance.some((row) => row.player_id === playerId),
		).length;
		const rate = presentCount / window.length;
		if (rate < minRate) {
			return [];
		}

		return [playerId];
	});
}

export function seedPresentIdsFromHistory(
	mode: AttendanceSeedMode,
	events: readonly AttendanceSeedEvent[],
	rosterIds: readonly number[],
	options: { weekday?: EventWeekday | null } = {},
): number[] {
	switch (mode) {
		case ATTENDANCE_SEED.lastEvent:
			return seedPresentIdsFromLastEvent(events, rosterIds, options);
		case ATTENDANCE_SEED.habitual:
			return seedPresentIdsFromHabitual(events, rosterIds, options);
		case ATTENDANCE_SEED.clear:
			return [];
		default: {
			const _never: never = mode;
			return _never;
		}
	}
}

export function isEventRsvpStatus(value: unknown): value is EventRsvpStatus {
	return Object.values(EVENT_RSVP_STATUS).includes(value as EventRsvpStatus);
}

export function rsvpGoingPlayerIds(
	rsvps: readonly { player_id: number; status: string }[],
): number[] {
	return rsvps.flatMap((row) =>
		includeWhen(row.status === EVENT_RSVP_STATUS.going, row.player_id),
	);
}

export function canSelfCheckIn(options: {
	endedAt: string | null;
	startsAt: string;
	playerId: number | null;
	attendanceIds: readonly number[];
	todayYmd?: string;
}): boolean {
	if (options.endedAt !== null) {
		return false;
	}

	if (options.playerId === null) {
		return false;
	}

	if (options.attendanceIds.includes(options.playerId)) {
		return false;
	}

	return isEventDayToday(options.startsAt, options.todayYmd);
}

export function teamSlotsToPlayerIds(slots: readonly string[]): number[] {
	return slots.filter(Boolean).map(Number);
}

export function eventTeamSlotPool<T extends { id: number }>(
	presentPlayers: readonly T[],
	teams: readonly { slots: readonly string[] }[],
	teamIndex: number,
	slot: number,
): T[] {
	const currentIds = teamSlotsToPlayerIds(teams[teamIndex]?.slots ?? []);
	const reservedIds = new Set(currentIds);
	const slotValue = teams[teamIndex]?.slots[slot] ?? "";
	const slotPlayerId = slotValue ? Number(slotValue) : null;

	return presentPlayers.filter(
		(player) => player.id === slotPlayerId || !reservedIds.has(player.id),
	);
}

export function eventTeamsSharePlayers(
	left: readonly { player_id: number }[],
	right: readonly { player_id: number }[],
): boolean {
	const ids = new Set(left.map((player) => player.player_id));
	return right.some((player) => ids.has(player.player_id));
}

export function builderTeamsHavePlayers(
	teams: readonly EventTeamBuilderTeam[],
): boolean {
	return teams.some((team) => teamSlotsToPlayerIds(team.slots).length > 0);
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

	for (const team of teams) {
		const color = normalizeEventTeamColor(team.color);
		if (color !== null && !isEventTeamColor(color)) {
			return EVENT_TEAM_MESSAGE.colorInvalid;
		}

		if (color !== null && colors.has(color)) {
			return EVENT_TEAM_MESSAGE.colorDuplicate;
		}

		if (color !== null) {
			colors.add(color);
		}

		if (team.playerIds.length === 0) {
			return EVENT_TEAM_MESSAGE.playerEmpty;
		}

		if (team.playerIds.length > playersPerTeam) {
			return EVENT_TEAM_MESSAGE.playerLimit;
		}

		if (new Set(team.playerIds).size !== team.playerIds.length) {
			return EVENT_TEAM_MESSAGE.playerDuplicate;
		}

		if (
			team.goalkeeperId !== 0 &&
			!team.playerIds.includes(team.goalkeeperId)
		) {
			return EVENT_TEAM_MESSAGE.goalkeeperMissing;
		}
	}

	return null;
}

export function validateEventTeam(
	team: EventTeamDraft,
	playersPerTeam: number,
	usedColors: readonly EventTeamColor[],
	presentIds: readonly number[],
): string | null {
	const color = normalizeEventTeamColor(team.color);
	if (color !== null && !isEventTeamColor(color)) {
		return EVENT_TEAM_MESSAGE.colorInvalid;
	}

	if (color !== null && usedColors.includes(color)) {
		return EVENT_TEAM_MESSAGE.colorDuplicate;
	}

	if (team.playerIds.length === 0) {
		return EVENT_TEAM_MESSAGE.playerEmpty;
	}

	if (team.playerIds.length > playersPerTeam) {
		return EVENT_TEAM_MESSAGE.playerLimit;
	}

	if (team.goalkeeperId !== 0 && !team.playerIds.includes(team.goalkeeperId)) {
		return EVENT_TEAM_MESSAGE.goalkeeperMissing;
	}

	if (new Set(team.playerIds).size !== team.playerIds.length) {
		return EVENT_TEAM_MESSAGE.playerDuplicate;
	}

	const present = new Set(presentIds);
	if (team.playerIds.some((playerId) => !present.has(playerId))) {
		return EVENT_TEAM_MESSAGE.playerNotPresent;
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

export function isAttendanceStatCount(value: unknown): value is number {
	return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function attendanceResultError(row: {
	wins: number;
	losses: number;
	draws: number;
	matches: number;
}): string | null {
	if (row.wins > row.matches) {
		return EVENT_ATTENDANCE_MESSAGE.winsExceedMatches;
	}

	if (row.wins + row.losses + row.draws > row.matches) {
		return EVENT_ATTENDANCE_MESSAGE.resultStatsMismatch;
	}

	return null;
}

export function attendanceStatsFromRows(
	rows: readonly EventAttendanceStatsDraft[],
): EventAttendanceStatsDraft[] {
	return rows.map((row) => ({
		player_id: row.player_id,
		goals: row.goals,
		assists: row.assists,
		own_goals: row.own_goals,
		wins: row.wins,
		losses: row.losses,
		draws: row.draws,
		matches: row.matches,
	}));
}

const UNASSIGNED_ATTENDANCE_TEAM_ORDER = Number.MAX_SAFE_INTEGER;

export type EventPlayerTeam = {
	team_id: number;
	color: string | null;
	sort_order: number;
	slot: number;
};

export function eventTeamByPlayerId(
	teams: readonly {
		id: number;
		color: string | null;
		sort_order: number;
		players: readonly { player_id: number }[];
	}[],
): ReadonlyMap<number, EventPlayerTeam> {
	return new Map(
		teams.flatMap((team) =>
			team.players.map(
				(player, slot) =>
					[
						player.player_id,
						{
							team_id: team.id,
							color: team.color,
							sort_order: team.sort_order,
							slot,
						},
					] as const,
			),
		),
	);
}

export function sortAttendanceByTeam<T extends { player_id: number }>(
	rows: readonly T[],
	teamByPlayerId: ReadonlyMap<number, EventPlayerTeam>,
): T[] {
	return [...rows].sort((left, right) => {
		const leftTeam = teamByPlayerId.get(left.player_id);
		const rightTeam = teamByPlayerId.get(right.player_id);
		const leftOrder = leftTeam?.sort_order ?? UNASSIGNED_ATTENDANCE_TEAM_ORDER;
		const rightOrder =
			rightTeam?.sort_order ?? UNASSIGNED_ATTENDANCE_TEAM_ORDER;
		if (leftOrder !== rightOrder) {
			return leftOrder - rightOrder;
		}

		return (leftTeam?.slot ?? 0) - (rightTeam?.slot ?? 0);
	});
}

export function filterAttendanceByTeam<T extends { player_id: number }>(
	rows: readonly T[],
	teamByPlayerId: ReadonlyMap<number, EventPlayerTeam>,
	filter: AttendanceStatsTeamFilter,
): T[] {
	if (filter === ATTENDANCE_STATS_TEAM_FILTER.all) {
		return [...rows];
	}

	if (filter === ATTENDANCE_STATS_TEAM_FILTER.none) {
		return rows.filter((row) => !teamByPlayerId.has(row.player_id));
	}

	return rows.filter(
		(row) => teamByPlayerId.get(row.player_id)?.team_id === filter,
	);
}

export function parseAttendanceStatInput(value: string): number | null {
	if (value === "") {
		return 0;
	}

	const n = Number(value);
	if (!isAttendanceStatCount(n)) {
		return null;
	}

	return n;
}

export function setAttendanceStat(
	rows: readonly EventAttendanceStatsDraft[],
	playerId: number,
	field: AttendanceStatField,
	value: number,
): EventAttendanceStatsDraft[] {
	return rows.map((row) => {
		if (row.player_id !== playerId) {
			return row;
		}

		return { ...row, [field]: value };
	});
}

function isAttendanceStatRow(row: EventAttendanceStatsDraft): boolean {
	if (!isAttendanceStatCount(row.goals)) {
		return false;
	}

	if (!isAttendanceStatCount(row.assists)) {
		return false;
	}

	if (!isAttendanceStatCount(row.own_goals)) {
		return false;
	}

	if (!isAttendanceStatCount(row.wins)) {
		return false;
	}

	if (!isAttendanceStatCount(row.losses)) {
		return false;
	}

	if (!isAttendanceStatCount(row.draws)) {
		return false;
	}

	if (!isAttendanceStatCount(row.matches)) {
		return false;
	}

	return attendanceResultError(row) === null;
}

export function playerEventStatsFromAttendance(
	row: {
		goals: number;
		assists: number;
		wins: number;
		losses: number;
		draws: number;
		matches: number;
	} | null,
): PlayerEventStatsDraft {
	return {
		goals: row?.goals ?? 0,
		assists: row?.assists ?? 0,
		wins: row?.wins ?? 0,
		losses: row?.losses ?? 0,
		draws: row?.draws ?? 0,
		matches: row?.matches ?? 0,
	};
}

export function setPlayerEventStat(
	draft: PlayerEventStatsDraft,
	field: PlayerEventStatField,
	value: number,
): PlayerEventStatsDraft {
	return { ...draft, [field]: value };
}

export function validatePlayerEventStats(
	draft: PlayerEventStatsDraft,
): string | null {
	if (!isAttendanceStatCount(draft.goals)) {
		return EVENT_ATTENDANCE_MESSAGE.invalidStats;
	}

	if (!isAttendanceStatCount(draft.assists)) {
		return EVENT_ATTENDANCE_MESSAGE.invalidStats;
	}

	if (!isAttendanceStatCount(draft.wins)) {
		return EVENT_ATTENDANCE_MESSAGE.invalidStats;
	}

	if (!isAttendanceStatCount(draft.losses)) {
		return EVENT_ATTENDANCE_MESSAGE.invalidStats;
	}

	if (!isAttendanceStatCount(draft.draws)) {
		return EVENT_ATTENDANCE_MESSAGE.invalidStats;
	}

	if (!isAttendanceStatCount(draft.matches)) {
		return EVENT_ATTENDANCE_MESSAGE.invalidStats;
	}

	return attendanceResultError(draft);
}

export function validateEventAttendanceStats(
	stats: readonly EventAttendanceStatsDraft[],
	presentIds: readonly number[],
): string | null {
	if (stats.length !== presentIds.length) {
		return EVENT_ATTENDANCE_MESSAGE.invalidStats;
	}

	const present = new Set(presentIds);
	const seen = new Set<number>();
	const invalid = stats.find((row) => {
		if (seen.has(row.player_id)) {
			return true;
		}

		if (!present.has(row.player_id)) {
			return true;
		}

		seen.add(row.player_id);
		return !isAttendanceStatRow(row);
	});

	if (invalid) {
		if (
			isAttendanceStatCount(invalid.wins) &&
			isAttendanceStatCount(invalid.losses) &&
			isAttendanceStatCount(invalid.draws) &&
			isAttendanceStatCount(invalid.matches)
		) {
			const resultError = attendanceResultError(invalid);
			if (resultError) {
				return resultError;
			}
		}

		return EVENT_ATTENDANCE_MESSAGE.invalidStats;
	}

	if (seen.size !== present.size) {
		return EVENT_ATTENDANCE_MESSAGE.invalidStats;
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

export function compareStartsAtOldestFirst(
	left: { starts_at: string; id: number },
	right: { starts_at: string; id: number },
): number {
	if (left.starts_at !== right.starts_at) {
		if (left.starts_at < right.starts_at) {
			return -1;
		}

		return 1;
	}

	return left.id - right.id;
}

export function compareStartsAtNewestFirst(
	left: { starts_at: string; id: number },
	right: { starts_at: string; id: number },
): number {
	if (left.starts_at !== right.starts_at) {
		if (left.starts_at < right.starts_at) {
			return 1;
		}

		return -1;
	}

	return right.id - left.id;
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

export function monthlyPlayerIds(
	players: readonly { id: number; is_monthly: boolean }[],
): number[] {
	return players.flatMap((player) => (player.is_monthly ? [player.id] : []));
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

export function keepGoalkeepersPresent(
	goalkeeperIds: readonly number[],
	presentIds: readonly number[],
): number[] {
	const present = new Set(presentIds);
	return [...new Set(goalkeeperIds)].filter((id) => present.has(id));
}

export function defaultGoalkeeperIds(
	players: readonly { id: number; is_goalkeeper: boolean }[],
): number[] {
	return players.flatMap((player) =>
		includeWhen(player.is_goalkeeper, player.id),
	);
}

export function eventGoalkeeperIds(
	defaultIds: readonly number[],
	attendanceIds: readonly number[],
): number[] {
	return [...new Set([...defaultIds, ...attendanceIds])];
}

export function setGoalkeeperSelection(
	currentIds: readonly number[],
	playerIds: readonly number[],
	asGoalkeeper: boolean,
): number[] {
	if (asGoalkeeper) {
		return [...new Set([...currentIds, ...playerIds])];
	}

	const visible = new Set(playerIds);
	return currentIds.filter((id) => !visible.has(id));
}

export function attendanceGoalkeeperIds(
	attendance: readonly { player_id: number; is_goalkeeper: boolean }[],
): number[] {
	return attendance.flatMap((row) =>
		includeWhen(row.is_goalkeeper, row.player_id),
	);
}

export function eventTeamPlayerOptionLabel(
	name: string,
	isGoalkeeperVolunteer: boolean,
): string {
	if (!isGoalkeeperVolunteer) {
		return name;
	}

	return `${name} · ${EVENT_TEAM_POSITION_LABEL.goalkeeper}`;
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

export function filterAttendanceListPlayers<T extends { id: number }>(
	players: readonly T[],
	presentIds: readonly number[],
	hideSelected: boolean,
): T[] {
	if (!hideSelected) {
		return [...players];
	}

	const present = new Set(presentIds);
	return players.filter((player) => !present.has(player.id));
}
