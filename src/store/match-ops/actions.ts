import { createAction } from "@reduxjs/toolkit";
import type { MatchOpDraft } from "../../const/championship-event-match-ops.ts";

export type MatchOpRequestedPayload = {
	eventId: number;
	draft: MatchOpDraft;
	nowMs: number;
};

export const matchOpRequested =
	createAction<MatchOpRequestedPayload>("matchOps/requested");

export const matchOpsFlushRequested = createAction<{ eventId: number }>(
	"matchOps/flushRequested",
);

export const matchIdRemapped = createAction<{
	eventId: number;
	localMatchId: number;
	serverMatchId: number;
}>("matchOps/matchIdRemapped");

export function requestMatchOp(eventId: number, draft: MatchOpDraft) {
	return matchOpRequested({
		eventId,
		draft,
		nowMs: Date.now(),
	});
}
