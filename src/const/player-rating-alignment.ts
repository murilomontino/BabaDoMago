import type { ChampionshipPlayer } from "../types/championship.ts";
import type {
	ChampionshipEvent,
	ChampionshipEventMatch,
	ChampionshipEventMatchPlayer,
} from "../types/championship-event.ts";
import {
	CONSISTENCY_METRIC,
	CONSISTENCY_MIN_PRESENCES,
	consistencySampleStdDev,
} from "./championship-consistency.ts";
import { compareStartsAtNewestFirst } from "./championship-event.ts";
import { championshipRatingChartColor } from "./championship-rating-history.ts";
import {
	eventRatingRate,
	formatEventRating,
} from "./event-rating-adjustment.ts";
import { matchGoalsConceded, matchGoalsForTeam } from "./match-goal-counts.ts";
import { playerVisibleName } from "./player-name.ts";
import { PLAYER_RATING } from "./player-rating.ts";
import { countsForSynergy } from "./player-synergy.ts";
import {
	rosterAverage,
	rosterSafeCount,
	rosterWinRate,
} from "./roster-stats.ts";

export const RATING_ALIGNMENT_WINDOW = {
	short: 10,
	default: 20,
	long: 30,
} as const;

export type RatingAlignmentWindowSize =
	(typeof RATING_ALIGNMENT_WINDOW)[keyof typeof RATING_ALIGNMENT_WINDOW];

export const RATING_ALIGNMENT_WINDOW_OPTIONS = [
	RATING_ALIGNMENT_WINDOW.short,
	RATING_ALIGNMENT_WINDOW.default,
	RATING_ALIGNMENT_WINDOW.long,
] as const;

export const RATING_ALIGNMENT_WEIGHT = {
	result: 0.35,
	attack: 0.3,
	defense: 0.2,
	consistency: 0.15,
	attackParticipation: 0.6,
	attackGoals: 0.4,
	defenseCleanSheet: 0.6,
	defenseConceded: 0.4,
} as const;

export const RATING_ALIGNMENT_EVIDENCE = {
	minGames: 3,
	initialMax: 4,
	moderateMax: 7,
} as const;

export const RATING_ALIGNMENT_GAP = {
	strong: 1,
	slight: 0.5,
} as const;

export const RATING_ALIGNMENT_STATUS = {
	below_performance: "below_performance",
	slightly_below: "slightly_below",
	aligned: "aligned",
	slightly_above: "slightly_above",
	above_performance: "above_performance",
} as const;

export type RatingAlignmentStatus =
	(typeof RATING_ALIGNMENT_STATUS)[keyof typeof RATING_ALIGNMENT_STATUS];

export const RATING_ALIGNMENT_EVIDENCE_LEVEL = {
	insufficient: "insufficient",
	initial: "initial",
	moderate: "moderate",
	strong: "strong",
} as const;

export type EvidenceLevel =
	(typeof RATING_ALIGNMENT_EVIDENCE_LEVEL)[keyof typeof RATING_ALIGNMENT_EVIDENCE_LEVEL];

export const RATING_ALIGNMENT_PERSISTENCE = {
	normal: "normal",
	persistent_below: "persistent_below",
	persistent_above: "persistent_above",
} as const;

export type RatingAlignmentPersistence =
	(typeof RATING_ALIGNMENT_PERSISTENCE)[keyof typeof RATING_ALIGNMENT_PERSISTENCE];

