import {
	MATCH_OP,
	MATCH_OPS_FLUSH_ERROR,
	type MatchOp,
} from "@/const/championship-event-match-ops";
import { invalidateChampionshipEventQueries } from "@/hooks/championships/championships-query-keys";
import { queryClient } from "@/lib/query-client";
import { ensureSupabaseSession } from "@/lib/supabase-session";
import {
	addChampionshipEventGoal,
	setChampionshipEventMatchGoalkeeper,
	setChampionshipEventMatchPlayer,
	undoChampionshipEventGoal,
} from "@/services/championship-events";

export async function runBoundMatchOpRpc(
	matchId: number,
	op: MatchOp,
): Promise<void> {
	await ensureSupabaseSession(MATCH_OPS_FLUSH_ERROR.fallback);

	switch (op.kind) {
		case MATCH_OP.setPlayer:
			await setChampionshipEventMatchPlayer(
				matchId,
				op.teamId,
				op.slot,
				op.playerId,
				op.includeStats,
			);
			return;
		case MATCH_OP.setGoalkeeper:
			await setChampionshipEventMatchGoalkeeper(
				matchId,
				op.teamId,
				op.playerId,
			);
			return;
		case MATCH_OP.addGoal:
			await addChampionshipEventGoal(
				matchId,
				op.scorerPlayerId,
				op.assistPlayerId,
				op.isOwnGoal,
				op.elapsedSeconds,
			);
			return;
		case MATCH_OP.undoGoal:
			await undoChampionshipEventGoal(matchId, op.goalId);
			return;
		default: {
			const _exhaustive: never = op;
			return _exhaustive;
		}
	}
}

export async function invalidateBoundMatchOpQueries(): Promise<void> {
	await invalidateChampionshipEventQueries(queryClient);
}
