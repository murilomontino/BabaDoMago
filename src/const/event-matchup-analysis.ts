import type { ChampionshipPlayer } from "../types/championship.ts";
import type {
	ChampionshipEvent,
	ChampionshipEventAttendance,
	ChampionshipEventGoal,
	ChampionshipEventMatch,
	ChampionshipEventMatchPlayer,
	ChampionshipEventTeam,
} from "../types/championship-event.ts";
import {
	type EventTeamBuilderTeam,
	eventTeamRatingSum,
	formatEventTeamRatingSum,
	teamSlotsToPlayerIds,
} from "./championship-event.ts";
import { endedChampionshipHistoryEvents } from "./championship-rating-history.ts";
import { championshipRecentForm } from "./championship-recent-form.ts";
import {
	championshipTrendsEvents,
	TRENDS_WINDOW,
} from "./championship-trends-window.ts";
import { eventActivePlayerRating } from "./event-rating-adjustment.ts";
import { eventTeamName } from "./event-team-color.ts";
import type { EventTeamShareCard } from "./event-team-share.ts";
import { matchGoalsConceded, matchGoalsForTeam } from "./match-goal-counts.ts";
import { playerVisibleName } from "./player-name.ts";
import { countsForSynergy, SYNERGY_MIN_MATCHES } from "./player-synergy.ts";
import {
	formatRosterWinRate,
	rosterAverage,
	rosterSafeCount,
} from "./roster-stats.ts";

export const MATCHUP_MIN_SAMPLE = SYNERGY_MIN_MATCHES;

export const MATCHUP_FORM_WINDOW = TRENDS_WINDOW.last5;

export const MATCHUP_SIDE = {
	home: "home",
	away: "away",
	neutral: "neutral",
} as const;

export type MatchupSide = (typeof MATCHUP_SIDE)[keyof typeof MATCHUP_SIDE];

export const MATCHUP_METRIC = {
	rating: "rating",
	attack: "attack",
	creation: "creation",
	defense: "defense",
	goalkeeper: "goalkeeper",
	form: "form",
} as const;

export type MatchupMetricKey =
	(typeof MATCHUP_METRIC)[keyof typeof MATCHUP_METRIC];

export const MATCHUP_BALANCE = {
	extreme: "extreme",
	balanced: "balanced",
	slight: "slight",
	clear: "clear",
	large: "large",
} as const;

export type MatchupBalanceLevel =
	(typeof MATCHUP_BALANCE)[keyof typeof MATCHUP_BALANCE];

export const MATCHUP_BALANCE_SPREAD = {
	extreme: 0.5,
	balanced: 1,
	slight: 2,
	clear: 3,
} as const;

/** Absolute gap below this → neutral for that metric. */
export const MATCHUP_NEUTRAL_THRESHOLD = {
	[MATCHUP_METRIC.rating]: 0.3,
	[MATCHUP_METRIC.attack]: 0.08,
	[MATCHUP_METRIC.creation]: 0.08,
	[MATCHUP_METRIC.defense]: 0.08,
	[MATCHUP_METRIC.goalkeeper]: 0.2,
	[MATCHUP_METRIC.form]: 0.04,
} as const;

/** Reference for relative gap (decisive / warning). */
export const MATCHUP_METRIC_REF = {
	[MATCHUP_METRIC.rating]: 2,
	[MATCHUP_METRIC.attack]: 0.5,
	[MATCHUP_METRIC.creation]: 0.4,
	[MATCHUP_METRIC.defense]: 0.5,
	[MATCHUP_METRIC.goalkeeper]: 1,
	[MATCHUP_METRIC.form]: 0.2,
} as const;

export const MATCHUP_LABEL = {
	title: "Análise do Confronto",
	favoriteByRating: "Favorito pelo rating",
	rating: "Rating",
	attack: "Ataque",
	creation: "Criação",
	defense: "Defesa",
	goalkeeper: "Goleiro",
	form: "Forma",
	decisive: "Fator decisivo",
	warning: "Ponto de atenção",
	keyPlayers: "Jogadores-chave",
	scorer: "Principal goleador",
	creator: "Principal criador",
	bestGoalkeeper: "Melhor goleiro",
	formPlayer: "Em alta",
	goalsPerGame: "Gols/jogo",
	assistsPerGame: "Assistências/jogo",
	goalShare: "Participação em gols",
	goalsConcededPerGame: "Gols sofridos/jogo",
	cleanSheetRate: "Clean sheets",
	goalkeeperRating: "Nota de goleiro",
	insufficient: "Dados insuficientes",
	noGoalkeeper: "Sem goleiro registrado",
	teamA: "Time A",
	teamB: "Time B",
	pickMatchup: "Escolher confronto",
	advantageHome: "Vantagem do Time A",
	advantageAway: "Vantagem do Time B",
	neutral: "Equilíbrio",
	attackFactor: "Fator ofensivo",
	defenseFactor: "Fator defensivo",
	summary: "Resumo",
	reviewTitle: "Análise pré-partida",
	reviewOutcome: "Favorito × resultado",
	reviewHit: "Coincidiu",
	reviewMiss: "Não coincidiu",
	reviewDraw: "Empate",
	reviewNeutral: "Sem favorito claro",
	reviewOpen: "Partida em andamento",
	[MATCHUP_BALANCE.extreme]: "Extremamente equilibrado",
	[MATCHUP_BALANCE.balanced]: "Equilibrado",
	[MATCHUP_BALANCE.slight]: "Leve vantagem",
	[MATCHUP_BALANCE.clear]: "Vantagem clara",
	[MATCHUP_BALANCE.large]: "Grande vantagem",
} as const;

