import type { ChampionshipPlayer } from "../types/championship.ts";
import type {
	ChampionshipEvent,
	ChampionshipEventAttendance,
	ChampionshipEventMatch,
	ChampionshipEventTeam,
} from "../types/championship-event.ts";
import {
	eventTeamRatingSum,
	formatEventStartsAt,
} from "./championship-event.ts";
import { endedChampionshipHistoryEvents } from "./championship-rating-history.ts";
import {
	TRENDS_AUDIENCE,
	type TrendsAudience,
} from "./championship-trends-window.ts";
import { eventTeamName } from "./event-team-color.ts";
import {
	isCloseMatch,
	matchGoalMargin,
	matchGoalsForTeam,
} from "./match-goal-counts.ts";
import { averageOrZero } from "./player-rating.ts";
import {
	formatRosterCount,
	formatRosterWinRate,
	rosterWinRate,
} from "./roster-stats.ts";
import {
	SHARE_FILE,
	shareFileDateStamp,
	shareFileName,
} from "./share-file-name.ts";

export const PREDICTED_VS_REALIZED_WINDOW = {
	last3: "last3",
	last5: "last5",
	last8: "last8",
	month1: "month1",
	month2: "month2",
	all: "all",
} as const;

export type PredictedVsRealizedWindow =
	(typeof PREDICTED_VS_REALIZED_WINDOW)[keyof typeof PREDICTED_VS_REALIZED_WINDOW];

export const PREDICTED_VS_REALIZED_WINDOW_DEFAULT =
	PREDICTED_VS_REALIZED_WINDOW.last5;

export const PREDICTED_VS_REALIZED_WINDOW_COUNT = {
	[PREDICTED_VS_REALIZED_WINDOW.last3]: 3,
	[PREDICTED_VS_REALIZED_WINDOW.last5]: 5,
	[PREDICTED_VS_REALIZED_WINDOW.last8]: 8,
} as const;

export const PREDICTED_VS_REALIZED_WINDOW_MONTHS = {
	[PREDICTED_VS_REALIZED_WINDOW.month1]: 1,
	[PREDICTED_VS_REALIZED_WINDOW.month2]: 2,
} as const;

export const PREDICTED_VS_REALIZED_WINDOW_OPTIONS = [
	PREDICTED_VS_REALIZED_WINDOW.last3,
	PREDICTED_VS_REALIZED_WINDOW.last5,
	PREDICTED_VS_REALIZED_WINDOW.last8,
	PREDICTED_VS_REALIZED_WINDOW.month1,
	PREDICTED_VS_REALIZED_WINDOW.month2,
	PREDICTED_VS_REALIZED_WINDOW.all,
] as const;

export const PREDICTED_VS_REALIZED_ROSTER = {
	all: TRENDS_AUDIENCE.all,
	monthly: TRENDS_AUDIENCE.monthly,
} as const;

export type PredictedVsRealizedRoster =
	(typeof PREDICTED_VS_REALIZED_ROSTER)[keyof typeof PREDICTED_VS_REALIZED_ROSTER];

export const PREDICTED_VS_REALIZED_ROSTER_DEFAULT =
	PREDICTED_VS_REALIZED_ROSTER.all;

export const PREDICTED_VS_REALIZED_ROSTER_OPTIONS = [
	PREDICTED_VS_REALIZED_ROSTER.all,
	PREDICTED_VS_REALIZED_ROSTER.monthly,
] as const;

export const PREDICTED_VS_REALIZED_WITHIN = 1 as const;

export const PREDICTED_VS_REALIZED_MIN_MATCHES = 1 as const;

export const PREDICTED_VS_REALIZED_SMALL_SAMPLE = 5 as const;

export const PREDICTED_VS_REALIZED_QUALITY = {
	good: "good",
	watch: "watch",
	high: "high",
} as const;

export type PredictedVsRealizedQuality =
	(typeof PREDICTED_VS_REALIZED_QUALITY)[keyof typeof PREDICTED_VS_REALIZED_QUALITY];

export const PREDICTED_VS_REALIZED_QUALITY_MAE = {
	[PREDICTED_VS_REALIZED_QUALITY.good]: 1,
	[PREDICTED_VS_REALIZED_QUALITY.watch]: 2,
} as const;

