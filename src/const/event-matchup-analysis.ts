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
	eventTeamRatingAverage,
	formatEventTeamRatingAverage,
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
import {
	hiddenStrengthCeiling,
	hiddenStrengthResolve,
} from "./hidden-strength.ts";
import { matchGoalsConceded, matchGoalsForTeam } from "./match-goal-counts.ts";
import { playerVisibleName } from "./player-name.ts";
import { PLAYER_RATING } from "./player-rating.ts";
import { countsForSynergy, SYNERGY_MIN_MATCHES } from "./player-synergy.ts";
import {
	formatRosterWinRate,
	rosterAverage,
	rosterSafeCount,
	rosterWinRate,
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
	extreme: 2,
	balanced: 5,
	slight: 10,
	clear: 18,
} as const;

/** Absolute gap below this → neutral for that metric. */
export const MATCHUP_NEUTRAL_THRESHOLD = {
	[MATCHUP_METRIC.rating]: 2,
	[MATCHUP_METRIC.attack]: 0.08,
	[MATCHUP_METRIC.creation]: 0.08,
	[MATCHUP_METRIC.defense]: 0.08,
	[MATCHUP_METRIC.goalkeeper]: 0.2,
	[MATCHUP_METRIC.form]: 0.04,
} as const;

/** Reference for relative gap (decisive / warning). */
export const MATCHUP_METRIC_REF = {
	[MATCHUP_METRIC.rating]: 10,
	[MATCHUP_METRIC.attack]: 0.5,
	[MATCHUP_METRIC.creation]: 0.4,
	[MATCHUP_METRIC.defense]: 0.5,
	[MATCHUP_METRIC.goalkeeper]: 1,
	[MATCHUP_METRIC.form]: 0.2,
} as const;

export const MATCHUP_LABEL = {
	title: "Análise do Confronto",
	favoriteByRating: "Favorito",
	favoriteByFields: "Favorito pelos campos",
	rating: "Média oculta",
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
	cleanSheetPlayer: "Melhor clean sheet",
	defensePlayer: "Menos gols sofridos",
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
	openAnalysis: "Análise do confronto",
	hideAnalysis: "Ocultar análise",
	reviewOutcome: "Favorito × resultado",
	reviewHit: "Coincidiu",
	reviewMiss: "Não coincidiu",
	reviewDraw: "Empate",
	reviewNeutral: "Sem favorito claro",
	reviewOpen: "Partida em andamento",
	favoriteHitRate: "Favorito",
	favoriteHitRateEmpty: "Sem favorito decretado",
	[MATCHUP_BALANCE.extreme]: "Extremamente equilibrado",
	[MATCHUP_BALANCE.balanced]: "Equilibrado",
	[MATCHUP_BALANCE.slight]: "Leve vantagem",
	[MATCHUP_BALANCE.clear]: "Vantagem clara",
	[MATCHUP_BALANCE.large]: "Grande vantagem",
} as const;

export const MATCHUP_SNAPSHOT_VERSION = 2 as const;

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

export type MatchupSnapshot = {
	version: typeof MATCHUP_SNAPSHOT_VERSION;
	analysis: MatchupAnalysis;
};