export const MATCHUP_REVIEW_OUTCOME = {
	hit: "hit",
	miss: "miss",
	draw: "draw",
	neutral: "neutral",
	open: "open",
} as const;

export type MatchupReviewOutcome =
	(typeof MATCHUP_REVIEW_OUTCOME)[keyof typeof MATCHUP_REVIEW_OUTCOME];

export type MatchupMatchReview = {
	analysis: MatchupAnalysis;
	outcome: MatchupReviewOutcome;
	outcomeLabel: string;
};

export type MatchupTeamInput = {
	teamKey: string;
	title: string;
	color: string | null;
	playerIds: readonly number[];
	goalkeeperId: number | null;
	/** Draw-time ratings aligned with reveal/sim cards. */
	ratings: ReadonlyMap<number, number>;
};

export type MatchupMetric = {
	key: MatchupMetricKey;
	homeValue: number | null;
	awayValue: number | null;
	advantage: MatchupSide;
	difference: number;
	relativeGap: number;
	/** false when lower value is better (defense). */
	higherIsBetter: boolean;
};

export type MatchupPlayerHighlight = {
	playerId: number;
	name: string;
	value: number;
	label: string;
	side: MatchupSide;
};

export type MatchupTeamDetail = {
	ratingSum: number;
	goalsPerGame: number | null;
	assistsPerGame: number | null;
	goalShare: number | null;
	goalsConcededPerGame: number | null;
	cleanSheetRate: number | null;
	goalkeeperRating: number | null;
	goalkeeperName: string | null;
	formRate: number | null;
};

export type MatchupSummary = {
	favoriteLine: string;
	decisiveLine: string | null;
	warningLine: string | null;
};

export type MatchupAnalysis = {
	favoriteSide: MatchupSide;
	ratingDifference: number;
	balanceLevel: MatchupBalanceLevel;
	home: MatchupTeamDetail;
	away: MatchupTeamDetail;
	metrics: MatchupMetric[];
	keyPlayers: {
		scorer: MatchupPlayerHighlight | null;
		creator: MatchupPlayerHighlight | null;
		goalkeeper: MatchupPlayerHighlight | null;
		form: MatchupPlayerHighlight | null;
	};
	decisiveFactor: MatchupMetricKey | typeof MATCHUP_SIDE.neutral;
	warningFactor: MatchupMetricKey | typeof MATCHUP_SIDE.neutral;
	summary: MatchupSummary;
};

type PlayerOffenseAgg = {
	matches: number;
	goals: number;
	assists: number;
};

type PlayerDefenseAgg = {
	matches: number;
	goalsAgainst: number;
	cleanSheets: number;
};

type GoalShareAgg = {
	involvement: number;
	teamGoals: number;
	matches: number;
};

export function matchupHistoryEvents<
	T extends { id: number; starts_at: string; ended_at: string | null },
>(events: readonly T[], current: { id: number; starts_at: string }): T[] {
	return endedChampionshipHistoryEvents(events).filter((event) => {
		if (event.starts_at < current.starts_at) {
			return true;
		}

		if (event.starts_at > current.starts_at) {
			return false;
		}

		return event.id < current.id;
	});
}

export function matchupBalanceLevel(
	ratingDifference: number,
): MatchupBalanceLevel {
	const abs = Math.abs(ratingDifference);
	if (abs < MATCHUP_BALANCE_SPREAD.extreme) {
		return MATCHUP_BALANCE.extreme;
	}

	if (abs < MATCHUP_BALANCE_SPREAD.balanced) {
		return MATCHUP_BALANCE.balanced;
	}

	if (abs < MATCHUP_BALANCE_SPREAD.slight) {
		return MATCHUP_BALANCE.slight;
	}

	if (abs < MATCHUP_BALANCE_SPREAD.clear) {
		return MATCHUP_BALANCE.clear;
	}

	return MATCHUP_BALANCE.large;
}

export function matchupAdvantage(
	homeValue: number | null,
	awayValue: number | null,
	higherIsBetter: boolean,
	threshold: number,
): MatchupSide {
	if (homeValue === null || awayValue === null) {
		return MATCHUP_SIDE.neutral;
	}

	const raw = homeValue - awayValue;
	const signed = higherIsBetter ? raw : -raw;
	if (Math.abs(signed) < threshold) {
		return MATCHUP_SIDE.neutral;
	}

	if (signed > 0) {
		return MATCHUP_SIDE.home;
	}

	return MATCHUP_SIDE.away;
}

