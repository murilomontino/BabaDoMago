import type {
	ChampionshipEvent,
	ChampionshipEventMatch,
	ChampionshipEventMatchPlayer,
} from "../types/championship-event.ts";
import {
	CONSISTENCY_MIN_PRESENCES,
	consistencySampleStdDev,
} from "./championship-consistency.ts";
import { compareStartsAtNewestFirst } from "./championship-event.ts";
import {
	eventRatingRate,
	formatEventRating,
} from "./event-rating-adjustment.ts";
import { matchGoalsConceded, matchGoalsForTeam } from "./match-goal-counts.ts";
import { countsForSynergy } from "./player-synergy.ts";
import {
	formatRosterAverage,
	formatRosterWinRate,
	rosterAverage,
	rosterSafeCount,
	rosterWinRate,
} from "./roster-stats.ts";

export const PLAYER_PERFORMANCE_WINDOW = {
	trend: 5,
	short: 10,
	default: 20,
	long: 30,
	movingAverage: 5,
} as const;

export type PlayerPerformanceWindowSize =
	| (typeof PLAYER_PERFORMANCE_WINDOW)["short"]
	| (typeof PLAYER_PERFORMANCE_WINDOW)["default"]
	| (typeof PLAYER_PERFORMANCE_WINDOW)["long"]
	| (typeof PLAYER_PERFORMANCE_WINDOW)["trend"];

export const PLAYER_PERFORMANCE_EVIDENCE = {
	minGames: 3,
	initialMax: 4,
	moderateMax: 7,
} as const;

export const PLAYER_PERFORMANCE_EVIDENCE_LEVEL = {
	insufficient: "insufficient",
	initial: "initial",
	moderate: "moderate",
	strong: "strong",
} as const;

export type PlayerPerformanceEvidence =
	(typeof PLAYER_PERFORMANCE_EVIDENCE_LEVEL)[keyof typeof PLAYER_PERFORMANCE_EVIDENCE_LEVEL];

export const PLAYER_PERFORMANCE_TREND = {
	up: "up",
	down: "down",
	flat: "flat",
} as const;

export type PlayerPerformanceTrend =
	(typeof PLAYER_PERFORMANCE_TREND)[keyof typeof PLAYER_PERFORMANCE_TREND];

export const PLAYER_PERFORMANCE_HEAT_ROW = {
	result: "result",
	attack: "attack",
	defense: "defense",
	rating: "rating",
} as const;

export type PlayerPerformanceHeatRow =
	(typeof PLAYER_PERFORMANCE_HEAT_ROW)[keyof typeof PLAYER_PERFORMANCE_HEAT_ROW];

export const PLAYER_PERFORMANCE_HEAT_CELL = {
	win: "win",
	draw: "draw",
	loss: "loss",
	good: "good",
	mid: "mid",
	bad: "bad",
	up: "up",
	flat: "flat",
	down: "down",
	empty: "empty",
} as const;

export type PlayerPerformanceHeatCell =
	(typeof PLAYER_PERFORMANCE_HEAT_CELL)[keyof typeof PLAYER_PERFORMANCE_HEAT_CELL];

export const PLAYER_PERFORMANCE_LABEL = {
	title: "Últimas 20 partidas",
	hint: "Participações reais do jogador. Rating e sorteio continuam por rodada.",
	empty: "Ainda sem partidas encerradas",
	evidence: "Evidência",
	games: "Partidas",
	winRate: "WinRate",
	pointsRate: "Aproveitamento",
	goalParticipation: "Participação gols",
	goalsPerGame: "Gols/J",
	assistsPerGame: "Assist/J",
	cleanSheets: "Clean Sheets",
	goalsConcededPerGame: "Gols sofridos/J",
	rating: "Rating",
	ratingDelta: "Delta",
	defenseTitle: "Desempenho defensivo",
	defenseHint:
		"Gols sofridos = contexto do time em campo, não culpa individual.",
	last5: "Últimas 5",
	last10: "Últimas 10",
	last20: "Últimas 20",
	heatmapTitle: "Heatmap das partidas",
	chartRating: "Evolução do rating",
	chartForm: "Forma (aproveitamento)",
	chartWinRate: "WinRate acumulado",
	chartParticipation: "Participação em gols",
	chartGoalsAssists: "Gols e assistências",
	movingAverage: "Média móvel 5",
	cumulative: "Acumulado",
	chartSeriesHintTitle: "Linhas do gráfico",
	cumulativeHint:
		"Acumulado: resultado de todas as partidas da janela até aquele ponto (ex.: 4 vitórias em 6 jogos = 67%).",
	movingAverageHint:
		"Média móvel 5: média só das últimas 5 partidas até aquele ponto — suaviza picos e mostra a forma recente.",
	goals: "Gols",
	assists: "Assistências",
	goalkeeperTitle: "Como goleiro (janela)",
	evidenceInsufficient: "Insuficiente",
	evidenceInitial: "Inicial",
	evidenceModerate: "Moderada",
	evidenceStrong: "Forte",
	heatResult: "Resultado",
	heatAttack: "Ataque",
	heatDefense: "Defesa",
	heatRating: "Rating",
	heatmapLegend: "Legenda",
	trendLegend: "Setas (últimas 5 vs últimas 20)",
	trendUp: "Forma recente acima da janela",
	trendDown: "Forma recente abaixo da janela",
	trendFlat: "Forma recente parecida com a janela",
	heatWin: "Vitória",
	heatDraw: "Empate",
	heatLoss: "Derrota",
	heatAttackGood: "2+ gols+assistências",
	heatAttackMid: "1 gol ou assistência",
	heatAttackBad: "Sem participação",
	heatDefenseGood: "Clean sheet",
	heatDefenseMid: "1 gol sofrido",
	heatDefenseBad: "2+ gols sofridos",
	heatRatingUp: "Nota subiu (próxima rodada)",
	heatRatingFlat: "Nota igual",
	heatRatingDown: "Nota caiu (próxima rodada)",
	heatEmpty: "Sem dado / goleiro",
} as const;

