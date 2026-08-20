import type { EventChannel, SagaIterator } from "redux-saga";
import { buffers, eventChannel } from "redux-saga";
import { call, take } from "redux-saga/effects";
import { isMatchClockOnline } from "../const/championship-event-match.ts";

export function readOnline(): boolean {
	return isMatchClockOnline(globalThis.navigator?.onLine);
}

export function createReconnectChannel(): EventChannel<true> {
	return eventChannel((emit) => {
		function emitOnline() {
			emit(true);
		}

		function onVisibility() {
			if (document.visibilityState !== "visible") {
				return;
			}

			emitOnline();
		}

		window.addEventListener("online", emitOnline);
		window.addEventListener("pageshow", emitOnline);
		document.addEventListener("visibilitychange", onVisibility);
		return () => {
			window.removeEventListener("online", emitOnline);
			window.removeEventListener("pageshow", emitOnline);
			document.removeEventListener("visibilitychange", onVisibility);
		};
	}, buffers.sliding(1));
}

export function* waitForOnline(): SagaIterator {
	for (;;) {
		const online: boolean = yield call(readOnline);
		if (online) {
			return;
		}

		const channel: EventChannel<true> = yield call(createReconnectChannel);
		try {
			yield take(channel);
		} finally {
			channel.close();
		}
	}
}
