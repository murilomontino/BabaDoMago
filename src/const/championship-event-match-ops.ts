import type {
	ChampionshipEvent,
	ChampionshipEventAttendance,
	ChampionshipEventGoal,
	ChampionshipEventMatch,
	ChampionshipEventMatchPlayer,
	ChampionshipEventTeam,
	ChampionshipEventTeamPlayer,
} from "../types/championship-event.ts";
import {
	EVENT_ERROR_MESSAGE,
	eventTeamsSharePlayers,
} from "./championship-event.ts";
import {
	isMatchSlotGoalkeeper,
	matchScore,
	matchWinnerTeamId,
	openEventMatch,
} from "./championship-event-match.ts";
import type { EventTeamColor } from "./event-team-color.ts";

export const MATCH_OP = {
	setPlayer: "setPlayer",
	setGoalkeeper: "setGoalkeeper",
	addGoal: "addGoal",
	undoGoal: "undoGoal",
	startMatch: "startMatch",
	updateTeam: "updateTeam",
	swapTeam: "swapTeam",
	endMatch: "endMatch",
	discardMatch: "discardMatch",
	saveAttendance: "saveAttendance",
	endEvent: "endEvent",
} as const;

export type MatchOpKind = (typeof MATCH_OP)[keyof typeof MATCH_OP];

export type MatchOpTeamMember = {
	playerId: number;
	displayName: string;
	isGoalkeeper: boolean;
};

export type MatchOpDraft =
	| {
			kind: typeof MATCH_OP.setPlayer;
			matchId: number;
			teamId: number;
			slot: number;
			playerId: number | null;
			displayName: string;
			includeStats: boolean;
	  }
	| {
			kind: typeof MATCH_OP.setGoalkeeper;
			matchId: number;
			teamId: number;
			playerId: number;
	  }
	| {
			kind: typeof MATCH_OP.addGoal;
			matchId: number;
			scorerPlayerId: number;
			assistPlayerId: number | null;
			isOwnGoal: boolean;
			elapsedSeconds: number | null;
	  }
	| {
			kind: typeof MATCH_OP.undoGoal;
			matchId: number;
			goalId: number;
	  }
	| {
			kind: typeof MATCH_OP.startMatch;
			eventId: number;
			teamAId: number;
			teamBId: number;
			durationSeconds: number;
	  }
	| {
			kind: typeof MATCH_OP.updateTeam;
			teamId: number;
			color: EventTeamColor | null;
			playerIds: number[];
			goalkeeperId: number;
			members: MatchOpTeamMember[];
	  }
	| {
			kind: typeof MATCH_OP.swapTeam;
			matchId: number;
			outgoingTeamId: number;
			incomingTeamId: number;
	  }
	| {
			kind: typeof MATCH_OP.endMatch;
			matchId: number;
	  }
	| {
			kind: typeof MATCH_OP.discardMatch;
			matchId: number;
	  }
	| {
			kind: typeof MATCH_OP.saveAttendance;
			eventId: number;
			presentPlayerIds: number[];
			goalkeeperPlayerIds: number[];
	  }
	| {
			kind: typeof MATCH_OP.endEvent;
			eventId: number;
			presentPlayerIds: number[] | null;
			mvpPlayerIds: number[] | null;
	  };

export type MatchOp = MatchOpDraft & {
	id: string;
	localId: number;
	createdAt: string;
};

export const MATCH_OPS_STORAGE_KEY = "babaDoMago-match-ops-event" as const;

export const MATCH_OPS_FLUSH_ERROR = {
	fallback: "Falha ao sincronizar a partida",
} as const;

export const MATCH_OPS_LABEL = {
	syncing: "Sincronizando ações da partida",
	pendingOffline: "Sem internet, salvo no aparelho",
	queue: "Fila da partida",
	setPlayer: "Jogador",
	setGoalkeeper: "Goleiro",
	addGoal: "Gol",
	undoGoal: "Desfazer gol",
	startMatch: "Abrir partida",
	updateTeam: "Editar time",
	swapTeam: "Trocar time",
	endMatch: "Encerrar",
	discardMatch: "Descartar",
	saveAttendance: "Presença",
	endEvent: "Encerrar rodada",
	ratingPreview: "Prévia da nota",
} as const;

export function matchOpCopiedIds(
	ids: readonly number[] | null | undefined,
): number[] | null {
	if (ids == null) {
		return null;
	}

	return [...ids];
}