export function matchupRelativeGap(
	homeValue: number | null,
	awayValue: number | null,
	ref: number,
): number {
	if (homeValue === null || awayValue === null || ref <= 0) {
		return 0;
	}

	return Math.abs(homeValue - awayValue) / ref;
}

export function teamMatchupRatingSum(team: MatchupTeamInput): number {
	const ratings = team.playerIds.flatMap((playerId) => {
		const rating = team.ratings.get(playerId);
		if (rating === undefined) {
			return [];
		}

		return [rating];
	});

	return eventTeamRatingSum(ratings);
}

export function teamGoalsPerGame(
	events: readonly ChampionshipEvent[],
	playerIds: readonly number[],
): number | null {
	return averagePlayerMetric(playerIds, (playerId) => {
		const agg = playerOffenseAggForAverage(events, playerId);
		if (!agg) {
			return null;
		}

		return rosterAverage(agg.goals, agg.matches);
	});
}

export function teamAssistsPerGame(
	events: readonly ChampionshipEvent[],
	playerIds: readonly number[],
): number | null {
	return averagePlayerMetric(playerIds, (playerId) => {
		const agg = playerOffenseAggForAverage(events, playerId);
		if (!agg) {
			return null;
		}

		return rosterAverage(agg.assists, agg.matches);
	});
}

export function teamGoalParticipation(
	events: readonly ChampionshipEvent[],
	playerIds: readonly number[],
): number | null {
	const shareByPlayer = aggregateGoalShare(events);
	return averagePlayerMetric(playerIds, (playerId) => {
		const agg = shareByPlayer.get(playerId);
		if (!agg || agg.matches <= 0 || agg.matches < MATCHUP_MIN_SAMPLE) {
			return null;
		}

		if (agg.teamGoals <= 0) {
			return null;
		}

		return agg.involvement / agg.teamGoals;
	});
}

export function teamGoalsConcededPerGame(
	events: readonly ChampionshipEvent[],
	playerIds: readonly number[],
): number | null {
	return averagePlayerMetric(playerIds, (playerId) => {
		const agg = playerDefenseAgg(events, playerId);
		if (!agg || agg.matches < MATCHUP_MIN_SAMPLE) {
			return null;
		}

		return rosterAverage(agg.goalsAgainst, agg.matches);
	});
}

export function teamCleanSheetRate(
	events: readonly ChampionshipEvent[],
	playerIds: readonly number[],
): number | null {
	return averagePlayerMetric(playerIds, (playerId) => {
		const agg = playerDefenseAgg(events, playerId);
		if (!agg || agg.matches < MATCHUP_MIN_SAMPLE) {
			return null;
		}

		return rosterAverage(agg.cleanSheets, agg.matches);
	});
}

export function teamGoalkeeperRating(
	roster: readonly ChampionshipPlayer[],
	goalkeeperId: number | null,
): number | null {
	if (goalkeeperId === null) {
		return null;
	}

	const player = roster.find((row) => row.id === goalkeeperId);
	if (!player) {
		return null;
	}

	return player.goalkeeper_rating;
}

export function teamRecentForm(
	events: readonly ChampionshipEvent[],
	roster: readonly ChampionshipPlayer[],
	playerIds: readonly number[],
): number | null {
	const windowEvents = championshipTrendsEvents(events, MATCHUP_FORM_WINDOW);
	if (windowEvents.length === 0) {
		return null;
	}

	const idSet = new Set(playerIds);
	const scoped = roster.filter((player) => idSet.has(player.id));
	const rows = championshipRecentForm(scoped, windowEvents);
	const rates = rows.flatMap((row) => {
		if (row.matches < MATCHUP_MIN_SAMPLE) {
			return [];
		}

		return [row.rate];
	});

	if (rates.length === 0) {
		return null;
	}

	return rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
}