export const PLAYER_PERFORMANCE_CHART = {
	height: 220,
	indexKey: "index",
	margin: { top: 16, right: 12, bottom: 8, left: 0 },
} as const;

export type PlayerPerformanceSeat = {
	eventId: number;
	match: ChampionshipEventMatch;
	seat: ChampionshipEventMatchPlayer;
	startsAt: string;
	rosterTeamId: number | null;
};

export type PlayerPerformanceGoalkeeperMetrics = {
	matches: number;
	wins: number;
	winRate: number;
	goalsConcededPerGame: number;
	cleanSheetRate: number;
};

export type PlayerPerformanceRawMetrics = {
	playerId: number;
	games: number;
	wins: number;
	draws: number;
	losses: number;
	pointsRate: number;
	winRate: number;
	goals: number;
	assists: number;
	goalsPerGame: number | null;
	assistsPerGame: number | null;
	goalParticipation: number | null;
	goalsConcededPerGame: number | null;
	cleanSheetRate: number | null;
	consistencyDeviation: number | null;
	goalkeeperMetrics: PlayerPerformanceGoalkeeperMetrics | null;
	lineGames: number;
	rating: number | null;
	ratingDelta: number;
	evidence: PlayerPerformanceEvidence;
};

export type PlayerPerformance20 = PlayerPerformanceRawMetrics;

export type PlayerPerformanceMatchPoint = {
	index: number;
	eventId: number;
	matchId: number;
	startsAt: string;
	result: "win" | "draw" | "loss";
	isGoalkeeper: boolean;
	goals: number;
	assists: number;
	teamGoals: number;
	goalsConceded: number;
	cleanSheet: boolean;
	goalParticipation: number | null;
	ratingSnapshot: number | null;
	pointsRateCumulative: number;
	winRateCumulative: number;
	pointsRateMa5: number | null;
	winRateMa5: number | null;
	goalParticipationMa5: number | null;
};

export type PlayerPerformanceTrendArrow = {
	winRate: PlayerPerformanceTrend;
	pointsRate: PlayerPerformanceTrend;
	goalParticipation: PlayerPerformanceTrend;
	goalsPerGame: PlayerPerformanceTrend;
	assistsPerGame: PlayerPerformanceTrend;
	cleanSheetRate: PlayerPerformanceTrend;
	rating: PlayerPerformanceTrend;
};

export type PlayerPerformanceDefenseWindows = {
	cleanSheetRate5: number | null;
	cleanSheetRate10: number | null;
	cleanSheetRate20: number | null;
	goalsConcededPerGame5: number | null;
	goalsConcededPerGame10: number | null;
	goalsConcededPerGame20: number | null;
};

export type PlayerPerformanceHeatmap = {
	columns: number;
	rows: readonly {
		id: PlayerPerformanceHeatRow;
		label: string;
		cells: readonly PlayerPerformanceHeatCell[];
	}[];
};

export type PlayerPerformanceOptions = {
	windowSize?: number;
};

function rosterTeamByPlayerId(
	event: ChampionshipEvent,
): ReadonlyMap<number, number> {
	return new Map(
		event.teams.flatMap((team) =>
			team.players.map((row) => [row.player_id, team.id] as const),
		),
	);
}

