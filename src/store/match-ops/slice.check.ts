import { MATCH_OP } from "../../const/championship-event-match-ops.ts";
import { matchOpRequested } from "./actions.ts";
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
		matchId: 7,
		draft: {
			kind: MATCH_OP.addGoal,
			scorerPlayerId: 101,
			assistPlayerId: null,
			isOwnGoal: false,
			elapsedSeconds: 12,
		},
		nowMs,
	}),
);
check(addGoal.seq, 1, "seq increments");
check(addGoal.queues["7"]?.length, 1, "enqueues addGoal");
check(addGoal.queues["7"]?.[0]?.localId, -1, "localId is negative");
check(addGoal.queues["7"]?.[0]?.id, "1", "id follows seq");

const cancelled = matchOpsReducer(
	addGoal,
	matchOpRequested({
		matchId: 7,
		draft: {
			kind: MATCH_OP.undoGoal,
			goalId: -1,
		},
		nowMs,
	}),
);
check(cancelled.queues["7"], undefined, "cancels local addGoal");
check(cancelled.seq, 1, "cancel does not bump seq");

const inFlight = matchOpsReducer(
	{
		...addGoal,
		inFlightId: "1",
	},
	matchOpRequested({
		matchId: 7,
		draft: {
			kind: MATCH_OP.undoGoal,
			goalId: -1,
		},
		nowMs,
	}),
);
check(inFlight.queues["7"]?.length, 1, "in-flight undo is noop");

const dropped = matchOpsReducer(
	addGoal,
	opDropped({ matchId: 7, message: "Jogador não está na partida" }),
);
check(dropped.queues["7"], undefined, "drop clears empty queue");
check(dropped.error, "Jogador não está na partida", "drop keeps message");

const settled = matchOpsReducer(addGoal, opSettled(7));
check(settled.queues["7"], undefined, "settled clears key");
check(settled.error, null, "settled clears error");
check(settled.inFlightId, null, "settled clears in-flight");

const second = matchOpsReducer(
	addGoal,
	matchOpRequested({
		matchId: 7,
		draft: {
			kind: MATCH_OP.setGoalkeeper,
			teamId: 10,
			playerId: 101,
		},
		nowMs,
	}),
);
check(second.seq, 2, "second op bumps seq");
check(second.queues["7"]?.length, 2, "keeps both ops");
check(second.queues["7"]?.[1]?.localId, -2, "second localId");

console.log("match-ops slice ok");