export const PREDICTED_VS_REALIZED_BANDS = [
	{ id: "0_1", label: "0–1", min: 0, max: 1 },
	{ id: "1_2", label: "1–2", min: 1, max: 2 },
	{ id: "2_3", label: "2–3", min: 2, max: 3 },
	{ id: "3_5", label: "3–5", min: 3, max: 5 },
	{ id: "5_plus", label: "5+", min: 5, max: Number.POSITIVE_INFINITY },
] as const;

export type PredictedVsRealizedBandId =
	(typeof PREDICTED_VS_REALIZED_BANDS)[number]["id"];

export const PREDICTED_VS_REALIZED_LABEL = {
	title: "Previsto × Realizado",
	subtitle: "Qualidade do equilíbrio dos sorteios",
	hint: "Compara a diferença de soma de notas do sorteio (snapshot) com a diferença de gols. Linha y = x = calibração 1 ponto ≈ 1 gol.",
	empty:
		"Ainda não há partidas suficientes para comparar previsão e resultado.",
	smallSample: "Amostra pequena: interpretação com cautela.",
	filterWindow: "Janela",
	filterRoster: "Elenco",
	[PREDICTED_VS_REALIZED_WINDOW.last3]: "Últimas 3",
	[PREDICTED_VS_REALIZED_WINDOW.last5]: "Últimas 5",
	[PREDICTED_VS_REALIZED_WINDOW.last8]: "Últimas 8",
	[PREDICTED_VS_REALIZED_WINDOW.month1]: "1 mês",
	[PREDICTED_VS_REALIZED_WINDOW.month2]: "2 meses",
	[PREDICTED_VS_REALIZED_WINDOW.all]: "Todas",
	rosterAll: "Todos",
	rosterMonthly: "Mensalistas",
	mae: "MAE",
	maeHint: "Erro absoluto médio",
	bias: "Viés",
	biasHint: "Erro médio com sinal",
	withinOne: "±1 gol",
	withinOneHint: "Partidas dentro da margem",
	meanPredicted: "Previsto médio",
	meanRealized: "Realizado médio",
	favoriteWin: "Favorito venceu",
	predicted: "Diferença prevista",
	realized: "Diferença realizada",
	error: "Erro",
	absoluteError: "Erro absoluto",
	round: "Rodada",
	match: "Jogo",
	score: "Placar",
	favorite: "Favorito",
	favoriteWonYes: "Sim",
	favoriteWonNo: "Não",
	favoriteWonDraw: "—",
	perfectLine: "Previsão perfeita (y = x)",
	evolutionTitle: "MAE por rodada",
	evolutionCumulative: "MAE acumulado",
	evolutionRound: "MAE da rodada",
	tableTitle: "Por partida",
	roundsTitle: "Por rodada",
	bandsTitle: "Por faixa de diferença prevista",
	band: "Dif. prevista",
	matches: "Jogos",
	closeMatches: "Jogos apertados",
	share: "Compartilhar",
	shareCsv: "Exportar CSV",
	sharePng: "Exportar PNG",
	sharing: "Gerando…",
	shareFailed: "Não foi possível compartilhar Previsto × Realizado",
	qualityGood: "Bem calibrado",
	qualityWatch: "Atenção",
	qualityHigh: "Alta divergência",
} as const;

export const PREDICTED_VS_REALIZED_CHART = {
	height: 320,
	margin: { top: 16, right: 28, bottom: 36, left: 8 },
	axisWidth: 44,
	dotRadius: 5,
	referenceStroke: "#a8a29e",
	pointFill: "#0f766e",
	predictedKey: "predictedDifference",
	realizedKey: "realizedDifference",
} as const;

export const PREDICTED_VS_REALIZED_EVOLUTION_CHART = {
	height: 220,
	indexKey: "x",
	roundMaeKey: "roundMae",
	cumulativeMaeKey: "cumulativeMae",
} as const;

export const PREDICTED_VS_REALIZED_SHARE = {
	width: 1080,
	padding: 32,
	headerHeight: 110,
	kpiHeight: 88,
	chartHeight: 480,
	chartPad: 48,
	dotRadius: 7,
	filePrefix: "previsto-realizado",
	mimePng: "image/png",
} as const;

