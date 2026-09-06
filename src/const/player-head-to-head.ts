import type { ChampionshipPlayer } from "../types/championship.ts";
import type { ChampionshipEvent } from "../types/championship-event.ts";
import { playerVisibleName } from "./player-name.ts";
import {
	countsForSynergy,
	SYNERGY_MIN_MATCHES,
	SYNERGY_PARTNER_LIMIT,
} from "./player-synergy.ts";
import {
	formatRosterCount,
	formatRosterWinRate,
	rosterWinRate,
} from "./roster-stats.ts";

export const HEAD_TO_HEAD_LABEL = {
	title: "Contra quem ganha",
	empty: "Poucos jogos contra o mesmo adversário",
	hint: "WinRate contra cada adversário. Mínimo de jogos iguais à sinergia.",
	opponent: "Adversário",
	wins: "V",
	matches: "J",
	winRate: "WR",
} as const;

export type HeadToHeadRow = {
	opponent: ChampionshipPlayer;
	wins: number;
	matches: number;
	winRate: number;
};

type PairAcc = {
	wins: number;
	matches: number;
};

export function playerHeadToHead(
	events: readonly ChampionshipEvent[],
	players: readonly ChampionshipPlayer[],
	playerId: number,
): HeadToHeadRow[] {
	const byOpponent = new Map<number, PairAcc>();
	const playerById = new Map(players.map((player) => [player.id, player]));

	for (const event of events) {
		const rosterByPlayer = new Map(
			event.teams.flatMap((team) =>
				team.players.map((row) => [row.player_id, team.id] as const),
			),
		);

		for (const match of event.matches) {
			const seat = match.players.find((row) => row.player_id === playerId);
			if (!seat) {
				continue;
			}

			if (
				!countsForSynergy(
					seat,
					match,
					rosterByPlayer.get(playerId) ?? null,
					event.skip_guest_goalkeeper_matches,
				)
			) {
				continue;
			}

			const opponents = match.players.filter(
				(row) => row.team_id !== seat.team_id,
			);
			const won = match.winner_team_id === seat.team_id;

			for (const opponent of opponents) {
				if (
					!countsForSynergy(
						opponent,
						match,
						rosterByPlayer.get(opponent.player_id) ?? null,
						event.skip_guest_goalkeeper_matches,
					)
				) {
					continue;
				}

				const key = opponent.player_id;
				const prev = byOpponent.get(key) ?? { wins: 0, matches: 0 };
				byOpponent.set(key, {
					wins: prev.wins + Number(won),
					matches: prev.matches + 1,
				});
			}
		}
	}

	const rows = [...byOpponent.entries()].flatMap(([opponentId, acc]) => {
		if (acc.matches < SYNERGY_MIN_MATCHES) {
			return [];
		}

		const opponent = playerById.get(opponentId);
		if (!opponent || opponent.deleted_at !== null) {
			return [];
		}

		return [
			{
				opponent,
				wins: acc.wins,
				matches: acc.matches,
				winRate: rosterWinRate(acc.wins, acc.matches),
			},
		];
	});

	return rows
		.sort((left, right) => {
			if (right.winRate !== left.winRate) {
				return right.winRate - left.winRate;
			}

			if (right.matches !== left.matches) {
				return right.matches - left.matches;
			}

			return playerVisibleName(left.opponent).localeCompare(
				playerVisibleName(right.opponent),
				"pt",
			);
		})
		.slice(0, SYNERGY_PARTNER_LIMIT);
}

export function formatHeadToHeadCount(value: number): string {
	return formatRosterCount(value);
}

export function formatHeadToHeadWinRate(value: number): string {
	return formatRosterWinRate(value);
}