export function analyzeEventMatchup(input: {
	home: MatchupTeamInput;
	away: MatchupTeamInput;
	historyEvents: readonly ChampionshipEvent[];
	roster: readonly ChampionshipPlayer[];
}): MatchupAnalysis {
	const { home, away, historyEvents, roster } = input;
	const homeRating = teamMatchupRatingSum(home);
	const awayRating = teamMatchupRatingSum(away);
	const ratingDifference = homeRating - awayRating;
	const favoriteSide = matchupFavoriteSide(ratingDifference);
	const balanceLevel = matchupBalanceLevel(ratingDifference);

	const homeDetail = buildTeamDetail(home, historyEvents, roster);
	const awayDetail = buildTeamDetail(away, historyEvents, roster);

	const metrics: MatchupMetric[] = [
		buildMetric(
			MATCHUP_METRIC.rating,
			homeRating,
			awayRating,
			true,
			MATCHUP_NEUTRAL_THRESHOLD.rating,
			MATCHUP_METRIC_REF.rating,
		),
		buildMetric(
			MATCHUP_METRIC.attack,
			homeDetail.goalsPerGame,
			awayDetail.goalsPerGame,
			true,
			MATCHUP_NEUTRAL_THRESHOLD.attack,
			MATCHUP_METRIC_REF.attack,
		),
		buildMetric(
			MATCHUP_METRIC.creation,
			homeDetail.assistsPerGame,
			awayDetail.assistsPerGame,
			true,
			MATCHUP_NEUTRAL_THRESHOLD.creation,
			MATCHUP_METRIC_REF.creation,
		),
		buildMetric(
			MATCHUP_METRIC.defense,
			homeDetail.goalsConcededPerGame,
			awayDetail.goalsConcededPerGame,
			false,
			MATCHUP_NEUTRAL_THRESHOLD.defense,
			MATCHUP_METRIC_REF.defense,
		),
		buildMetric(
			MATCHUP_METRIC.goalkeeper,
			homeDetail.goalkeeperRating,
			awayDetail.goalkeeperRating,
			true,
			MATCHUP_NEUTRAL_THRESHOLD.goalkeeper,
			MATCHUP_METRIC_REF.goalkeeper,
		),
		buildMetric(
			MATCHUP_METRIC.form,
			homeDetail.formRate,
			awayDetail.formRate,
			true,
			MATCHUP_NEUTRAL_THRESHOLD.form,
			MATCHUP_METRIC_REF.form,
		),
	];

	const decisiveFactor = matchupDecisiveFactor(metrics);
	const warningFactor = matchupWarningFactor(metrics, favoriteSide);
	const keyPlayers = buildKeyPlayers(home, away, historyEvents, roster);
	const summary = buildSummary({
		home,
		away,
		favoriteSide,
		ratingDifference,
		metrics,
		decisiveFactor,
		warningFactor,
	});

	return {
		favoriteSide,
		ratingDifference,
		balanceLevel,
		home: homeDetail,
		away: awayDetail,
		metrics,
		keyPlayers,
		decisiveFactor,
		warningFactor,
		summary,
	};
}

export function matchupDecisiveFactor(
	metrics: readonly MatchupMetric[],
): MatchupMetricKey | typeof MATCHUP_SIDE.neutral {
	const candidates = metrics.filter(
		(metric) =>
			metric.key !== MATCHUP_METRIC.rating &&
			metric.homeValue !== null &&
			metric.awayValue !== null &&
			metric.advantage !== MATCHUP_SIDE.neutral &&
			metric.relativeGap > 0,
	);

	if (candidates.length === 0) {
		return MATCHUP_SIDE.neutral;
	}

	const best = candidates.reduce((left, right) => {
		if (right.relativeGap > left.relativeGap) {
			return right;
		}

		return left;
	});

	return best.key;
}

export function matchupWarningFactor(
	metrics: readonly MatchupMetric[],
	favoriteSide: MatchupSide,
): MatchupMetricKey | typeof MATCHUP_SIDE.neutral {
	if (favoriteSide === MATCHUP_SIDE.neutral) {
		return MATCHUP_SIDE.neutral;
	}

	const underdog =
		favoriteSide === MATCHUP_SIDE.home ? MATCHUP_SIDE.away : MATCHUP_SIDE.home;

	const candidates = metrics.filter(
		(metric) =>
			metric.key !== MATCHUP_METRIC.rating &&
			metric.advantage === underdog &&
			metric.relativeGap > 0,
	);

	if (candidates.length === 0) {
		return MATCHUP_SIDE.neutral;
	}

	const best = candidates.reduce((left, right) => {
		if (right.relativeGap > left.relativeGap) {
			return right;
		}

		return left;
	});

	return best.key;
}

export function defaultMatchupPairKeys(
	teams: readonly MatchupTeamInput[],
): { homeKey: string; awayKey: string } | null {
	const withPlayers = teams.filter((team) => team.playerIds.length > 0);
	if (withPlayers.length < 2) {
		return null;
	}

	const ranked = [...withPlayers].sort((left, right) => {
		const diff = teamMatchupRatingSum(right) - teamMatchupRatingSum(left);
		if (diff !== 0) {
			return diff;
		}

		return left.teamKey.localeCompare(right.teamKey);
	});

	return {
		homeKey: ranked[0].teamKey,
		awayKey: ranked[1].teamKey,
	};
}

/** Only attendance/volunteer mark — never slot position or GK history alone. */
export function matchupMarkedGoalkeeperId(
	playerIds: readonly number[],
	markedGoalkeeperIds: ReadonlySet<number> | readonly number[],
): number | null {
	const marked = asMarkedGoalkeeperSet(markedGoalkeeperIds);
	const found = playerIds.find((playerId) => marked.has(playerId));
	return found ?? null;
}

function asMarkedGoalkeeperSet(
	markedGoalkeeperIds: ReadonlySet<number> | readonly number[],
): ReadonlySet<number> {
	if (markedGoalkeeperIds instanceof Set) {
		return markedGoalkeeperIds;
	}

	return new Set(markedGoalkeeperIds);
}

export function matchupTeamsFromShareCards(
	cards: readonly EventTeamShareCard[],
): MatchupTeamInput[] {
	return cards.map((card, index) => {
		const playerIds = card.players.map((player) => player.id);
		const ratings = new Map(
			card.players.map((player) => [player.id, player.rating] as const),
		);
		const marked = card.players.flatMap((player) => {
			if (!player.isGoalkeeperRating) {
				return [];
			}

			return [player.id];
		});

		return {
			teamKey: `share-${index}-${card.title}`,
			title: card.title,
			color: card.color,
			playerIds,
			goalkeeperId: matchupMarkedGoalkeeperId(playerIds, marked),
			ratings,
		};
	});
}

