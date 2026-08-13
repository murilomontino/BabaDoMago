import type {
	ChampionshipEventGoal,
	ChampionshipEventMatch,
	ChampionshipEventMatchPlayer,
} from "../types/championship-event.ts";
import { CHAMPIONSHIP_EVENT } from "./championship-event.ts";
import type { EventTeamColor } from "./event-team-color.ts";
import { playerVisibleName } from "./player-name.ts";

type MatchStarRosterPlayer = {
	nickname: string | null;
	display_name: string;
	rating: number;
};

export const EVENT_MATCH_STATUS = {
	open: "open",
	ended: "ended",
} as const;

export type EventMatchStatus =
	(typeof EVENT_MATCH_STATUS)[keyof typeof EVENT_MATCH_STATUS];

export const EVENT_MATCH_LABEL = {
	winner: "Vencedor",
	draw: "Empate",
	open: "Em andamento",
	selectTeams: "Selecione dois times",
	emptySlot: "Vago",
	copied: "Link copiado.",
	none: "Nenhuma partida ainda.",
	picked: "Time",
	select: "Selecionar",
} as const;

export const EVENT_GOAL_KIND = {
	assist: "assist",
	none: "none",
	ownGoal: "ownGoal",
} as const;

export type EventGoalKind =
	(typeof EVENT_GOAL_KIND)[keyof typeof EVENT_GOAL_KIND];

export const EVENT_GOAL_LABEL = {
	goal: "Gol",
	assist: "Assistência",
	none: "Sem assistência",
	ownGoal: "Gol contra",
} as const;

export const EVENT_GOAL_KINDS = [
	EVENT_GOAL_KIND.none,
	EVENT_GOAL_KIND.ownGoal,
] as const;

export function eventMatchStatus(endedAt: string | null): EventMatchStatus {
	if (endedAt) {
		return EVENT_MATCH_STATUS.ended;
	}

	return EVENT_MATCH_STATUS.open;
}

export function openEventMatch<T extends { ended_at: string | null }>(
	matches: readonly T[],
): T | null {
	return matches.find((match) => match.ended_at === null) ?? null;
}

export function matchPlayerIds(
	players: readonly { player_id: number }[],
): number[] {
	return players.map((player) => player.player_id);
}

export function matchTeamPlayers(
	players: readonly ChampionshipEventMatchPlayer[],
	teamId: number,
): ChampionshipEventMatchPlayer[] {
	return [...players]
		.filter((player) => player.team_id === teamId)
		.sort((left, right) => left.slot - right.slot);
}

export function matchTeamSlots(
	players: readonly ChampionshipEventMatchPlayer[],
	teamId: number,
	playersPerTeam: number,
): (ChampionshipEventMatchPlayer | null)[] {
	const slots = Array.from(
		{ length: playersPerTeam },
		() => null as ChampionshipEventMatchPlayer | null,
	);
	const team = matchTeamPlayers(players, teamId);

	return team.reduce((next, player) => {
		if (player.slot < 0 || player.slot >= next.length) {
			return next;
		}

		next[player.slot] = player;
		return next;
	}, slots);
}

export function matchBenchPlayerIds(
	presentIds: readonly number[],
	matchPlayers: readonly { player_id: number }[],
): number[] {
	const taken = new Set(matchPlayers.map((player) => player.player_id));
	return presentIds.filter((playerId) => !taken.has(playerId));
}

export function matchAssistCandidates(
	players: readonly ChampionshipEventMatchPlayer[],
	teamId: number,
	scorerPlayerId: number,
): ChampionshipEventMatchPlayer[] {
	return matchTeamPlayers(players, teamId).filter(
		(player) => player.player_id !== scorerPlayerId,
	);
}

export function matchTeamScore(
	goals: readonly ChampionshipEventGoal[],
	teamPlayerIds: ReadonlySet<number>,
): number {
	return goals.reduce((score, goal) => {
		const scorerInTeam = teamPlayerIds.has(goal.scorer_player_id);
		if (scorerInTeam === goal.is_own_goal) {
			return score;
		}

		return score + 1;
	}, 0);
}

export function matchScore(
	goals: readonly ChampionshipEventGoal[],
	teamAPlayerIds: ReadonlySet<number>,
): { teamA: number; teamB: number } {
	return goals.reduce(
		(score, goal) => {
			const scorerInA = teamAPlayerIds.has(goal.scorer_player_id);
			if (goal.is_own_goal) {
				if (scorerInA) {
					return { teamA: score.teamA, teamB: score.teamB + 1 };
				}

				return { teamA: score.teamA + 1, teamB: score.teamB };
			}

			if (scorerInA) {
				return { teamA: score.teamA + 1, teamB: score.teamB };
			}

			return { teamA: score.teamA, teamB: score.teamB + 1 };
		},
		{ teamA: 0, teamB: 0 },
	);
}

export function matchWinnerTeamId(
	teamAId: number,
	teamBId: number,
	scoreA: number,
	scoreB: number,
): number | null {
	if (scoreA > scoreB) {
		return teamAId;
	}

	if (scoreB > scoreA) {
		return teamBId;
	}

	return null;
}