function matchSeatGoals(
	match: ChampionshipEventMatch,
	playerId: number,
): { goals: number; assists: number } {
	const goals = match.goals.reduce((sum, goal) => {
		if (goal.is_own_goal) {
			return sum;
		}
		if (goal.scorer_player_id !== playerId) {
			return sum;
		}
		return sum + 1;
	}, 0);
	const assists = match.goals.reduce((sum, goal) => {
		if (goal.assist_player_id !== playerId) {
			return sum;
		}
		return sum + 1;
	}, 0);
	return { goals, assists };
}

function matchSortKey(match: ChampionshipEventMatch): string {
	return match.ended_at ?? match.created_at;
}

function compareMatchesNewestFirst(
	left: ChampionshipEventMatch,
	right: ChampionshipEventMatch,
	leftEventId: number,
	rightEventId: number,
): number {
	const byTime = matchSortKey(right).localeCompare(matchSortKey(left));
	if (byTime !== 0) {
		return byTime;
	}
	if (rightEventId !== leftEventId) {
		return rightEventId - leftEventId;
	}
	return right.id - left.id;
}

function matchResult(
	match: ChampionshipEventMatch,
	teamId: number,
): "win" | "draw" | "loss" {
	if (match.winner_team_id === null) {
		return "draw";
	}
	if (match.winner_team_id === teamId) {
		return "win";
	}
	return "loss";
}

export function playerPerformanceEvidence(
	games: number,
): PlayerPerformanceEvidence {
	if (games < PLAYER_PERFORMANCE_EVIDENCE.minGames) {
		return PLAYER_PERFORMANCE_EVIDENCE_LEVEL.insufficient;
	}
	if (games <= PLAYER_PERFORMANCE_EVIDENCE.initialMax) {
		return PLAYER_PERFORMANCE_EVIDENCE_LEVEL.initial;
	}
	if (games <= PLAYER_PERFORMANCE_EVIDENCE.moderateMax) {
		return PLAYER_PERFORMANCE_EVIDENCE_LEVEL.moderate;
	}
	return PLAYER_PERFORMANCE_EVIDENCE_LEVEL.strong;
}

export function playerPerformanceEvidenceLabel(
	evidence: PlayerPerformanceEvidence,
): string {
	switch (evidence) {
		case PLAYER_PERFORMANCE_EVIDENCE_LEVEL.insufficient:
			return PLAYER_PERFORMANCE_LABEL.evidenceInsufficient;
		case PLAYER_PERFORMANCE_EVIDENCE_LEVEL.initial:
			return PLAYER_PERFORMANCE_LABEL.evidenceInitial;
		case PLAYER_PERFORMANCE_EVIDENCE_LEVEL.moderate:
			return PLAYER_PERFORMANCE_LABEL.evidenceModerate;
		case PLAYER_PERFORMANCE_EVIDENCE_LEVEL.strong:
			return PLAYER_PERFORMANCE_LABEL.evidenceStrong;
		default: {
			const _never: never = evidence;
			return _never;
		}
	}
}

/**
 * Últimas N partidas disputadas pelo jogador (participação efetiva).
 * Ignora rodada aberta e partida não encerrada.
 */
export function playerPerformanceSeats(
	events: readonly ChampionshipEvent[],
	playerId: number,
	limit: number = PLAYER_PERFORMANCE_WINDOW.default,
): PlayerPerformanceSeat[] {
	const ordered = [...events].sort(compareStartsAtNewestFirst);
	const collected: PlayerPerformanceSeat[] = [];

	for (const event of ordered) {
		if (event.ended_at == null) {
			continue;
		}

		const rosterByPlayer = rosterTeamByPlayerId(event);
		const matchesNewestFirst = [...event.matches].sort((left, right) =>
			compareMatchesNewestFirst(left, right, event.id, event.id),
		);

		for (const match of matchesNewestFirst) {
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

			collected.push({
				eventId: event.id,
				match,
				seat,
				startsAt: event.starts_at,
				rosterTeamId: rosterByPlayer.get(playerId) ?? null,
			});
			if (collected.length >= limit) {
				return collected;
			}
		}
	}

	return collected;
}

function attendanceGoalInvolvementPerMatch(
	events: readonly ChampionshipEvent[],
	playerId: number,
	eventIds: ReadonlySet<number>,
): number | null {
	const samples = events.flatMap((event) => {
		if (!eventIds.has(event.id)) {
			return [];
		}
		if (event.ended_at == null) {
			return [];
		}
		const row = event.attendance.find((item) => item.player_id === playerId);
		if (!row) {
			return [];
		}
		const matches = rosterSafeCount(row.matches);
		if (matches === 0) {
			return [0];
		}
		return [
			(rosterSafeCount(row.goals) + rosterSafeCount(row.assists)) / matches,
		];
	});

	if (samples.length < CONSISTENCY_MIN_PRESENCES) {
		return null;
	}

	return consistencySampleStdDev(samples);
}