export function matchOpsQueueBannerLabel(online: boolean): string {
	if (online) {
		return MATCH_OPS_LABEL.syncing;
	}

	return MATCH_OPS_LABEL.pendingOffline;
}

export const MATCH_OPS_SYNCING_CLASS =
	"pointer-events-none absolute inset-x-0 top-2 z-10 flex justify-center text-fg-muted";

const FATAL_MATCH_OP_MESSAGES = new Set<string>(
	Object.values(EVENT_ERROR_MESSAGE),
);

type MatchOpsTarget = Pick<
	ChampionshipEventMatch,
	"id" | "event_id" | "players" | "goals"
>;

export function buildMatchOp(
	draft: MatchOpDraft,
	seq: number,
	nowMs: number,
): MatchOp {
	return {
		...draft,
		id: String(seq),
		localId: -seq,
		createdAt: new Date(nowMs).toISOString(),
	};
}

export function isFatalMatchOpMessage(message: string): boolean {
	return FATAL_MATCH_OP_MESSAGES.has(message);
}

export function matchOpDebugLabel(op: MatchOp, index: number): string {
	return `${index + 1}. ${MATCH_OPS_LABEL[op.kind]} (${op.kind})`;
}

export function pendingLocalGoalOpId(
	ops: readonly MatchOp[],
	goalId: number,
): string | null {
	const pending = ops.find((op) => {
		if (op.kind !== MATCH_OP.addGoal) {
			return false;
		}

		return op.localId === goalId;
	});
	if (!pending) {
		return null;
	}

	return pending.id;
}

export function remapOpMatchId(
	op: MatchOp,
	localMatchId: number,
	serverMatchId: number,
): MatchOp {
	if (!("matchId" in op)) {
		return op;
	}

	if (op.matchId !== localMatchId) {
		return op;
	}

	return {
		...op,
		matchId: serverMatchId,
	};
}

export function applyMatchOps<T extends MatchOpsTarget>(
	match: T | null,
	ops: readonly MatchOp[],
): T | null {
	if (!match) {
		return match;
	}

	if (ops.length === 0) {
		return match;
	}

	return ops.reduce((current, op) => applyMatchOp(current, op), match);
}

export function applyPlayOps(
	event: ChampionshipEvent,
	ops: readonly MatchOp[],
): ChampionshipEvent {
	if (ops.length === 0) {
		return event;
	}

	return ops.reduce(applyPlayOp, event);
}

export function applyMatchOp<T extends MatchOpsTarget>(
	match: T,
	op: MatchOp,
): T {
	switch (op.kind) {
		case MATCH_OP.setPlayer:
			return applySetPlayer(match, op);
		case MATCH_OP.setGoalkeeper:
			return applySetGoalkeeper(match, op);
		case MATCH_OP.addGoal:
			return applyAddGoal(match, op);
		case MATCH_OP.undoGoal:
			return applyUndoGoal(match, op);
		case MATCH_OP.startMatch:
		case MATCH_OP.updateTeam:
		case MATCH_OP.swapTeam:
		case MATCH_OP.endMatch:
		case MATCH_OP.discardMatch:
		case MATCH_OP.saveAttendance:
		case MATCH_OP.endEvent:
			return match;
		default: {
			const _exhaustive: never = op;
			return _exhaustive;
		}
	}
}

function applyPlayOp(event: ChampionshipEvent, op: MatchOp): ChampionshipEvent {
	switch (op.kind) {
		case MATCH_OP.updateTeam:
			return applyUpdateTeam(event, op);
		case MATCH_OP.startMatch:
			return applyStartMatch(event, op);
		case MATCH_OP.swapTeam:
			return applySwapTeam(event, op);
		case MATCH_OP.endMatch:
			return applyEndMatch(event, op);
		case MATCH_OP.discardMatch:
			return applyDiscardMatch(event, op);
		case MATCH_OP.saveAttendance:
			return applySaveAttendance(event, op);
		case MATCH_OP.endEvent:
			return applyEndEvent(event, op);
		case MATCH_OP.setPlayer:
		case MATCH_OP.setGoalkeeper:
		case MATCH_OP.addGoal:
		case MATCH_OP.undoGoal:
			return applyQueuedMatchOp(event, op);
		default: {
			const _exhaustive: never = op;
			return _exhaustive;
		}
	}
}