export function matchupTeamsFromBuilderTeams(
	teams: readonly EventTeamBuilderTeam[],
	roster: readonly ChampionshipPlayer[],
	goalkeeperVolunteerIds: readonly number[],
	ratingForPlayer: (player: ChampionshipPlayer, isGk: boolean) => number,
): MatchupTeamInput[] {
	const byId = new Map(roster.map((player) => [player.id, player] as const));
	const volunteers = new Set(goalkeeperVolunteerIds);

	return teams.map((team, index) => {
		const playerIds = teamSlotsToPlayerIds(team.slots);
		const ratings = new Map(
			playerIds.flatMap((playerId) => {
				const player = byId.get(playerId);
				if (!player) {
					return [];
				}

				return [
					[
						playerId,
						ratingForPlayer(player, volunteers.has(playerId)),
					] as const,
				];
			}),
		);

		return {
			teamKey: team.key,
			title: eventTeamName(team.color, index),
			color: team.color,
			playerIds,
			goalkeeperId: matchupMarkedGoalkeeperId(playerIds, volunteers),
			ratings,
		};
	});
}

export function matchupTeamFromMatchLineup(input: {
	team: ChampionshipEventTeam;
	lineup: readonly ChampionshipEventMatchPlayer[];
	attendanceByPlayer: ReadonlyMap<number, ChampionshipEventAttendance>;
}): MatchupTeamInput {
	const { team, lineup, attendanceByPlayer } = input;
	const playerIds = lineup.map((row) => row.player_id);
	const markedGkIds = lineup.flatMap((row) => {
		if (!row.is_goalkeeper) {
			return [];
		}

		return [row.player_id];
	});
	const ratings = new Map(
		lineup.map((row) => {
			const attendance = attendanceByPlayer.get(row.player_id);
			const rating = eventActivePlayerRating(
				row.is_goalkeeper,
				attendance?.rating ?? 0,
				attendance?.goalkeeper_rating ?? 0,
			);
			return [row.player_id, rating] as const;
		}),
	);

	return {
		teamKey: `match-team-${team.id}`,
		title: eventTeamName(team.color, team.sort_order),
		color: team.color,
		playerIds,
		goalkeeperId: matchupMarkedGoalkeeperId(playerIds, markedGkIds),
		ratings,
	};
}

export function matchupReviewOutcome(
	favoriteSide: MatchupSide,
	winnerTeamId: number | null,
	homeTeamId: number,
	awayTeamId: number,
	matchEnded: boolean,
): MatchupReviewOutcome {
	if (!matchEnded) {
		return MATCHUP_REVIEW_OUTCOME.open;
	}

	if (favoriteSide === MATCHUP_SIDE.neutral) {
		return MATCHUP_REVIEW_OUTCOME.neutral;
	}

	if (winnerTeamId === null) {
		return MATCHUP_REVIEW_OUTCOME.draw;
	}

	const favoriteTeamId =
		favoriteSide === MATCHUP_SIDE.home ? homeTeamId : awayTeamId;

	if (winnerTeamId === favoriteTeamId) {
		return MATCHUP_REVIEW_OUTCOME.hit;
	}

	return MATCHUP_REVIEW_OUTCOME.miss;
}

export function matchupReviewOutcomeLabel(
	outcome: MatchupReviewOutcome,
): string {
	switch (outcome) {
		case MATCHUP_REVIEW_OUTCOME.hit:
			return MATCHUP_LABEL.reviewHit;
		case MATCHUP_REVIEW_OUTCOME.miss:
			return MATCHUP_LABEL.reviewMiss;
		case MATCHUP_REVIEW_OUTCOME.draw:
			return MATCHUP_LABEL.reviewDraw;
		case MATCHUP_REVIEW_OUTCOME.neutral:
			return MATCHUP_LABEL.reviewNeutral;
		case MATCHUP_REVIEW_OUTCOME.open:
			return MATCHUP_LABEL.reviewOpen;
		default: {
			const _never: never = outcome;
			return _never;
		}
	}
}

export function analyzeMatchHistoryMatchup(input: {
	match: ChampionshipEventMatch;
	teamA: ChampionshipEventTeam;
	teamB: ChampionshipEventTeam;
	attendance: readonly ChampionshipEventAttendance[];
	historyEvents: readonly ChampionshipEvent[];
	roster: readonly ChampionshipPlayer[];
}): MatchupMatchReview | null {
	const lineupA = input.match.players.filter(
		(row) => row.team_id === input.match.team_a_id,
	);
	const lineupB = input.match.players.filter(
		(row) => row.team_id === input.match.team_b_id,
	);
	if (lineupA.length === 0 || lineupB.length === 0) {
		return null;
	}

	const attendanceByPlayer = new Map(
		input.attendance.map((row) => [row.player_id, row] as const),
	);
	const home = matchupTeamFromMatchLineup({
		team: input.teamA,
		lineup: lineupA,
		attendanceByPlayer,
	});
	const away = matchupTeamFromMatchLineup({
		team: input.teamB,
		lineup: lineupB,
		attendanceByPlayer,
	});
	const analysis = analyzeEventMatchup({
		home,
		away,
		historyEvents: input.historyEvents,
		roster: input.roster,
	});
	const matchEnded = input.match.ended_at !== null;
	const outcome = matchupReviewOutcome(
		analysis.favoriteSide,
		input.match.winner_team_id,
		input.match.team_a_id,
		input.match.team_b_id,
		matchEnded,
	);

	return {
		analysis,
		outcome,
		outcomeLabel: matchupReviewOutcomeLabel(outcome),
	};
}