export function matchWinnerColor(
	winnerTeamId: number | null,
	teams: ReadonlyMap<number, { color: EventTeamColor | null }>,
): EventTeamColor | null {
	if (winnerTeamId === null) {
		return null;
	}

	return teams.get(winnerTeamId)?.color ?? null;
}

export function matchPlayUrl(
	origin: string,
	championshipId: number,
	eventId: number,
	playPath: string,
): string {
	return `${origin}${playPath
		.replace("$championshipId", String(championshipId))
		.replace("$eventId", String(eventId))}`;
}

export function isMatchSlotGoalkeeper(slot: number): boolean {
	return slot === 0;
}

export function matchSlotCount(playersPerTeam: number): number {
	if (playersPerTeam < CHAMPIONSHIP_EVENT.playersPerTeamMin) {
		return CHAMPIONSHIP_EVENT.playersPerTeamMin;
	}

	if (playersPerTeam > CHAMPIONSHIP_EVENT.playersPerTeamMax) {
		return CHAMPIONSHIP_EVENT.playersPerTeamMax;
	}

	return playersPerTeam;
}

export function toggleMatchTeamSelection(
	selected: readonly number[],
	teamId: number,
): number[] {
	if (selected.includes(teamId)) {
		return selected.filter((id) => id !== teamId);
	}

	if (selected.length < CHAMPIONSHIP_EVENT.minTeams) {
		return [...selected, teamId];
	}

	const last = selected[selected.length - 1];
	if (last === undefined) {
		return [teamId];
	}

	return [last, teamId];
}

export function canConfirmMatchTeams(selected: readonly number[]): boolean {
	return selected.length === CHAMPIONSHIP_EVENT.minTeams;
}

export type MatchGoalDraft = {
	scorerPlayerId: number;
	kind: EventGoalKind;
	assistPlayerId: number | null;
};

export function matchGoalPayload(draft: MatchGoalDraft): {
	scorerPlayerId: number;
	assistPlayerId: number | null;
	isOwnGoal: boolean;
} {
	switch (draft.kind) {
		case EVENT_GOAL_KIND.ownGoal:
			return {
				scorerPlayerId: draft.scorerPlayerId,
				assistPlayerId: null,
				isOwnGoal: true,
			};
		case EVENT_GOAL_KIND.none:
			return {
				scorerPlayerId: draft.scorerPlayerId,
				assistPlayerId: null,
				isOwnGoal: false,
			};
		case EVENT_GOAL_KIND.assist:
			return {
				scorerPlayerId: draft.scorerPlayerId,
				assistPlayerId: draft.assistPlayerId,
				isOwnGoal: false,
			};
		default: {
			const _exhaustive: never = draft.kind;
			return _exhaustive;
		}
	}
}

export function formatMatchScore(scoreA: number, scoreB: number): string {
	return `${scoreA} x ${scoreB}`;
}

export function matchTeamStarName(
	players: readonly ChampionshipEventMatchPlayer[],
	teamId: number,
	roster: ReadonlyMap<number, MatchStarRosterPlayer>,
): string | null {
	const team = matchTeamPlayers(players, teamId);
	const star = team.reduce<ChampionshipEventMatchPlayer | null>(
		(best, player) => {
			if (!best) {
				return player;
			}

			const playerRating = roster.get(player.player_id)?.rating ?? 0;
			const bestRating = roster.get(best.player_id)?.rating ?? 0;
			if (playerRating !== bestRating) {
				return playerRating > bestRating ? player : best;
			}

			if (player.slot !== best.slot) {
				return player.slot < best.slot ? player : best;
			}

			return player.player_id < best.player_id ? player : best;
		},
		null,
	);

	if (!star) {
		return null;
	}

	const named = roster.get(star.player_id);
	if (!named) {
		return star.display_name;
	}

	return playerVisibleName(named);
}

export function matchGoalForTeamA(
	goal: ChampionshipEventGoal,
	teamAPlayerIds: ReadonlySet<number>,
): boolean {
	const scorerInA = teamAPlayerIds.has(goal.scorer_player_id);
	if (goal.is_own_goal) {
		return !scorerInA;
	}

	return scorerInA;
}

export function matchGoalTimeline(
	goals: readonly ChampionshipEventGoal[],
): ChampionshipEventGoal[] {
	return [...goals].sort((left, right) => {
		if (left.created_at !== right.created_at) {
			return left.created_at < right.created_at ? -1 : 1;
		}

		return left.id - right.id;
	});
}

export function formatGoalTimelineLine(values: {
	scorerName: string;
	assistName: string | null;
	isOwnGoal: boolean;
}): string {
	if (values.isOwnGoal) {
		return `${values.scorerName} · ${EVENT_GOAL_LABEL.ownGoal}`;
	}

	if (values.assistName) {
		return `${values.scorerName} · ${values.assistName}`;
	}

	return values.scorerName;
}

export function isOpenMatch(
	match: Pick<ChampionshipEventMatch, "ended_at">,
): boolean {
	return match.ended_at === null;
}