export const PLAYER_RATING_ALIGNMENT_LABEL = {
	title: "Adequação do rating",
	hint: "Indícios de defasagem entre a nota oficial e o desempenho recente. Não altera a nota nem o sorteio.",
	current: "Rating atual",
	expected: "Rating de referência",
	gap: "Gap",
	performanceIndex: "Desempenho observado",
	evidence: "Evidência",
	factors: "Principais fatores",
	result: "Resultado",
	attack: "Ataque",
	defense: "Defesa",
	consistency: "Consistência",
	games: "Últimas partidas",
	persistence: "Persistência",
	noEvidence: "Sem evidência suficiente",
	defenseContext:
		"Gols sofridos = contexto defensivo do time em campo, não culpa individual.",
	chartTitle: "Rating atual × referência",
	chartHint: "Acima da linha: nota abaixo do desempenho. Abaixo: nota acima.",
	underratedList: "Jogadores com possível rating defasado",
	overratedList: "Jogadores com rating acima do desempenho",
	emptyList: "Nenhum jogador nesta faixa",
	drawWarningBelow: "Possível rating defasado",
	drawWarningAbove: "Rating acima do desempenho recente",
	drawRecentAbove: "Desempenho recente acima do rating.",
	drawRecentBelow: "Desempenho recente abaixo do rating.",
	sentinel: "Nota sentinela — sem comparação",
	[RATING_ALIGNMENT_STATUS.below_performance]: "Rating abaixo do desempenho",
	[RATING_ALIGNMENT_STATUS.slightly_below]: "Tendência de alta",
	[RATING_ALIGNMENT_STATUS.aligned]: "Rating alinhado",
	[RATING_ALIGNMENT_STATUS.slightly_above]: "Tendência de queda",
	[RATING_ALIGNMENT_STATUS.above_performance]: "Rating acima do desempenho",
	[RATING_ALIGNMENT_EVIDENCE_LEVEL.insufficient]: "Insuficiente",
	[RATING_ALIGNMENT_EVIDENCE_LEVEL.initial]: "Inicial",
	[RATING_ALIGNMENT_EVIDENCE_LEVEL.moderate]: "Moderada",
	[RATING_ALIGNMENT_EVIDENCE_LEVEL.strong]: "Forte",
	[RATING_ALIGNMENT_PERSISTENCE.normal]: "Normal",
	[RATING_ALIGNMENT_PERSISTENCE.persistent_below]: "Defasagem persistente",
	[RATING_ALIGNMENT_PERSISTENCE.persistent_above]:
		"Sobrevalorização persistente",
} as const;

export type PlayerRatingAlignmentOptions = {
	windowSize?: RatingAlignmentWindowSize;
};

export type GoalkeeperAlignmentMetrics = {
	matches: number;
	goalsConcededPerGame: number;
	cleanSheetRate: number;
};

export type RatingAlignmentWindows = {
	[RATING_ALIGNMENT_WINDOW.short]: number | null;
	[RATING_ALIGNMENT_WINDOW.default]: number | null;
	[RATING_ALIGNMENT_WINDOW.long]: number | null;
};

export type PlayerRatingAlignment = {
	playerId: number;
	games: number;
	currentRating: number;
	performanceIndex: number | null;
	expectedRating: number | null;
	ratingGap: number | null;
	status: RatingAlignmentStatus;
	evidence: EvidenceLevel;
	resultScore: number | null;
	attackScore: number | null;
	defenseScore: number | null;
	consistencyScore: number | null;
	persistence: RatingAlignmentPersistence;
	windows: RatingAlignmentWindows;
	goalkeeperMetrics: GoalkeeperAlignmentMetrics | null;
};

type SeatMatch = {
	eventId: number;
	match: ChampionshipEventMatch;
	seat: ChampionshipEventMatchPlayer;
	skipGuestGk: boolean;
	rosterTeamId: number | null;
	startsAt: string;
};

type PlayerRawMetrics = {
	playerId: number;
	games: number;
	wins: number;
	draws: number;
	losses: number;
	rate: number;
	winRate: number;
	goalsPerGame: number | null;
	assistsPerGame: number | null;
	goalParticipation: number | null;
	goalsConcededPerGame: number;
	cleanSheetRate: number;
	consistencyDeviation: number | null;
	goalkeeperMetrics: GoalkeeperAlignmentMetrics | null;
	lineGames: number;
};