function goalParticipationOrNull(
	involvement: number,
	teamGoals: number,
	lineGamesWithGoals: number,
): number | null {
	if (lineGamesWithGoals === 0) {
		return null;
	}
	if (teamGoals <= 0) {
		return null;
	}
	return involvement / teamGoals;
}

function goalkeeperMetricsOrNull(
	matches: number,
	wins: number,
	conceded: number,
	cleanSheets: number,
): PlayerPerformanceGoalkeeperMetrics | null {
	if (matches < PLAYER_PERFORMANCE_EVIDENCE.minGames) {
		return null;
	}

	return {
		matches,
		wins,
		winRate: rosterWinRate(wins, matches),
		goalsConcededPerGame: rosterAverage(conceded, matches),
		cleanSheetRate: rosterWinRate(cleanSheets, matches),
	};
}

function attendanceRatingForEvent(
	events: readonly ChampionshipEvent[],
	eventId: number,
	playerId: number,
): { rating: number | null; ratingDelta: number } {
	const event = events.find((row) => row.id === eventId);
	if (!event) {
		return { rating: null, ratingDelta: 0 };
	}
	const row = event.attendance.find((item) => item.player_id === playerId);
	if (!row) {
		return { rating: null, ratingDelta: 0 };
	}
	return {
		rating: row.rating,
		ratingDelta: row.rating_delta,
	};
}

export function aggregatePlayerPerformanceRaw(
	seats: readonly PlayerPerformanceSeat[],
	events: readonly ChampionshipEvent[],
	playerId: number,
): PlayerPerformanceRawMetrics {
	let wins = 0;
	let draws = 0;
	let losses = 0;
	let lineGoals = 0;
	let lineAssists = 0;
	let lineTeamGoals = 0;
	let lineGames = 0;
	let lineGamesWithTeamGoals = 0;
	let participationInvolvement = 0;
	let goalsConceded = 0;
	let cleanSheets = 0;
	let gkMatches = 0;
	let gkWins = 0;
	let gkConceded = 0;
	let gkCleanSheets = 0;
	const eventIds = new Set<number>();

	for (const row of seats) {
		eventIds.add(row.eventId);
		const result = matchResult(row.match, row.seat.team_id);
		if (result === "win") {
			wins += 1;
		} else if (result === "draw") {
			draws += 1;
		} else {
			losses += 1;
		}

		const conceded = matchGoalsConceded(row.match, row.seat.team_id);
		goalsConceded += conceded;
		if (conceded === 0) {
			cleanSheets += 1;
		}

		if (row.seat.is_goalkeeper) {
			gkMatches += 1;
			if (result === "win") {
				gkWins += 1;
			}
			gkConceded += conceded;
			if (conceded === 0) {
				gkCleanSheets += 1;
			}
			continue;
		}

		lineGames += 1;
		const involvement = matchSeatGoals(row.match, playerId);
		lineGoals += involvement.goals;
		lineAssists += involvement.assists;
		const teamGoals = matchGoalsForTeam(row.match, row.seat.team_id);
		if (teamGoals > 0) {
			lineGamesWithTeamGoals += 1;
			lineTeamGoals += teamGoals;
			participationInvolvement += involvement.goals + involvement.assists;
		}
	}

	const games = seats.length;
	const newest = seats[0];
	const ratingRow = newest
		? attendanceRatingForEvent(events, newest.eventId, playerId)
		: { rating: null, ratingDelta: 0 };

	return {
		playerId,
		games,
		wins,
		draws,
		losses,
		pointsRate: eventRatingRate(wins, draws, losses, games),
		winRate: rosterWinRate(wins, games),
		goals: lineGoals,
		assists: lineAssists,
		goalsPerGame: lineGames > 0 ? lineGoals / lineGames : null,
		assistsPerGame: lineGames > 0 ? lineAssists / lineGames : null,
		goalParticipation: goalParticipationOrNull(
			participationInvolvement,
			lineTeamGoals,
			lineGamesWithTeamGoals,
		),
		goalsConcededPerGame:
			games > 0 ? rosterAverage(goalsConceded, games) : null,
		cleanSheetRate: games > 0 ? rosterWinRate(cleanSheets, games) : null,
		consistencyDeviation: attendanceGoalInvolvementPerMatch(
			events,
			playerId,
			eventIds,
		),
		goalkeeperMetrics: goalkeeperMetricsOrNull(
			gkMatches,
			gkWins,
			gkConceded,
			gkCleanSheets,
		),
		lineGames,
		rating: ratingRow.rating,
		ratingDelta: ratingRow.ratingDelta,
		evidence: playerPerformanceEvidence(games),
	};
}

