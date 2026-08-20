import { createAction } from "@reduxjs/toolkit";
import type {
	MatchClockAction,
	MatchClockFields,
} from "../../const/championship-event-match.ts";

export type MatchClockRequestedPayload = {
	matchId: number;
	action: MatchClockAction;
	seed: MatchClockFields;
	nowMs: number;
};

export const matchClockRequested = createAction<MatchClockRequestedPayload>(
	"matchClock/requested",
);

export const matchClockFlushRequested = createAction<{ matchId: number }>(
	"matchClock/flushRequested",
);

export function requestMatchClock(
	matchId: number,
	action: MatchClockAction,
	seed: MatchClockFields,
) {
	return matchClockRequested({
		matchId,
		action,
		seed,
		nowMs: Date.now(),
	});
}
