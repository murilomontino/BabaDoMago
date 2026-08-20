import {
	MATCH_OP,
	MATCH_OPS_FLUSH_ERROR,
	type MatchOp,
} from "@/const/championship-event-match-ops";
import {
	invalidateChampionshipEventQueries,
	invalidateChampionshipQueries,
} from "@/hooks/championships/championships-query-keys";
import { queryClient } from "@/lib/query-client";
import { ensureSupabaseSession } from "@/lib/supabase-session";
import {
	addChampionshipEventGoal,
	deleteChampionshipEventMatch,
	endChampionshipEventMatch,
	setChampionshipEventMatchGoalkeeper,
	setChampionshipEventMatchPlayer,
	startChampionshipEventMatch,
	swapChampionshipEventMatchTeam,
	undoChampionshipEventGoal,
	updateChampionshipEventTeam,
} from "@/services/championship-events";

export async function runBoundMatchOpRpc(
	_eventId: number,
	op: MatchOp,
): Promise<number | null> {
	await ensureSupabaseSession(MATCH_OPS_FLUSH_ERROR.fallback);

	switch (op.kind) {
		case MATCH_OP.setPlayer:
			await setChampionshipEventMatchPlayer(
				op.matchId,
				op.teamId,
				op.slot,
				op.playerId,
				op.includeStats,
			);
			return null;
		case MATCH_OP.setGoalkeeper:
			await setChampionshipEventMatchGoalkeeper(
				op.matchId,
				op.teamId,
				op.playerId,
			);
			return null;
		case MATCH_OP.addGoal:
			await addChampionshipEventGoal(
				op.matchId,
				op.scorerPlayerId,
				op.assistPlayerId,
				op.isOwnGoal,
				op.elapsedSeconds,
			);
			return null;
		case MATCH_OP.undoGoal:
			await undoChampionshipEventGoal(op.matchId, op.goalId);
			return null;
		case MATCH_OP.startMatch:
			return startChampionshipEventMatch(
				op.eventId,
				op.teamAId,
				op.teamBId,
				op.durationSeconds,
			);
		case MATCH_OP.updateTeam:
			await updateChampionshipEventTeam(op.teamId, {
				color: op.color,
				playerIds: op.playerIds,
				goalkeeperId: op.goalkeeperId,
			});
			return null;
		case MATCH_OP.swapTeam:
			await swapChampionshipEventMatchTeam(
				op.matchId,
				op.outgoingTeamId,
				op.incomingTeamId,
			);
			return null;
		case MATCH_OP.endMatch:
			await endChampionshipEventMatch(op.matchId);
			return null;
		case MATCH_OP.discardMatch:
			await deleteChampionshipEventMatch(op.matchId);
			return null;
		default: {
			const _exhaustive: never = op;
			return _exhaustive;
		}
	}
}

export async function invalidateBoundMatchOpQueries(
	op: MatchOp,
): Promise<void> {
	await invalidateChampionshipEventQueries(queryClient);
	if (op.kind !== MATCH_OP.endMatch && op.kind !== MATCH_OP.discardMatch) {
		return;
	}

	await invalidateChampionshipQueries(queryClient);
}
