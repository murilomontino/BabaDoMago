import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
	buildMatchOp,
	MATCH_OP,
	type MatchOp,
	pendingLocalGoalOpId,
} from "../../const/championship-event-match-ops.ts";
import { matchOpRequested } from "./actions.ts";

export type MatchOpsState = {
	queues: Record<string, MatchOp[]>;
	seq: number;
	inFlightId: string | null;
	error: string | null;
	flushAttempt: number;
};

export type MatchOpsRootState = {
	matchOps: MatchOpsState;
};

export const MATCH_OPS_INITIAL_STATE: MatchOpsState = {
	queues: {},
	seq: 0,
	inFlightId: null,
	error: null,
	flushAttempt: 0,
};

function queueKey(matchId: number): string {
	return String(matchId);
}

function omitKey<T>(record: Record<string, T>, key: string): Record<string, T> {
	return Object.fromEntries(
		Object.entries(record).filter(([id]) => id !== key),
	);
}

function shiftQueue(
	queues: Record<string, MatchOp[]>,
	key: string,
): Record<string, MatchOp[]> {
	const current = queues[key];
	if (!current) {
		return queues;
	}

	const next = current.slice(1);
	if (next.length === 0) {
		return omitKey(queues, key);
	}

	return {
		...queues,
		[key]: next,
	};
}

const matchOpsSlice = createSlice({
	name: "matchOps",
	initialState: MATCH_OPS_INITIAL_STATE,
	reducers: {
		opSettled: (state, action: PayloadAction<number>) => {
			state.queues = shiftQueue(state.queues, queueKey(action.payload));
			state.inFlightId = null;
			state.error = null;
			state.flushAttempt = 0;
		},
		opDropped: (
			state,
			action: PayloadAction<{ matchId: number; message: string }>,
		) => {
			state.queues = shiftQueue(state.queues, queueKey(action.payload.matchId));
			state.inFlightId = null;
			state.error = action.payload.message;
			state.flushAttempt = 0;
		},
		flushFailed: (state, action: PayloadAction<string | null>) => {
			state.error = action.payload;
		},
		flushAttemptSet: (state, action: PayloadAction<number>) => {
			state.flushAttempt = action.payload;
		},
		inFlightSet: (state, action: PayloadAction<string | null>) => {
			state.inFlightId = action.payload;
		},
		clearMatchOps: (state, action: PayloadAction<number>) => {
			state.queues = omitKey(state.queues, queueKey(action.payload));
			state.inFlightId = null;
			state.error = null;
			state.flushAttempt = 0;
		},
	},
	extraReducers: (builder) => {
		builder.addCase(matchOpRequested, (state, action) => {
			const { matchId, draft, nowMs } = action.payload;
			const key = queueKey(matchId);
			const queue = state.queues[key] ?? [];

			if (draft.kind === MATCH_OP.undoGoal && draft.goalId < 0) {
				const opId = pendingLocalGoalOpId(queue, draft.goalId);
				if (!opId) {
					return;
				}

				if (state.inFlightId === opId) {
					return;
				}

				const next = queue.filter((op) => op.id !== opId);
				if (next.length === 0) {
					state.queues = omitKey(state.queues, key);
					return;
				}

				state.queues[key] = next;
				return;
			}

			state.seq += 1;
			const op = buildMatchOp(draft, state.seq, nowMs);
			state.queues[key] = [...queue, op];
			state.error = null;
			state.flushAttempt = 0;
		});
	},
});

export const {
	opSettled,
	opDropped,
	flushFailed,
	flushAttemptSet,
	inFlightSet,
	clearMatchOps,
} = matchOpsSlice.actions;

export const matchOpsReducer = matchOpsSlice.reducer;
