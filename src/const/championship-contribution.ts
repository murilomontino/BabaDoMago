import type { ChampionshipPlayer } from "../types/championship.ts";
import type {
	ChampionshipEvent,
	ChampionshipEventAttendance,
	ChampionshipEventGoal,
	ChampionshipEventMatch,
	ChampionshipEventMatchPlayer,
} from "../types/championship-event.ts";
import { championshipRatingChartColor } from "./championship-rating-history.ts";
import {
	championshipTrendsEvents,
	type TrendsAudience,
	type TrendsWindow,
	trendsAudiencePlayers,
} from "./championship-trends-window.ts";
import { formatEventRating } from "./event-rating-adjustment.ts";
import { matchGoalsForTeam } from "./match-goal-counts.ts";
import { playerVisibleName } from "./player-name.ts";
import { countsForSynergy } from "./player-synergy.ts";
import {
	formatRosterAverage,
	formatRosterCount,
	formatRosterWinRate,
	rosterAverage,
	rosterSafeCount,
	rosterWinRate,
} from "./roster-stats.ts";

export const CONTRIBUTION_MIN_GAMES = 3 as const;

export const CONTRIBUTION_METRIC = {
	goalShare: "goal_share",
	goalsPerGame: "goals_per_game",
	assistsPerGame: "assists_per_game",
	mvpRate: "mvp_rate",
	ratingDelta: "rating_delta",
} as const;

export type ContributionMetric =
	(typeof CONTRIBUTION_METRIC)[keyof typeof CONTRIBUTION_METRIC];

export const CONTRIBUTION_METRIC_DEFAULT = CONTRIBUTION_METRIC.goalShare;

export const CONTRIBUTION_METRIC_OPTIONS = [
	CONTRIBUTION_METRIC.goalShare,
	CONTRIBUTION_METRIC.goalsPerGame,
	CONTRIBUTION_METRIC.assistsPerGame,
	CONTRIBUTION_METRIC.mvpRate,
	CONTRIBUTION_METRIC.ratingDelta,
] as const;

export const CONTRIBUTION_LABEL = {
	title: "Contribuição × Resultado",
	hint: "Relação entre produção individual e frequência de vitórias. WinRate = V ÷ J (não é o aproveitamento da nota).",
	filter: "Métrica",
	[CONTRIBUTION_METRIC.goalShare]: "Participação em gols",
	[CONTRIBUTION_METRIC.goalsPerGame]: "Gols / jogo",
	[CONTRIBUTION_METRIC.assistsPerGame]: "Assistências / jogo",
	[CONTRIBUTION_METRIC.mvpRate]: "MVP / rodada",
	[CONTRIBUTION_METRIC.ratingDelta]: "Δ rating",
	winRate: "WinRate",
	games: "Jogos",
	goals: "Gols",
	assists: "Assistências",
	mvps: "MVP",
	rating: "Rating",
	goalShare: "Participação em gols",
	goalsPerGame: "Gols/jogo",
	assistsPerGame: "Assistências/jogo",
	mvpRate: "MVP/rodada",
	ratingDelta: "Δ rating",
	showTable: "Mostrar tabela",
	hideTable: "Ocultar tabela",
	showBelowMin: "Mostrar jogadores com poucos jogos",
	empty: "Nenhum jogador possui dados no recorte selecionado.",
	emptyMinGames:
		"Ainda não há dados suficientes. São necessárias pelo menos 3 partidas por jogador.",
	emptyGoalShare: "Não houve gols suficientes para calcular participação.",
	insightTopShare: "Maior contribuição ofensiva",
	insightTopWinRate: "Maior WinRate",
	insightBestCombo: "Melhor combinação",
	insightBestComboDetail: "alta contribuição + alto WinRate",
	insightHighProdLowWin: "Maior produção com baixo WinRate",
} as const;

export const CONTRIBUTION_CHART = {
	height: 300,
	winRateKey: "winRate",
	metricKey: "selectedMetric",
	nameKey: "name",
	margin: { top: 24, right: 28, bottom: 28, left: 8 },
	axisWidth: 44,
	fallbackMax: 1,
	bubbleMin: 4,
	bubbleMax: 16,
	bubbleSqrtScale: 2.2,
	domainPad: 0.05,
} as const;

export type PlayerContributionPoint = {
	player: ChampionshipPlayer;
	playerId: number;
	name: string;
	avatarUrl: string | null;
	color: string;
	rating: number;
	games: number;
	wins: number;
	draws: number;
	losses: number;
	winRate: number;
	goals: number;
	assists: number;
	mvps: number;
	goalShare: number | null;
	goalsPerGame: number;
	assistsPerGame: number;
	mvpRate: number;
	ratingDelta: number;
	selectedMetric: number;
	belowMinSample: boolean;
};