export function calculatePlayerPerformance20(
	events: readonly ChampionshipEvent[],
	playerId: number,
	options: PlayerPerformanceOptions = {},
): PlayerPerformance20 {
	const windowSize = options.windowSize ?? PLAYER_PERFORMANCE_WINDOW.default;
	const seats = playerPerformanceSeats(events, playerId, windowSize);
	return aggregatePlayerPerformanceRaw(seats, events, playerId);
}

function movingAverage(
	values: readonly (number | null)[],
	endIndex: number,
	window: number,
): number | null {
	const start = Math.max(0, endIndex - window + 1);
	const slice = values
		.slice(start, endIndex + 1)
		.filter((value): value is number => value !== null);
	if (slice.length === 0) {
		return null;
	}
	return slice.reduce((sum, value) => sum + value, 0) / slice.length;
}

function rateFromCounts(
	wins: number,
	draws: number,
	losses: number,
	games: number,
): { pointsRate: number; winRate: number } {
	return {
		pointsRate: eventRatingRate(wins, draws, losses, games),
		winRate: rosterWinRate(wins, games),
	};
}

/**
 * Série cronológica (antiga → nova) das partidas da janela.
 * Rating = snapshot da rodada (constante dentro do evento).
 */
export function playerPerformanceMatchSeries(
	events: readonly ChampionshipEvent[],
	playerId: number,
	options: PlayerPerformanceOptions = {},
): PlayerPerformanceMatchPoint[] {
	const windowSize = options.windowSize ?? PLAYER_PERFORMANCE_WINDOW.default;
	const seatsNewestFirst = playerPerformanceSeats(events, playerId, windowSize);
	const seats = [...seatsNewestFirst].reverse();

	let wins = 0;
	let draws = 0;
	let losses = 0;
	const pointsRates: number[] = [];
	const winRates: number[] = [];
	const participations: (number | null)[] = [];

	return seats.map((row, index) => {
		const result = matchResult(row.match, row.seat.team_id);
		if (result === "win") {
			wins += 1;
		} else if (result === "draw") {
			draws += 1;
		} else {
			losses += 1;
		}

		const gamesSoFar = index + 1;
		const rates = rateFromCounts(wins, draws, losses, gamesSoFar);
		pointsRates.push(rates.pointsRate);
		winRates.push(rates.winRate);

		const isGoalkeeper = row.seat.is_goalkeeper;
		const involvement = isGoalkeeper
			? { goals: 0, assists: 0 }
			: matchSeatGoals(row.match, playerId);
		const teamGoals = isGoalkeeper
			? 0
			: matchGoalsForTeam(row.match, row.seat.team_id);
		const participation =
			isGoalkeeper || teamGoals <= 0
				? null
				: (involvement.goals + involvement.assists) / teamGoals;
		participations.push(participation);

		const conceded = matchGoalsConceded(row.match, row.seat.team_id);
		const ratingRow = attendanceRatingForEvent(events, row.eventId, playerId);

		return {
			index: index + 1,
			eventId: row.eventId,
			matchId: row.match.id,
			startsAt: row.startsAt,
			result,
			isGoalkeeper,
			goals: involvement.goals,
			assists: involvement.assists,
			teamGoals,
			goalsConceded: conceded,
			cleanSheet: conceded === 0,
			goalParticipation: participation,
			ratingSnapshot: ratingRow.rating,
			pointsRateCumulative: rates.pointsRate,
			winRateCumulative: rates.winRate,
			pointsRateMa5: movingAverage(
				pointsRates,
				index,
				PLAYER_PERFORMANCE_WINDOW.movingAverage,
			),
			winRateMa5: movingAverage(
				winRates,
				index,
				PLAYER_PERFORMANCE_WINDOW.movingAverage,
			),
			goalParticipationMa5: movingAverage(
				participations,
				index,
				PLAYER_PERFORMANCE_WINDOW.movingAverage,
			),
		};
	});
}

function sliceNewest(
	seats: readonly PlayerPerformanceSeat[],
	limit: number,
): PlayerPerformanceSeat[] {
	return seats.slice(0, limit);
}

