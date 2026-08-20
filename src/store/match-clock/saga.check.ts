import { call, put, select } from "redux-saga/effects";
import {
	MATCH_CLOCK_ACTION,
	MATCH_CLOCK_FLUSH_ERROR,
} from "../../const/championship-event-match.ts";
import {
	createReconnectChannel,
	readOnline,
	waitForOnline,
} from "../online-channel.ts";
import {
	flushMatchClockWorker,
	flushPendingAction,
	invalidateMatchClockQueries,
	runMatchClockRpc,
} from "./flush-worker.ts";
import { selectMatchClockHeld } from "./selectors.ts";
import { flushAttemptSet, flushFailed, shiftPending } from "./slice.ts";

function check(actual: unknown, expected: unknown, message: string): void {
	if (actual !== expected) {
		throw new Error(`${message}: ${String(actual)} !== ${String(expected)}`);
	}
}

function ioType(effect: unknown): string {
	if (!effect || typeof effect !== "object") {
		return "";
	}

	if (!("type" in effect)) {
		return "";
	}

	return String((effect as { type: string }).type);
}

function checkJson(actual: unknown, expected: unknown, message: string): void {
	const actualJson = JSON.stringify(actual);
	const expectedJson = JSON.stringify(expected);
	if (actualJson !== expectedJson) {
		throw new Error(`${message}: ${actualJson} !== ${expectedJson}`);
	}
}

const heldWorker = flushMatchClockWorker(7);
check(ioType(heldWorker.next().value), "SELECT", "worker selects hold");
checkJson(
	heldWorker.next(true),
	{ value: undefined, done: true },
	"held stops",
);

const emptyWorker = flushMatchClockWorker(7);
emptyWorker.next();
check(
	ioType(emptyWorker.next(false).value),
	"SELECT",
	"worker selects snapshot",
);
checkJson(
	emptyWorker.next(undefined),
	{ value: undefined, done: true },
	"empty pending stops",
);

const onlineWait = waitForOnline();
checkJson(onlineWait.next().value, call(readOnline), "wait checks online");
checkJson(
	onlineWait.next(true),
	{ value: undefined, done: true },
	"online proceeds",
);

const offlineWait = waitForOnline();
offlineWait.next();
checkJson(
	offlineWait.next(false).value,
	call(createReconnectChannel),
	"offline waits reconnect",
);

const pauseFlush = flushPendingAction(7, MATCH_CLOCK_ACTION.pause);
checkJson(pauseFlush.next().value, call(waitForOnline), "waits to be online");
checkJson(
	pauseFlush.next().value,
	call(runMatchClockRpc, 7, MATCH_CLOCK_ACTION.pause),
	"calls rpc",
);
checkJson(pauseFlush.next().value, put(shiftPending(7)), "shifts pending");
checkJson(pauseFlush.next().value, put(flushFailed(null)), "clears error");
checkJson(pauseFlush.next().value, put(flushAttemptSet(0)), "resets attempt");
checkJson(
	pauseFlush.next().value,
	call(invalidateMatchClockQueries),
	"invalidates queries",
);
checkJson(pauseFlush.next(), { value: true, done: true }, "flush success");

const retryFlush = flushPendingAction(7, MATCH_CLOCK_ACTION.pause);
retryFlush.next();
retryFlush.next();
const afterFail = retryFlush.throw(new Error("offline"));
checkJson(afterFail.value, put(flushFailed("offline")), "keeps error");
checkJson(retryFlush.next().value, put(flushAttemptSet(1)), "records retry");
checkJson(
	retryFlush.next().value,
	call(readOnline),
	"rechecks online after fail",
);
checkJson(
	retryFlush.next(false).value,
	call(waitForOnline),
	"offline waits instead of dropping",
);

check(
	select(selectMatchClockHeld).type,
	"SELECT",
	"hold selector is a select effect",
);
check(MATCH_CLOCK_FLUSH_ERROR.fallback.length > 0, true, "fallback label");

console.log("match-clock saga ok");
