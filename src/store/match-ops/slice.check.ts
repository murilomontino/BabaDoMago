import {
	MATCH_OP,
	type MatchOp,
} from "../../const/championship-event-match-ops.ts";
import { matchIdRemapped, matchOpRequested } from "./actions.ts";
import {
	MATCH_OPS_INITIAL_STATE,
	matchOpsReducer,
	opDropped,
	opSettled,
} from "./slice.ts";

function check(actual: unknown, expected: unknown, message: string): void {
	if (actual !== expected) {
		throw new Error(`${message}: ${String(actual)} !== ${String(expected)}`);
	}
}

const nowMs = Date.parse("2026-08-20T12:00:00.000Z");

const addGoal = matchOpsReducer(
	MATCH_OPS_INITIAL_STATE,
	matchOpRequested({
		eventId: 1,
		draft: {
			kind: MATCH_OP.addGoal,
			matchId: 7,
			scorerPlayerId: 101,
			assistPlayerId: null,
			isOwnGoal: false,
			elapsedSeconds: 12,
		},
		nowMs,
	}),
);
check(addGoal.seq, 1, "seq increments");
check(addGoal.queues["1"]?.length, 1, "enqueues addGoal");
check(addGoal.queues["1"]?.[0]?.localId, -1, "localId is negative");
check(addGoal.queues["1"]?.[0]?.id, "1", "id follows seq");

const cancelled = matchOpsReducer(
	addGoal,
	matchOpRequested({
		eventId: 1,
		draft: {
			kind: MATCH_OP.undoGoal,
			matchId: 7,
			goalId: -1,
		},
		nowMs,
	}),
);
check(cancelled.queues["1"], undefined, "cancels local addGoal");
check(cancelled.seq, 1, "cancel does not bump seq");

const inFlight = matchOpsReducer(
	{
		...addGoal,
		inFlightId: "1",
	},
	matchOpRequested({
		eventId: 1,
		draft: {
			kind: MATCH_OP.undoGoal,
			matchId: 7,
			goalId: -1,
		},
		nowMs,
	}),
);
check(inFlight.queues["1"]?.length, 1, "in-flight undo is noop");

const dropped = matchOpsReducer(
	addGoal,
	opDropped({ eventId: 1, message: "Jogador não está na partida" }),
);
check(dropped.queues["1"], undefined, "drop clears empty queue");
check(dropped.error, "Jogador não está na partida", "drop keeps message");

const settled = matchOpsReducer(addGoal, opSettled(1));
check(settled.queues["1"], undefined, "settled clears key");
check(settled.error, null, "settled clears error");
check(settled.inFlightId, null, "settled clears in-flight");

const second = matchOpsReducer(
	addGoal,
	matchOpRequested({
		eventId: 1,
		draft: {
			kind: MATCH_OP.setGoalkeeper,
			matchId: 7,
			teamId: 10,
			playerId: 101,
		},
		nowMs,
	}),
);
check(second.seq, 2, "second op bumps seq");
check(second.queues["1"]?.length, 2, "keeps both ops");
check(second.queues["1"]?.[1]?.localId, -2, "second localId");

const started = matchOpsReducer(
	MATCH_OPS_INITIAL_STATE,
	matchOpRequested({
		eventId: 1,
		draft: {
			kind: MATCH_OP.startMatch,
			eventId: 1,
			teamAId: 10,
			teamBId: 20,
			durationSeconds: 420,
		},
		nowMs,
	}),
);
check(
	started.queues["1"]?.[0]?.localId,
	-1,
	"startMatch uses localId as match id",
);
check(started.queues["1"]?.[0]?.kind, MATCH_OP.startMatch, "startMatch kind");

const withGoal = matchOpsReducer(
	started,
	matchOpRequested({
		eventId: 1,
		draft: {
			kind: MATCH_OP.addGoal,
			matchId: -1,
			scorerPlayerId: 101,
			assistPlayerId: null,
			isOwnGoal: false,
			elapsedSeconds: 8,
		},
		nowMs,
	}),
);
const remapped = matchOpsReducer(
	withGoal,
	matchIdRemapped({
		eventId: 1,
		localMatchId: -1,
		serverMatchId: 42,
	}),
);
check(remapped.localMatchMap["-1"], 42, "stores local to server map");
check(
	remapped.queues["1"]?.[0]?.kind,
	MATCH_OP.startMatch,
	"keeps start in front",
);
function remappedGoalMatchId(op: MatchOp | undefined): number | null {
	if (!op) {
		return null;
	}

	if (!("matchId" in op)) {
		return null;
	}

	return op.matchId;
}

check(
	remappedGoalMatchId(remapped.queues["1"]?.[1]),
	42,
	"rewrites following matchId",
);

console.log("match-ops slice ok");
