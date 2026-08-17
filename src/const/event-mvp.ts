import { playerVisibleName } from "./player-name.ts";
import { rosterGoalInvolvement } from "./roster-stats.ts";

export const EVENT_MVP = {
	starBonus: 0.1,
	candidateLimit: 3,
} as const;

export const EVENT_MVP_LABEL = {
	badge: "MVP",
	title: "MVP da rodada",
	hint: "Maior participação no time que mais ganhou.",
	empty: "Nenhum MVP nesta rodada.",
	pick: "Escolher MVP",
	pickHint: "Os 3 com melhor estatística desta rodada.",
	pickEmpty: "Ninguém com estatística nesta rodada.",
	explain:
		"MVP é o destaque da rodada. Ganha +0,1 na nota. Até 3 jogadores, pelos melhores números.",
	toggleHint: "Toque para marcar ou desmarcar. A nota muda na hora.",
	save: "Salvar",
	cancel: "Cancelar",
} as const;

export type EventMvpCandidate = {
	playerId: number;
	goals: number;
	assists: number;
	wins: number;
	matches: number;
	involvement: number;
};

type EventMvpCandidateSource = {
	player_id: number;
	goals: number;
	assists: number;
	wins: number;
	matches: number;
};

function toEventMvpCandidate(row: EventMvpCandidateSource): EventMvpCandidate {
	return {
		playerId: row.player_id,
		goals: row.goals,
		assists: row.assists,
		wins: row.wins,
		matches: row.matches,
		involvement: rosterGoalInvolvement(row.goals, row.assists),
	};
}

function compareEventMvpCandidate(
	left: EventMvpCandidate,
	right: EventMvpCandidate,
): number {
	return (
		right.involvement - left.involvement ||
		right.goals - left.goals ||
		right.assists - left.assists ||
		right.wins - left.wins ||
		right.matches - left.matches ||
		left.playerId - right.playerId
	);
}

export function eventMvpCandidates(
	attendance: readonly EventMvpCandidateSource[],
): EventMvpCandidate[] {
	return attendance
		.map(toEventMvpCandidate)
		.filter((row) => row.involvement > 0 || row.wins > 0)
		.sort(compareEventMvpCandidate)
		.slice(0, EVENT_MVP.candidateLimit);
}

export function eventMvpPickCandidates(
	attendance: readonly EventMvpCandidateSource[],
	selectedIds: readonly number[],
): EventMvpCandidate[] {
	const top = eventMvpCandidates(attendance);
	const topIds = new Set(top.map((row) => row.playerId));
	const byId = new Map(
		attendance.map((row) => [row.player_id, toEventMvpCandidate(row)]),
	);

	return [
		...top,
		...selectedIds.flatMap((playerId) => {
			if (topIds.has(playerId)) {
				return [];
			}

			const row = byId.get(playerId);
			return row ? [row] : [];
		}),
	];
}

export function eventMvpStarDelta(): number {
	return EVENT_MVP.starBonus;
}

export function mvpCount(isMvp: boolean): number {
	if (!isMvp) {
		return 0;
	}

	return 1;
}

export function eventMvpBonus(isMvp: boolean): number {
	if (!isMvp) {
		return 0;
	}

	return eventMvpStarDelta();
}

export function formatEventMvpCount(selected: number): string {
	return `${selected}/${EVENT_MVP.candidateLimit} ${EVENT_MVP_LABEL.badge}`;
}

export function eventMvpPlayerIds({
	matches,
	teams,
	attendance,
}: {
	matches: readonly {
		ended_at: string | null;
		winner_team_id: number | null;
	}[];
	teams: readonly {
		id: number;
		players: readonly { player_id: number }[];
	}[];
	attendance: readonly {
		player_id: number;
		goals: number;
		assists: number;
	}[];
}): number[] {
	const winCounts = matches.reduce((counts, match) => {
		if (match.ended_at === null || match.winner_team_id === null) {
			return counts;
		}

		return counts.set(
			match.winner_team_id,
			(counts.get(match.winner_team_id) ?? 0) + 1,
		);
	}, new Map<number, number>());
	const maxWins = Math.max(0, ...winCounts.values());
	if (maxWins < 1) {
		return [];
	}

	const involvementByPlayer = new Map(
		attendance.map((row) => [
			row.player_id,
			rosterGoalInvolvement(row.goals, row.assists),
		]),
	);

	return [
		...new Set(
			teams.flatMap((team) => {
				if ((winCounts.get(team.id) ?? 0) !== maxWins) {
					return [];
				}

				const rows = team.players.map((player) => ({
					playerId: player.player_id,
					involvement: involvementByPlayer.get(player.player_id) ?? 0,
				}));
				const best = Math.max(0, ...rows.map((row) => row.involvement));
				if (best <= 0) {
					return [];
				}

				return rows.flatMap((row) =>
					row.involvement === best ? [row.playerId] : [],
				);
			}),
		),
	];
}

export function toggleEventMvpPlayerId(
	selected: readonly number[],
	playerId: number,
): number[] {
	if (selected.includes(playerId)) {
		return selected.filter((id) => id !== playerId);
	}

	if (selected.length >= EVENT_MVP.candidateLimit) {
		return [...selected];
	}

	return [...selected, playerId];
}

export function eventMvpNames(
	playerIds: readonly number[],
	players: readonly {
		id: number;
		nickname: string | null;
		display_name: string;
	}[],
	attendance: readonly { player_id: number; display_name: string }[],
): string[] {
	const playerById = new Map(players.map((player) => [player.id, player]));
	const attendanceById = new Map(attendance.map((row) => [row.player_id, row]));

	return playerIds.map((playerId) => {
		const player = playerById.get(playerId);
		if (player) {
			return playerVisibleName(player);
		}

		return attendanceById.get(playerId)?.display_name ?? String(playerId);
	});
}