export function formatMatchupRating(value: number): string {
	return formatEventTeamRatingSum(value);
}

export function formatMatchupPerGame(value: number): string {
	const fixed = rosterSafeCount(value).toFixed(2);
	if (fixed.endsWith(".00")) {
		return fixed.slice(0, -3);
	}

	if (fixed.endsWith("0")) {
		return fixed.slice(0, -1);
	}

	return fixed;
}

export function formatMatchupPercent(value: number): string {
	return formatRosterWinRate(value);
}

export function formatMatchupMetricValue(
	key: MatchupMetricKey,
	value: number | null,
): string {
	if (value === null) {
		return MATCHUP_LABEL.insufficient;
	}

	switch (key) {
		case MATCHUP_METRIC.rating:
			return formatMatchupRating(value);
		case MATCHUP_METRIC.attack:
		case MATCHUP_METRIC.creation:
		case MATCHUP_METRIC.defense:
			return formatMatchupPerGame(value);
		case MATCHUP_METRIC.goalkeeper:
			return formatMatchupPerGame(value);
		case MATCHUP_METRIC.form:
			return formatMatchupPercent(value);
		default: {
			const _never: never = key;
			return _never;
		}
	}
}

export function matchupMetricLabel(key: MatchupMetricKey): string {
	switch (key) {
		case MATCHUP_METRIC.rating:
			return MATCHUP_LABEL.rating;
		case MATCHUP_METRIC.attack:
			return MATCHUP_LABEL.attack;
		case MATCHUP_METRIC.creation:
			return MATCHUP_LABEL.creation;
		case MATCHUP_METRIC.defense:
			return MATCHUP_LABEL.defense;
		case MATCHUP_METRIC.goalkeeper:
			return MATCHUP_LABEL.goalkeeper;
		case MATCHUP_METRIC.form:
			return MATCHUP_LABEL.form;
		default: {
			const _never: never = key;
			return _never;
		}
	}
}

export function matchupBalanceLabel(level: MatchupBalanceLevel): string {
	return MATCHUP_LABEL[level];
}

function matchupFavoriteSide(ratingDifference: number): MatchupSide {
	if (Math.abs(ratingDifference) < MATCHUP_NEUTRAL_THRESHOLD.rating) {
		return MATCHUP_SIDE.neutral;
	}

	if (ratingDifference > 0) {
		return MATCHUP_SIDE.home;
	}

	return MATCHUP_SIDE.away;
}

function buildMetric(
	key: MatchupMetricKey,
	homeValue: number | null,
	awayValue: number | null,
	higherIsBetter: boolean,
	threshold: number,
	ref: number,
): MatchupMetric {
	const advantage = matchupAdvantage(
		homeValue,
		awayValue,
		higherIsBetter,
		threshold,
	);
	const difference =
		homeValue !== null && awayValue !== null ? homeValue - awayValue : 0;

	return {
		key,
		homeValue,
		awayValue,
		advantage,
		difference,
		relativeGap: matchupRelativeGap(homeValue, awayValue, ref),
		higherIsBetter,
	};
}

function buildTeamDetail(
	team: MatchupTeamInput,
	events: readonly ChampionshipEvent[],
	roster: readonly ChampionshipPlayer[],
): MatchupTeamDetail {
	const gkId = team.goalkeeperId;
	const gkPlayer =
		gkId === null ? null : (roster.find((row) => row.id === gkId) ?? null);

	return {
		ratingSum: teamMatchupRatingSum(team),
		goalsPerGame: teamGoalsPerGame(events, team.playerIds),
		assistsPerGame: teamAssistsPerGame(events, team.playerIds),
		goalShare: teamGoalParticipation(events, team.playerIds),
		goalsConcededPerGame: teamGoalsConcededPerGame(events, team.playerIds),
		cleanSheetRate: teamCleanSheetRate(events, team.playerIds),
		goalkeeperRating: teamGoalkeeperRating(roster, gkId),
		goalkeeperName: gkPlayer ? playerVisibleName(gkPlayer) : null,
		formRate: teamRecentForm(events, roster, team.playerIds),
	};
}

