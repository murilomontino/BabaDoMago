import { includeWhen } from "../lib/include-when.ts";
import type { ChampionshipPlayer } from "../types/championship.ts";
import type { ChampionshipEvent } from "../types/championship-event.ts";
import {
	formatGoalkeeperAverage,
	formatGoalkeeperCount,
	formatGoalkeeperWinRate,
	GOALKEEPER_STATS_LABEL,
} from "./goalkeeper-stats.ts";
import { playerVisibleName } from "./player-name.ts";
import { countsForSynergy, SYNERGY_MIN_MATCHES } from "./player-synergy.ts";
import { rosterAverage, rosterWinRate } from "./roster-stats.ts";

export const GOALKEEPER_RANKING_LABEL = {
	title: "Ranking de goleiros",
	empty: "Nenhum goleiro com 3 jogos na janela",
	hint: GOALKEEPER_STATS_LABEL.hint,
	winRateHint: "WinRate do gol (V/J), não o aproveitamento da nota.",
	trendUp: "Em alta",
	trendDown: "Em baixa",
	trendFlat: "Média estável",
	matches: GOALKEEPER_STATS_LABEL.matches,
	wins: "V",
	draws: "E",
	losses: "D",
	goalsConceded: GOALKEEPER_STATS_LABEL.goalsConceded,
	goalsConcededAverage: GOALKEEPER_STATS_LABEL.goalsConcededAverage,
	winRate: "WinRate",
	trend: "Tendência",
} as const;

export const GOALKEEPER_TREND = {
	up: "up",
	down: "down",
	flat: "flat",
	none: "none",
} as const;

export type GoalkeeperTrend =
	(typeof GOALKEEPER_TREND)[keyof typeof GOALKEEPER_TREND];

export const GOALKEEPER_TREND_MIN_POINTS = 3 as const;

export type GoalkeeperRankingRow = {
	player: ChampionshipPlayer;
	matches: number;
	wins: number;
	draws: number;
	losses: number;
	goalsConceded: number;
	goalsConcededAverage: number;
	winRate: number;
	trend: GoalkeeperTrend;
};

type GkMatchRow = {
	eventId: number;
	startsAt: string;
	won: boolean;
	draw: boolean;
	goalsConceded: number;
};

export function championshipGoalkeeperRanking(
	players: readonly ChampionshipPlayer[],
	events: readonly ChampionshipEvent[],
): GoalkeeperRankingRow[] {
	const byPlayer = new Map<number, GkMatchRow[]>();

	for (const event of events) {
		const rosterByPlayer = rosterTeamByPlayerId(event);
		for (const match of event.matches) {
			for (const player of match.players) {
				if (!player.is_goalkeeper) {
					continue;
				}

				if (
					!countsForSynergy(
						player,
						match,
						rosterByPlayer.get(player.player_id) ?? null,
						event.skip_guest_goalkeeper_matches,
					)
				) {
					continue;
				}

				const list = byPlayer.get(player.player_id) ?? [];
				list.push({
					eventId: event.id,
					startsAt: event.starts_at,
					won: match.winner_team_id === player.team_id,
					draw: match.winner_team_id === null,
					goalsConceded: matchGoalsConceded(match, player.team_id),
				});
				byPlayer.set(player.player_id, list);
			}
		}
	}

	const rows = players.flatMap((player) => {
		const matches = byPlayer.get(player.id) ?? [];
		if (matches.length < SYNERGY_MIN_MATCHES) {
			return [];
		}

		const wins = matches.filter((row) => row.won).length;
		const draws = matches.filter((row) => row.draw).length;
		const goalsConceded = matches.reduce(
			(sum, row) => sum + row.goalsConceded,
			0,
		);
		return [
			{
				player,
				matches: matches.length,
				wins,
				draws,
				losses: matches.length - wins - draws,
				goalsConceded,
				goalsConcededAverage: rosterAverage(goalsConceded, matches.length),
				winRate: rosterWinRate(wins, matches.length),
				trend: goalkeeperAverageTrend(
					goalkeeperEventAverages(matches),
				),
			},
		];
	});

	return rows.sort(compareGoalkeeperRows);
}

export function goalkeeperTrendLabel(trend: GoalkeeperTrend): string {
	switch (trend) {
		case GOALKEEPER_TREND.up:
			return GOALKEEPER_RANKING_LABEL.trendUp;
		case GOALKEEPER_TREND.down:
			return GOALKEEPER_RANKING_LABEL.trendDown;
		case GOALKEEPER_TREND.flat:
			return GOALKEEPER_RANKING_LABEL.trendFlat;
		case GOALKEEPER_TREND.none:
			return "";
		default: {
			const _never: never = trend;
			return _never;
		}
	}
}

export {
	formatGoalkeeperAverage,
	formatGoalkeeperCount,
	formatGoalkeeperWinRate,
};

function goalkeeperEventAverages(
	matches: readonly GkMatchRow[],
): { average: number }[] {
	const byEvent = new Map<
		number,
		{ startsAt: string; goals: number; matches: number }
	>();

	for (const row of matches) {
		const prev = byEvent.get(row.eventId) ?? {
			startsAt: row.startsAt,
			goals: 0,
			matches: 0,
		};
		byEvent.set(row.eventId, {
			startsAt: prev.startsAt,
			goals: prev.goals + row.goalsConceded,
			matches: prev.matches + 1,
		});
	}

	return [...byEvent.entries()]
		.map(([, value]) => ({
			startsAt: value.startsAt,
			average: rosterAverage(value.goals, value.matches),
		}))
		.sort((left, right) => left.startsAt.localeCompare(right.startsAt));
}

function goalkeeperAverageTrend(
	averages: readonly { average: number }[],
): GoalkeeperTrend {
	if (averages.length < GOALKEEPER_TREND_MIN_POINTS) {
		return GOALKEEPER_TREND.none;
	}

	const first = averages[0]?.average;
	const last = averages[averages.length - 1]?.average;
	if (first === undefined || last === undefined) {
		return GOALKEEPER_TREND.none;
	}

	if (last < first) {
		return GOALKEEPER_TREND.up;
	}

	if (last > first) {
		return GOALKEEPER_TREND.down;
	}

	return GOALKEEPER_TREND.flat;
}

function compareGoalkeeperRows(
	left: GoalkeeperRankingRow,
	right: GoalkeeperRankingRow,
): number {
	if (left.goalsConcededAverage !== right.goalsConcededAverage) {
		return left.goalsConcededAverage - right.goalsConcededAverage;
	}

	if (right.matches !== left.matches) {
		return right.matches - left.matches;
	}

	return playerVisibleName(left.player).localeCompare(
		playerVisibleName(right.player),
		"pt",
	);
}

function rosterTeamByPlayerId(
	event: ChampionshipEvent,
): ReadonlyMap<number, number> {
	return new Map(
		event.teams.flatMap((team) =>
			team.players.map((player) => [player.player_id, team.id] as const),
		),
	);
}

function matchGoalsConceded(
	match: ChampionshipEvent["matches"][number],
	teamId: number,
): number {
	const teamPlayerIds = new Set(
		match.players.flatMap((player) =>
			includeWhen(player.team_id === teamId, player.player_id),
		),
	);

	return match.goals.filter((goal) => {
		const scorerOnTeam = teamPlayerIds.has(goal.scorer_player_id);
		if (goal.is_own_goal) {
			return scorerOnTeam;
		}

		return !scorerOnTeam;
	}).length;
}
