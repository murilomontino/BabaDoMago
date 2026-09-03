import type {
	ChampionshipEvent,
	ChampionshipEventMatch,
	ChampionshipEventTeam,
} from "../types/championship-event.ts";
import {
	matchScore,
	matchTeamPlayers,
} from "./championship-event-match.ts";
import { eventTeamName, type EventTeamColor } from "./event-team-color.ts";
import { averageOrZero } from "./player-rating.ts";
import { formatRosterWinRate } from "./roster-stats.ts";

export const EVENT_TEAM_STANDINGS_POINTS = {
	win: 3,
	draw: 1,
	loss: 0,
} as const;

export const EVENT_TEAM_STANDINGS_LABEL = {
	title: "Classificação",
	empty: "Nenhuma partida encerrada",
	team: "Time",
	matches: "Jogos",
	wins: "Vitórias",
	draws: "Empates",
	losses: "Derrotas",
	goalsFor: "Gols pró",
	goalsAgainst: "Gols sofridos",
	goalDifference: "Saldo de gols",
	points: "Pontos",
	pointsRate: "Aproveitamento",
} as const;

export const EVENT_TEAM_STANDINGS_ABBR = {
	matches: "J",
	wins: "V",
	draws: "E",
	losses: "D",
	goalsFor: "GP",
	goalsAgainst: "GC",
	goalDifference: "SG",
	points: "Pts",
	pointsRate: "%",
} as const;

export type EventTeamStandingRow = {
	teamId: number;
	color: EventTeamColor | null;
	sortOrder: number;
	label: string;
	matches: number;
	wins: number;
	draws: number;
	losses: number;
	goalsFor: number;
	goalsAgainst: number;
	goalDifference: number;
	points: number;
	pointsRate: number;
};

type StandingAcc = {
	matches: number;
	wins: number;
	draws: number;
	losses: number;
	goalsFor: number;
	goalsAgainst: number;
};

function emptyStandingAcc(): StandingAcc {
	return {
		matches: 0,
		wins: 0,
		draws: 0,
		losses: 0,
		goalsFor: 0,
		goalsAgainst: 0,
	};
}

function standingPoints(wins: number, draws: number): number {
	return (
		wins * EVENT_TEAM_STANDINGS_POINTS.win +
		draws * EVENT_TEAM_STANDINGS_POINTS.draw
	);
}

export function standingPointsRate(points: number, matches: number): number {
	return averageOrZero(points, matches * EVENT_TEAM_STANDINGS_POINTS.win);
}

function applyMatchResult(
	acc: StandingAcc,
	winnerTeamId: number | null,
	teamId: number,
	goalsFor: number,
	goalsAgainst: number,
): StandingAcc {
	const next: StandingAcc = {
		matches: acc.matches + 1,
		wins: acc.wins,
		draws: acc.draws,
		losses: acc.losses,
		goalsFor: acc.goalsFor + goalsFor,
		goalsAgainst: acc.goalsAgainst + goalsAgainst,
	};

	if (winnerTeamId === null) {
		next.draws += 1;
		return next;
	}

	if (winnerTeamId === teamId) {
		next.wins += 1;
		return next;
	}

	next.losses += 1;
	return next;
}

function compareStandingRows(
	left: EventTeamStandingRow,
	right: EventTeamStandingRow,
): number {
	return (
		right.points - left.points ||
		right.wins - left.wins ||
		right.goalDifference - left.goalDifference ||
		right.goalsFor - left.goalsFor ||
		left.sortOrder - right.sortOrder
	);
}

function endedMatches(
	matches: readonly ChampionshipEventMatch[],
): ChampionshipEventMatch[] {
	return matches.filter((match) => match.ended_at !== null);
}

function teamMatchGoals(
	match: ChampionshipEventMatch,
	teamId: number,
): { goalsFor: number; goalsAgainst: number } {
	const teamAIds = new Set(
		matchTeamPlayers(match.players, match.team_a_id).map(
			(player) => player.player_id,
		),
	);
	const score = matchScore(match.goals, teamAIds);

	if (teamId === match.team_a_id) {
		return { goalsFor: score.teamA, goalsAgainst: score.teamB };
	}

	return { goalsFor: score.teamB, goalsAgainst: score.teamA };
}

function accumulateTeamStandings(
	teams: readonly ChampionshipEventTeam[],
	matches: readonly ChampionshipEventMatch[],
): Map<number, StandingAcc> {
	const byTeam = new Map(
		teams.map((team) => [team.id, emptyStandingAcc()] as const),
	);

	return endedMatches(matches).reduce((acc, match) => {
		const teamA = acc.get(match.team_a_id);
		const teamB = acc.get(match.team_b_id);
		if (!teamA || !teamB) {
			return acc;
		}

		const goalsA = teamMatchGoals(match, match.team_a_id);
		const goalsB = teamMatchGoals(match, match.team_b_id);

		acc.set(
			match.team_a_id,
			applyMatchResult(
				teamA,
				match.winner_team_id,
				match.team_a_id,
				goalsA.goalsFor,
				goalsA.goalsAgainst,
			),
		);
		acc.set(
			match.team_b_id,
			applyMatchResult(
				teamB,
				match.winner_team_id,
				match.team_b_id,
				goalsB.goalsFor,
				goalsB.goalsAgainst,
			),
		);

		return acc;
	}, byTeam);
}

export function formatStandingGoalDifference(value: number): string {
	if (value > 0) {
		return `+${value}`;
	}

	return String(value);
}

export function formatStandingPointsRate(value: number): string {
	return formatRosterWinRate(value);
}

export function eventTeamStandings(
	teams: readonly ChampionshipEventTeam[],
	matches: readonly ChampionshipEventMatch[],
): EventTeamStandingRow[] {
	const byTeam = accumulateTeamStandings(teams, matches);

	return teams
		.map((team) => {
			const acc = byTeam.get(team.id) ?? emptyStandingAcc();
			const points = standingPoints(acc.wins, acc.draws);

			return {
				teamId: team.id,
				color: team.color,
				sortOrder: team.sort_order,
				label: eventTeamName(team.color, team.sort_order),
				matches: acc.matches,
				wins: acc.wins,
				draws: acc.draws,
				losses: acc.losses,
				goalsFor: acc.goalsFor,
				goalsAgainst: acc.goalsAgainst,
				goalDifference: acc.goalsFor - acc.goalsAgainst,
				points,
				pointsRate: standingPointsRate(points, acc.matches),
			};
		})
		.sort(compareStandingRows);
}

export type ChampionshipRoundStanding = {
	eventId: number;
	championshipId: number;
	startsAt: string;
	teams: readonly ChampionshipEventTeam[];
	matches: readonly ChampionshipEventMatch[];
	rows: EventTeamStandingRow[];
};

function eventHasEndedMatch(event: ChampionshipEvent): boolean {
	return event.matches.some((match) => match.ended_at !== null);
}

export function championshipRoundStandings(
	events: readonly ChampionshipEvent[],
): ChampionshipRoundStanding[] {
	return events.filter(eventHasEndedMatch).map((event) => ({
		eventId: event.id,
		championshipId: event.championship_id,
		startsAt: event.starts_at,
		teams: event.teams,
		matches: event.matches,
		rows: eventTeamStandings(event.teams, event.matches),
	}));
}
