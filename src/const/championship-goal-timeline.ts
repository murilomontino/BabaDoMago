import type { ChampionshipEvent } from "../types/championship-event.ts";
import {
	EVENT_MATCH_DURATION,
	formatMatchClock,
	matchScore,
} from "./championship-event-match.ts";
import type { TrendsPlayerScope } from "./championship-trends-player-scope.ts";
import {
	trendsScopedEndedMatches,
	trendsScopedGoalCount,
} from "./championship-trends-player-scope.ts";
import {
	compareMatchGoals,
	goalBeneficiaryTeamId,
	goalScoresForTeamA,
	marginForScoringSide,
	matchTeamAPlayerIds,
} from "./match-goal-score-walk.ts";
import { averageOrZero } from "./player-rating.ts";
import {
	formatRosterAverage,
	formatRosterWinRate,
	rosterWinRate,
} from "./roster-stats.ts";

export const GOAL_TIMELINE_BUCKET_COUNT = 3 as const;

export const GOAL_TIMELINE_MIN_COVERAGE = 0.5 as const;

export const GOAL_TIMELINE_LABEL = {
	title: "Timeline de gols",
	empty: "Poucos gols com minuto na janela",
	hint: "Quando os gols saem no relógio da partida. Some se a cobertura de minuto for baixa.",
	coverage: "Cobertura de minuto",
	avgFirstGoal: "Tempo médio até o 1º gol",
	lateShare: "Gols no terço final",
	bucketEarly: "Início",
	bucketMid: "Meio",
	bucketLate: "Final",
	minuteAxis: "Minuto",
	goalsAxis: "Gols",
	histogramHint: "Quantos gols saíram em cada minuto inteiro na janela.",
	firstGoalTitle: "Abertura × virada",
	firstGoalHint:
		"Partidas com gol: quem abriu o placar segurou a vitória, sofreu virada ou empatou.",
	firstGoalHeld: "Abriu e ganhou",
	firstGoalComeback: "Virada",
	firstGoalDraw: "Abriu e empatou",
	playerFirstGoalTitle: "Abertura × virada",
	playerFirstGoalHint:
		"Do ponto de vista do seu time nas partidas em que jogou com gol.",
	playerFirstGoalEmpty: "Poucos jogos com gol",
	playerOpenedHeld: "Abriu e ganhou",
	playerSufferedComeback: "Sofreu virada",
	playerMadeComeback: "Virou o jogo",
	playerDraw: "Empate",
	playerFailedChase: "Não virou",
	matchesAxis: "Partidas",
	scoreStateTitle: "Gol × placar",
	scoreStateHint:
		"Saldo do time que marcou, antes do gol. Negativo = perdendo, zero = empatado, positivo = vencendo.",
	marginAxis: "Saldo antes",
	ownGoal: "Gol contra",
	trailing: "Perdendo",
	tied: "Empatado",
	leading: "Vencendo",
} as const;

export const FIRST_GOAL_OUTCOME = {
	held: "held",
	comeback: "comeback",
	draw: "draw",
} as const;

export type FirstGoalOutcome =
	(typeof FIRST_GOAL_OUTCOME)[keyof typeof FIRST_GOAL_OUTCOME];

export const GOAL_SCORE_STATE = {
	trailing: "trailing",
	tied: "tied",
	leading: "leading",
} as const;

export type GoalScoreState =
	(typeof GOAL_SCORE_STATE)[keyof typeof GOAL_SCORE_STATE];

export const GOAL_MINUTE_HISTOGRAM_CHART = {
	height: 220,
	minuteKey: "label",
	goalsKey: "goals",
	margin: { top: 16, right: 28, bottom: 28, left: 8 },
	axisWidth: 36,
	barFill: "currentColor",
} as const;

export const FIRST_GOAL_OUTCOME_CHART = {
	height: 240,
	labelKey: "label",
	matchesKey: "matches",
	margin: { top: 16, right: 28, bottom: 48, left: 8 },
	axisWidth: 36,
	barFill: "currentColor",
} as const;

export const GOAL_SCORE_STATE_CHART = {
	height: 220,
	minuteKey: "minute",
	marginKey: "marginBefore",
	ballSize: 14,
	margin: { top: 16, right: 28, bottom: 28, left: 8 },
	axisWidth: 40,
	yPad: 0.5,
} as const;