type PeerCalibration = {
	performanceIndex: number;
	rating: number;
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

function playerSeatMatches(
	events: readonly ChampionshipEvent[],
	playerId: number,
	limit: number,
): SeatMatch[] {
	const ordered = [...events].sort(compareStartsAtNewestFirst);
	const collected: SeatMatch[] = [];

	for (const event of ordered) {
		const rosterByPlayer = rosterTeamByPlayerId(event);
		const matchesNewestFirst = [...event.matches].sort((left, right) => {
			const leftKey = left.ended_at ?? left.created_at;
			const rightKey = right.ended_at ?? right.created_at;
			return rightKey.localeCompare(leftKey);
		});

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
				skipGuestGk: event.skip_guest_goalkeeper_matches,
				rosterTeamId: rosterByPlayer.get(playerId) ?? null,
				startsAt: event.starts_at,
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

function aggregateRawMetrics(
	seats: readonly SeatMatch[],
	events: readonly ChampionshipEvent[],
	playerId: number,
): PlayerRawMetrics {
	let wins = 0;
	let draws = 0;
	let losses = 0;
	let lineGoals = 0;
	let lineAssists = 0;
	let lineTeamGoals = 0;
	let lineGames = 0;
	let goalsConceded = 0;
	let cleanSheets = 0;
	let gkMatches = 0;
	let gkConceded = 0;
	let gkCleanSheets = 0;
	const eventIds = new Set<number>();

	for (const row of seats) {
		eventIds.add(row.eventId);
		const won = row.match.winner_team_id === row.seat.team_id;
		const draw = row.match.winner_team_id === null;
		if (won) {
			wins += 1;
		} else if (draw) {
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
		lineTeamGoals += matchGoalsForTeam(row.match, row.seat.team_id);
	}

	const games = seats.length;
	const rate = eventRatingRate(wins, draws, losses, games);
	const consistencyDeviation = attendanceGoalInvolvementPerMatch(
		events,
		playerId,
		eventIds,
	);

	return {
		playerId,
		games,
		wins,
		draws,
		losses,
		rate,
		winRate: rosterWinRate(wins, games),
		goalsPerGame: lineGames > 0 ? lineGoals / lineGames : null,
		assistsPerGame: lineGames > 0 ? lineAssists / lineGames : null,
		goalParticipation: goalParticipationOrNull(
			lineGoals + lineAssists,
			lineTeamGoals,
			lineGames,
		),
		goalsConcededPerGame: rosterAverage(goalsConceded, games),
		cleanSheetRate: rosterWinRate(cleanSheets, games),
		consistencyDeviation,
		goalkeeperMetrics: goalkeeperMetricsOrNull(
			gkMatches,
			gkConceded,
			gkCleanSheets,
		),
		lineGames,
	};
}

function goalParticipationOrNull(
	involvement: number,
	teamGoals: number,
	lineGames: number,
): number | null {
	if (lineGames === 0) {
		return null;
	}
	if (teamGoals <= 0) {
		return null;
	}
	return involvement / teamGoals;
}

function goalkeeperMetricsOrNull(
	matches: number,
	conceded: number,
	cleanSheets: number,
): GoalkeeperAlignmentMetrics | null {
	if (matches < RATING_ALIGNMENT_EVIDENCE.minGames) {
		return null;
	}

	return {
		matches,
		goalsConcededPerGame: rosterAverage(conceded, matches),
		cleanSheetRate: rosterWinRate(cleanSheets, matches),
	};
}

export function ratingAlignmentEvidence(games: number): EvidenceLevel {
	if (games < RATING_ALIGNMENT_EVIDENCE.minGames) {
		return RATING_ALIGNMENT_EVIDENCE_LEVEL.insufficient;
	}
	if (games <= RATING_ALIGNMENT_EVIDENCE.initialMax) {
		return RATING_ALIGNMENT_EVIDENCE_LEVEL.initial;
	}
	if (games <= RATING_ALIGNMENT_EVIDENCE.moderateMax) {
		return RATING_ALIGNMENT_EVIDENCE_LEVEL.moderate;
	}
	return RATING_ALIGNMENT_EVIDENCE_LEVEL.strong;
}

export function classifyRatingAlignmentGap(
	gap: number | null,
): RatingAlignmentStatus {
	if (gap === null) {
		return RATING_ALIGNMENT_STATUS.aligned;
	}
	if (gap >= RATING_ALIGNMENT_GAP.strong) {
		return RATING_ALIGNMENT_STATUS.below_performance;
	}
	if (gap >= RATING_ALIGNMENT_GAP.slight) {
		return RATING_ALIGNMENT_STATUS.slightly_below;
	}
	if (gap > -RATING_ALIGNMENT_GAP.slight) {
		return RATING_ALIGNMENT_STATUS.aligned;
	}
	if (gap > -RATING_ALIGNMENT_GAP.strong) {
		return RATING_ALIGNMENT_STATUS.slightly_above;
	}
	return RATING_ALIGNMENT_STATUS.above_performance;
}

export function classifyRatingAlignmentPersistence(
	windows: RatingAlignmentWindows,
): RatingAlignmentPersistence {
	const short = windows[RATING_ALIGNMENT_WINDOW.short];
	const mid = windows[RATING_ALIGNMENT_WINDOW.default];
	const long = windows[RATING_ALIGNMENT_WINDOW.long];
	if (short === null || mid === null || long === null) {
		return RATING_ALIGNMENT_PERSISTENCE.normal;
	}

	if (
		short >= RATING_ALIGNMENT_GAP.strong &&
		mid >= RATING_ALIGNMENT_GAP.strong &&
		long >= RATING_ALIGNMENT_GAP.strong
	) {
		return RATING_ALIGNMENT_PERSISTENCE.persistent_below;
	}

	if (
		short <= -RATING_ALIGNMENT_GAP.strong &&
		mid <= -RATING_ALIGNMENT_GAP.strong &&
		long <= -RATING_ALIGNMENT_GAP.strong
	) {
		return RATING_ALIGNMENT_PERSISTENCE.persistent_above;
	}

	return RATING_ALIGNMENT_PERSISTENCE.normal;
}

/** Percentil empírico 0–100. Valores ausentes não entram. */
export function empiricalPercentile(
	value: number,
	peers: readonly number[],
): number | null {
	if (peers.length === 0) {
		return null;
	}

	const below = peers.filter((peer) => peer < value).length;
	return Math.round((below / peers.length) * 1000) / 10;
}

function invertedPercentile(
	value: number,
	peers: readonly number[],
): number | null {
	const direct = empiricalPercentile(value, peers);
	if (direct === null) {
		return null;
	}
	return Math.round((100 - direct) * 10) / 10;
}

function weightedMean(
	parts: readonly { score: number | null; weight: number }[],
): number | null {
	const present = parts.filter(
		(part): part is { score: number; weight: number } => part.score !== null,
	);
	if (present.length === 0) {
		return null;
	}

	const weightSum = present.reduce((sum, part) => sum + part.weight, 0);
	if (weightSum <= 0) {
		return null;
	}

	const total = present.reduce(
		(sum, part) => sum + part.score * (part.weight / weightSum),
		0,
	);
	return Math.round(total * 10) / 10;
}

function clampRating(value: number): number {
	return (
		Math.round(
			Math.min(PLAYER_RATING.max, Math.max(PLAYER_RATING.floor, value)) * 10,
		) / 10
	);
}

/**
 * Converte performanceIndex (0–100) para a escala de rating.
 * Isolada para recalibração futura. V1: regressão linear nos pares.
 */
export function performanceIndexToExpectedRating(
	performanceIndex: number,
	peers: readonly PeerCalibration[],
): number | null {
	const usable = peers.filter(
		(peer) =>
			Number.isFinite(peer.performanceIndex) &&
			peer.rating > PLAYER_RATING.default,
	);
	if (usable.length === 0) {
		return null;
	}

	if (usable.length === 1) {
		return clampRating(usable[0].rating);
	}

	const n = usable.length;
	const meanX =
		usable.reduce((sum, peer) => sum + peer.performanceIndex, 0) / n;
	const meanY = usable.reduce((sum, peer) => sum + peer.rating, 0) / n;
	const varianceX = usable.reduce(
		(sum, peer) => sum + (peer.performanceIndex - meanX) ** 2,
		0,
	);
	if (varianceX === 0) {
		return clampRating(meanY);
	}

	const covariance = usable.reduce(
		(sum, peer) =>
			sum + (peer.performanceIndex - meanX) * (peer.rating - meanY),
		0,
	);
	const slope = covariance / varianceX;
	const intercept = meanY - slope * meanX;
	return clampRating(intercept + slope * performanceIndex);
}

function peerValues(
	rawByPlayer: ReadonlyMap<number, PlayerRawMetrics>,
	pick: (raw: PlayerRawMetrics) => number | null,
): number[] {
	return [...rawByPlayer.values()].flatMap((raw) => {
		if (raw.games < RATING_ALIGNMENT_EVIDENCE.minGames) {
			return [];
		}
		const value = pick(raw);
		if (value === null) {
			return [];
		}
		return [value];
	});
}

function attackScoreFromRaw(
	raw: PlayerRawMetrics,
	participationPeers: readonly number[],
	goalsPeers: readonly number[],
): number | null {
	const participationScore =
		raw.goalParticipation === null
			? null
			: empiricalPercentile(raw.goalParticipation, participationPeers);
	const goalsScore =
		raw.goalsPerGame === null
			? null
			: empiricalPercentile(raw.goalsPerGame, goalsPeers);

	return weightedMean([
		{
			score: participationScore,
			weight: RATING_ALIGNMENT_WEIGHT.attackParticipation,
		},
		{ score: goalsScore, weight: RATING_ALIGNMENT_WEIGHT.attackGoals },
	]);
}

function defenseScoreFromRaw(
	raw: PlayerRawMetrics,
	cleanSheetPeers: readonly number[],
	concededPeers: readonly number[],
): number | null {
	const cleanSheetScore = empiricalPercentile(
		raw.cleanSheetRate,
		cleanSheetPeers,
	);
	const concededScore = invertedPercentile(
		raw.goalsConcededPerGame,
		concededPeers,
	);

	return weightedMean([
		{
			score: cleanSheetScore,
			weight: RATING_ALIGNMENT_WEIGHT.defenseCleanSheet,
		},
		{
			score: concededScore,
			weight: RATING_ALIGNMENT_WEIGHT.defenseConceded,
		},
	]);
}

function scoreRawAgainstPeers(
	raw: PlayerRawMetrics,
	rawByPlayer: ReadonlyMap<number, PlayerRawMetrics>,
): {
	resultScore: number | null;
	attackScore: number | null;
	defenseScore: number | null;
	consistencyScore: number | null;
	performanceIndex: number | null;
} {
	if (raw.games < RATING_ALIGNMENT_EVIDENCE.minGames) {
		return {
			resultScore: null,
			attackScore: null,
			defenseScore: null,
			consistencyScore: null,
			performanceIndex: null,
		};
	}

	const ratePeers = peerValues(rawByPlayer, (item) => item.rate);
	const participationPeers = peerValues(
		rawByPlayer,
		(item) => item.goalParticipation,
	);
	const goalsPeers = peerValues(rawByPlayer, (item) => item.goalsPerGame);
	const cleanSheetPeers = peerValues(
		rawByPlayer,
		(item) => item.cleanSheetRate,
	);
	const concededPeers = peerValues(
		rawByPlayer,
		(item) => item.goalsConcededPerGame,
	);
	const consistencyPeers = peerValues(
		rawByPlayer,
		(item) => item.consistencyDeviation,
	);

	const resultScore = empiricalPercentile(raw.rate, ratePeers);
	const attackScore = attackScoreFromRaw(raw, participationPeers, goalsPeers);
	const defenseScore = defenseScoreFromRaw(raw, cleanSheetPeers, concededPeers);
	const consistencyScore =
		raw.consistencyDeviation === null
			? null
			: invertedPercentile(raw.consistencyDeviation, consistencyPeers);

	const performanceIndex = weightedMean([
		{ score: resultScore, weight: RATING_ALIGNMENT_WEIGHT.result },
		{ score: attackScore, weight: RATING_ALIGNMENT_WEIGHT.attack },
		{ score: defenseScore, weight: RATING_ALIGNMENT_WEIGHT.defense },
		{ score: consistencyScore, weight: RATING_ALIGNMENT_WEIGHT.consistency },
	]);

	return {
		resultScore,
		attackScore,
		defenseScore,
		consistencyScore,
		performanceIndex,
	};
}

function collectRawByPlayer(
	players: readonly ChampionshipPlayer[],
	events: readonly ChampionshipEvent[],
	windowSize: RatingAlignmentWindowSize,
): Map<number, PlayerRawMetrics> {
	const map = new Map<number, PlayerRawMetrics>();
	for (const player of players) {
		if (player.deleted_at !== null) {
			continue;
		}
		const seats = playerSeatMatches(events, player.id, windowSize);
		map.set(player.id, aggregateRawMetrics(seats, events, player.id));
	}
	return map;
}

function gapForWindow(
	playerId: number,
	players: readonly ChampionshipPlayer[],
	events: readonly ChampionshipEvent[],
	windowSize: RatingAlignmentWindowSize,
): number | null {
	const player = players.find((item) => item.id === playerId);
	if (!player || player.rating === PLAYER_RATING.default) {
		return null;
	}

	const rawByPlayer = collectRawByPlayer(players, events, windowSize);
	const raw = rawByPlayer.get(playerId);
	if (!raw || raw.games < RATING_ALIGNMENT_EVIDENCE.minGames) {
		return null;
	}

	const scored = scoreRawAgainstPeers(raw, rawByPlayer);
	if (scored.performanceIndex === null) {
		return null;
	}

	const peers = calibrationPeers(players, rawByPlayer);
	const expected = performanceIndexToExpectedRating(
		scored.performanceIndex,
		peers,
	);
	if (expected === null) {
		return null;
	}

	return Math.round((expected - player.rating) * 10) / 10;
}

function calibrationPeers(
	players: readonly ChampionshipPlayer[],
	rawByPlayer: ReadonlyMap<number, PlayerRawMetrics>,
): PeerCalibration[] {
	return players.flatMap((player) => {
		if (player.deleted_at !== null) {
			return [];
		}
		if (player.rating === PLAYER_RATING.default) {
			return [];
		}
		const raw = rawByPlayer.get(player.id);
		if (!raw || raw.games < RATING_ALIGNMENT_EVIDENCE.minGames) {
			return [];
		}
		const scored = scoreRawAgainstPeers(raw, rawByPlayer);
		if (scored.performanceIndex === null) {
			return [];
		}
		return [
			{
				performanceIndex: scored.performanceIndex,
				rating: player.rating,
			},
		];
	});
}

function finalizeAlignment(
	player: ChampionshipPlayer,
	raw: PlayerRawMetrics,
	rawByPlayer: ReadonlyMap<number, PlayerRawMetrics>,
	allPlayers: readonly ChampionshipPlayer[],
	windows: RatingAlignmentWindows,
): PlayerRatingAlignment {
	const evidence = ratingAlignmentEvidence(raw.games);
	const persistence = classifyRatingAlignmentPersistence(windows);

	if (
		player.rating === PLAYER_RATING.default ||
		raw.games < RATING_ALIGNMENT_EVIDENCE.minGames
	) {
		return {
			playerId: player.id,
			games: raw.games,
			currentRating: player.rating,
			performanceIndex: null,
			expectedRating: null,
			ratingGap: null,
			status: RATING_ALIGNMENT_STATUS.aligned,
			evidence:
				player.rating === PLAYER_RATING.default
					? RATING_ALIGNMENT_EVIDENCE_LEVEL.insufficient
					: evidence,
			resultScore: null,
			attackScore: null,
			defenseScore: null,
			consistencyScore: null,
			persistence,
			windows,
			goalkeeperMetrics: raw.goalkeeperMetrics,
		};
	}

	const scored = scoreRawAgainstPeers(raw, rawByPlayer);
	const peers = calibrationPeers(allPlayers, rawByPlayer);
	const expectedRating =
		scored.performanceIndex === null
			? null
			: performanceIndexToExpectedRating(scored.performanceIndex, peers);
	const ratingGap =
		expectedRating === null
			? null
			: Math.round((expectedRating - player.rating) * 10) / 10;

	return {
		playerId: player.id,
		games: raw.games,
		currentRating: player.rating,
		performanceIndex: scored.performanceIndex,
		expectedRating,
		ratingGap,
		status: classifyRatingAlignmentGap(ratingGap),
		evidence,
		resultScore: scored.resultScore,
		attackScore: scored.attackScore,
		defenseScore: scored.defenseScore,
		consistencyScore: scored.consistencyScore,
		persistence,
		windows,
		goalkeeperMetrics: raw.goalkeeperMetrics,
	};
}

function windowsForPlayer(
	playerId: number,
	players: readonly ChampionshipPlayer[],
	events: readonly ChampionshipEvent[],
): RatingAlignmentWindows {
	return {
		[RATING_ALIGNMENT_WINDOW.short]: gapForWindow(
			playerId,
			players,
			events,
			RATING_ALIGNMENT_WINDOW.short,
		),
		[RATING_ALIGNMENT_WINDOW.default]: gapForWindow(
			playerId,
			players,
			events,
			RATING_ALIGNMENT_WINDOW.default,
		),
		[RATING_ALIGNMENT_WINDOW.long]: gapForWindow(
			playerId,
			players,
			events,
			RATING_ALIGNMENT_WINDOW.long,
		),
	};
}

export function calculatePlayerRatingAlignment(
	players: readonly ChampionshipPlayer[],
	events: readonly ChampionshipEvent[],
	playerId: number,
	options: PlayerRatingAlignmentOptions = {},
): PlayerRatingAlignment | null {
	const player = players.find((item) => item.id === playerId);
	if (!player || player.deleted_at !== null) {
		return null;
	}

	const windowSize = options.windowSize ?? RATING_ALIGNMENT_WINDOW.default;
	const rawByPlayer = collectRawByPlayer(players, events, windowSize);
	const raw = rawByPlayer.get(playerId);
	if (!raw) {
		return null;
	}

	const windows = windowsForPlayer(playerId, players, events);
	return finalizeAlignment(player, raw, rawByPlayer, players, windows);
}

export function calculatePlayersRatingAlignment(
	players: readonly ChampionshipPlayer[],
	events: readonly ChampionshipEvent[],
	options: PlayerRatingAlignmentOptions = {},
): PlayerRatingAlignment[] {
	const windowSize = options.windowSize ?? RATING_ALIGNMENT_WINDOW.default;
	const rawByPlayer = collectRawByPlayer(players, events, windowSize);

	const rows = players.flatMap((player) => {
		if (player.deleted_at !== null) {
			return [];
		}
		const raw = rawByPlayer.get(player.id);
		if (!raw) {
			return [];
		}
		const windows = windowsForPlayer(player.id, players, events);
		return [finalizeAlignment(player, raw, rawByPlayer, players, windows)];
	});

	return rows.sort((left, right) => {
		const leftGap = left.ratingGap ?? Number.NEGATIVE_INFINITY;
		const rightGap = right.ratingGap ?? Number.NEGATIVE_INFINITY;
		if (rightGap !== leftGap) {
			return rightGap - leftGap;
		}
		return left.playerId - right.playerId;
	});
}

export function ratingAlignmentUnderrated(
	rows: readonly PlayerRatingAlignment[],
): PlayerRatingAlignment[] {
	return rows
		.filter(
			(row) =>
				row.ratingGap !== null &&
				row.ratingGap > 0 &&
				row.currentRating > PLAYER_RATING.default &&
				row.evidence !== RATING_ALIGNMENT_EVIDENCE_LEVEL.insufficient,
		)
		.sort(
			(left, right) =>
				Math.abs(right.ratingGap ?? 0) - Math.abs(left.ratingGap ?? 0),
		);
}

export function ratingAlignmentOverrated(
	rows: readonly PlayerRatingAlignment[],
): PlayerRatingAlignment[] {
	return rows
		.filter(
			(row) =>
				row.ratingGap !== null &&
				row.ratingGap < 0 &&
				row.currentRating > PLAYER_RATING.default &&
				row.evidence !== RATING_ALIGNMENT_EVIDENCE_LEVEL.insufficient,
		)
		.sort(
			(left, right) =>
				Math.abs(right.ratingGap ?? 0) - Math.abs(left.ratingGap ?? 0),
		);
}

export function ratingAlignmentDrawWarnings(
	rows: readonly PlayerRatingAlignment[],
	playerIds: readonly number[],
): PlayerRatingAlignment[] {
	const idSet = new Set(playerIds);
	return rows.filter((row) => {
		if (!idSet.has(row.playerId)) {
			return false;
		}
		if (
			row.evidence !== RATING_ALIGNMENT_EVIDENCE_LEVEL.moderate &&
			row.evidence !== RATING_ALIGNMENT_EVIDENCE_LEVEL.strong
		) {
			return false;
		}
		return (
			row.status === RATING_ALIGNMENT_STATUS.below_performance ||
			row.status === RATING_ALIGNMENT_STATUS.above_performance
		);
	});
}

export function ratingAlignmentStatusLabel(
	status: RatingAlignmentStatus,
): string {
	return PLAYER_RATING_ALIGNMENT_LABEL[status];
}

export function ratingAlignmentEvidenceLabel(evidence: EvidenceLevel): string {
	return PLAYER_RATING_ALIGNMENT_LABEL[evidence];
}

export function formatRatingAlignmentGap(gap: number | null): string {
	if (gap === null) {
		return "—";
	}
	const formatted = formatEventRating(Math.abs(gap));
	if (gap > 0) {
		return `+${formatted}`;
	}
	if (gap < 0) {
		return `-${formatted}`;
	}
	return formatted;
}

export function formatRatingAlignmentIndex(value: number | null): string {
	if (value === null) {
		return "—";
	}
	return `${Math.round(value)}/100`;
}

export function formatRatingAlignmentRating(value: number | null): string {
	if (value === null) {
		return "—";
	}
	return formatEventRating(value);
}

/** Reexport tipado da métrica de consistência usada na janela. */
export const RATING_ALIGNMENT_CONSISTENCY_METRIC =
	CONSISTENCY_METRIC.goalInvolvementPerMatch;

export const RATING_ALIGNMENT_CHART = {
	height: 280,
	xKey: "currentRating",
	yKey: "expectedRating",
	nameKey: "name",
	dotRadius: 5,
	labelOffset: 8,
	labelFontSize: 11,
	margin: { top: 24, right: 28, bottom: 24, left: 0 },
	domainPad: 0.5,
	axisWidth: 36,
	fallbackMax: 5,
} as const;

export type RatingAlignmentChartPoint = {
	playerId: number;
	name: string;
	currentRating: number;
	expectedRating: number;
	ratingGap: number;
	color: string;
};

export function ratingAlignmentChartPoints(
	rows: readonly PlayerRatingAlignment[],
	players: readonly ChampionshipPlayer[],
): RatingAlignmentChartPoint[] {
	const byId = new Map(players.map((player) => [player.id, player] as const));
	return rows.flatMap((row) => {
		if (row.expectedRating === null || row.ratingGap === null) {
			return [];
		}
		if (row.currentRating === PLAYER_RATING.default) {
			return [];
		}
		const player = byId.get(row.playerId);
		if (!player) {
			return [];
		}
		return [
			{
				playerId: row.playerId,
				name: playerVisibleName(player),
				currentRating: row.currentRating,
				expectedRating: row.expectedRating,
				ratingGap: row.ratingGap,
				color: championshipRatingChartColor(row.playerId),
			},
		];
	});
}

export function ratingAlignmentChartDomain(
	points: readonly RatingAlignmentChartPoint[],
): { min: number; max: number } {
	if (points.length === 0) {
		return { min: 0, max: RATING_ALIGNMENT_CHART.fallbackMax };
	}
	const values = points.flatMap((point) => [
		point.currentRating,
		point.expectedRating,
	]);
	const rawMin = Math.min(...values);
	const rawMax = Math.max(...values);
	const pad = RATING_ALIGNMENT_CHART.domainPad;
	return {
		min: Math.max(0, rawMin - pad),
		max: Math.max(pad, rawMax + pad),
	};
}

export function ratingAlignmentFactorRows(row: PlayerRatingAlignment): {
	id: "result" | "attack" | "defense" | "consistency";
	label: string;
	score: number | null;
}[] {
	return [
		{
			id: "result",
			label: PLAYER_RATING_ALIGNMENT_LABEL.result,
			score: row.resultScore,
		},
		{
			id: "attack",
			label: PLAYER_RATING_ALIGNMENT_LABEL.attack,
			score: row.attackScore,
		},
		{
			id: "defense",
			label: PLAYER_RATING_ALIGNMENT_LABEL.defense,
			score: row.defenseScore,
		},
		{
			id: "consistency",
			label: PLAYER_RATING_ALIGNMENT_LABEL.consistency,
			score: row.consistencyScore,
		},
	];
}