function buildKeyPlayers(
	home: MatchupTeamInput,
	away: MatchupTeamInput,
	events: readonly ChampionshipEvent[],
	roster: readonly ChampionshipPlayer[],
): MatchupAnalysis["keyPlayers"] {
	const allIds = [...home.playerIds, ...away.playerIds];
	const sideOf = (playerId: number): MatchupSide => {
		if (home.playerIds.includes(playerId)) {
			return MATCHUP_SIDE.home;
		}

		if (away.playerIds.includes(playerId)) {
			return MATCHUP_SIDE.away;
		}

		return MATCHUP_SIDE.neutral;
	};

	const scorers = allIds.flatMap((playerId) => {
		const agg = playerOffenseAggForAverage(events, playerId);
		if (!agg) {
			return [];
		}

		const player = roster.find((row) => row.id === playerId);
		if (!player) {
			return [];
		}

		return [
			{
				playerId,
				name: playerVisibleName(player),
				value: rosterAverage(agg.goals, agg.matches),
				label: MATCHUP_LABEL.scorer,
				side: sideOf(playerId),
			},
		];
	});

	const creators = allIds.flatMap((playerId) => {
		const agg = playerOffenseAggForAverage(events, playerId);
		if (!agg) {
			return [];
		}

		const player = roster.find((row) => row.id === playerId);
		if (!player) {
			return [];
		}

		return [
			{
				playerId,
				name: playerVisibleName(player),
				value: rosterAverage(agg.assists, agg.matches),
				label: MATCHUP_LABEL.creator,
				side: sideOf(playerId),
			},
		];
	});

	const goalkeepers = [home.goalkeeperId, away.goalkeeperId].flatMap(
		(goalkeeperId) => {
			if (goalkeeperId === null) {
				return [];
			}

			const rating = teamGoalkeeperRating(roster, goalkeeperId);
			if (rating === null) {
				return [];
			}

			const player = roster.find((row) => row.id === goalkeeperId);
			if (!player) {
				return [];
			}

			return [
				{
					playerId: goalkeeperId,
					name: playerVisibleName(player),
					value: rating,
					label: MATCHUP_LABEL.bestGoalkeeper,
					side: sideOf(goalkeeperId),
				},
			];
		},
	);

	const formWindow = championshipTrendsEvents(events, MATCHUP_FORM_WINDOW);
	const formRows = championshipRecentForm(
		roster.filter((player) => allIds.includes(player.id)),
		formWindow,
	);
	const formHighlights = formRows.flatMap((row) => {
		if (row.matches < MATCHUP_MIN_SAMPLE) {
			return [];
		}

		return [
			{
				playerId: row.player.id,
				name: playerVisibleName(row.player),
				value: row.rate,
				label: MATCHUP_LABEL.formPlayer,
				side: sideOf(row.player.id),
			},
		];
	});

	return {
		scorer: maxHighlight(scorers),
		creator: maxHighlight(creators),
		goalkeeper: maxHighlight(goalkeepers),
		form: maxHighlight(formHighlights),
	};
}

function maxHighlight(
	rows: readonly MatchupPlayerHighlight[],
): MatchupPlayerHighlight | null {
	if (rows.length === 0) {
		return null;
	}

	return rows.reduce((left, right) => {
		if (right.value > left.value) {
			return right;
		}

		return left;
	});
}

function buildSummary(input: {
	home: MatchupTeamInput;
	away: MatchupTeamInput;
	favoriteSide: MatchupSide;
	ratingDifference: number;
	metrics: readonly MatchupMetric[];
	decisiveFactor: MatchupMetricKey | typeof MATCHUP_SIDE.neutral;
	warningFactor: MatchupMetricKey | typeof MATCHUP_SIDE.neutral;
}): MatchupSummary {
	const favoriteName = sideTeamTitle(
		input.favoriteSide,
		input.home,
		input.away,
	);
	const favoriteLine = favoriteSummaryLine(
		favoriteName,
		input.favoriteSide,
		input.ratingDifference,
	);

	const decisiveLine = factorSummaryLine(
		input.decisiveFactor,
		input.metrics,
		input.home,
		input.away,
		true,
	);
	const warningLine = factorSummaryLine(
		input.warningFactor,
		input.metrics,
		input.home,
		input.away,
		false,
	);

	return { favoriteLine, decisiveLine, warningLine };
}

function favoriteSummaryLine(
	favoriteName: string | null,
	favoriteSide: MatchupSide,
	ratingDifference: number,
): string {
	if (favoriteSide === MATCHUP_SIDE.neutral || favoriteName === null) {
		return `${MATCHUP_LABEL.favoriteByRating}: ${MATCHUP_LABEL.neutral}`;
	}

	const delta = formatMatchupRating(Math.abs(ratingDifference));
	return `${favoriteName} é favorito pelo rating (+${delta}).`;
}

function factorSummaryLine(
	factor: MatchupMetricKey | typeof MATCHUP_SIDE.neutral,
	metrics: readonly MatchupMetric[],
	home: MatchupTeamInput,
	away: MatchupTeamInput,
	isDecisive: boolean,
): string | null {
	if (factor === MATCHUP_SIDE.neutral) {
		return null;
	}

	const metric = metrics.find((row) => row.key === factor);
	if (!metric || metric.advantage === MATCHUP_SIDE.neutral) {
		return null;
	}

	const sideName = sideTeamTitle(metric.advantage, home, away);
	if (sideName === null) {
		return null;
	}

	const label = matchupMetricLabel(factor);
	if (isDecisive) {
		return `A maior vantagem está em ${label.toLowerCase()} (${sideName}): ${formatMatchupMetricValue(factor, metric.homeValue)} × ${formatMatchupMetricValue(factor, metric.awayValue)}.`;
	}

	return `${sideName} possui maior ${label.toLowerCase()}.`;
}

