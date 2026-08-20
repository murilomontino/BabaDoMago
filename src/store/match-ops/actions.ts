import { createAction } from "@reduxjs/toolkit";
import type { MatchOpDraft } from "../../const/championship-event-match-ops.ts";

export type MatchOpRequestedPayload = {
	matchId: number;
	draft: MatchOpDraft;
	nowMs: number;
};

export const matchOpRequested =
	createAction<MatchOpRequestedPayload>("matchOps/requested");

export const matchOpsFlushRequested = createAction<{ matchId: number }>(
	"matchOps/flushRequested",
);

export function requestMatchOp(matchId: number, draft: MatchOpDraft) {
	return matchOpRequested({
		matchId,
		draft,
		nowMs: Date.now(),
	});
}