export type ContributionInsight = {
	kind: "topShare" | "topWinRate" | "bestCombo" | "highProdLowWin";
	label: string;
	detail: string;
	playerId: number;
	name: string;
};

type AttendanceAgg = {
	wins: number;
	draws: number;
	losses: number;
	matches: number;
	goals: number;
	assists: number;
	mvps: number;
	ratingDeltaSum: number;
};

type GoalShareAgg = {
	involvement: number;
	teamGoals: number;
};

export function isContributionMetric(
	value: string,
): value is ContributionMetric {
	return CONTRIBUTION_METRIC_OPTIONS.some((option) => option === value);
}

export function parseContributionMetric(value: string): ContributionMetric {
	if (isContributionMetric(value)) {
		return value;
	}

	return CONTRIBUTION_METRIC_DEFAULT;
}

export function contributionMetricCaption(metric: ContributionMetric): string {
	return CONTRIBUTION_LABEL[metric];
}

export function contributionSubtitle(metric: ContributionMetric): string {
	return `${contributionMetricCaption(metric)} × ${CONTRIBUTION_LABEL.winRate}`;
}

export function championshipContribution(input: {
	players: readonly ChampionshipPlayer[];
	events: readonly ChampionshipEvent[];
	window: TrendsWindow;
	audience: TrendsAudience;
	metric: ContributionMetric;
	includeBelowMin?: boolean;
}): PlayerContributionPoint[] {
	const scopedPlayers = trendsAudiencePlayers(input.players, input.audience);
	const windowEvents = championshipTrendsEvents(input.events, input.window);
	const includeBelowMin = input.includeBelowMin === true;
	const attendanceByPlayer = aggregateAttendance(windowEvents);
	const goalShareByPlayer = aggregateGoalShare(windowEvents);

	const points = scopedPlayers.flatMap((player) => {
		const agg = attendanceByPlayer.get(player.id);
		if (!agg || agg.matches === 0) {
			return [];
		}

		const belowMinSample = agg.matches < CONTRIBUTION_MIN_GAMES;
		if (belowMinSample && !includeBelowMin) {
			return [];
		}

		const shareAgg = goalShareByPlayer.get(player.id);
		const goalShare = goalShareValue(shareAgg);
		const goalsPerGame = rosterAverage(agg.goals, agg.matches);
		const assistsPerGame = rosterAverage(agg.assists, agg.matches);
		const mvpRate = rosterAverage(agg.mvps, agg.matches);
		const ratingDelta = roundAwayFromZero1(agg.ratingDeltaSum);
		const winRate = rosterWinRate(agg.wins, agg.matches);
		const selectedMetric = selectedMetricValue(input.metric, {
			goalShare,
			goalsPerGame,
			assistsPerGame,
			mvpRate,
			ratingDelta,
		});
		if (selectedMetric === null) {
			return [];
		}

		return [
			{
				player,
				playerId: player.id,
				name: playerVisibleName(player),
				avatarUrl: player.avatar_url,
				color: championshipRatingChartColor(player.id),
				rating: player.rating,
				games: agg.matches,
				wins: agg.wins,
				draws: agg.draws,
				losses: agg.losses,
				winRate,
				goals: agg.goals,
				assists: agg.assists,
				mvps: agg.mvps,
				goalShare,
				goalsPerGame,
				assistsPerGame,
				mvpRate,
				ratingDelta,
				selectedMetric,
				belowMinSample,
			},
		];
	});

	return points.sort(compareContributionPoints);
}

export function championshipContributionEmptyLabel(
	points: readonly PlayerContributionPoint[],
	metric: ContributionMetric,
	includeBelowMin: boolean,
): string | null {
	if (points.length > 0) {
		return null;
	}

	if (metric === CONTRIBUTION_METRIC.goalShare) {
		return CONTRIBUTION_LABEL.emptyGoalShare;
	}

	if (!includeBelowMin) {
		return CONTRIBUTION_LABEL.emptyMinGames;
	}

	return CONTRIBUTION_LABEL.empty;
}

export function contributionBubbleRadius(games: number): number {
	const safe = Math.max(0, rosterSafeCount(games));
	const raw =
		CONTRIBUTION_CHART.bubbleMin +
		Math.sqrt(safe) * CONTRIBUTION_CHART.bubbleSqrtScale;
	return Math.min(CONTRIBUTION_CHART.bubbleMax, raw);
}

export function contributionWinRateDomain(): { min: number; max: number } {
	return { min: 0, max: 1 };
}