export type GoalMinuteHistogramBar = {
	minute: number;
	label: string;
	goals: number;
};

export type GoalMinuteHistogram = {
	bars: GoalMinuteHistogramBar[];
	xMaxMinutes: number;
	maxGoals: number;
};

export const PLAYER_FIRST_GOAL_OUTCOME = {
	openedHeld: "openedHeld",
	sufferedComeback: "sufferedComeback",
	madeComeback: "madeComeback",
	draw: "draw",
	failedChase: "failedChase",
} as const;

export type PlayerFirstGoalOutcomeId =
	(typeof PLAYER_FIRST_GOAL_OUTCOME)[keyof typeof PLAYER_FIRST_GOAL_OUTCOME];

export type FirstGoalOutcomeBar = {
	id: string;
	label: string;
	matches: number;
};

export type FirstGoalOutcomeSummary = {
	held: number;
	comeback: number;
	draw: number;
	matches: number;
	bars: FirstGoalOutcomeBar[];
};

export type PlayerFirstGoalOutcomeSummary = {
	openedHeld: number;
	sufferedComeback: number;
	madeComeback: number;
	draw: number;
	failedChase: number;
	matches: number;
	bars: FirstGoalOutcomeBar[];
};

export type GoalScoreStatePoint = {
	minute: number;
	marginBefore: number;
	state: GoalScoreState;
	goalId: number;
	isOwnGoal: boolean;
	matchId: number;
	eventId: number;
	elapsedSeconds: number;
};

export type GoalScoreStateScatter = {
	points: GoalScoreStatePoint[];
	xMaxMinutes: number;
	yMin: number;
	yMax: number;
};

export type GoalTimelineBucket = {
	index: number;
	label: string;
	goals: number;
	share: number;
};

export type GoalTimelineSummary = {
	totalGoals: number;
	timedGoals: number;
	coverage: number;
	enoughCoverage: boolean;
	averageFirstGoalSeconds: number | null;
	lateShare: number;
	buckets: GoalTimelineBucket[];
};

function bucketLabel(index: number): string {
	switch (index) {
		case 0:
			return GOAL_TIMELINE_LABEL.bucketEarly;
		case 1:
			return GOAL_TIMELINE_LABEL.bucketMid;
		case 2:
			return GOAL_TIMELINE_LABEL.bucketLate;
		default:
			return GOAL_TIMELINE_LABEL.bucketMid;
	}
}

function goalBucketIndex(
	elapsedSeconds: number,
	durationSeconds: number,
): number {
	if (durationSeconds <= 0) {
		return 0;
	}

	const ratio = elapsedSeconds / durationSeconds;
	if (ratio < 1 / GOAL_TIMELINE_BUCKET_COUNT) {
		return 0;
	}

	if (ratio < 2 / GOAL_TIMELINE_BUCKET_COUNT) {
		return 1;
	}

	return 2;
}

function emptyBuckets(): GoalTimelineBucket[] {
	return Array.from({ length: GOAL_TIMELINE_BUCKET_COUNT }, (_, index) => ({
		index,
		label: bucketLabel(index),
		goals: 0,
		share: 0,
	}));
}

