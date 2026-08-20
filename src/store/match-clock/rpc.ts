import {
	MATCH_CLOCK_ACTION,
	MATCH_CLOCK_FLUSH_ERROR,
	type MatchClockAction,
} from "@/const/championship-event-match";
import { invalidateChampionshipEventQueries } from "@/hooks/championships/championships-query-keys";
import { queryClient } from "@/lib/query-client";
import { supabase } from "@/lib/supabase";
import {
	pauseChampionshipEventMatch,
	resumeChampionshipEventMatch,
	startChampionshipEventClock,
} from "@/services/championship-events";

export async function runBoundMatchClockRpc(
	matchId: number,
	action: MatchClockAction,
): Promise<void> {
	const { data, error } = await supabase.auth.getSession();
	if (error) {
		throw error;
	}

	if (!data.session) {
		const refreshed = await supabase.auth.refreshSession();
		if (refreshed.error) {
			throw refreshed.error;
		}

		if (!refreshed.data.session) {
			throw new Error(MATCH_CLOCK_FLUSH_ERROR.fallback);
		}
	}

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

export async function invalidateBoundMatchClockQueries(): Promise<void> {
	await invalidateChampionshipEventQueries(queryClient);
}