function sideTeamTitle(
	side: MatchupSide,
	home: MatchupTeamInput,
	away: MatchupTeamInput,
): string | null {
	if (side === MATCHUP_SIDE.home) {
		return home.title;
	}

	if (side === MATCHUP_SIDE.away) {
		return away.title;
	}

	return null;
}

function averagePlayerMetric(
	playerIds: readonly number[],
	metricOf: (playerId: number) => number | null,
): number | null {
	const values = playerIds.flatMap((playerId) => {
		const value = metricOf(playerId);
		if (value === null) {
			return [];
		}

		return [value];
	});

	if (values.length === 0) {
		return null;
	}

	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Null when no matches — never dilute team average with 0. */
function playerOffenseAggForAverage(
	events: readonly ChampionshipEvent[],
	playerId: number,
): PlayerOffenseAgg | null {
	const agg = playerOffenseFromAttendance(events, playerId);
	if (!agg) {
		return null;
	}

	if (agg.matches <= 0) {
		return null;
	}

	if (agg.matches < MATCHUP_MIN_SAMPLE) {
		return null;
	}

	return agg;
}

function playerOffenseFromAttendance(
	events: readonly ChampionshipEvent[],
	playerId: number,
): PlayerOffenseAgg | null {
	let matches = 0;
	let goals = 0;
	let assists = 0;

	for (const event of events) {
		const row = event.attendance.find(
			(item: ChampionshipEventAttendance) => item.player_id === playerId,
		);
		if (!row) {
			continue;
		}

		const rowMatches = rosterSafeCount(row.matches);
		if (rowMatches <= 0) {
			continue;
		}

		matches += rowMatches;
		goals += rosterSafeCount(row.goals);
		assists += rosterSafeCount(row.assists);
	}

	if (matches <= 0) {
		return null;
	}

	return { matches, goals, assists };
}

function playerDefenseAgg(
	events: readonly ChampionshipEvent[],
	playerId: number,
): PlayerDefenseAgg | null {
	let matches = 0;
	let goalsAgainst = 0;
	let cleanSheets = 0;

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

			const conceded = matchGoalsConceded(match, seat.team_id);
			matches += 1;
			goalsAgainst += conceded;
			if (conceded === 0) {
				cleanSheets += 1;
			}
		}
	}

	if (matches === 0) {
		return null;
	}

	return { matches, goalsAgainst, cleanSheets };
}

function aggregateGoalShare(
	events: readonly ChampionshipEvent[],
): Map<number, GoalShareAgg> {
	const byPlayer = new Map<number, GoalShareAgg>();

	for (const event of events) {
		const rosterByPlayer = new Map(
			event.teams.flatMap((team) =>
				team.players.map((row) => [row.player_id, team.id] as const),
			),
		);

		for (const match of event.matches) {
			applyMatchGoalShare(
				byPlayer,
				match,
				rosterByPlayer,
				event.skip_guest_goalkeeper_matches,
			);
		}
	}

	return byPlayer;
}

function applyMatchGoalShare(
	byPlayer: Map<number, GoalShareAgg>,
	match: ChampionshipEventMatch,
	rosterByPlayer: ReadonlyMap<number, number>,
	skipGuestGk: boolean,
): void {
	const playerById = new Map(
		match.players.map((row) => [row.player_id, row] as const),
	);

	for (const seat of match.players) {
		if (
			!countsForSynergy(
				seat,
				match,
				rosterByPlayer.get(seat.player_id) ?? null,
				skipGuestGk,
			)
		) {
			continue;
		}

		const teamGoals = matchGoalsForTeam(match, seat.team_id);
		const involvement = matchPlayerInvolvement(match.goals, playerById, seat);
		const prev = byPlayer.get(seat.player_id) ?? {
			involvement: 0,
			teamGoals: 0,
			matches: 0,
		};
		byPlayer.set(seat.player_id, {
			involvement: prev.involvement + involvement,
			teamGoals: prev.teamGoals + teamGoals,
			matches: prev.matches + 1,
		});
	}
}

function matchPlayerInvolvement(
	goals: readonly ChampionshipEventGoal[],
	playerById: ReadonlyMap<number, ChampionshipEventMatchPlayer>,
	seat: ChampionshipEventMatchPlayer,
): number {
	return goals.reduce((sum, goal) => {
		let next = sum;
		if (
			goal.scorer_player_id === seat.player_id &&
			!goal.is_own_goal &&
			playerById.get(seat.player_id)?.include_stats === true
		) {
			next += 1;
		}

		if (
			goal.assist_player_id === seat.player_id &&
			playerById.get(seat.player_id)?.include_stats === true
		) {
			next += 1;
		}

		return next;
	}, 0);
}