export type PredictedVsRealizedMatch = {
	eventId: number;
	eventStartsAt: string;
	roundIndex: number;
	matchId: number;
	matchIndex: number;
	teamAId: number;
	teamBId: number;
	teamALabel: string;
	teamBLabel: string;
	teamAGoals: number;
	teamBGoals: number;
	predictedSumA: number;
	predictedSumB: number;
	predictedDifference: number;
	realizedDifference: number;
	error: number;
	absoluteError: number;
	isCloseMatch: boolean;
	favoriteTeamId: number | null;
	favoriteLabel: string | null;
	favoriteWon: boolean | null;
};

export type PredictedVsRealizedRound = {
	eventId: number;
	eventStartsAt: string;
	roundIndex: number;
	matches: number;
	meanPredictedDifference: number;
	meanRealizedDifference: number;
	meanError: number;
	meanAbsoluteError: number;
	cumulativeMeanAbsoluteError: number;
};

export type PredictedVsRealizedBand = {
	bandId: PredictedVsRealizedBandId;
	label: string;
	matches: number;
	meanAbsoluteError: number;
	closeMatchRate: number;
	favoriteWinRate: number | null;
};

export type PredictedVsRealizedSummary = {
	matches: number;
	meanPredictedDifference: number;
	meanRealizedDifference: number;
	meanError: number;
	meanAbsoluteError: number;
	withinOneGoalRate: number;
	favoriteWinRate: number | null;
	favoriteDecided: number;
	smallSample: boolean;
	quality: PredictedVsRealizedQuality | null;
};

export type PredictedVsRealizedResult = {
	matches: PredictedVsRealizedMatch[];
	rounds: PredictedVsRealizedRound[];
	bands: PredictedVsRealizedBand[];
	summary: PredictedVsRealizedSummary;
};

export type PredictedVsRealizedOptions = {
	window: PredictedVsRealizedWindow;
	roster: PredictedVsRealizedRoster;
};

export function isPredictedVsRealizedWindow(
	value: string,
): value is PredictedVsRealizedWindow {
	return PREDICTED_VS_REALIZED_WINDOW_OPTIONS.some(
		(option) => option === value,
	);
}

export function parsePredictedVsRealizedWindow(
	value: string,
): PredictedVsRealizedWindow {
	if (isPredictedVsRealizedWindow(value)) {
		return value;
	}

	return PREDICTED_VS_REALIZED_WINDOW_DEFAULT;
}

export function predictedVsRealizedWindowCaption(
	window: PredictedVsRealizedWindow,
): string {
	return PREDICTED_VS_REALIZED_LABEL[window];
}

export function isPredictedVsRealizedRoster(
	value: string,
): value is PredictedVsRealizedRoster {
	return PREDICTED_VS_REALIZED_ROSTER_OPTIONS.some(
		(option) => option === value,
	);
}

export function parsePredictedVsRealizedRoster(
	value: string,
): PredictedVsRealizedRoster {
	if (isPredictedVsRealizedRoster(value)) {
		return value;
	}

	return PREDICTED_VS_REALIZED_ROSTER_DEFAULT;
}

export function predictedVsRealizedRosterCaption(
	roster: PredictedVsRealizedRoster,
): string {
	if (roster === PREDICTED_VS_REALIZED_ROSTER.monthly) {
		return PREDICTED_VS_REALIZED_LABEL.rosterMonthly;
	}

	return PREDICTED_VS_REALIZED_LABEL.rosterAll;
}

export function predictedVsRealizedEvents<
	T extends { id: number; starts_at: string; ended_at: string | null },
>(
	events: readonly T[],
	window: PredictedVsRealizedWindow,
	nowMs: number = Date.now(),
): T[] {
	const ended = endedChampionshipHistoryEvents(events);

	if (window === PREDICTED_VS_REALIZED_WINDOW.all) {
		return ended;
	}

	if (window === PREDICTED_VS_REALIZED_WINDOW.last3) {
		return ended.slice(-PREDICTED_VS_REALIZED_WINDOW_COUNT.last3);
	}

	if (window === PREDICTED_VS_REALIZED_WINDOW.last5) {
		return ended.slice(-PREDICTED_VS_REALIZED_WINDOW_COUNT.last5);
	}

	if (window === PREDICTED_VS_REALIZED_WINDOW.last8) {
		return ended.slice(-PREDICTED_VS_REALIZED_WINDOW_COUNT.last8);
	}

	if (window === PREDICTED_VS_REALIZED_WINDOW.month1) {
		return filterEndedSinceMonths(
			ended,
			PREDICTED_VS_REALIZED_WINDOW_MONTHS.month1,
			nowMs,
		);
	}

	if (window === PREDICTED_VS_REALIZED_WINDOW.month2) {
		return filterEndedSinceMonths(
			ended,
			PREDICTED_VS_REALIZED_WINDOW_MONTHS.month2,
			nowMs,
		);
	}

	const _never: never = window;
	return _never;
}