export function championshipGoalTimeline(
	events: readonly ChampionshipEvent[],
	playerIds: TrendsPlayerScope = null,
): GoalTimelineSummary {
	const bucketCounts = [0, 0, 0];
	let totalGoals = 0;
	let timedGoals = 0;
	let firstGoalSum = 0;
	let firstGoalCount = 0;

	for (const event of events) {
		if (event.ended_at === null) {
			continue;
		}

		const endedMatches = trendsScopedEndedMatches(event, playerIds);
		for (const match of endedMatches) {
			totalGoals += trendsScopedGoalCount(match.goals, playerIds);

			const timed = match.goals.flatMap((goal) => {
				if (goal.elapsed_seconds === null) {
					return [];
				}

				if (playerIds !== null && !playerIds.has(goal.scorer_player_id)) {
					return [];
				}

				return [goal.elapsed_seconds];
			});
			timedGoals += timed.length;

			const first = timed.reduce<number | null>((min, seconds) => {
				if (min === null || seconds < min) {
					return seconds;
				}

				return min;
			}, null);
			if (first !== null) {
				firstGoalSum += first;
				firstGoalCount += 1;
			}

			for (const seconds of timed) {
				const index = goalBucketIndex(seconds, match.duration_seconds);
				bucketCounts[index] = (bucketCounts[index] ?? 0) + 1;
			}
		}
	}

	const coverage = rosterWinRate(timedGoals, totalGoals);
	const buckets = emptyBuckets().map((bucket) => {
		const goals = bucketCounts[bucket.index] ?? 0;
		return {
			...bucket,
			goals,
			share: rosterWinRate(goals, timedGoals),
		};
	});
	const lateGoals = bucketCounts[2] ?? 0;

	return {
		totalGoals,
		timedGoals,
		coverage,
		enoughCoverage: coverage >= GOAL_TIMELINE_MIN_COVERAGE && timedGoals > 0,
		averageFirstGoalSeconds: firstGoalAverageSeconds(
			firstGoalSum,
			firstGoalCount,
		),
		lateShare: rosterWinRate(lateGoals, timedGoals),
		buckets,
	};
}

function firstGoalAverageSeconds(sum: number, count: number): number | null {
	if (count <= 0) {
		return null;
	}

	return averageOrZero(sum, count);
}

export function championshipGoalMinuteHistogram(
	events: readonly ChampionshipEvent[],
	playerIds: TrendsPlayerScope = null,
): GoalMinuteHistogram {
	const counts = new Map<number, number>();
	let maxDurationSeconds = 0;

	for (const event of events) {
		if (event.ended_at === null) {
			continue;
		}

		const endedMatches = trendsScopedEndedMatches(event, playerIds);
		for (const match of endedMatches) {
			if (match.duration_seconds > maxDurationSeconds) {
				maxDurationSeconds = match.duration_seconds;
			}

			for (const goal of match.goals) {
				if (goal.elapsed_seconds === null) {
					continue;
				}

				if (playerIds !== null && !playerIds.has(goal.scorer_player_id)) {
					continue;
				}

				const minute = Math.floor(goal.elapsed_seconds / 60);
				counts.set(minute, (counts.get(minute) ?? 0) + 1);
			}
		}
	}

	const xMaxMinutes = scatterXMaxMinutes(maxDurationSeconds);
	const bars: GoalMinuteHistogramBar[] = [];
	let maxGoals = 0;

	for (let minute = 0; minute <= xMaxMinutes; minute += 1) {
		const goals = counts.get(minute) ?? 0;
		if (goals > maxGoals) {
			maxGoals = goals;
		}

		bars.push({ minute, label: String(minute), goals });
	}

	return { bars, xMaxMinutes, maxGoals };
}

export function championshipFirstGoalOutcome(
	events: readonly ChampionshipEvent[],
	playerIds: TrendsPlayerScope = null,
): FirstGoalOutcomeSummary {
	let held = 0;
	let comeback = 0;
	let draw = 0;

	for (const event of events) {
		if (event.ended_at === null) {
			continue;
		}

		const endedMatches = trendsScopedEndedMatches(event, playerIds);
		for (const match of endedMatches) {
			const outcome = matchFirstGoalOutcome(match);
			if (outcome === null) {
				continue;
			}

			switch (outcome) {
				case FIRST_GOAL_OUTCOME.held:
					held += 1;
					break;
				case FIRST_GOAL_OUTCOME.comeback:
					comeback += 1;
					break;
				case FIRST_GOAL_OUTCOME.draw:
					draw += 1;
					break;
				default: {
					const _exhaustive: never = outcome;
					void _exhaustive;
				}
			}
		}
	}

	const bars: FirstGoalOutcomeBar[] = [
		{
			id: FIRST_GOAL_OUTCOME.held,
			label: GOAL_TIMELINE_LABEL.firstGoalHeld,
			matches: held,
		},
		{
			id: FIRST_GOAL_OUTCOME.comeback,
			label: GOAL_TIMELINE_LABEL.firstGoalComeback,
			matches: comeback,
		},
		{
			id: FIRST_GOAL_OUTCOME.draw,
			label: GOAL_TIMELINE_LABEL.firstGoalDraw,
			matches: draw,
		},
	];

	return {
		held,
		comeback,
		draw,
		matches: held + comeback + draw,
		bars,
	};
}

