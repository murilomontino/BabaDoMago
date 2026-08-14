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
	"team has matches": "Time já tem partidas",
	"match already open": "Já tem partida em andamento",
	"match already ended": "Partida já encerrada",
	"match not found": "Partida não encontrada",
	"player already in match": "Jogador já está na partida",
	"player has goals": "Jogador já tem gol nesta partida",
	"invalid slot": "Vaga inválida",
	"team not in match": "Time não está na partida",
	"player not in match": "Jogador não está na partida",
	"assist not in team": "Assistência de outro time",
	"invalid attendance stats": "Números inválidos",
	"wins exceed matches": "Vitórias acima dos jogos",
	"invalid rating": "Nota inválida",
	"event still open": "Evento ainda aberto",
} as const;

export const EVENT_ACTION = {
	create: "Criar evento",
	saveTeams: "Salvar times",
	editTeams: "Editar times",
	newEvent: "Novo evento",
	addAttendance: "Adicionar presença",
	addMatch: "Adicionar partida",
	startMatch: "Iniciar partida",
	continueMatch: "Continuar partida",
	nextMatch: "Próxima partida",
	endMatch: "Encerrar",
	copyMatchLink: "Copiar link",
	markGoal: "Marcar gol",
	swapPlayer: "Trocar",
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
	endEvent: "Encerrar",
} as const;

export const EVENT_END_LABEL = {
	title: "Encerrar evento",
	hint: "O evento fica marcado como encerrado. Ainda dá para adicionar partidas depois.",
	confirm: "Encerrar",
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
	needAttendance: "Marque a presença primeiro",
	drawing: "Buscando melhor cenário...",
	drawFailed: "Não foi possível sortear os times",
	drawReplaceTitle: "Sortear times de novo?",
	drawReplaceHint: "Os times atuais serão substituídos.",
	drawReplaceCancel: "Cancelar",
} as const;

export const EVENT_ATTENDANCE_MESSAGE = {
	minPresent: "Marque pelo menos dois presentes",
	notInRoster: "Jogador fora do elenco",
	duplicate: "Jogador repetido na presença",
	invalidStats: "Números inválidos",
	winsExceedMatches: "Vitórias acima dos jogos",
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
	ownGoals: "ownGoals",
	wins: "wins",
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
	ownGoals: "Gols contra",
	wins: "Vitórias",
	matches: "Jogos",
} as const;

export const EVENT_ATTENDANCE_STAT_ABBR = {
	goals: "G",
	assists: "A",
	ownGoals: "GC",
	wins: "V",
	matches: "J",
} as const;

export const ATTENDANCE_STAT = {
	goals: "goals",
	assists: "assists",
	ownGoals: "own_goals",
	wins: "wins",
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
	matches: number;
};

export const PLAYER_EVENT_STATS_LABEL = {
	title: "Stats do evento",
	event: "Evento",
	emptyEvents: "Nenhum evento encerrado",
	ratingHint:
		"O rate só muda neste jogador se ainda não tinha sido aplicado neste evento.",
} as const;

export type EventAttendanceStatsDraft = {
	player_id: number;
	goals: number;
	assists: number;
	own_goals: number;
	wins: number;
	matches: number;
};

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
	const known = Object.entries(EVENT_ERROR_MESSAGE)
		.filter(([code]) => message.includes(code))
		.sort((left, right) => right[0].length - left[0].length)[0];

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

export function eventTeamRatingAverage(ratings: readonly number[]): number {
	if (ratings.length === 0) {
		return 0;
	}

	return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
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

function eventTeamCapacities(playerCount: number, teamCount: number): number[] {
	const minimum = Math.floor(playerCount / teamCount);
	const largerTeams = playerCount % teamCount;
	return Array.from(
		{ length: teamCount },
		(_, index) => minimum + (index < largerTeams ? 1 : 0),
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

export function drawBalancedEventTeams(
	players: readonly { id: number; rating: number }[],
	playersPerTeam: number,
	random: () => number = Math.random,
	volunteerIds: readonly number[] = [],
): EventTeamDraft[] {
	const teamCount = eventTeamCount(players.length, playersPerTeam);
	const capacities = eventTeamCapacities(players.length, teamCount);
	const ordered = players
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

	return Array.from({ length: count }, (_, index) => ({
		key: `team-${index}`,
		color: EVENT_TEAM_COLOR_NONE,
		slots: emptyTeamSlots(playersPerTeam),
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
	}));

	return [...kept, ...extra];
}

export function builderTeamsFromEvent(
	teams: readonly {
		id: number;
		color: EventTeamColor | null;
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
	teams: readonly { players: readonly { player_id: number }[] }[],
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

export function teamSlotsToPlayerIds(slots: readonly string[]): number[] {
	return slots.filter(Boolean).map(Number);
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
	const players = new Set<number>();

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

		if (team.playerIds.some((playerId) => players.has(playerId))) {
			return EVENT_TEAM_MESSAGE.playerDuplicate;
		}

		if (
			team.goalkeeperId !== 0 &&
			!team.playerIds.includes(team.goalkeeperId)
		) {
			return EVENT_TEAM_MESSAGE.goalkeeperMissing;
		}

		for (const playerId of team.playerIds) {
			players.add(playerId);
		}
	}

	return null;
}

export function validateEventTeam(
	team: EventTeamDraft,
	playersPerTeam: number,
	usedColors: readonly EventTeamColor[],
	takenPlayerIds: readonly number[],
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

	const taken = new Set(takenPlayerIds);
	if (team.playerIds.some((playerId) => taken.has(playerId))) {
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

export function attendanceStatsFromRows(
	rows: readonly EventAttendanceStatsDraft[],
): EventAttendanceStatsDraft[] {
	return rows.map((row) => ({
		player_id: row.player_id,
		goals: row.goals,
		assists: row.assists,
		own_goals: row.own_goals,
		wins: row.wins,
		matches: row.matches,
	}));
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

	if (!isAttendanceStatCount(row.matches)) {
		return false;
	}

	return row.wins <= row.matches;
}

export function playerEventStatsFromAttendance(
	row: {
		goals: number;
		assists: number;
		wins: number;
		matches: number;
	} | null,
): PlayerEventStatsDraft {
	return {
		goals: row?.goals ?? 0,
		assists: row?.assists ?? 0,
		wins: row?.wins ?? 0,
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

	if (!isAttendanceStatCount(draft.matches)) {
		return EVENT_ATTENDANCE_MESSAGE.invalidStats;
	}

	if (draft.wins > draft.matches) {
		return EVENT_ATTENDANCE_MESSAGE.winsExceedMatches;
	}

	return null;
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
			isAttendanceStatCount(invalid.matches) &&
			invalid.wins > invalid.matches
		) {
			return EVENT_ATTENDANCE_MESSAGE.winsExceedMatches;
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

export function keepGoalkeepersPresent(
	goalkeeperIds: readonly number[],
	presentIds: readonly number[],
): number[] {
	const present = new Set(presentIds);
	return [...new Set(goalkeeperIds)].filter((id) => present.has(id));
}

export function attendanceGoalkeeperIds(
	attendance: readonly { player_id: number; is_goalkeeper: boolean }[],
): number[] {
	return attendance.flatMap((row) =>
		row.is_goalkeeper ? [row.player_id] : [],
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