export function predictedVsRealizedQuality(
	meanAbsoluteError: number,
	matches: number,
): PredictedVsRealizedQuality | null {
	if (matches < PREDICTED_VS_REALIZED_MIN_MATCHES) {
		return null;
	}

	if (meanAbsoluteError < PREDICTED_VS_REALIZED_QUALITY_MAE.good) {
		return PREDICTED_VS_REALIZED_QUALITY.good;
	}

	if (meanAbsoluteError <= PREDICTED_VS_REALIZED_QUALITY_MAE.watch) {
		return PREDICTED_VS_REALIZED_QUALITY.watch;
	}

	return PREDICTED_VS_REALIZED_QUALITY.high;
}

export function predictedVsRealizedQualityCaption(
	quality: PredictedVsRealizedQuality,
): string {
	switch (quality) {
		case PREDICTED_VS_REALIZED_QUALITY.good:
			return PREDICTED_VS_REALIZED_LABEL.qualityGood;
		case PREDICTED_VS_REALIZED_QUALITY.watch:
			return PREDICTED_VS_REALIZED_LABEL.qualityWatch;
		case PREDICTED_VS_REALIZED_QUALITY.high:
			return PREDICTED_VS_REALIZED_LABEL.qualityHigh;
		default: {
			const _never: never = quality;
			return _never;
		}
	}
}

export function formatPredictedVsRealizedValue(value: number): string {
	return value.toFixed(1);
}

export function formatPredictedVsRealizedSigned(value: number): string {
	if (value > 0) {
		return `+${value.toFixed(1)}`;
	}

	return value.toFixed(1);
}

export function formatPredictedVsRealizedRate(value: number): string {
	return formatRosterWinRate(value);
}

export function formatPredictedVsRealizedCount(value: number): string {
	return formatRosterCount(value);
}

export function predictedVsRealizedFavoriteWonCaption(
	favoriteWon: boolean | null,
): string {
	if (favoriteWon === null) {
		return PREDICTED_VS_REALIZED_LABEL.favoriteWonDraw;
	}

	if (favoriteWon) {
		return PREDICTED_VS_REALIZED_LABEL.favoriteWonYes;
	}

	return PREDICTED_VS_REALIZED_LABEL.favoriteWonNo;
}

export function championshipPredictedVsRealized(
	players: readonly ChampionshipPlayer[],
	events: readonly ChampionshipEvent[],
	options: PredictedVsRealizedOptions = {
		window: PREDICTED_VS_REALIZED_WINDOW_DEFAULT,
		roster: PREDICTED_VS_REALIZED_ROSTER_DEFAULT,
	},
	nowIso: string = new Date().toISOString(),
): PredictedVsRealizedResult {
	const nowMs = Date.parse(nowIso);
	const windowEvents = predictedVsRealizedEvents(
		events,
		options.window,
		Number.isNaN(nowMs) ? Date.now() : nowMs,
	);
	const playerIds = rosterPlayerIds(players, options.roster);
	const matches = windowEvents.flatMap((event, roundOffset) =>
		matchRowsForEvent(event, roundOffset + 1, playerIds),
	);
	const rounds = roundsFromMatches(matches);
	const bands = bandsFromMatches(matches);
	const summary = summarizeMatches(matches);

	return { matches, rounds, bands, summary };
}

export function predictedVsRealizedCsvRows(result: PredictedVsRealizedResult): {
	headers: string[];
	rows: string[][];
} {
	const headers = [
		"round",
		"match",
		"event_id",
		"match_id",
		"predicted",
		"realized",
		"error",
		"absolute_error",
		"close",
		"favorite_won",
	];
	const rows = result.matches.map((row) => [
		String(row.roundIndex),
		String(row.matchIndex),
		String(row.eventId),
		String(row.matchId),
		formatPredictedVsRealizedValue(row.predictedDifference),
		formatPredictedVsRealizedValue(row.realizedDifference),
		formatPredictedVsRealizedSigned(row.error),
		formatPredictedVsRealizedValue(row.absoluteError),
		row.isCloseMatch ? "1" : "0",
		favoriteWonCsv(row.favoriteWon),
	]);

	return { headers, rows };
}