export function contributionMetricDomain(
	points: readonly PlayerContributionPoint[],
	metric: ContributionMetric,
): { min: number; max: number } {
	if (
		metric === CONTRIBUTION_METRIC.goalShare ||
		metric === CONTRIBUTION_METRIC.mvpRate
	) {
		return { min: 0, max: 1 };
	}

	if (points.length === 0) {
		return { min: 0, max: CONTRIBUTION_CHART.fallbackMax };
	}

	const values = points.map((point) => point.selectedMetric);
	const rawMax = Math.max(...values);
	const rawMin = Math.min(0, ...values);
	const pad = CONTRIBUTION_CHART.domainPad;
	if (metric === CONTRIBUTION_METRIC.ratingDelta) {
		const span = Math.max(Math.abs(rawMin), Math.abs(rawMax), pad);
		return { min: -span - pad, max: span + pad };
	}

	return {
		min: 0,
		max: Math.max(pad, rawMax + pad),
	};
}

export function formatContributionWinRate(value: number): string {
	return formatRosterWinRate(value);
}

export function formatContributionPercent(value: number): string {
	return `${(rosterSafeCount(value) * 100).toFixed(1).replace(/\.0$/, "")}%`;
}

export function formatContributionPerGame(value: number): string {
	const fixed = rosterSafeCount(value).toFixed(2);
	if (fixed.endsWith(".00")) {
		return fixed.slice(0, -3);
	}

	if (fixed.endsWith("0")) {
		return fixed.slice(0, -1);
	}

	return fixed;
}

export function formatContributionMetricValue(
	metric: ContributionMetric,
	value: number,
): string {
	switch (metric) {
		case CONTRIBUTION_METRIC.goalShare:
		case CONTRIBUTION_METRIC.mvpRate:
			return formatContributionPercent(value);
		case CONTRIBUTION_METRIC.goalsPerGame:
		case CONTRIBUTION_METRIC.assistsPerGame:
			return formatContributionPerGame(value);
		case CONTRIBUTION_METRIC.ratingDelta:
			return formatContributionDelta(value);
		default: {
			const _never: never = metric;
			return _never;
		}
	}
}

export function formatContributionDelta(value: number): string {
	if (value > 0) {
		return `+${formatEventRating(value)}`;
	}

	return formatEventRating(value);
}

export function formatContributionCount(value: number): string {
	return formatRosterCount(value);
}

export function formatContributionAverage(value: number): string {
	return formatRosterAverage(value);
}

export function contributionInsights(
	points: readonly PlayerContributionPoint[],
): ContributionInsight[] {
	const eligible = points.filter((point) => !point.belowMinSample);
	if (eligible.length === 0) {
		return [];
	}

	const withShare = eligible.filter(
		(point): point is PlayerContributionPoint & { goalShare: number } =>
			point.goalShare !== null,
	);

	const insights: ContributionInsight[] = [];

	const topShare = maxBy(withShare, (point) => point.goalShare);
	if (topShare) {
		insights.push({
			kind: "topShare",
			label: CONTRIBUTION_LABEL.insightTopShare,
			detail: formatContributionPercent(topShare.goalShare),
			playerId: topShare.playerId,
			name: topShare.name,
		});
	}

	const topWin = maxBy(eligible, (point) => point.winRate);
	if (topWin) {
		insights.push({
			kind: "topWinRate",
			label: CONTRIBUTION_LABEL.insightTopWinRate,
			detail: formatContributionWinRate(topWin.winRate),
			playerId: topWin.playerId,
			name: topWin.name,
		});
	}

	const bestCombo = maxBy(withShare, comboScore);
	if (bestCombo && bestCombo.winRate >= 0.5 && bestCombo.goalShare >= 0.25) {
		insights.push({
			kind: "bestCombo",
			label: CONTRIBUTION_LABEL.insightBestCombo,
			detail: CONTRIBUTION_LABEL.insightBestComboDetail,
			playerId: bestCombo.playerId,
			name: bestCombo.name,
		});
	}

	const highProdLowWin = maxBy(
		withShare.filter((point) => point.winRate < 0.45 && point.goalShare >= 0.3),
		(point) => point.goalShare,
	);
	if (highProdLowWin) {
		insights.push({
			kind: "highProdLowWin",
			label: CONTRIBUTION_LABEL.insightHighProdLowWin,
			detail: `${formatContributionPercent(highProdLowWin.goalShare)} participação / ${formatContributionWinRate(highProdLowWin.winRate)} WinRate`,
			playerId: highProdLowWin.playerId,
			name: highProdLowWin.name,
		});
	}

	return insights;
}

function aggregateAttendance(
	events: readonly ChampionshipEvent[],
): Map<number, AttendanceAgg> {
	const byPlayer = new Map<number, AttendanceAgg>();

	for (const event of events) {
		for (const row of event.attendance) {
			const prev = byPlayer.get(row.player_id) ?? emptyAttendanceAgg();
			byPlayer.set(row.player_id, addAttendance(prev, row));
		}
	}

	return byPlayer;
}

