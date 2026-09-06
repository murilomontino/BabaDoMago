import { includeWhen } from "../lib/include-when.ts";
import type {
	ChampionshipEventGoal,
	ChampionshipEventMatch,
} from "../types/championship-event.ts";
import { matchScore } from "./championship-event-match.ts";

export function matchTeamAPlayerIds(
	match: ChampionshipEventMatch,
): Set<number> {
	return new Set(
		match.players.flatMap((player) =>
			includeWhen(player.team_id === match.team_a_id, player.player_id),
		),
	);
}

export function compareMatchGoals(
	a: ChampionshipEventGoal,
	b: ChampionshipEventGoal,
): number {
	const aElapsed = a.elapsed_seconds;
	const bElapsed = b.elapsed_seconds;
	if (aElapsed !== null && bElapsed !== null && aElapsed !== bElapsed) {
		return aElapsed - bElapsed;
	}

	if (aElapsed !== null && bElapsed === null) {
		return -1;
	}

	if (aElapsed === null && bElapsed !== null) {
		return 1;
	}

	if (a.created_at < b.created_at) {
		return -1;
	}

	if (a.created_at > b.created_at) {
		return 1;
	}

	return a.id - b.id;
}

export function goalScoresForTeamA(
	goal: ChampionshipEventGoal,
	teamAIds: ReadonlySet<number>,
): boolean {
	const scorerInA = teamAIds.has(goal.scorer_player_id);
	if (goal.is_own_goal) {
		return !scorerInA;
	}

	return scorerInA;
}

export function goalBeneficiaryTeamId(
	goal: ChampionshipEventGoal,
	match: Pick<ChampionshipEventMatch, "team_a_id" | "team_b_id">,
	teamAIds: ReadonlySet<number>,
): number {
	if (goalScoresForTeamA(goal, teamAIds)) {
		return match.team_a_id;
	}

	return match.team_b_id;
}

export function marginForScoringSide(
	score: { teamA: number; teamB: number },
	scoresForA: boolean,
): number {
	if (scoresForA) {
		return score.teamA - score.teamB;
	}

	return score.teamB - score.teamA;
}

export function isComebackLeadGoal(input: {
	marginBefore: number;
	marginAfter: number;
	teamHadTrailed: boolean;
}): boolean {
	if (!input.teamHadTrailed) {
		return false;
	}

	if (input.marginAfter <= 0) {
		return false;
	}

	return input.marginBefore <= 0;
}

export type MatchGoalScoreStep = {
	goal: ChampionshipEventGoal;
	scoresForA: boolean;
	marginBefore: number;
	marginAfter: number;
	teamHadTrailed: boolean;
	isComebackLead: boolean;
};

export function walkMatchGoalScores(
	match: ChampionshipEventMatch,
): MatchGoalScoreStep[] {
	const teamAIds = matchTeamAPlayerIds(match);
	const ordered = [...match.goals].sort(compareMatchGoals);
	const steps: MatchGoalScoreStep[] = [];
	let teamAHadTrailed = false;
	let teamBHadTrailed = false;

	for (let index = 0; index < ordered.length; index += 1) {
		const goal = ordered[index];
		if (goal === undefined) {
			continue;
		}

		const prior = ordered.slice(0, index);
		const before = matchScore(prior, teamAIds);
		if (before.teamA < before.teamB) {
			teamAHadTrailed = true;
		}
		if (before.teamB < before.teamA) {
			teamBHadTrailed = true;
		}

		const scoresForA = goalScoresForTeamA(goal, teamAIds);
		const marginBefore = marginForScoringSide(before, scoresForA);
		const after = matchScore(ordered.slice(0, index + 1), teamAIds);
		const marginAfter = marginForScoringSide(after, scoresForA);
		const teamHadTrailed = scoresForA ? teamAHadTrailed : teamBHadTrailed;

		steps.push({
			goal,
			scoresForA,
			marginBefore,
			marginAfter,
			teamHadTrailed,
			isComebackLead: isComebackLeadGoal({
				marginBefore,
				marginAfter,
				teamHadTrailed,
			}),
		});
	}

	return steps;
}