export function predictedVsRealizedShareFileName(
	championshipName: string,
	window: PredictedVsRealizedWindow,
	startsAt: string | null,
): string {
	return shareFileName(
		[
			PREDICTED_VS_REALIZED_SHARE.filePrefix,
			championshipName,
			predictedVsRealizedWindowCaption(window),
			startsAt ? shareFileDateStamp(startsAt) : null,
		],
		SHARE_FILE.png,
	);
}

export function predictedVsRealizedCsvFileName(
	championshipName: string,
	window: PredictedVsRealizedWindow,
): string {
	return shareFileName(
		[
			PREDICTED_VS_REALIZED_SHARE.filePrefix,
			championshipName,
			predictedVsRealizedWindowCaption(window),
		],
		SHARE_FILE.csv,
	);
}

export function trendsAudienceToPredictedRoster(
	audience: TrendsAudience,
): PredictedVsRealizedRoster {
	if (audience === TRENDS_AUDIENCE.monthly) {
		return PREDICTED_VS_REALIZED_ROSTER.monthly;
	}

	return PREDICTED_VS_REALIZED_ROSTER.all;
}

function favoriteWonCsv(favoriteWon: boolean | null): string {
	if (favoriteWon === null) {
		return "";
	}

	if (favoriteWon) {
		return "1";
	}

	return "0";
}

function rosterPlayerIds(
	players: readonly ChampionshipPlayer[],
	roster: PredictedVsRealizedRoster,
): ReadonlySet<number> | null {
	if (roster === PREDICTED_VS_REALIZED_ROSTER.all) {
		return null;
	}

	return new Set(
		players.flatMap((player) => {
			if (!player.is_monthly) {
				return [];
			}

			return [player.id];
		}),
	);
}

function matchRowsForEvent(
	event: ChampionshipEvent,
	roundIndex: number,
	playerIds: ReadonlySet<number> | null,
): PredictedVsRealizedMatch[] {
	if (event.ended_at === null) {
		return [];
	}

	const teamsById = new Map(event.teams.map((team) => [team.id, team]));
	const attendanceByPlayer = new Map(
		event.attendance.map((row) => [row.player_id, row] as const),
	);
	const endedMatches = event.matches.filter((match) => match.ended_at !== null);

	return endedMatches.flatMap((match, matchOffset) => {
		const row = matchPredictedVsRealized(
			event,
			match,
			roundIndex,
			matchOffset + 1,
			teamsById,
			attendanceByPlayer,
			playerIds,
		);
		if (!row) {
			return [];
		}

		return [row];
	});
}

function matchPredictedVsRealized(
	event: ChampionshipEvent,
	match: ChampionshipEventMatch,
	roundIndex: number,
	matchIndex: number,
	teamsById: ReadonlyMap<number, ChampionshipEventTeam>,
	attendanceByPlayer: ReadonlyMap<number, ChampionshipEventAttendance>,
	playerIds: ReadonlySet<number> | null,
): PredictedVsRealizedMatch | null {
	const teamA = teamsById.get(match.team_a_id);
	const teamB = teamsById.get(match.team_b_id);
	if (!teamA || !teamB) {
		return null;
	}

	const ratingsA = teamSnapshotRatings(teamA, attendanceByPlayer, playerIds);
	const ratingsB = teamSnapshotRatings(teamB, attendanceByPlayer, playerIds);
	if (ratingsA.length === 0 || ratingsB.length === 0) {
		return null;
	}

	const presentRatings = [...ratingsA, ...ratingsB];
	const predictedSumA = eventTeamRatingSum(ratingsA, presentRatings);
	const predictedSumB = eventTeamRatingSum(ratingsB, presentRatings);
	const predictedDifference = Math.abs(predictedSumA - predictedSumB);
	const realizedDifference = matchGoalMargin(match);
	const error = realizedDifference - predictedDifference;
	const favorite = favoriteFromSums(
		match.team_a_id,
		match.team_b_id,
		predictedSumA,
		predictedSumB,
		teamA,
		teamB,
	);
	const favoriteWon = favoriteWonWhenDecided(
		favorite.teamId,
		match.winner_team_id,
	);

	return {
		eventId: event.id,
		eventStartsAt: event.starts_at,
		roundIndex,
		matchId: match.id,
		matchIndex,
		teamAId: match.team_a_id,
		teamBId: match.team_b_id,
		teamALabel: eventTeamName(teamA.color, teamA.sort_order),
		teamBLabel: eventTeamName(teamB.color, teamB.sort_order),
		teamAGoals: matchGoalsForTeam(match, match.team_a_id),
		teamBGoals: matchGoalsForTeam(match, match.team_b_id),
		predictedSumA,
		predictedSumB,
		predictedDifference,
		realizedDifference,
		error,
		absoluteError: Math.abs(error),
		isCloseMatch: isCloseMatch(match),
		favoriteTeamId: favorite.teamId,
		favoriteLabel: favorite.label,
		favoriteWon,
	};
}

