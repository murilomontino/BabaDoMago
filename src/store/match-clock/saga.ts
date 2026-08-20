import { REHYDRATE } from "redux-persist";
import type { EventChannel, SagaIterator } from "redux-saga";
import { buffers } from "redux-saga";
import {
	actionChannel,
	all,
	call,
	delay,
	fork,
	put,
	select,
	take,
	takeEvery,
} from "redux-saga/effects";
import { MATCH_CLOCK_FLUSH_RETRY } from "@/const/championship-event-match";
import {
	matchClockFlushRequested,
	matchClockRequested,
} from "@/store/match-clock/actions";
import {
	createMatchClockReconnectChannel,
	flushMatchClockWorker,
} from "@/store/match-clock/flush-worker";
import { selectPendingMatchClockIds } from "@/store/match-clock/selectors";
import { holdSet } from "@/store/match-clock/slice";

function* flushAllPending(): SagaIterator {
	const ids: number[] = yield select(selectPendingMatchClockIds);
	yield all(ids.map((matchId) => put(matchClockFlushRequested({ matchId }))));
}

function* watchOnline(): SagaIterator {
	const channel: EventChannel<true> = yield call(
		createMatchClockReconnectChannel,
	);
	try {
		for (;;) {
			yield take(channel);
			yield call(flushAllPending);
		}
	} finally {
		channel.close();
	}
}

function* watchPendingPoll(): SagaIterator {
	for (;;) {
		yield delay(MATCH_CLOCK_FLUSH_RETRY.pollMs);
		const ids: number[] = yield select(selectPendingMatchClockIds);
		if (ids.length === 0) {
			continue;
		}

		yield call(flushAllPending);
	}
}

function* onHoldSet(action: ReturnType<typeof holdSet>): SagaIterator {
	if (action.payload.held) {
		return;
	}

	yield put(matchClockFlushRequested({ matchId: action.payload.matchId }));
}

function* watchMatchClockFlush(): SagaIterator {
	const channel = yield actionChannel(
		[matchClockRequested.type, matchClockFlushRequested.type],
		buffers.expanding(),
	);
	for (;;) {
		const action: { payload: { matchId: number } } = yield take(channel);
		yield call(flushMatchClockWorker, action.payload.matchId);
	}
}

export function* matchClockSaga(): SagaIterator {
	yield all([
		fork(watchMatchClockFlush),
		fork(watchOnline),
		fork(watchPendingPoll),
		takeEvery(holdSet, onHoldSet),
		takeEvery(REHYDRATE, flushAllPending),
	]);
}