function applyQueuedMatchOp(
	event: ChampionshipEvent,
	op: Extract<
		MatchOp,
		{
			kind:
				| typeof MATCH_OP.setPlayer
				| typeof MATCH_OP.setGoalkeeper
				| typeof MATCH_OP.addGoal
				| typeof MATCH_OP.undoGoal;
		}
	>,
): ChampionshipEvent {
	const match = findMatchForPlayOp(event.matches, op.matchId);
	if (!match) {
		return event;
	}

	const next = applyMatchOp(match, op);
	if (next === match) {
		return event;
	}

	return {
		...event,
		matches: event.matches.map((row) => {
			if (row.id !== match.id) {
				return row;
			}

			return next;
		}),
	};
}

function applyUpdateTeam(
	event: ChampionshipEvent,
	op: Extract<MatchOp, { kind: typeof MATCH_OP.updateTeam }>,
): ChampionshipEvent {
	const exists = event.teams.some((team) => team.id === op.teamId);
	if (!exists) {
		return event;
	}

	return {
		...event,
		teams: event.teams.map((team) => overlayUpdatedTeam(team, event.id, op)),
	};
}

function overlayUpdatedTeam(
	team: ChampionshipEventTeam,
	eventId: number,
	op: Extract<MatchOp, { kind: typeof MATCH_OP.updateTeam }>,
): ChampionshipEventTeam {
	if (team.id !== op.teamId) {
		return team;
	}

	return {
		...team,
		color: op.color,
		template_player_ids: op.playerIds,
		template_goalkeeper_id: op.goalkeeperId,
		players: op.members.map((member, index) =>
			overlayTeamPlayer(eventId, op.teamId, op.localId, member, index),
		),
	};
}

function overlayTeamPlayer(
	eventId: number,
	teamId: number,
	localId: number,
	member: MatchOpTeamMember,
	index: number,
): ChampionshipEventTeamPlayer {
	return {
		id: localId * 100 - index,
		event_id: eventId,
		team_id: teamId,
		player_id: member.playerId,
		display_name: member.displayName,
		is_goalkeeper: member.isGoalkeeper,
	};
}

function applyStartMatch(
	event: ChampionshipEvent,
	op: Extract<MatchOp, { kind: typeof MATCH_OP.startMatch }>,
): ChampionshipEvent {
	if (event.ended_at !== null) {
		return event;
	}

	if (openEventMatch(event.matches)) {
		return event;
	}

	if (op.teamAId === op.teamBId) {
		return event;
	}

	const teamA = event.teams.find((team) => team.id === op.teamAId);
	const teamB = event.teams.find((team) => team.id === op.teamBId);
	if (!teamA || !teamB) {
		return event;
	}

	if (eventTeamsSharePlayers(teamA.players, teamB.players)) {
		return event;
	}

	const teamAPlayers = matchPlayersFromTeam(
		teamA,
		op.localId,
		event.id,
		op.localId * 100,
	);
	const teamBPlayers = matchPlayersFromTeam(
		teamB,
		op.localId,
		event.id,
		op.localId * 100 - teamAPlayers.length,
	);

	const match: ChampionshipEventMatch = {
		id: op.localId,
		event_id: event.id,
		team_a_id: op.teamAId,
		team_b_id: op.teamBId,
		created_at: op.createdAt,
		ended_at: null,
		winner_team_id: null,
		duration_seconds: op.durationSeconds,
		started_at: null,
		paused_at: null,
		pause_accumulated_seconds: 0,
		players: [...teamAPlayers, ...teamBPlayers],
		goals: [],
	};

	return {
		...event,
		matches: [...event.matches, match],
	};
}

function applySwapTeam(
	event: ChampionshipEvent,
	op: Extract<MatchOp, { kind: typeof MATCH_OP.swapTeam }>,
): ChampionshipEvent {
	const match = findMatchForPlayOp(event.matches, op.matchId);
	if (!match) {
		return event;
	}

	if (match.ended_at !== null) {
		return event;
	}

	if (op.outgoingTeamId === op.incomingTeamId) {
		return event;
	}

	const stayingTeamId = stayingMatchTeamId(
		match.team_a_id,
		match.team_b_id,
		op.outgoingTeamId,
	);
	if (stayingTeamId === null) {
		return event;
	}

	if (op.incomingTeamId === stayingTeamId) {
		return event;
	}

	const incoming = event.teams.find((team) => team.id === op.incomingTeamId);
	if (!incoming) {
		return event;
	}

	const stayingTeam = event.teams.find((team) => team.id === stayingTeamId);
	if (!stayingTeam) {
		return event;
	}

	if (eventTeamsSharePlayers(incoming.players, stayingTeam.players)) {
		return event;
	}

	const stayingPlayers = match.players.filter(
		(player) => player.team_id === stayingTeamId,
	);
	if (eventTeamsSharePlayers(stayingPlayers, incoming.players)) {
		return event;
	}

	const incomingPlayers = matchPlayersFromTeam(
		incoming,
		match.id,
		event.id,
		op.localId * 100,
	);
	const nextTeamIds = swappedMatchTeamIds(
		match.team_a_id,
		match.team_b_id,
		op.outgoingTeamId,
		op.incomingTeamId,
	);

	const next: ChampionshipEventMatch = {
		...match,
		team_a_id: nextTeamIds.teamAId,
		team_b_id: nextTeamIds.teamBId,
		goals: [],
		players: [...stayingPlayers, ...incomingPlayers],
	};

	return {
		...event,
		matches: event.matches.map((row) => {
			if (row.id !== match.id) {
				return row;
			}

			return next;
		}),
	};
}