function teamSnapshotRatings(
	team: ChampionshipEventTeam,
	attendanceByPlayer: ReadonlyMap<number, ChampionshipEventAttendance>,
	playerIds: ReadonlySet<number> | null,
): number[] {
	const roster = playerIds
		? team.players.filter((player) => playerIds.has(player.player_id))
		: team.players;

	return roster.map((player) => {
		const attendance = attendanceByPlayer.get(player.player_id);
		return attendanceSnapshotRating(attendance);
	});
}

function attendanceSnapshotRating(
	attendance: ChampionshipEventAttendance | undefined,
): number {
	if (!attendance) {
		return 0;
	}

	if (attendance.is_goalkeeper === true) {
		return attendance.goalkeeper_rating;
	}

	return attendance.rating;
}

function favoriteFromSums(
	teamAId: number,
	teamBId: number,
	sumA: number,
	sumB: number,
	teamA: ChampionshipEventTeam,
	teamB: ChampionshipEventTeam,
): { teamId: number | null; label: string | null } {
	if (sumA === sumB) {
		return { teamId: null, label: null };
	}

	if (sumA > sumB) {
		return {
			teamId: teamAId,
			label: eventTeamName(teamA.color, teamA.sort_order),
		};
	}

	return {
		teamId: teamBId,
		label: eventTeamName(teamB.color, teamB.sort_order),
	};
}

function favoriteWonWhenDecided(
	favoriteTeamId: number | null,
	winnerTeamId: number | null,
): boolean | null {
	if (favoriteTeamId === null || winnerTeamId === null) {
		return null;
	}

	return favoriteTeamId === winnerTeamId;
}

function roundsFromMatches(
	matches: readonly PredictedVsRealizedMatch[],
): PredictedVsRealizedRound[] {
	const byEvent = new Map<number, PredictedVsRealizedMatch[]>();
	for (const row of matches) {
		const list = byEvent.get(row.eventId) ?? [];
		list.push(row);
		byEvent.set(row.eventId, list);
	}

	const ordered = [...byEvent.entries()].sort((left, right) => {
		const leftRow = left[1][0];
		const rightRow = right[1][0];
		if (!leftRow || !rightRow) {
			return 0;
		}

		return leftRow.roundIndex - rightRow.roundIndex;
	});

	let absoluteErrorTotal = 0;
	let matchTotal = 0;

	return ordered.map(([eventId, rows]) => {
		const predictedTotal = rows.reduce(
			(sum, row) => sum + row.predictedDifference,
			0,
		);
		const realizedTotal = rows.reduce(
			(sum, row) => sum + row.realizedDifference,
			0,
		);
		const errorTotal = rows.reduce((sum, row) => sum + row.error, 0);
		const absoluteTotal = rows.reduce((sum, row) => sum + row.absoluteError, 0);
		absoluteErrorTotal += absoluteTotal;
		matchTotal += rows.length;
		const first = rows[0];

		return {
			eventId,
			eventStartsAt: first?.eventStartsAt ?? "",
			roundIndex: first?.roundIndex ?? 0,
			matches: rows.length,
			meanPredictedDifference: averageOrZero(predictedTotal, rows.length),
			meanRealizedDifference: averageOrZero(realizedTotal, rows.length),
			meanError: averageOrZero(errorTotal, rows.length),
			meanAbsoluteError: averageOrZero(absoluteTotal, rows.length),
			cumulativeMeanAbsoluteError: averageOrZero(
				absoluteErrorTotal,
				matchTotal,
			),
		};
	});
}