function defenseFromSeats(seats: readonly PlayerPerformanceSeat[]): {
	cleanSheetRate: number | null;
	goalsConcededPerGame: number | null;
} {
	if (seats.length === 0) {
		return { cleanSheetRate: null, goalsConcededPerGame: null };
	}
	let conceded = 0;
	let cleanSheets = 0;
	for (const row of seats) {
		const value = matchGoalsConceded(row.match, row.seat.team_id);
		conceded += value;
		if (value === 0) {
			cleanSheets += 1;
		}
	}
	return {
		cleanSheetRate: rosterWinRate(cleanSheets, seats.length),
		goalsConcededPerGame: rosterAverage(conceded, seats.length),
	};
}

export function playerPerformanceDefenseWindows(
	events: readonly ChampionshipEvent[],
	playerId: number,
): PlayerPerformanceDefenseWindows {
	const seats = playerPerformanceSeats(
		events,
		playerId,
		PLAYER_PERFORMANCE_WINDOW.default,
	);
	const d5 = defenseFromSeats(
		sliceNewest(seats, PLAYER_PERFORMANCE_WINDOW.trend),
	);
	const d10 = defenseFromSeats(
		sliceNewest(seats, PLAYER_PERFORMANCE_WINDOW.short),
	);
	const d20 = defenseFromSeats(seats);

	return {
		cleanSheetRate5: d5.cleanSheetRate,
		cleanSheetRate10: d10.cleanSheetRate,
		cleanSheetRate20: d20.cleanSheetRate,
		goalsConcededPerGame5: d5.goalsConcededPerGame,
		goalsConcededPerGame10: d10.goalsConcededPerGame,
		goalsConcededPerGame20: d20.goalsConcededPerGame,
	};
}

function trendFromRates(
	recent: number | null,
	baseline: number | null,
	epsilon = 0.02,
): PlayerPerformanceTrend {
	if (recent === null || baseline === null) {
		return PLAYER_PERFORMANCE_TREND.flat;
	}
	const delta = recent - baseline;
	if (delta > epsilon) {
		return PLAYER_PERFORMANCE_TREND.up;
	}
	if (delta < -epsilon) {
		return PLAYER_PERFORMANCE_TREND.down;
	}
	return PLAYER_PERFORMANCE_TREND.flat;
}

export function playerPerformanceTrendArrows(
	events: readonly ChampionshipEvent[],
	playerId: number,
): PlayerPerformanceTrendArrow {
	const full = calculatePlayerPerformance20(events, playerId, {
		windowSize: PLAYER_PERFORMANCE_WINDOW.default,
	});
	const recent = calculatePlayerPerformance20(events, playerId, {
		windowSize: PLAYER_PERFORMANCE_WINDOW.trend,
	});

	return {
		winRate: trendFromRates(recent.winRate, full.winRate),
		pointsRate: trendFromRates(recent.pointsRate, full.pointsRate),
		goalParticipation: trendFromRates(
			recent.goalParticipation,
			full.goalParticipation,
		),
		goalsPerGame: trendFromRates(recent.goalsPerGame, full.goalsPerGame),
		assistsPerGame: trendFromRates(recent.assistsPerGame, full.assistsPerGame),
		cleanSheetRate: trendFromRates(recent.cleanSheetRate, full.cleanSheetRate),
		rating: trendFromRates(recent.rating, full.rating, 0.05),
	};
}

function attackHeatCell(
	goals: number,
	assists: number,
	isGoalkeeper: boolean,
): PlayerPerformanceHeatCell {
	if (isGoalkeeper) {
		return PLAYER_PERFORMANCE_HEAT_CELL.empty;
	}
	const involvement = goals + assists;
	if (involvement >= 2) {
		return PLAYER_PERFORMANCE_HEAT_CELL.good;
	}
	if (involvement === 1) {
		return PLAYER_PERFORMANCE_HEAT_CELL.mid;
	}
	return PLAYER_PERFORMANCE_HEAT_CELL.bad;
}

function defenseHeatCell(
	cleanSheet: boolean,
	conceded: number,
): PlayerPerformanceHeatCell {
	if (cleanSheet) {
		return PLAYER_PERFORMANCE_HEAT_CELL.good;
	}
	if (conceded <= 1) {
		return PLAYER_PERFORMANCE_HEAT_CELL.mid;
	}
	return PLAYER_PERFORMANCE_HEAT_CELL.bad;
}

function resultHeatCell(
	result: PlayerPerformanceMatchPoint["result"],
): PlayerPerformanceHeatCell {
	if (result === "win") {
		return PLAYER_PERFORMANCE_HEAT_CELL.win;
	}
	if (result === "draw") {
		return PLAYER_PERFORMANCE_HEAT_CELL.draw;
	}
	return PLAYER_PERFORMANCE_HEAT_CELL.loss;
}