function applyEndMatch(
	event: ChampionshipEvent,
	op: Extract<MatchOp, { kind: typeof MATCH_OP.endMatch }>,
): ChampionshipEvent {
	const match = findMatchForPlayOp(event.matches, op.matchId);
	if (!match) {
		return event;
	}

	if (match.ended_at !== null) {
		return event;
	}

	const teamAIds = new Set(
		match.players
			.filter((player) => player.team_id === match.team_a_id)
			.map((player) => player.player_id),
	);
	const score = matchScore(match.goals, teamAIds);
	const next: ChampionshipEventMatch = {
		...match,
		ended_at: op.createdAt,
		winner_team_id: matchWinnerTeamId(
			match.team_a_id,
			match.team_b_id,
			score.teamA,
			score.teamB,
		),
	};

	return {
		...event,
		matches: event.matches.map((row) => {
			if (row.id !== match.id) {
				return row;
			}

			return next;
		}),
	};
}

function applyDiscardMatch(
	event: ChampionshipEvent,
	op: Extract<MatchOp, { kind: typeof MATCH_OP.discardMatch }>,
): ChampionshipEvent {
	const match = findMatchForPlayOp(event.matches, op.matchId);
	if (!match) {
		return event;
	}

	return {
		...event,
		matches: event.matches.filter((row) => row.id !== match.id),
	};
}

function overlayAttendanceRow(
	event: ChampionshipEvent,
	playerId: number,
	isGoalkeeper: boolean,
): ChampionshipEventAttendance {
	const current = event.attendance.find((row) => row.player_id === playerId);
	if (current) {
		return {
			...current,
			is_goalkeeper: isGoalkeeper,
		};
	}

	return {
		id: -playerId,
		event_id: event.id,
		player_id: playerId,
		display_name: "",
		is_goalkeeper: isGoalkeeper,
		event_date: event.starts_at,
		goals: 0,
		assists: 0,
		assisted_goals: 0,
		own_goals: 0,
		wins: 0,
		losses: 0,
		draws: 0,
		matches: 0,
		rating: 0,
		rating_delta: 0,
		is_mvp: false,
		mvp_overridden: false,
	};
}

function applySaveAttendance(
	event: ChampionshipEvent,
	op: Extract<MatchOp, { kind: typeof MATCH_OP.saveAttendance }>,
): ChampionshipEvent {
	const goalkeepers = new Set(op.goalkeeperPlayerIds);
	return {
		...event,
		attendance: op.presentPlayerIds.map((playerId) =>
			overlayAttendanceRow(event, playerId, goalkeepers.has(playerId)),
		),
	};
}

function applyEndEvent(
	event: ChampionshipEvent,
	op: Extract<MatchOp, { kind: typeof MATCH_OP.endEvent }>,
): ChampionshipEvent {
	return {
		...event,
		ended_at: event.ended_at ?? op.createdAt,
	};
}

function findMatchForPlayOp(
	matches: readonly ChampionshipEventMatch[],
	matchId: number,
): ChampionshipEventMatch | undefined {
	const exact = matches.find((match) => match.id === matchId);
	if (exact) {
		return exact;
	}

	if (matchId < 0) {
		return undefined;
	}

	return openEventMatch(matches) ?? undefined;
}

function stayingMatchTeamId(
	teamAId: number,
	teamBId: number,
	outgoingTeamId: number,
): number | null {
	if (teamAId === outgoingTeamId) {
		return teamBId;
	}

	if (teamBId === outgoingTeamId) {
		return teamAId;
	}

	return null;
}

