import { useEffect } from "react";
import {
	MATCH_CLOCK_ACTION,
	type MatchClockAction,
} from "@/const/championship-event-match";
import { useMatchClockStore } from "@/hooks/match-clock-store";
import {
	pauseChampionshipEventMatch,
	resumeChampionshipEventMatch,
	startChampionshipEventClock,
} from "@/services/championship-events";

const flushTail = new Map<number, Promise<void>>();
let flushHeld = false;

export function isMatchClockFlushHeld(): boolean {
	return flushHeld;
}

export function setMatchClockFlushHeld(held: boolean, matchId: number): void {
	flushHeld = held;
	if (held) {
		return;
	}

	void enqueueMatchClockFlush(matchId);
}

async function runMatchClockAction(
	matchId: number,
	action: MatchClockAction,
): Promise<void> {
	switch (action) {
		case MATCH_CLOCK_ACTION.start:
			await startChampionshipEventClock(matchId);
			return;
		case MATCH_CLOCK_ACTION.pause:
			await pauseChampionshipEventMatch(matchId);
			return;
		case MATCH_CLOCK_ACTION.resume:
			await resumeChampionshipEventMatch(matchId);
			return;
		default: {
			const _exhaustive: never = action;
			return _exhaustive;
		}
	}
}

async function flushMatchClockPending(matchId: number): Promise<void> {
	for (;;) {
		if (flushHeld) {
			return;
		}

		const snapshot = useMatchClockStore.getState().clocks[String(matchId)];
		const action = snapshot?.pending[0];
		if (!action) {
			return;
		}

		await runMatchClockAction(matchId, action);
		useMatchClockStore.getState().shiftPending(matchId);
	}
}

export function enqueueMatchClockFlush(matchId: number): Promise<void> {
	const previous = flushTail.get(matchId) ?? Promise.resolve();
	const next = previous.then(
		() => flushMatchClockPending(matchId),
		() => flushMatchClockPending(matchId),
	);
	flushTail.set(matchId, next);
	return next;
}

export function useFlushMatchClock(matchId: number | null) {
	useEffect(() => {
		if (matchId === null) {
			return;
		}

		const id = matchId;
		void enqueueMatchClockFlush(id);
		function onOnline() {
			void enqueueMatchClockFlush(id);
		}

		window.addEventListener("online", onOnline);
		return () => {
			window.removeEventListener("online", onOnline);
		};
	}, [matchId]);
}
