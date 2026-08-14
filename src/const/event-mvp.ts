import { playerVisibleName } from "./player-name.ts";
import { starFillToRating } from "./player-rating.ts";
import { rosterGoalInvolvement } from "./roster-stats.ts";

export const EVENT_MVP = {
	starBonus: 0.1,
} as const;

export const EVENT_MVP_LABEL = {
	badge: "MVP",
	title: "MVP da rodada",
	hint: "Maior participação no time que mais ganhou.",
	empty: "Nenhum MVP nesta rodada.",
	pick: "Escolher MVP",
	toggleHint: "Toque para marcar ou desmarcar. A nota muda na hora.",
	save: "Salvar",
	cancel: "Cancelar",
} as const;

export function eventMvpStarDelta(ceiling: number): number {
	return starFillToRating(EVENT_MVP.starBonus, ceiling);
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