function swappedMatchTeamIds(
	teamAId: number,
	teamBId: number,
	outgoingTeamId: number,
	incomingTeamId: number,
): { teamAId: number; teamBId: number } {
	if (teamAId === outgoingTeamId) {
		return {
			teamAId: incomingTeamId,
			teamBId,
		};
	}

	return {
		teamAId,
		teamBId: incomingTeamId,
	};
}

function matchPlayersFromTeam(
	team: ChampionshipEventTeam,
	matchId: number,
	eventId: number,
	idSeed: number,
): ChampionshipEventMatchPlayer[] {
	let fieldIndex = 0;
	return team.players.map((player, index) => {
		const slot = matchSlotForTeamPlayer(player.is_goalkeeper, fieldIndex);
		if (!player.is_goalkeeper) {
			fieldIndex += 1;
		}

		return {
			id: idSeed - index,
			match_id: matchId,
			event_id: eventId,
			team_id: team.id,
			player_id: player.player_id,
			display_name: player.display_name,
			is_goalkeeper: player.is_goalkeeper,
			slot,
			is_substituted: false,
			include_stats: true,
		};
	});
}

function matchSlotForTeamPlayer(
	isGoalkeeper: boolean,
	fieldIndex: number,
): number {
	if (isGoalkeeper) {
		return 0;
	}

	return fieldIndex + 1;
}

function applySetPlayer<T extends MatchOpsTarget>(
	match: T,
	op: Extract<MatchOp, { kind: typeof MATCH_OP.setPlayer }>,
): T {
	const outgoing = activeSlotPlayer(match.players, op.teamId, op.slot);
	if (op.playerId === null) {
		return removeSlotPlayer(match, outgoing);
	}

	if (outgoing && outgoing.player_id === op.playerId) {
		return match;
	}

	if (playerInMatch(match.players, op.playerId)) {
		return match;
	}

	const remaining = substitutedOutgoing(
		match.players,
		outgoing,
		op.includeStats,
	);
	const existing = substitutedMatchPlayer(remaining, op.playerId);
	if (existing) {
		return {
			...match,
			players: remaining.map((player) =>
				reactivatedMatchPlayer(player, existing.id, op),
			),
		};
	}

	const incoming: ChampionshipEventMatchPlayer = {
		id: op.localId,
		match_id: match.id,
		event_id: match.event_id,
		team_id: op.teamId,
		player_id: op.playerId,
		display_name: op.displayName,
		is_goalkeeper: isMatchSlotGoalkeeper(op.slot),
		slot: op.slot,
		is_substituted: false,
		include_stats: true,
	};

	return {
		...match,
		players: [...remaining, incoming],
	};
}

function applySetGoalkeeper<T extends MatchOpsTarget>(
	match: T,
	op: Extract<MatchOp, { kind: typeof MATCH_OP.setGoalkeeper }>,
): T {
	const promoted = activeTeamPlayer(match.players, op.teamId, op.playerId);
	if (!promoted) {
		return match;
	}

	if (promoted.slot === 0) {
		return match;
	}

	const keeper = activeSlotPlayer(match.players, op.teamId, 0);
	if (!keeper) {
		return {
			...match,
			players: match.players.map((player) =>
				promotedGoalkeeper(player, promoted.id),
			),
		};
	}

	return {
		...match,
		players: match.players.map((player) =>
			swappedGoalkeeper(player, promoted, keeper),
		),
	};
}

function applyAddGoal<T extends MatchOpsTarget>(
	match: T,
	op: Extract<MatchOp, { kind: typeof MATCH_OP.addGoal }>,
): T {
	const assistPlayerId = ownGoalAssistPlayerId(op.isOwnGoal, op.assistPlayerId);
	const goal: ChampionshipEventGoal = {
		id: op.localId,
		match_id: match.id,
		event_id: match.event_id,
		scorer_player_id: op.scorerPlayerId,
		assist_player_id: assistPlayerId,
		is_own_goal: op.isOwnGoal,
		elapsed_seconds: op.elapsedSeconds,
		created_at: op.createdAt,
	};

	return {
		...match,
		goals: [...match.goals, goal],
	};
}

function applyUndoGoal<T extends MatchOpsTarget>(
	match: T,
	op: Extract<MatchOp, { kind: typeof MATCH_OP.undoGoal }>,
): T {
	const nextGoals = match.goals.filter((goal) => goal.id !== op.goalId);
	if (nextGoals.length === match.goals.length) {
		return match;
	}

	return {
		...match,
		goals: nextGoals,
	};
}