export type MatchupFavoriteStats = {
	decreed: number;
	hits: number;
	rate: number | null;
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

export type MatchupTeamKeyPlayers = {
	scorer: MatchupPlayerHighlight | null;
	creator: MatchupPlayerHighlight | null;
	goalkeeper: MatchupPlayerHighlight | null;
	form: MatchupPlayerHighlight | null;
	cleanSheet: MatchupPlayerHighlight | null;
	goalsConceded: MatchupPlayerHighlight | null;
};

export type MatchupTeamDetail = {
	ratingAverage: number;
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
	/** How many metric fields each side leads (non-neutral). */
	fieldWins: { home: number; away: number };
	ratingDifference: number;
	balanceLevel: MatchupBalanceLevel;
	home: MatchupTeamDetail;
	away: MatchupTeamDetail;
	metrics: MatchupMetric[];
	keyPlayers: {
		home: MatchupTeamKeyPlayers;
		away: MatchupTeamKeyPlayers;
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

export function teamMatchupRatingAverage(team: MatchupTeamInput): number {
	const ratings = team.playerIds.flatMap((playerId) => {
		const rating = team.ratings.get(playerId);
		if (rating === undefined) {
			return [];
		}

		return [rating];
	});

	return eventTeamRatingAverage(ratings);
}

export function matchupHiddenCeiling(
	attendance: Iterable<
		Pick<ChampionshipEventAttendance, "rating" | "goalkeeper_rating">
	>,
): number {
	return hiddenStrengthCeiling(
		[...attendance].flatMap((row) => [row.rating, row.goalkeeper_rating]),
	);
}

export function matchupPlayerHiddenRating(input: {
	isGoalkeeper: boolean;
	publicRating: number;
	hiddenStrength: number | undefined;
	hiddenGoalkeeperStrength: number | undefined;
	ceiling: number;
}): number {
	const stored = input.isGoalkeeper
		? (input.hiddenGoalkeeperStrength ?? PLAYER_RATING.default)
		: (input.hiddenStrength ?? PLAYER_RATING.default);

	return hiddenStrengthResolve(stored, input.publicRating, input.ceiling);
}

function matchupHiddenRatingFromAttendance(
	isGoalkeeper: boolean,
	attendance: ChampionshipEventAttendance | undefined,
	ceiling: number,
): number {
	const publicRating = eventActivePlayerRating(
		isGoalkeeper,
		attendance?.rating ?? PLAYER_RATING.default,
		attendance?.goalkeeper_rating ?? PLAYER_RATING.default,
	);

	return matchupPlayerHiddenRating({
		isGoalkeeper,
		publicRating,
		hiddenStrength: attendance?.hidden_strength,
		hiddenGoalkeeperStrength: attendance?.hidden_goalkeeper_strength,
		ceiling,
	});
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

/** Snapshot rating of the marked GK only — never invent from lineup/history. */
export function teamGoalkeeperSnapshotRating(
	team: MatchupTeamInput,
): number | null {
	if (team.goalkeeperId === null) {
		return null;
	}

	const value = team.ratings.get(team.goalkeeperId);
	if (value === undefined) {
		return null;
	}

	return value;
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
	const homeRating = teamMatchupRatingAverage(home);
	const awayRating = teamMatchupRatingAverage(away);
	const ratingDifference = homeRating - awayRating;
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

	const fieldWins = matchupFieldWins(metrics);
	const favoriteSide = matchupFavoriteSideFromFields(fieldWins);
	const decisiveFactor = matchupDecisiveFactor(metrics);
	const warningFactor = matchupWarningFactor(metrics, favoriteSide);
	const keyPlayers = buildKeyPlayers(home, away, historyEvents, roster);
	const summary = buildSummary({
		home,
		away,
		favoriteSide,
		fieldWins,
		metrics,
		decisiveFactor,
		warningFactor,
	});

	return {
		favoriteSide,
		fieldWins,
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
		const diff =
			teamMatchupRatingAverage(right) - teamMatchupRatingAverage(left);
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
	attendance: readonly ChampionshipEventAttendance[] = [],
): MatchupTeamInput[] {
	const attendanceByPlayer = new Map(
		attendance.map((row) => [row.player_id, row] as const),
	);
	const ceiling = matchupHiddenCeiling(attendance);

	return cards.map((card, index) => {
		const playerIds = card.players.map((player) => player.id);
		const ratings = new Map(
			card.players.map((player) => {
				const row = attendanceByPlayer.get(player.id);
				if (!row && attendance.length === 0) {
					return [player.id, player.rating] as const;
				}

				return [
					player.id,
					matchupHiddenRatingFromAttendance(
						player.isGoalkeeperRating,
						row,
						ceiling,
					),
				] as const;
			}),
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
	ceiling?: number;
}): MatchupTeamInput {
	const { team, lineup, attendanceByPlayer } = input;
	const ceiling =
		input.ceiling ?? matchupHiddenCeiling(attendanceByPlayer.values());
	const playerIds = lineup.map((row) => row.player_id);
	const markedGkIds = lineup.flatMap((row) => {
		const attendance = attendanceByPlayer.get(row.player_id);
		if (attendance?.is_goalkeeper !== true) {
			return [];
		}

		return [row.player_id];
	});
	const ratings = new Map(
		lineup.map((row) => {
			const attendance = attendanceByPlayer.get(row.player_id);
			const isMarkedGk = attendance?.is_goalkeeper === true;
			const rating = matchupHiddenRatingFromAttendance(
				isMarkedGk,
				attendance,
				ceiling,
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

	const favoriteTeamId = matchupFavoriteTeamId(
		favoriteSide,
		homeTeamId,
		awayTeamId,
	);

	if (favoriteTeamId !== null && winnerTeamId === favoriteTeamId) {
		return MATCHUP_REVIEW_OUTCOME.hit;
	}

	return MATCHUP_REVIEW_OUTCOME.miss;
}

export function matchupFavoriteTeamId(
	favoriteSide: MatchupSide,
	homeTeamId: number,
	awayTeamId: number,
): number | null {
	if (favoriteSide === MATCHUP_SIDE.neutral) {
		return null;
	}

	if (favoriteSide === MATCHUP_SIDE.home) {
		return homeTeamId;
	}

	return awayTeamId;
}

export function buildMatchupSnapshot(
	analysis: MatchupAnalysis,
): MatchupSnapshot {
	return {
		version: MATCHUP_SNAPSHOT_VERSION,
		analysis,
	};
}

export function readMatchupSnapshot(raw: unknown): MatchupSnapshot | null {
	if (!raw || typeof raw !== "object") {
		return null;
	}

	const row = raw as Record<string, unknown>;
	if (row.version !== MATCHUP_SNAPSHOT_VERSION) {
		return null;
	}

	if (!row.analysis || typeof row.analysis !== "object") {
		return null;
	}

	return {
		version: MATCHUP_SNAPSHOT_VERSION,
		analysis: row.analysis as MatchupAnalysis,
	};
}

export function hasMatchupSnapshot(
	match: Pick<ChampionshipEventMatch, "matchup_snapshot">,
): boolean {
	return match.matchup_snapshot != null;
}

export function matchFavoriteTeamId(
	match: Pick<ChampionshipEventMatch, "favorite_team_id" | "matchup_snapshot">,
): number | null | undefined {
	if (!hasMatchupSnapshot(match)) {
		return undefined;
	}

	return match.favorite_team_id ?? null;
}

export function eventMatchupFavoriteStats(
	matches: readonly Pick<
		ChampionshipEventMatch,
		"favorite_team_id" | "favorite_won"
	>[],
): MatchupFavoriteStats {
	const decreed = matches.filter((match) => match.favorite_team_id != null);
	const hits = decreed.filter((match) => match.favorite_won === true).length;
	const decreedCount = decreed.length;
	if (decreedCount === 0) {
		return { decreed: 0, hits: 0, rate: null };
	}

	return {
		decreed: decreedCount,
		hits,
		rate: rosterWinRate(hits, decreedCount),
	};
}

export function formatMatchupFavoriteHitRate(
	stats: MatchupFavoriteStats,
): string {
	if (stats.rate === null) {
		return MATCHUP_LABEL.favoriteHitRateEmpty;
	}

	return `${stats.hits}/${stats.decreed} · ${formatRosterWinRate(stats.rate)}`;
}

export function matchupFavoriteWonValue(
	favoriteTeamId: number | null | undefined,
	winnerTeamId: number | null,
): boolean | null {
	if (favoriteTeamId == null || winnerTeamId == null) {
		return null;
	}

	return winnerTeamId === favoriteTeamId;
}

export function matchupTeamFromEventTeam(input: {
	team: ChampionshipEventTeam;
	attendanceByPlayer: ReadonlyMap<number, ChampionshipEventAttendance>;
	ceiling?: number;
}): MatchupTeamInput {
	const { team, attendanceByPlayer } = input;
	const ceiling =
		input.ceiling ?? matchupHiddenCeiling(attendanceByPlayer.values());
	const playerIds = team.players.map((row) => row.player_id);
	const markedGkIds = team.players.flatMap((row) => {
		const attendance = attendanceByPlayer.get(row.player_id);
		if (attendance?.is_goalkeeper !== true) {
			return [];
		}

		return [row.player_id];
	});
	const ratings = new Map(
		team.players.map((row) => {
			const attendance = attendanceByPlayer.get(row.player_id);
			const isMarkedGk = attendance?.is_goalkeeper === true;
			const rating = matchupHiddenRatingFromAttendance(
				isMarkedGk,
				attendance,
				ceiling,
			);
			return [row.player_id, rating] as const;
		}),
	);

	return {
		teamKey: `event-team-${team.id}`,
		title: eventTeamName(team.color, team.sort_order),
		color: team.color,
		playerIds,
		goalkeeperId: matchupMarkedGoalkeeperId(playerIds, markedGkIds),
		ratings,
	};
}

export function buildStartMatchMatchup(input: {
	teamA: ChampionshipEventTeam;
	teamB: ChampionshipEventTeam;
	attendance: readonly ChampionshipEventAttendance[];
	historyEvents: readonly ChampionshipEvent[];
	roster: readonly ChampionshipPlayer[];
}): {
	snapshot: MatchupSnapshot;
	favoriteTeamId: number | null;
	analysis: MatchupAnalysis;
} {
	const attendanceByPlayer = new Map(
		input.attendance.map((row) => [row.player_id, row] as const),
	);
	const ceiling = matchupHiddenCeiling(input.attendance);
	const home = matchupTeamFromEventTeam({
		team: input.teamA,
		attendanceByPlayer,
		ceiling,
	});
	const away = matchupTeamFromEventTeam({
		team: input.teamB,
		attendanceByPlayer,
		ceiling,
	});
	const analysis = analyzeEventMatchup({
		home,
		away,
		historyEvents: input.historyEvents,
		roster: input.roster,
	});

	return {
		analysis,
		snapshot: buildMatchupSnapshot(analysis),
		favoriteTeamId: matchupFavoriteTeamId(
			analysis.favoriteSide,
			input.teamA.id,
			input.teamB.id,
		),
	};
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
	const frozen = readMatchupSnapshot(input.match.matchup_snapshot);
	if (frozen) {
		const matchEnded = input.match.ended_at !== null;
		const outcome = matchupReviewOutcome(
			frozen.analysis.favoriteSide,
			input.match.winner_team_id,
			input.match.team_a_id,
			input.match.team_b_id,
			matchEnded,
		);

		return {
			analysis: frozen.analysis,
			outcome,
			outcomeLabel: matchupReviewOutcomeLabel(outcome),
		};
	}

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
	const ceiling = matchupHiddenCeiling(input.attendance);
	const home = matchupTeamFromMatchLineup({
		team: input.teamA,
		lineup: lineupA,
		attendanceByPlayer,
		ceiling,
	});
	const away = matchupTeamFromMatchLineup({
		team: input.teamB,
		lineup: lineupB,
		attendanceByPlayer,
		ceiling,
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
	return formatEventTeamRatingAverage(value);
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

export function matchupFieldWins(metrics: readonly MatchupMetric[]): {
	home: number;
	away: number;
} {
	return metrics.reduce(
		(acc, metric) => {
			if (metric.advantage === MATCHUP_SIDE.home) {
				return { home: acc.home + 1, away: acc.away };
			}

			if (metric.advantage === MATCHUP_SIDE.away) {
				return { home: acc.home, away: acc.away + 1 };
			}

			return acc;
		},
		{ home: 0, away: 0 },
	);
}

export function matchupFavoriteSideFromFields(fieldWins: {
	home: number;
	away: number;
}): MatchupSide {
	if (fieldWins.home === fieldWins.away) {
		return MATCHUP_SIDE.neutral;
	}

	if (fieldWins.home > fieldWins.away) {
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
		ratingAverage: teamMatchupRatingAverage(team),
		goalsPerGame: teamGoalsPerGame(events, team.playerIds),
		assistsPerGame: teamAssistsPerGame(events, team.playerIds),
		goalShare: teamGoalParticipation(events, team.playerIds),
		goalsConcededPerGame: teamGoalsConcededPerGame(events, team.playerIds),
		cleanSheetRate: teamCleanSheetRate(events, team.playerIds),
		goalkeeperRating: teamGoalkeeperSnapshotRating(team),
		goalkeeperName: gkPlayer ? playerVisibleName(gkPlayer) : null,
		formRate: teamRecentForm(events, roster, team.playerIds),
	};
}

function teamHasKeyPlayers(row: MatchupTeamKeyPlayers): boolean {
	return (
		row.scorer !== null ||
		row.creator !== null ||
		row.goalkeeper !== null ||
		row.form !== null ||
		row.cleanSheet !== null ||
		row.goalsConceded !== null
	);
}

export function matchupHasKeyPlayers(
	keyPlayers: MatchupAnalysis["keyPlayers"],
): boolean {
	return (
		teamHasKeyPlayers(keyPlayers.home) || teamHasKeyPlayers(keyPlayers.away)
	);
}

function buildTeamKeyPlayers(
	team: MatchupTeamInput,
	side: MatchupSide,
	events: readonly ChampionshipEvent[],
	roster: readonly ChampionshipPlayer[],
): MatchupTeamKeyPlayers {
	const playerIds = team.playerIds;

	const scorers = playerIds.flatMap((playerId) => {
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
				side,
			},
		];
	});

	const creators = playerIds.flatMap((playerId) => {
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
				side,
			},
		];
	});

	const goalkeepers = (() => {
		const goalkeeperId = team.goalkeeperId;
		if (goalkeeperId === null) {
			return [];
		}

		const rating = teamGoalkeeperSnapshotRating(team);
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
				side,
			},
		];
	})();

	const formWindow = championshipTrendsEvents(events, MATCHUP_FORM_WINDOW);
	const formRows = championshipRecentForm(
		roster.filter((player) => playerIds.includes(player.id)),
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
				side,
			},
		];
	});

	const cleanSheets = playerIds.flatMap((playerId) => {
		const agg = playerDefenseAgg(events, playerId);
		if (!agg || agg.matches < MATCHUP_MIN_SAMPLE) {
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
				value: rosterAverage(agg.cleanSheets, agg.matches),
				label: MATCHUP_LABEL.cleanSheetPlayer,
				side,
			},
		];
	});

	const goalsConceded = playerIds.flatMap((playerId) => {
		const agg = playerDefenseAgg(events, playerId);
		if (!agg || agg.matches < MATCHUP_MIN_SAMPLE) {
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
				value: rosterAverage(agg.goalsAgainst, agg.matches),
				label: MATCHUP_LABEL.defensePlayer,
				side,
			},
		];
	});

	return {
		scorer: maxHighlight(scorers),
		creator: maxHighlight(creators),
		goalkeeper: maxHighlight(goalkeepers),
		form: maxHighlight(formHighlights),
		cleanSheet: maxHighlight(cleanSheets),
		goalsConceded: minHighlight(goalsConceded),
	};
}

function buildKeyPlayers(
	home: MatchupTeamInput,
	away: MatchupTeamInput,
	events: readonly ChampionshipEvent[],
	roster: readonly ChampionshipPlayer[],
): MatchupAnalysis["keyPlayers"] {
	return {
		home: buildTeamKeyPlayers(home, MATCHUP_SIDE.home, events, roster),
		away: buildTeamKeyPlayers(away, MATCHUP_SIDE.away, events, roster),
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

function minHighlight(
	rows: readonly MatchupPlayerHighlight[],
): MatchupPlayerHighlight | null {
	if (rows.length === 0) {
		return null;
	}

	return rows.reduce((left, right) => {
		if (right.value < left.value) {
			return right;
		}

		return left;
	});
}

function buildSummary(input: {
	home: MatchupTeamInput;
	away: MatchupTeamInput;
	favoriteSide: MatchupSide;
	fieldWins: { home: number; away: number };
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
		input.fieldWins,
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
	fieldWins: { home: number; away: number },
): string {
	if (favoriteSide === MATCHUP_SIDE.neutral || favoriteName === null) {
		return `${MATCHUP_LABEL.favoriteByFields}: ${MATCHUP_LABEL.neutral} (${fieldWins.home}×${fieldWins.away})`;
	}

	return `${favoriteName} é favorito pelos campos (${fieldWins.home}×${fieldWins.away}).`;
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
