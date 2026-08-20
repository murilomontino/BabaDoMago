import { call, put } from "redux-saga/effects";
import { EVENT_ERROR_MESSAGE } from "../../const/championship-event.ts";
import { MATCH_OP } from "../../const/championship-event-match-ops.ts";
import { matchClockFlushRequested } from "../match-clock/actions.ts";
import { readOnline, waitForOnline } from "../online-channel.ts";
import { matchIdRemapped } from "./actions.ts";
import {
	flushMatchOp,
	invalidateMatchOpQueries,
	runMatchOpRpc,
} from "./flush-worker.ts";
import { flushFailed, inFlightSet, opDropped, opSettled } from "./slice.ts";

function checkJson(actual: unknown, expected: unknown, message: string): void {
	const actualJson = JSON.stringify(actual);
	const expectedJson = JSON.stringify(expected);
	if (actualJson !== expectedJson) {
		throw new Error(`${message}: ${actualJson} !== ${expectedJson}`);
	}
}

const op = {
	kind: MATCH_OP.addGoal,
	matchId: 7,
	scorerPlayerId: 101,
	assistPlayerId: null,
	isOwnGoal: false,
	elapsedSeconds: 12,
	id: "1",
	localId: -1,
	createdAt: "2026-08-20T12:00:00.000Z",
} as const;

const success = flushMatchOp(1, op);
checkJson(success.next().value, call(waitForOnline), "waits to be online");
checkJson(success.next().value, put(inFlightSet(op.id)), "marks in flight");
checkJson(success.next().value, call(runMatchOpRpc, 1, op), "calls rpc");
checkJson(
	success.next(null).value,
	call(invalidateMatchOpQueries, op),
	"invalidates queries",
);
checkJson(success.next().value, put(opSettled(1)), "settles");
checkJson(success.next(), { value: true, done: true }, "flush success");

const retry = flushMatchOp(1, op);
retry.next();
retry.next();
retry.next();
const afterFail = retry.throw(new Error("Failed to fetch"));
checkJson(afterFail.value, put(inFlightSet(null)), "clears in flight");
checkJson(
	retry.next().value,
	put(flushFailed("Failed to fetch")),
	"keeps error",
);
checkJson(retry.next().value, call(readOnline), "rechecks online after fail");
checkJson(
	retry.next(false).value,
	call(waitForOnline),
	"offline waits instead of dropping",
);

const fatal = flushMatchOp(1, op);
fatal.next();
fatal.next();
fatal.next();
const afterFatal = fatal.throw(
	new Error(EVENT_ERROR_MESSAGE["player not in match"]),
);
checkJson(afterFatal.value, put(inFlightSet(null)), "fatal clears in flight");
checkJson(
	fatal.next().value,
	put(flushFailed(EVENT_ERROR_MESSAGE["player not in match"])),
	"fatal records error",
);
checkJson(fatal.next().value, call(readOnline), "fatal rechecks online");
checkJson(
	fatal.next(true).value,
	put(
		opDropped({
			eventId: 1,
			message: EVENT_ERROR_MESSAGE["player not in match"],
		}),
	),
	"fatal drops the op",
);
checkJson(
	fatal.next().value,
	call(invalidateMatchOpQueries, op),
	"fatal invalidates queries",
);
checkJson(fatal.next(), { value: true, done: true }, "fatal continues queue");

const startOp = {
	kind: MATCH_OP.startMatch,
	eventId: 1,
	teamAId: 10,
	teamBId: 20,
	durationSeconds: 420,
	id: "2",
	localId: -2,
	createdAt: "2026-08-20T12:00:00.000Z",
} as const;

const startFlush = flushMatchOp(1, startOp);
checkJson(startFlush.next().value, call(waitForOnline), "start waits online");
checkJson(
	startFlush.next().value,
	put(inFlightSet(startOp.id)),
	"start marks in flight",
);
checkJson(
	startFlush.next().value,
	call(runMatchOpRpc, 1, startOp),
	"start calls rpc",
);
checkJson(
	startFlush.next(42).value,
	put(
		matchIdRemapped({
			eventId: 1,
			localMatchId: -2,
			serverMatchId: 42,
		}),
	),
	"start remaps match id before settle",
);
checkJson(
	startFlush.next().value,
	put(matchClockFlushRequested({ matchId: 42 })),
	"start flushes remapped clock",
);
checkJson(
	startFlush.next().value,
	call(invalidateMatchOpQueries, startOp),
	"start invalidates queries",
);
checkJson(
	startFlush.next().value,
	put(opSettled(1)),
	"start settles after remap",
);
checkJson(
	startFlush.next(),
	{ value: true, done: true },
	"start flush success",
);

console.log("match-ops saga ok");