function removeSlotPlayer<T extends MatchOpsTarget>(
	match: T,
	outgoing: ChampionshipEventMatchPlayer | undefined,
): T {
	if (!outgoing) {
		return match;
	}

	if (playerHasMatchGoal(match.goals, outgoing.player_id)) {
		return match;
	}

	return {
		...match,
		players: match.players.filter((player) => player.id !== outgoing.id),
	};
}

function substitutedOutgoing(
	players: readonly ChampionshipEventMatchPlayer[],
	outgoing: ChampionshipEventMatchPlayer | undefined,
	includeStats: boolean,
): ChampionshipEventMatchPlayer[] {
	if (!outgoing) {
		return [...players];
	}

	return players.map((player) => {
		if (player.id !== outgoing.id) {
			return player;
		}

		return {
			...player,
			is_substituted: true,
			include_stats: includeStats,
			is_goalkeeper: false,
			slot: null,
		};
	});
}

function promotedGoalkeeper(
	player: ChampionshipEventMatchPlayer,
	promotedId: number,
): ChampionshipEventMatchPlayer {
	if (player.id !== promotedId) {
		return player;
	}

	return {
		...player,
		slot: 0,
		is_goalkeeper: true,
	};
}

function swappedGoalkeeper(
	player: ChampionshipEventMatchPlayer,
	promoted: ChampionshipEventMatchPlayer,
	keeper: ChampionshipEventMatchPlayer,
): ChampionshipEventMatchPlayer {
	if (player.id === promoted.id) {
		return {
			...player,
			slot: 0,
			is_goalkeeper: true,
		};
	}

	if (player.id === keeper.id) {
		return {
			...player,
			slot: promoted.slot,
			is_goalkeeper: false,
		};
	}

	return player;
}

function ownGoalAssistPlayerId(
	isOwnGoal: boolean,
	assistPlayerId: number | null,
): number | null {
	if (isOwnGoal) {
		return null;
	}

	return assistPlayerId;
}

function activeSlotPlayer(
	players: readonly ChampionshipEventMatchPlayer[],
	teamId: number,
	slot: number,
): ChampionshipEventMatchPlayer | undefined {
	return players.find((player) => {
		if (player.team_id !== teamId) {
			return false;
		}

		if (player.slot !== slot) {
			return false;
		}

		return !player.is_substituted;
	});
}

function activeTeamPlayer(
	players: readonly ChampionshipEventMatchPlayer[],
	teamId: number,
	playerId: number,
): ChampionshipEventMatchPlayer | undefined {
	return players.find((player) => {
		if (player.team_id !== teamId) {
			return false;
		}

		if (player.player_id !== playerId) {
			return false;
		}

		return !player.is_substituted;
	});
}

function substitutedMatchPlayer(
	players: readonly ChampionshipEventMatchPlayer[],
	playerId: number,
): ChampionshipEventMatchPlayer | undefined {
	return players.find((player) => {
		if (player.player_id !== playerId) {
			return false;
		}

		return player.is_substituted;
	});
}

function incomingMatchDisplayName(
	incomingName: string,
	existingName: string,
): string {
	const trimmed = incomingName.trim();
	if (trimmed.length > 0) {
		return trimmed;
	}

	return existingName;
}

function reactivatedMatchPlayer(
	player: ChampionshipEventMatchPlayer,
	existingId: number,
	op: Extract<MatchOp, { kind: typeof MATCH_OP.setPlayer }>,
): ChampionshipEventMatchPlayer {
	if (player.id !== existingId) {
		return player;
	}

	return {
		...player,
		team_id: op.teamId,
		slot: op.slot,
		is_substituted: false,
		is_goalkeeper: isMatchSlotGoalkeeper(op.slot),
		display_name: incomingMatchDisplayName(op.displayName, player.display_name),
	};
}

function playerInMatch(
	players: readonly ChampionshipEventMatchPlayer[],
	playerId: number,
): boolean {
	return players.some((player) => {
		if (player.player_id !== playerId) {
			return false;
		}

		return !player.is_substituted;
	});
}

function playerHasMatchGoal(
	goals: readonly ChampionshipEventGoal[],
	playerId: number,
): boolean {
	return goals.some((goal) => {
		if (goal.scorer_player_id === playerId) {
			return true;
		}

		return goal.assist_player_id === playerId;
	});
}
