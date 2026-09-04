import type { ChampionshipPlayer } from "../types/championship.ts";
import { CHAMPIONSHIP_ROLE } from "./championship-role.ts";
import { mvpCount } from "./event-mvp.ts";
import {
	attendanceRatingEvolution,
	type PodiumSourcePlayer,
} from "./podium.ts";

export function fallbackRosterPlayer(
	playerId: number,
	displayName: string,
): ChampionshipPlayer {
	return {
		id: playerId,
		championship_id: 0,
		user_id: null,
		display_name: displayName,
		nickname: null,
		nickname_tags: [],
		avatar_url: null,
		rating: 0,
		goalkeeper_rating: 0,
		role: CHAMPIONSHIP_ROLE.member,
		is_goalkeeper: false,
		is_monthly: false,
		deleted_at: null,
		goals: 0,
		assists: 0,
		assisted_goals: 0,
		own_goals: 0,
		wins: 0,
		losses: 0,
		draws: 0,
		matches: 0,
		mvps: 0,
	};
}

export function resolveRosterPlayer(
	playerId: number,
	displayName: string,
	byId: ReadonlyMap<number, ChampionshipPlayer>,
): ChampionshipPlayer {
	return byId.get(playerId) ?? fallbackRosterPlayer(playerId, displayName);
}

export function resolveEventPlayers(
	rows: readonly { player_id: number; display_name: string }[],
	byId: ReadonlyMap<number, ChampionshipPlayer>,
): ChampionshipPlayer[] {
	return rows.map((row) =>
		resolveRosterPlayer(row.player_id, row.display_name, byId),
	);
}

export function eventAttendanceDisplayRating(
	inRoster: boolean,
	rosterRating: number,
	attendanceRating: number,
): number {
	if (!inRoster) {
		return attendanceRating;
	}

	return rosterRating;
}

export function playersFromEventAttendance(
	attendance: readonly {
		player_id: number;
		display_name: string;
		goals: number;
		assists: number;
		assisted_goals: number;
		own_goals: number;
		wins: number;
		losses: number;
		draws: number;
		matches: number;
		is_mvp: boolean;
		rating: number;
		rating_delta?: number;
		vote_rating_delta?: number;
	}[],
	byId: ReadonlyMap<number, ChampionshipPlayer>,
): PodiumSourcePlayer[] {
	return attendance.map((row) => {
		const inRoster = byId.has(row.player_id);
		const player = resolveRosterPlayer(row.player_id, row.display_name, byId);
		return {
			...player,
			goals: row.goals,
			assists: row.assists,
			assisted_goals: row.assisted_goals,
			own_goals: row.own_goals,
			wins: row.wins,
			losses: row.losses,
			draws: row.draws,
			matches: row.matches,
			mvps: mvpCount(row.is_mvp),
			rating: eventAttendanceDisplayRating(inRoster, player.rating, row.rating),
			ratingEvolution: attendanceRatingEvolution({
				rating: row.rating,
				rating_delta: row.rating_delta ?? 0,
				vote_rating_delta: row.vote_rating_delta ?? 0,
			}),
		};
	});
}
