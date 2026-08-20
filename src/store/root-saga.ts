import type { SagaIterator } from "redux-saga";
import { fork } from "redux-saga/effects";
import { matchClockSaga } from "./match-clock/saga";
import { matchOpsSaga } from "./match-ops/saga";

export function* rootSaga(): SagaIterator {
	yield fork(matchClockSaga);
	yield fork(matchOpsSaga);
}
