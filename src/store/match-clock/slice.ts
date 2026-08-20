import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
	applyMatchClockAction,
	canClearMatchClock,
	keepLocalMatchClock,
	type MatchClockSnapshot,
	shiftMatchClockPending,
} from "../../const/championship-event-match.ts";
import { matchClockRequested } from "./actions.ts";

export type MatchClockState = {
	clocks: Record<string, MatchClockSnapshot>;
	deferredClear: Record<string, true>;
	held: boolean;
	error: string | null;
	flushAttempt: number;
};

export type MatchClockRootState = {
	matchClock: MatchClockState;
};

export const MATCH_CLOCK_INITIAL_STATE: MatchClockState = {
	clocks: {},
	deferredClear: {},
	held: false,
	error: null,
	flushAttempt: 0,
};

function clockKey(matchId: number): string {
	return String(matchId);
}

function omitKey<T>(record: Record<string, T>, key: string): Record<string, T> {
	return Object.fromEntries(
		Object.entries(record).filter(([id]) => id !== key),
	);
}

const matchClockSlice = createSlice({
	name: "matchClock",
	initialState: MATCH_CLOCK_INITIAL_STATE,
	reducers: {
		shiftPending: (state, action: PayloadAction<number>) => {
			const key = clockKey(action.payload);
			const current = state.clocks[key];
			if (!current) {
				return;
			}

			const next = shiftMatchClockPending(current);
			if (canClearMatchClock(next) && state.deferredClear[key]) {
				state.clocks = omitKey(state.clocks, key);
				state.deferredClear = omitKey(state.deferredClear, key);
				state.error = null;
				state.flushAttempt = 0;
				return;
			}

			state.clocks[key] = next;
		},
		clearMatchClock: (state, action: PayloadAction<number>) => {
			const key = clockKey(action.payload);
			const current = state.clocks[key];
			if (!canClearMatchClock(current)) {
				state.deferredClear[key] = true;
				return;
			}

			state.clocks = omitKey(state.clocks, key);
			state.deferredClear = omitKey(state.deferredClear, key);
			state.error = null;
			state.flushAttempt = 0;
		},
		flushFailed: (state, action: PayloadAction<string | null>) => {
			state.error = action.payload;
		},
		holdSet: (
			state,
			action: PayloadAction<{ held: boolean; matchId: number }>,
		) => {
			state.held = action.payload.held;
		},
		flushAttemptSet: (state, action: PayloadAction<number>) => {
			state.flushAttempt = action.payload;
		},
	},
	extraReducers: (builder) => {
		builder.addCase(matchClockRequested, (state, action) => {
			const { matchId, action: clockAction, seed, nowMs } = action.payload;
			const key = clockKey(matchId);
			const existing = state.clocks[key];
			const base = keepLocalMatchClock(existing, seed);
			state.clocks[key] = applyMatchClockAction(base, clockAction, nowMs);
			state.error = null;
			state.flushAttempt = 0;
		});
	},
});

export const {
	shiftPending,
	clearMatchClock,
	flushFailed,
	holdSet,
	flushAttemptSet,
} = matchClockSlice.actions;

export const matchClockReducer = matchClockSlice.reducer;