function ratingHeatCells(
	points: readonly PlayerPerformanceMatchPoint[],
): PlayerPerformanceHeatCell[] {
	return points.map((point, index) => {
		if (point.ratingSnapshot === null) {
			return PLAYER_PERFORMANCE_HEAT_CELL.empty;
		}
		if (index === 0) {
			return PLAYER_PERFORMANCE_HEAT_CELL.flat;
		}
		const prev = points[index - 1]?.ratingSnapshot;
		if (prev === null || prev === undefined) {
			return PLAYER_PERFORMANCE_HEAT_CELL.flat;
		}
		if (point.ratingSnapshot > prev) {
			return PLAYER_PERFORMANCE_HEAT_CELL.up;
		}
		if (point.ratingSnapshot < prev) {
			return PLAYER_PERFORMANCE_HEAT_CELL.down;
		}
		return PLAYER_PERFORMANCE_HEAT_CELL.flat;
	});
}

export function playerPerformanceHeatmap(
	events: readonly ChampionshipEvent[],
	playerId: number,
	options: PlayerPerformanceOptions = {},
): PlayerPerformanceHeatmap {
	const points = playerPerformanceMatchSeries(events, playerId, options);
	const columns = points.length;

	return {
		columns,
		rows: [
			{
				id: PLAYER_PERFORMANCE_HEAT_ROW.result,
				label: PLAYER_PERFORMANCE_LABEL.heatResult,
				cells: points.map((point) => resultHeatCell(point.result)),
			},
			{
				id: PLAYER_PERFORMANCE_HEAT_ROW.attack,
				label: PLAYER_PERFORMANCE_LABEL.heatAttack,
				cells: points.map((point) =>
					attackHeatCell(point.goals, point.assists, point.isGoalkeeper),
				),
			},
			{
				id: PLAYER_PERFORMANCE_HEAT_ROW.defense,
				label: PLAYER_PERFORMANCE_LABEL.heatDefense,
				cells: points.map((point) =>
					defenseHeatCell(point.cleanSheet, point.goalsConceded),
				),
			},
			{
				id: PLAYER_PERFORMANCE_HEAT_ROW.rating,
				label: PLAYER_PERFORMANCE_LABEL.heatRating,
				cells: ratingHeatCells(points),
			},
		],
	};
}

export function formatPlayerPerformanceRate(value: number | null): string {
	if (value === null) {
		return "—";
	}
	return formatRosterWinRate(value);
}

export function formatPlayerPerformanceAverage(value: number | null): string {
	if (value === null) {
		return "—";
	}
	return formatRosterAverage(value);
}

export function formatPlayerPerformanceRating(value: number | null): string {
	if (value === null) {
		return "—";
	}
	return formatEventRating(value);
}

export function playerPerformanceTrendGlyph(
	trend: PlayerPerformanceTrend,
): string {
	if (trend === PLAYER_PERFORMANCE_TREND.up) {
		return "↗";
	}
	if (trend === PLAYER_PERFORMANCE_TREND.down) {
		return "↘";
	}
	return "→";
}

export const PLAYER_PERFORMANCE_TREND_LEGEND = [
	{
		trend: PLAYER_PERFORMANCE_TREND.up,
		glyph: "↗",
		caption: PLAYER_PERFORMANCE_LABEL.trendUp,
	},
	{
		trend: PLAYER_PERFORMANCE_TREND.down,
		glyph: "↘",
		caption: PLAYER_PERFORMANCE_LABEL.trendDown,
	},
	{
		trend: PLAYER_PERFORMANCE_TREND.flat,
		glyph: "→",
		caption: PLAYER_PERFORMANCE_LABEL.trendFlat,
	},
] as const;

export const PLAYER_PERFORMANCE_HEAT_CELL_CLASS = {
	[PLAYER_PERFORMANCE_HEAT_CELL.win]: "bg-pitch/80 text-white",
	[PLAYER_PERFORMANCE_HEAT_CELL.draw]: "bg-surface-muted text-fg",
	[PLAYER_PERFORMANCE_HEAT_CELL.loss]: "bg-danger/80 text-white",
	[PLAYER_PERFORMANCE_HEAT_CELL.good]: "bg-pitch/70 text-white",
	[PLAYER_PERFORMANCE_HEAT_CELL.mid]: "bg-amber-500/70 text-white",
	[PLAYER_PERFORMANCE_HEAT_CELL.bad]: "bg-danger/60 text-white",
	[PLAYER_PERFORMANCE_HEAT_CELL.up]: "bg-pitch/50 text-fg",
	[PLAYER_PERFORMANCE_HEAT_CELL.flat]: "bg-surface-muted text-fg-muted",
	[PLAYER_PERFORMANCE_HEAT_CELL.down]: "bg-danger/40 text-fg",
	[PLAYER_PERFORMANCE_HEAT_CELL.empty]: "bg-transparent text-fg-muted",
} as const;