function bandsFromMatches(
	matches: readonly PredictedVsRealizedMatch[],
): PredictedVsRealizedBand[] {
	return PREDICTED_VS_REALIZED_BANDS.flatMap((band) => {
		const rows = matches.filter(
			(row) =>
				row.predictedDifference >= band.min &&
				row.predictedDifference < band.max,
		);
		if (rows.length === 0) {
			return [];
		}

		const absoluteTotal = rows.reduce((sum, row) => sum + row.absoluteError, 0);
		const closeCount = rows.filter((row) => row.isCloseMatch).length;
		const favoriteDecided = rows.filter((row) => row.favoriteWon !== null);
		const favoriteWon = favoriteDecided.filter((row) => row.favoriteWon).length;

		return [
			{
				bandId: band.id,
				label: band.label,
				matches: rows.length,
				meanAbsoluteError: averageOrZero(absoluteTotal, rows.length),
				closeMatchRate: rosterWinRate(closeCount, rows.length),
				favoriteWinRate: favoriteWinRateOrNull(
					favoriteWon,
					favoriteDecided.length,
				),
			},
		];
	});
}

function summarizeMatches(
	matches: readonly PredictedVsRealizedMatch[],
): PredictedVsRealizedSummary {
	const count = matches.length;
	if (count === 0) {
		return {
			matches: 0,
			meanPredictedDifference: 0,
			meanRealizedDifference: 0,
			meanError: 0,
			meanAbsoluteError: 0,
			withinOneGoalRate: 0,
			favoriteWinRate: null,
			favoriteDecided: 0,
			smallSample: true,
			quality: null,
		};
	}

	const predictedTotal = matches.reduce(
		(sum, row) => sum + row.predictedDifference,
		0,
	);
	const realizedTotal = matches.reduce(
		(sum, row) => sum + row.realizedDifference,
		0,
	);
	const errorTotal = matches.reduce((sum, row) => sum + row.error, 0);
	const absoluteTotal = matches.reduce(
		(sum, row) => sum + row.absoluteError,
		0,
	);
	const withinOne = matches.filter(
		(row) => row.absoluteError <= PREDICTED_VS_REALIZED_WITHIN,
	).length;
	const favoriteDecided = matches.filter((row) => row.favoriteWon !== null);
	const favoriteWon = favoriteDecided.filter((row) => row.favoriteWon).length;
	const meanAbsoluteError = averageOrZero(absoluteTotal, count);

	return {
		matches: count,
		meanPredictedDifference: averageOrZero(predictedTotal, count),
		meanRealizedDifference: averageOrZero(realizedTotal, count),
		meanError: averageOrZero(errorTotal, count),
		meanAbsoluteError,
		withinOneGoalRate: rosterWinRate(withinOne, count),
		favoriteWinRate: favoriteWinRateOrNull(favoriteWon, favoriteDecided.length),
		favoriteDecided: favoriteDecided.length,
		smallSample: count < PREDICTED_VS_REALIZED_SMALL_SAMPLE,
		quality: predictedVsRealizedQuality(meanAbsoluteError, count),
	};
}

function favoriteWinRateOrNull(
	favoriteWon: number,
	favoriteDecided: number,
): number | null {
	if (favoriteDecided === 0) {
		return null;
	}

	return rosterWinRate(favoriteWon, favoriteDecided);
}

function filterEndedSinceMonths<T extends { starts_at: string }>(
	ended: readonly T[],
	months: number,
	nowMs: number,
): T[] {
	const cutoff = new Date(nowMs);
	cutoff.setMonth(cutoff.getMonth() - months);
	const cutoffMs = cutoff.getTime();

	return ended.filter((event) => Date.parse(event.starts_at) >= cutoffMs);
}

export function predictedVsRealizedRoundCaption(
	roundIndex: number,
	startsAt: string,
): string {
	const date = formatEventStartsAt(startsAt).date;
	return `${PREDICTED_VS_REALIZED_LABEL.round} ${roundIndex} · ${date}`;
}
