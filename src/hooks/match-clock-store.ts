import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
	applyMatchClockAction,
	keepLocalMatchClock,
	MATCH_CLOCK_STORAGE_KEY,
	type MatchClockAction,
	type MatchClockFields,
	type MatchClockSnapshot,
	shiftMatchClockPending,
} from "@/const/championship-event-match";

function clockKey(matchId: number): string {
	return String(matchId);
}

export function matchClockFromStore(
	clocks: Record<string, MatchClockSnapshot>,
	matchId: number | null,
): MatchClockSnapshot | undefined {
	if (matchId === null) {
		return undefined;
	}

	return clocks[clockKey(matchId)];
}

type MatchClockStore = {
	clocks: Record<string, MatchClockSnapshot>;
	apply: (
		matchId: number,
		action: MatchClockAction,
		nowMs: number,
		seed: MatchClockFields,
	) => void;
	clear: (matchId: number) => void;
	shiftPending: (matchId: number) => void;
};

export const useMatchClockStore = create<MatchClockStore>()(
	persist(
		(set, get) => ({
			clocks: {},
			apply: (matchId, action, nowMs, seed) => {
				const key = clockKey(matchId);
				const existing = get().clocks[key];
				const base = keepLocalMatchClock(existing, seed);
				const next = applyMatchClockAction(base, action, nowMs);
				set({
					clocks: {
						...get().clocks,
						[key]: next,
					},
				});
			},
			clear: (matchId) => {
				const key = clockKey(matchId);
				set({
					clocks: Object.fromEntries(
						Object.entries(get().clocks).filter(([id]) => id !== key),
					),
				});
			},
			shiftPending: (matchId) => {
				const key = clockKey(matchId);
				const current = get().clocks[key];
				if (!current) {
					return;
				}

				set({
					clocks: {
						...get().clocks,
						[key]: shiftMatchClockPending(current),
					},
				});
			},
		}),
		{
			name: MATCH_CLOCK_STORAGE_KEY,
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({ clocks: state.clocks }),
		},
	),
);
