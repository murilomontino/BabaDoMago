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
	matchOpRequested,
	matchOpsFlushRequested,
} from "@/store/match-ops/actions";
import { flushMatchOpsWorker } from "@/store/match-ops/flush-worker";
import { selectPendingMatchOpIds } from "@/store/match-ops/selectors";
import { createReconnectChannel } from "@/store/online-channel";

function* flushAllPending(): SagaIterator {
	const ids: number[] = yield select(selectPendingMatchOpIds);
	yield all(ids.map((matchId) => put(matchOpsFlushRequested({ matchId }))));
}

function* watchOnline(): SagaIterator {
	const channel: EventChannel<true> = yield call(createReconnectChannel);
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
		const ids: number[] = yield select(selectPendingMatchOpIds);
		if (ids.length === 0) {
			continue;
		}

		yield call(flushAllPending);
	}
}

function* watchMatchOpsFlush(): SagaIterator {
	const channel = yield actionChannel(
		[matchOpRequested.type, matchOpsFlushRequested.type],
		buffers.expanding(),
	);
	for (;;) {
		const action: { payload: { matchId: number } } = yield take(channel);
		yield call(flushMatchOpsWorker, action.payload.matchId);
	}
}

export function* matchOpsSaga(): SagaIterator {
	yield all([
		fork(watchMatchOpsFlush),
		fork(watchOnline),
		fork(watchPendingPoll),
		takeEvery(REHYDRATE, flushAllPending),
	]);
}