export function playerPerformanceHeatCellClass(
	cell: PlayerPerformanceHeatCell,
): string {
	return PLAYER_PERFORMANCE_HEAT_CELL_CLASS[cell];
}

export function playerPerformanceHeatCellLabel(
	cell: PlayerPerformanceHeatCell,
): string {
	switch (cell) {
		case PLAYER_PERFORMANCE_HEAT_CELL.win:
			return "V";
		case PLAYER_PERFORMANCE_HEAT_CELL.draw:
			return "E";
		case PLAYER_PERFORMANCE_HEAT_CELL.loss:
			return "D";
		case PLAYER_PERFORMANCE_HEAT_CELL.good:
			return "●";
		case PLAYER_PERFORMANCE_HEAT_CELL.mid:
			return "◐";
		case PLAYER_PERFORMANCE_HEAT_CELL.bad:
			return "○";
		case PLAYER_PERFORMANCE_HEAT_CELL.up:
			return "↑";
		case PLAYER_PERFORMANCE_HEAT_CELL.flat:
			return "─";
		case PLAYER_PERFORMANCE_HEAT_CELL.down:
			return "↓";
		case PLAYER_PERFORMANCE_HEAT_CELL.empty:
			return "·";
		default: {
			const _never: never = cell;
			return _never;
		}
	}
}

export const PLAYER_PERFORMANCE_HEAT_LEGEND = [
	{
		id: "result",
		title: PLAYER_PERFORMANCE_LABEL.heatResult,
		items: [
			{
				cell: PLAYER_PERFORMANCE_HEAT_CELL.win,
				caption: PLAYER_PERFORMANCE_LABEL.heatWin,
			},
			{
				cell: PLAYER_PERFORMANCE_HEAT_CELL.draw,
				caption: PLAYER_PERFORMANCE_LABEL.heatDraw,
			},
			{
				cell: PLAYER_PERFORMANCE_HEAT_CELL.loss,
				caption: PLAYER_PERFORMANCE_LABEL.heatLoss,
			},
		],
	},
	{
		id: "attack",
		title: PLAYER_PERFORMANCE_LABEL.heatAttack,
		items: [
			{
				cell: PLAYER_PERFORMANCE_HEAT_CELL.good,
				caption: PLAYER_PERFORMANCE_LABEL.heatAttackGood,
			},
			{
				cell: PLAYER_PERFORMANCE_HEAT_CELL.mid,
				caption: PLAYER_PERFORMANCE_LABEL.heatAttackMid,
			},
			{
				cell: PLAYER_PERFORMANCE_HEAT_CELL.bad,
				caption: PLAYER_PERFORMANCE_LABEL.heatAttackBad,
			},
		],
	},
	{
		id: "defense",
		title: PLAYER_PERFORMANCE_LABEL.heatDefense,
		items: [
			{
				cell: PLAYER_PERFORMANCE_HEAT_CELL.good,
				caption: PLAYER_PERFORMANCE_LABEL.heatDefenseGood,
			},
			{
				cell: PLAYER_PERFORMANCE_HEAT_CELL.mid,
				caption: PLAYER_PERFORMANCE_LABEL.heatDefenseMid,
			},
			{
				cell: PLAYER_PERFORMANCE_HEAT_CELL.bad,
				caption: PLAYER_PERFORMANCE_LABEL.heatDefenseBad,
			},
		],
	},
	{
		id: "rating",
		title: PLAYER_PERFORMANCE_LABEL.heatRating,
		items: [
			{
				cell: PLAYER_PERFORMANCE_HEAT_CELL.up,
				caption: PLAYER_PERFORMANCE_LABEL.heatRatingUp,
			},
			{
				cell: PLAYER_PERFORMANCE_HEAT_CELL.flat,
				caption: PLAYER_PERFORMANCE_LABEL.heatRatingFlat,
			},
			{
				cell: PLAYER_PERFORMANCE_HEAT_CELL.down,
				caption: PLAYER_PERFORMANCE_LABEL.heatRatingDown,
			},
			{
				cell: PLAYER_PERFORMANCE_HEAT_CELL.empty,
				caption: PLAYER_PERFORMANCE_LABEL.heatEmpty,
			},
		],
	},
] as const;
