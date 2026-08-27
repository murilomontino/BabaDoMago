import type { EventChannel, SagaIterator } from "redux-saga";
import { buffers, eventChannel } from "redux-saga";
import { call, take } from "redux-saga/effects";
import { isMatchClockOnline } from "../const/championship-event-match.ts";

export const RECONNECT_DEBOUNCE_MS = 1500;

export function createDebouncedEmitter(emit: () => void, waitMs: number) {
	let timer: ReturnType<typeof setTimeout> | null = null;

	return {
		schedule() {
			if (timer) {
				clearTimeout(timer);
			}

			timer = setTimeout(() => {
				timer = null;
				emit();
			}, waitMs);
		},
		cancel() {
			if (!timer) {
				return;
			}

			clearTimeout(timer);
			timer = null;
		},
	};
}

export function readOnline(): boolean {
	return isMatchClockOnline(globalThis.navigator?.onLine);
}

export function createReconnectChannel(): EventChannel<true> {
	return eventChannel((emit) => {
		const debounced = createDebouncedEmitter(() => {
			emit(true);
		}, RECONNECT_DEBOUNCE_MS);

		function onVisibility() {
			if (document.visibilityState !== "visible") {
				return;
			}

			debounced.schedule();
		}

		window.addEventListener("online", debounced.schedule);
		window.addEventListener("pageshow", debounced.schedule);
		document.addEventListener("visibilitychange", onVisibility);
		return () => {
			debounced.cancel();
			window.removeEventListener("online", debounced.schedule);
			window.removeEventListener("pageshow", debounced.schedule);
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
