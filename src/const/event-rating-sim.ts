import type { ChampionshipPlayer } from "../types/championship.ts";
import type {
	ChampionshipEventAttendance,
	ChampionshipEventMatch,
	ChampionshipEventTeam,
} from "../types/championship-event.ts";
import { eventMatchPlayerStats } from "./event-match-player-stats.ts";
import { eventMvpCandidates } from "./event-mvp.ts";
import { playerVisibleName } from "./player-name.ts";
import { championshipRatingCeiling } from "./player-rating.ts";
import {
	formatPlayerRatingSimRate,
	PLAYER_RATING_SIM_LABEL,
	simulatePlayerEventRating,
} from "./player-rating-sim.ts";

export const EVENT_RATING_SIM_LABEL = {
	title: "Simulação",
	hint: "Prévia com as partidas atuais. Não grava nada.",
	empty: "Nenhuma partida encerrada",
	from: PLAYER_RATING_SIM_LABEL.from,
	to: PLAYER_RATING_SIM_LABEL.to,
	wins: PLAYER_RATING_SIM_LABEL.wins,
	draws: PLAYER_RATING_SIM_LABEL.draws,
	losses: PLAYER_RATING_SIM_LABEL.losses,
	matches: PLAYER_RATING_SIM_LABEL.matches,
	rate: PLAYER_RATING_SIM_LABEL.rate,
	delta: PLAYER_RATING_SIM_LABEL.delta,
	mvp: PLAYER_RATING_SIM_LABEL.mvp,
	belowMinMatches: PLAYER_RATING_SIM_LABEL.belowMinMatches,
	deadZone: PLAYER_RATING_SIM_LABEL.deadZone,
	seed: PLAYER_RATING_SIM_LABEL.seed,
} as const;

export const EVENT_RATING_SIM_ABBR = {
	wins: "V",
	draws: "E",
	losses: "D",
	matches: "J",
} as const;

export type EventRatingSimRow = {
	playerId: number;
	name: string;
	wins: number;
	draws: number;
	losses: number;
	matches: number;
	rate: number;
	delta: number;
	from: number;
	to: number;
	isMvp: boolean;
	belowMinMatches: boolean;
	inDeadZone: boolean;
	isSeed: boolean;
};

export function formatEventRatingSimRate(rate: number): string {
	return formatPlayerRatingSimRate(rate);
}

function compareEventRatingSimRows(
	left: EventRatingSimRow,
	right: EventRatingSimRow,
): number {
	const deltaGap = Math.abs(right.delta) - Math.abs(left.delta);
	if (deltaGap !== 0) {
		return deltaGap;
	}

	return left.name.localeCompare(right.name, "pt-BR");
}

export function eventRatingSimHasEndedMatches(
	matches: readonly ChampionshipEventMatch[],
): boolean {
	return matches.some((match) => match.ended_at !== null);
}

export function eventRatingSimMvpCandidateIds(input: {
	attendance: readonly ChampionshipEventAttendance[];
	matches: readonly ChampionshipEventMatch[];
	teams: readonly ChampionshipEventTeam[];
	skipGuestGoalkeeperMatches: boolean;
}): number[] {
	const statsById = eventMatchPlayerStats({
		matches: input.matches,
		teams: input.teams,
		skipGuestGoalkeeperMatches: input.skipGuestGoalkeeperMatches,
		playerIds: input.attendance.map((row) => row.player_id),
	});

	return eventMvpCandidates(
		input.attendance.map((row) => {
			const stats = statsById.get(row.player_id);
			return {
				player_id: row.player_id,
				goals: stats?.goals ?? 0,
				assists: stats?.assists ?? 0,
				wins: stats?.wins ?? 0,
				matches: stats?.matches ?? 0,
			};
		}),
	).map((candidate) => candidate.playerId);
}

export function eventRatingSimRows(input: {
	attendance: readonly ChampionshipEventAttendance[];
	players: readonly ChampionshipPlayer[];
	matches: readonly ChampionshipEventMatch[];
	teams: readonly ChampionshipEventTeam[];
	skipGuestGoalkeeperMatches: boolean;
	mvpPlayerIds: readonly number[];
}): EventRatingSimRow[] {
	const playerById = new Map(
		input.players.map((player) => [player.id, player] as const),
	);
	const mvpIds = new Set(input.mvpPlayerIds);
	const ceiling = championshipRatingCeiling(
		input.players.map((player) => player.rating),
	);
	const statsById = eventMatchPlayerStats({
		matches: input.matches,
		teams: input.teams,
		skipGuestGoalkeeperMatches: input.skipGuestGoalkeeperMatches,
		playerIds: input.attendance.map((row) => row.player_id),
	});

	return input.attendance
		.map((row) => {
			const player = playerById.get(row.player_id);
			const stats = statsById.get(row.player_id);
			const from = row.rating;
			const wins = stats?.wins ?? 0;
			const draws = stats?.draws ?? 0;
			const losses = stats?.losses ?? 0;
			const isMvp = mvpIds.has(row.player_id);
			const result = simulatePlayerEventRating({
				rating: from,
				wins,
				draws,
				losses,
				ceiling,
				isMvp,
			});

			return {
				playerId: row.player_id,
				name: playerVisibleName(
					player ?? {
						nickname: null,
						display_name: row.display_name,
					},
				),
				wins,
				draws,
				losses,
				matches: result.matches,
				rate: result.rate,
				delta: result.delta,
				from: result.from,
				to: result.to,
				isMvp,
				belowMinMatches: result.belowMinMatches,
				inDeadZone: result.inDeadZone,
				isSeed: result.isSeed,
			};
		})
		.sort(compareEventRatingSimRows);
}
