import type { ChampionshipPlayer } from "../types/championship.ts";
import type { ChampionshipEvent } from "../types/championship-event.ts";
import { walkMatchGoalScores } from "./match-goal-score-walk.ts";
import { playerVisibleName } from "./player-name.ts";
import { formatRosterCount } from "./roster-stats.ts";

export const COMEBACK_GOAL_RANKING_LABEL = {
	title: "Ranking de gol da virada",
	empty: "Nenhum gol da virada na janela",
	hint: "Gol que coloca o time na frente depois de já ter ficado atrás. Empate e abertura não contam.",
	goals: "Gols",
	player: "Jogador",
} as const;

export type ComebackGoalRankingRow = {
	player: ChampionshipPlayer;
	comebackGoals: number;
};

export function championshipComebackGoalCounts(
	events: readonly ChampionshipEvent[],
): Map<number, number> {
	return championshipComebackStatCounts(events).goals;
}

export function championshipComebackAssistCounts(
	events: readonly ChampionshipEvent[],
): Map<number, number> {
	return championshipComebackStatCounts(events).assists;
}

type ComebackStatCounts = {
	goals: Map<number, number>;
	assists: Map<number, number>;
};

function championshipComebackStatCounts(
	events: readonly ChampionshipEvent[],
): ComebackStatCounts {
	const goals = new Map<number, number>();
	const assists = new Map<number, number>();

	for (const event of events) {
		if (event.ended_at === null) {
			continue;
		}

		for (const match of event.matches) {
			if (match.ended_at === null) {
				continue;
			}

			for (const step of walkMatchGoalScores(match)) {
				if (step.goal.is_own_goal) {
					continue;
				}

				if (!step.isComebackLead) {
					continue;
				}

				const scorerId = step.goal.scorer_player_id;
				goals.set(scorerId, (goals.get(scorerId) ?? 0) + 1);

				const assistId = step.goal.assist_player_id;
				if (assistId === null) {
					continue;
				}

				assists.set(assistId, (assists.get(assistId) ?? 0) + 1);
			}
		}
	}

	return { goals, assists };
}

export function applyComebackGoalCounts<T extends ChampionshipPlayer>(
	players: readonly T[],
	events: readonly ChampionshipEvent[],
): Array<T & { comebackGoals: number; comebackAssists: number }> {
	const counts = championshipComebackStatCounts(events);
	return players.map((player) => ({
		...player,
		comebackGoals: counts.goals.get(player.id) ?? 0,
		comebackAssists: counts.assists.get(player.id) ?? 0,
	}));
}

export function championshipComebackGoalRanking(
	players: readonly ChampionshipPlayer[],
	events: readonly ChampionshipEvent[],
): ComebackGoalRankingRow[] {
	const counts = championshipComebackGoalCounts(events);

	return players
		.flatMap((player) => {
			const comebackGoals = counts.get(player.id) ?? 0;
			if (comebackGoals <= 0) {
				return [];
			}

			return [{ player, comebackGoals }];
		})
		.sort(compareComebackRows);
}

export type ComebackAssistRankingRow = {
	player: ChampionshipPlayer;
	comebackAssists: number;
};

export function championshipComebackAssistRanking(
	players: readonly ChampionshipPlayer[],
	events: readonly ChampionshipEvent[],
): ComebackAssistRankingRow[] {
	const counts = championshipComebackAssistCounts(events);

	return players
		.flatMap((player) => {
			const comebackAssists = counts.get(player.id) ?? 0;
			if (comebackAssists <= 0) {
				return [];
			}

			return [{ player, comebackAssists }];
		})
		.sort(compareComebackAssistRows);
}

function compareComebackRows(
	a: ComebackGoalRankingRow,
	b: ComebackGoalRankingRow,
): number {
	if (a.comebackGoals !== b.comebackGoals) {
		return b.comebackGoals - a.comebackGoals;
	}

	return playerVisibleName(a.player).localeCompare(
		playerVisibleName(b.player),
		"pt-BR",
	);
}

function compareComebackAssistRows(
	a: ComebackAssistRankingRow,
	b: ComebackAssistRankingRow,
): number {
	if (a.comebackAssists !== b.comebackAssists) {
		return b.comebackAssists - a.comebackAssists;
	}

	return playerVisibleName(a.player).localeCompare(
		playerVisibleName(b.player),
		"pt-BR",
	);
}

export function formatComebackGoalCount(value: number): string {
	return formatRosterCount(value);
}