export function playerFirstGoalOutcome(
	events: readonly ChampionshipEvent[],
	playerId: number,
): PlayerFirstGoalOutcomeSummary {
	let openedHeld = 0;
	let sufferedComeback = 0;
	let madeComeback = 0;
	let draw = 0;
	let failedChase = 0;

	for (const event of events) {
		for (const match of event.matches) {
			if (match.ended_at === null) {
				continue;
			}

			const seat = match.players.find((row) => row.player_id === playerId);
			if (!seat) {
				continue;
			}

			const outcome = playerMatchFirstGoalOutcome(match, seat.team_id);
			if (outcome === null) {
				continue;
			}

			switch (outcome) {
				case PLAYER_FIRST_GOAL_OUTCOME.openedHeld:
					openedHeld += 1;
					break;
				case PLAYER_FIRST_GOAL_OUTCOME.sufferedComeback:
					sufferedComeback += 1;
					break;
				case PLAYER_FIRST_GOAL_OUTCOME.madeComeback:
					madeComeback += 1;
					break;
				case PLAYER_FIRST_GOAL_OUTCOME.draw:
					draw += 1;
					break;
				case PLAYER_FIRST_GOAL_OUTCOME.failedChase:
					failedChase += 1;
					break;
				default: {
					const _exhaustive: never = outcome;
					void _exhaustive;
				}
			}
		}
	}

	const bars: FirstGoalOutcomeBar[] = [
		{
			id: PLAYER_FIRST_GOAL_OUTCOME.openedHeld,
			label: GOAL_TIMELINE_LABEL.playerOpenedHeld,
			matches: openedHeld,
		},
		{
			id: PLAYER_FIRST_GOAL_OUTCOME.madeComeback,
			label: GOAL_TIMELINE_LABEL.playerMadeComeback,
			matches: madeComeback,
		},
		{
			id: PLAYER_FIRST_GOAL_OUTCOME.sufferedComeback,
			label: GOAL_TIMELINE_LABEL.playerSufferedComeback,
			matches: sufferedComeback,
		},
		{
			id: PLAYER_FIRST_GOAL_OUTCOME.draw,
			label: GOAL_TIMELINE_LABEL.playerDraw,
			matches: draw,
		},
		{
			id: PLAYER_FIRST_GOAL_OUTCOME.failedChase,
			label: GOAL_TIMELINE_LABEL.playerFailedChase,
			matches: failedChase,
		},
	];

	return {
		openedHeld,
		sufferedComeback,
		madeComeback,
		draw,
		failedChase,
		matches: openedHeld + sufferedComeback + madeComeback + draw + failedChase,
		bars,
	};
}

function playerMatchFirstGoalOutcome(
	match: ChampionshipEvent["matches"][number],
	playerTeamId: number,
): PlayerFirstGoalOutcomeId | null {
	if (match.goals.length === 0) {
		return null;
	}

	const ordered = [...match.goals].sort(compareMatchGoals);
	const first = ordered[0];
	if (first === undefined) {
		return null;
	}

	const teamAIds = matchTeamAPlayerIds(match);
	const openerTeamId = goalBeneficiaryTeamId(first, match, teamAIds);
	const weOpened = openerTeamId === playerTeamId;

	if (match.winner_team_id === null) {
		return PLAYER_FIRST_GOAL_OUTCOME.draw;
	}

	const weWon = match.winner_team_id === playerTeamId;
	if (weOpened && weWon) {
		return PLAYER_FIRST_GOAL_OUTCOME.openedHeld;
	}

	if (weOpened && !weWon) {
		return PLAYER_FIRST_GOAL_OUTCOME.sufferedComeback;
	}

	if (!weOpened && weWon) {
		return PLAYER_FIRST_GOAL_OUTCOME.madeComeback;
	}

	return PLAYER_FIRST_GOAL_OUTCOME.failedChase;
}

