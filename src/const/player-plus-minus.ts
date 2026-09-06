import type { ChampionshipPlayer } from "../types/championship.ts";
import type { ChampionshipEvent } from "../types/championship-event.ts";
import {
	matchGoalsConceded,
	matchGoalsForTeam,
} from "./match-goal-counts.ts";
import { playerVisibleName } from "./player-name.ts";
import { countsForSynergy, SYNERGY_MIN_MATCHES } from "./player-synergy.ts";
import {
	formatRosterAverage,
	formatRosterCount,
	rosterAverage,
} from "./roster-stats.ts";

export const PLUS_MINUS_LABEL = {
	title: "Saldo em campo",
	empty: "Poucos jogos com stats",
	hint: "Gols pró menos contra do time nas partidas em que jogou. Sem minuto de sub, conta a partida inteira.",
	for: "Pró",
	against: "Contra",
	diff: "Saldo",
	perMatch: "Por jogo",
	matches: "Jogos",
} as const;

export type PlayerPlusMinus = {
	player: ChampionshipPlayer;
	matches: number;
	goalsFor: number;
	goalsAgainst: number;
	diff: number;
	perMatch: number;
};

// ponytail: saldo por partida, nao por minuto. Upgrade quando houver substituted_at.
export function playerPlusMinus(
	events: readonly ChampionshipEvent[],
	players: readonly ChampionshipPlayer[],
	playerId: number,
): PlayerPlusMinus | null {
	const player = players.find((row) => row.id === playerId);
	if (!player) {
		return null;
	}

	let matches = 0;
	let goalsFor = 0;
	let goalsAgainst = 0;

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

			matches += 1;
			goalsFor += matchGoalsForTeam(match, seat.team_id);
			goalsAgainst += matchGoalsConceded(match, seat.team_id);
		}
	}

	if (matches < SYNERGY_MIN_MATCHES) {
		return null;
	}

	const diff = goalsFor - goalsAgainst;
	return {
		player,
		matches,
		goalsFor,
		goalsAgainst,
		diff,
		perMatch: rosterAverage(diff, matches),
	};
}

export function championshipPlusMinus(
	events: readonly ChampionshipEvent[],
	players: readonly ChampionshipPlayer[],
): PlayerPlusMinus[] {
	return players
		.flatMap((player) => {
			const row = playerPlusMinus(events, players, player.id);
			if (!row) {
				return [];
			}

			return [row];
		})
		.sort((left, right) => {
			if (right.diff !== left.diff) {
				return right.diff - left.diff;
			}

			return playerVisibleName(left.player).localeCompare(
				playerVisibleName(right.player),
				"pt",
			);
		});
}

export function formatPlusMinusDiff(value: number): string {
	if (value > 0) {
		return `+${formatRosterCount(value)}`;
	}

	return formatRosterCount(value);
}

export function formatPlusMinusPerMatch(value: number): string {
	if (value > 0) {
		return `+${formatRosterAverage(value)}`;
	}

	return formatRosterAverage(value);
}

export function formatPlusMinusCount(value: number): string {
	return formatRosterCount(value);
}
