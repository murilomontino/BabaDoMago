import type { SagaIterator } from "redux-saga";
import { fork } from "redux-saga/effects";
import { matchClockSaga } from "@/store/match-clock/saga";

export function* rootSaga(): SagaIterator {
	yield fork(matchClockSaga);
}