function emptyAttendanceAgg(): AttendanceAgg {
	return {
		wins: 0,
		draws: 0,
		losses: 0,
		matches: 0,
		goals: 0,
		assists: 0,
		mvps: 0,
		ratingDeltaSum: 0,
	};
}

function addAttendance(
	prev: AttendanceAgg,
	row: ChampionshipEventAttendance,
): AttendanceAgg {
	return {
		wins: prev.wins + rosterSafeCount(row.wins),
		draws: prev.draws + rosterSafeCount(row.draws),
		losses: prev.losses + rosterSafeCount(row.losses),
		matches: prev.matches + rosterSafeCount(row.matches),
		goals: prev.goals + rosterSafeCount(row.goals),
		assists: prev.assists + rosterSafeCount(row.assists),
		mvps: prev.mvps + Number(row.is_mvp),
		ratingDeltaSum: prev.ratingDeltaSum + row.rating_delta,
	};
}

function aggregateGoalShare(
	events: readonly ChampionshipEvent[],
): Map<number, GoalShareAgg> {
	const byPlayer = new Map<number, GoalShareAgg>();

	for (const event of events) {
		const rosterByPlayer = rosterTeamByPlayerId(event);
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
		if (teamGoals <= 0) {
			continue;
		}

		const involvement = matchPlayerInvolvement(match.goals, playerById, seat);
		const prev = byPlayer.get(seat.player_id) ?? {
			involvement: 0,
			teamGoals: 0,
		};
		byPlayer.set(seat.player_id, {
			involvement: prev.involvement + involvement,
			teamGoals: prev.teamGoals + teamGoals,
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
		if (countsAsScorer(goal, playerById, seat.player_id)) {
			next += 1;
		}

		if (countsAsAssist(goal, playerById, seat.player_id)) {
			next += 1;
		}

		return next;
	}, 0);
}

function countsAsScorer(
	goal: ChampionshipEventGoal,
	playerById: ReadonlyMap<number, ChampionshipEventMatchPlayer>,
	playerId: number,
): boolean {
	if (goal.scorer_player_id !== playerId) {
		return false;
	}

	if (goal.is_own_goal) {
		return false;
	}

	return playerById.get(playerId)?.include_stats === true;
}

function countsAsAssist(
	goal: ChampionshipEventGoal,
	playerById: ReadonlyMap<number, ChampionshipEventMatchPlayer>,
	playerId: number,
): boolean {
	if (goal.assist_player_id !== playerId) {
		return false;
	}

	return playerById.get(playerId)?.include_stats === true;
}

function goalShareValue(agg: GoalShareAgg | undefined): number | null {
	if (!agg || agg.teamGoals <= 0) {
		return null;
	}

	return agg.involvement / agg.teamGoals;
}

function selectedMetricValue(
	metric: ContributionMetric,
	values: {
		goalShare: number | null;
		goalsPerGame: number;
		assistsPerGame: number;
		mvpRate: number;
		ratingDelta: number;
	},
): number | null {
	switch (metric) {
		case CONTRIBUTION_METRIC.goalShare:
			return values.goalShare;
		case CONTRIBUTION_METRIC.goalsPerGame:
			return values.goalsPerGame;
		case CONTRIBUTION_METRIC.assistsPerGame:
			return values.assistsPerGame;
		case CONTRIBUTION_METRIC.mvpRate:
			return values.mvpRate;
		case CONTRIBUTION_METRIC.ratingDelta:
			return values.ratingDelta;
		default: {
			const _never: never = metric;
			return _never;
		}
	}
}

function rosterTeamByPlayerId(
	event: ChampionshipEvent,
): ReadonlyMap<number, number> {
	return new Map(
		event.teams.flatMap((team) =>
			team.players.map((row) => [row.player_id, team.id] as const),
		),
	);
}

function compareContributionPoints(
	left: PlayerContributionPoint,
	right: PlayerContributionPoint,
): number {
	if (right.selectedMetric !== left.selectedMetric) {
		return right.selectedMetric - left.selectedMetric;
	}

	if (right.winRate !== left.winRate) {
		return right.winRate - left.winRate;
	}

	return left.name.localeCompare(right.name, "pt");
}

function comboScore(
	point: PlayerContributionPoint & { goalShare: number },
): number {
	return point.goalShare * point.winRate;
}

function maxBy<T>(items: readonly T[], score: (item: T) => number): T | null {
	if (items.length === 0) {
		return null;
	}

	return items.reduce((best, item) => {
		if (score(item) > score(best)) {
			return item;
		}

		return best;
	});
}

function signedUnit(value: number): number {
	if (value < 0) {
		return -1;
	}

	return 1;
}

function roundAwayFromZero1(value: number): number {
	if (!Number.isFinite(value)) {
		return 0;
	}

	return (signedUnit(value) * Math.round(Math.abs(value) * 10)) / 10;
}
