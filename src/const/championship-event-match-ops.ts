import type {
	ChampionshipEventGoal,
	ChampionshipEventMatch,
	ChampionshipEventMatchPlayer,
} from "../types/championship-event.ts";
import { EVENT_ERROR_MESSAGE } from "./championship-event.ts";
import { isMatchSlotGoalkeeper } from "./championship-event-match.ts";

export const MATCH_OP = {
	setPlayer: "setPlayer",
	setGoalkeeper: "setGoalkeeper",
	addGoal: "addGoal",
	undoGoal: "undoGoal",
} as const;

export type MatchOpKind = (typeof MATCH_OP)[keyof typeof MATCH_OP];

export type MatchOpDraft =
	| {
			kind: typeof MATCH_OP.setPlayer;
			teamId: number;
			slot: number;
			playerId: number | null;
			displayName: string;
			includeStats: boolean;
	  }
	| {
			kind: typeof MATCH_OP.setGoalkeeper;
			teamId: number;
			playerId: number;
	  }
	| {
			kind: typeof MATCH_OP.addGoal;
			scorerPlayerId: number;
			assistPlayerId: number | null;
			isOwnGoal: boolean;
			elapsedSeconds: number | null;
	  }
	| {
			kind: typeof MATCH_OP.undoGoal;
			goalId: number;
	  };

export type MatchOp = MatchOpDraft & {
	id: string;
	localId: number;
	createdAt: string;
};

export const MATCH_OPS_STORAGE_KEY = "babaDoMago-match-ops" as const;

export const MATCH_OPS_FLUSH_ERROR = {
	fallback: "Falha ao sincronizar a partida",
} as const;

export const MATCH_OPS_LABEL = {
	syncing: "Sincronizando ações da partida",
	queue: "Fila da partida",
	setPlayer: "Jogador",
	setGoalkeeper: "Goleiro",
	addGoal: "Gol",
	undoGoal: "Desfazer gol",
} as const;

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
		default: {
			const _exhaustive: never = op;
			return _exhaustive;
		}
	}
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

function playerInMatch(
	players: readonly ChampionshipEventMatchPlayer[],
	playerId: number,
): boolean {
	return players.some((player) => player.player_id === playerId);
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
