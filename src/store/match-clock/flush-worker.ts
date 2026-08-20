import type { SagaIterator } from "redux-saga";
import { call, delay, put, select } from "redux-saga/effects";
import {
	MATCH_CLOCK_FLUSH_ERROR,
	type MatchClockAction,
	matchClockRetryDelayMs,
} from "../../const/championship-event-match.ts";
import { caughtErrorMessage } from "../../lib/error-message.ts";
import { readOnline, waitForOnline } from "../online-channel.ts";
import { selectMatchClockHeld, selectMatchClockSnapshot } from "./selectors.ts";
import {
	flushAttemptSet,
	flushFailed,
	type MatchClockRootState,
	shiftPending,
} from "./slice.ts";

export async function runMatchClockRpc(
	matchId: number,
	action: MatchClockAction,
): Promise<void> {
	const { runBoundMatchClockRpc } = await import("./rpc.ts");
	await runBoundMatchClockRpc(matchId, action);
}

export async function invalidateMatchClockQueries(): Promise<void> {
	const { invalidateBoundMatchClockQueries } = await import("./rpc.ts");
	await invalidateBoundMatchClockQueries();
}

function selectMatchClockById(matchId: number) {
	return (state: MatchClockRootState) =>
		selectMatchClockSnapshot(state, matchId);
}

export function* flushPendingAction(
	matchId: number,
	action: MatchClockAction,
): SagaIterator<boolean> {
	for (let attempt = 0; ; attempt += 1) {
		yield call(waitForOnline);
		try {
			yield call(runMatchClockRpc, matchId, action);
			yield put(shiftPending(matchId));
			yield put(flushFailed(null));
			yield put(flushAttemptSet(0));
			yield call(invalidateMatchClockQueries);
			return true;
		} catch (error) {
			yield put(
				flushFailed(
					caughtErrorMessage(error, MATCH_CLOCK_FLUSH_ERROR.fallback),
				),
			);
			yield put(flushAttemptSet(attempt + 1));
			const online: boolean = yield call(readOnline);
			if (!online) {
				continue;
			}

			yield delay(matchClockRetryDelayMs(attempt));
		}
	}
}

export function* flushMatchClockWorker(matchId: number): SagaIterator {
	for (;;) {
		const held: boolean = yield select(selectMatchClockHeld);
		if (held) {
			return;
		}

		const snapshot: ReturnType<typeof selectMatchClockSnapshot> = yield select(
			selectMatchClockById(matchId),
		);
		const action = snapshot?.pending[0];
		if (!action) {
			return;
		}

		const flushed: boolean = yield call(flushPendingAction, matchId, action);
		if (!flushed) {
			return;
		}
	}
}