function matchFirstGoalOutcome(
	match: ChampionshipEvent["matches"][number],
): FirstGoalOutcome | null {
	if (match.goals.length === 0) {
		return null;
	}

	const ordered = [...match.goals].sort(compareMatchGoals);
	const first = ordered[0];
	if (first === undefined) {
		return null;
	}

	const teamAIds = matchTeamAPlayerIds(match);
	const openerTeamId = goalBeneficiaryTeamId(first, match, teamAIds);
	if (match.winner_team_id === null) {
		return FIRST_GOAL_OUTCOME.draw;
	}

	if (match.winner_team_id === openerTeamId) {
		return FIRST_GOAL_OUTCOME.held;
	}

	return FIRST_GOAL_OUTCOME.comeback;
}

export function championshipGoalScoreStateScatter(
	events: readonly ChampionshipEvent[],
	playerIds: TrendsPlayerScope = null,
): GoalScoreStateScatter {
	const points: GoalScoreStatePoint[] = [];
	let maxDurationSeconds = 0;
	let yMin = 0;
	let yMax = 0;

	for (const event of events) {
		if (event.ended_at === null) {
			continue;
		}

		const endedMatches = trendsScopedEndedMatches(event, playerIds);
		for (const match of endedMatches) {
			if (match.duration_seconds > maxDurationSeconds) {
				maxDurationSeconds = match.duration_seconds;
			}

			const teamAIds = matchTeamAPlayerIds(match);
			const ordered = [...match.goals].sort(compareMatchGoals);

			for (let index = 0; index < ordered.length; index += 1) {
				const goal = ordered[index];
				if (goal === undefined || goal.elapsed_seconds === null) {
					continue;
				}

				if (playerIds !== null && !playerIds.has(goal.scorer_player_id)) {
					continue;
				}

				const prior = ordered.slice(0, index);
				const before = matchScore(prior, teamAIds);
				const scoresForA = goalScoresForTeamA(goal, teamAIds);
				const marginBefore = marginForScoringSide(before, scoresForA);
				if (marginBefore < yMin) {
					yMin = marginBefore;
				}
				if (marginBefore > yMax) {
					yMax = marginBefore;
				}

				points.push({
					minute: goal.elapsed_seconds / 60,
					marginBefore,
					state: scoreStateFromMargin(marginBefore),
					goalId: goal.id,
					isOwnGoal: goal.is_own_goal,
					matchId: match.id,
					eventId: event.id,
					elapsedSeconds: goal.elapsed_seconds,
				});
			}
		}
	}

	return {
		points,
		xMaxMinutes: scatterXMaxMinutes(maxDurationSeconds),
		yMin,
		yMax,
	};
}

export function scoreStateFromMargin(margin: number): GoalScoreState {
	if (margin < 0) {
		return GOAL_SCORE_STATE.trailing;
	}

	if (margin > 0) {
		return GOAL_SCORE_STATE.leading;
	}

	return GOAL_SCORE_STATE.tied;
}

export function goalScoreStateCaption(state: GoalScoreState): string {
	switch (state) {
		case GOAL_SCORE_STATE.trailing:
			return GOAL_TIMELINE_LABEL.trailing;
		case GOAL_SCORE_STATE.tied:
			return GOAL_TIMELINE_LABEL.tied;
		case GOAL_SCORE_STATE.leading:
			return GOAL_TIMELINE_LABEL.leading;
		default: {
			const _exhaustive: never = state;
			return _exhaustive;
		}
	}
}

function scatterXMaxMinutes(maxDurationSeconds: number): number {
	if (maxDurationSeconds <= 0) {
		return EVENT_MATCH_DURATION.defaultMinutes;
	}

	return Math.max(
		EVENT_MATCH_DURATION.minMinutes,
		Math.ceil(maxDurationSeconds / 60),
	);
}

export function formatGoalScoreStateClock(point: GoalScoreStatePoint): string {
	return formatMatchClock(point.elapsedSeconds);
}

export function formatGoalTimelineCoverage(
	summary: GoalTimelineSummary,
): string {
	return formatRosterWinRate(summary.coverage);
}

export function formatGoalTimelineLateShare(
	summary: GoalTimelineSummary,
): string {
	return formatRosterWinRate(summary.lateShare);
}

export function formatGoalTimelineFirstGoal(
	summary: GoalTimelineSummary,
): string {
	if (summary.averageFirstGoalSeconds === null) {
		return "—";
	}

	return `${formatRosterAverage(summary.averageFirstGoalSeconds / 60)} min`;
}
