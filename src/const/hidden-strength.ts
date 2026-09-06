import type { ChampionshipEvent } from "../types/championship-event.ts";
import {
	eventDrawRatings,
	eventTeamRatingAverage,
} from "./championship-event.ts";
import { endedChampionshipHistoryEvents } from "./championship-rating-history.ts";
import {
	EVENT_RATING_ADJUSTMENT,
	eventActivePlayerRating,
	eventRatingDelta,
} from "./event-rating-adjustment.ts";
import { eventTeamName } from "./event-team-color.ts";
import { averageOrZero, maxOrZero, PLAYER_RATING } from "./player-rating.ts";
import {
	formatRosterCount,
	formatRosterWinRate,
	rosterWinRate,
} from "./roster-stats.ts";

export const HIDDEN_STRENGTH = {
	min: 1,
	max: 100,
	midpoint: 50,
	downThreshold: EVENT_RATING_ADJUSTMENT.downThreshold,
	upThreshold: EVENT_RATING_ADJUSTMENT.upThreshold,
	expectedRate: EVENT_RATING_ADJUSTMENT.expectedRate,
	scaleDivisor: EVENT_RATING_ADJUSTMENT.scaleDivisor,
	rateMillis: 1000,
} as const;

export const HIDDEN_STRENGTH_LABEL = {
	short: "Oculta",
	ariaLabel: "Nota oculta",
	predicted: "Nota oculta prevista",
	favorite: "Favorito oculto",
	spread: "Diferença oculta",
	hint: "Sem oculta, rescale da pública. Depois delta ao encerrar. Teto 100.",
} as const;

export const HIDDEN_STRENGTH_TRACK = {
	line: "line",
	goalkeeper: "goalkeeper",
} as const;

export type HiddenStrengthTrack =
	(typeof HIDDEN_STRENGTH_TRACK)[keyof typeof HIDDEN_STRENGTH_TRACK];

export type HiddenStrengthCurrent = {
	line: number;
	goalkeeper: number;
};

export type HiddenStrengthWalk = {
	current: ReadonlyMap<number, HiddenStrengthCurrent>;
	hiddenBeforeEvent: ReadonlyMap<number, ReadonlyMap<number, number>>;
};

export type TeamHiddenBalanceTeam = {
	teamId: number;
	label: string;
	predictedHidden: number;
	matches: number;
	wins: number;
	winRate: number;
};

export type TeamHiddenBalanceEvent = {
	eventId: number;
	startsAt: string;
	spread: number;
	favoriteWon: boolean | null;
	favoriteTeamId: number | null;
	teams: TeamHiddenBalanceTeam[];
};

export type TeamHiddenBalanceSummary = {
	events: number;
	averageSpread: number;
	favoriteDecided: number;
	favoriteWon: number;
	favoriteWinRate: number;
	rows: TeamHiddenBalanceEvent[];
};

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

function clampHidden(value: number): number {
	return Math.min(
		HIDDEN_STRENGTH.max,
		Math.max(HIDDEN_STRENGTH.min, roundAwayFromZero1(value)),
	);
}

export function formatHiddenStrength(value: number): string {
	if (value === PLAYER_RATING.default) {
		return "—";
	}

	return value.toFixed(1);
}

export function hiddenStrengthRateInDeadZone(rate: number): boolean {
	const millis = Math.round(rate * HIDDEN_STRENGTH.rateMillis);
	const down = Math.round(
		HIDDEN_STRENGTH.downThreshold * HIDDEN_STRENGTH.rateMillis,
	);
	const up = Math.round(
		HIDDEN_STRENGTH.upThreshold * HIDDEN_STRENGTH.rateMillis,
	);
	return millis >= down && millis <= up;
}

export function hiddenStrengthDeltaFromRate(
	rate: number,
	matches: number,
): number {
	if (matches < EVENT_RATING_ADJUSTMENT.minMatches) {
		return 0;
	}

	if (hiddenStrengthRateInDeadZone(rate)) {
		return 0;
	}

	return roundAwayFromZero1(
		((rate - HIDDEN_STRENGTH.expectedRate) * HIDDEN_STRENGTH.max) /
			HIDDEN_STRENGTH.scaleDivisor,
	);
}

export function hiddenStrengthDelta(
	wins: number,
	draws: number,
	losses: number,
	matches: number,
	hidden: number,
): number {
	if (hidden === PLAYER_RATING.default) {
		return PLAYER_RATING.default;
	}

	return eventRatingDelta(
		wins,
		draws,
		losses,
		matches,
		hidden,
		HIDDEN_STRENGTH.max,
	);
}

export function hiddenStrengthKnown(hidden: number, stored: number): number {
	if (hidden !== PLAYER_RATING.default) {
		return hidden;
	}

	return stored;
}

export function hiddenStrengthResolve(
	hidden: number,
	publicRating: number,
	ceiling: number,
): number {
	if (hidden !== PLAYER_RATING.default) {
		return hidden;
	}

	return hiddenStrengthSeed(publicRating, ceiling);
}

export function hiddenStrengthNext(
	playerHidden: number,
	before: number,
	oldDelta: number,
	newDelta: number,
): number {
	if (playerHidden === PLAYER_RATING.default) {
		return hiddenStrengthApply(before, newDelta);
	}

	return hiddenStrengthApply(playerHidden, -oldDelta + newDelta);
}

export function hiddenStrengthApply(hidden: number, delta: number): number {
	if (
		hidden === PLAYER_RATING.default &&
		roundAwayFromZero1(hidden + delta) <= 0
	) {
		return PLAYER_RATING.default;
	}

	return clampHidden(hidden + delta);
}

export function hiddenStrengthCeiling(ratings: readonly number[]): number {
	const official = ratings.flatMap((rating) => {
		if (rating === PLAYER_RATING.default) {
			return [];
		}

		return [rating];
	});
	return Math.min(HIDDEN_STRENGTH.max, maxOrZero(official));
}

type HiddenStrengthRosterPlayer = {
	rating: number;
	goalkeeper_rating: number;
	deleted_at: string | null;
};

export function hiddenStrengthChampionshipCeiling(
	players: readonly HiddenStrengthRosterPlayer[],
): number {
	return hiddenStrengthCeiling(
		players.flatMap((player) => {
			if (player.deleted_at !== null) {
				return [];
			}

			return [player.rating, player.goalkeeper_rating];
		}),
	);
}

export function hiddenStrengthSeed(
	attendanceSnapshot: number,
	ceiling: number,
): number {
	if (attendanceSnapshot === PLAYER_RATING.default) {
		return PLAYER_RATING.default;
	}

	if (ceiling <= 0) {
		return PLAYER_RATING.default;
	}

	return clampHidden((attendanceSnapshot / ceiling) * HIDDEN_STRENGTH.max);
}

function trackHiddenSnapshot(
	isGoalkeeper: boolean,
	hiddenStrength: number | undefined,
	hiddenGoalkeeperStrength: number | undefined,
): number {
	if (isGoalkeeper) {
		return hiddenGoalkeeperStrength ?? PLAYER_RATING.default;
	}

	return hiddenStrength ?? PLAYER_RATING.default;
}

function eventPublicCeiling(event: ChampionshipEvent): number {
	return hiddenStrengthCeiling(
		event.attendance.flatMap((row) => [row.rating, row.goalkeeper_rating]),
	);
}

function attendancePublicSnapshot(
	isGoalkeeper: boolean,
	rating: number,
	goalkeeperRating: number,
): number {
	return eventActivePlayerRating(isGoalkeeper, rating, goalkeeperRating);
}

function trackKey(isGoalkeeper: boolean): HiddenStrengthTrack {
	if (isGoalkeeper) {
		return HIDDEN_STRENGTH_TRACK.goalkeeper;
	}

	return HIDDEN_STRENGTH_TRACK.line;
}

function emptyCurrent(): HiddenStrengthCurrent {
	return {
		line: PLAYER_RATING.default,
		goalkeeper: PLAYER_RATING.default,
	};
}

function readTrack(
	current: HiddenStrengthCurrent,
	track: HiddenStrengthTrack,
): number {
	if (track === HIDDEN_STRENGTH_TRACK.goalkeeper) {
		return current.goalkeeper;
	}

	return current.line;
}

function writeTrack(
	current: HiddenStrengthCurrent,
	track: HiddenStrengthTrack,
	value: number,
): HiddenStrengthCurrent {
	if (track === HIDDEN_STRENGTH_TRACK.goalkeeper) {
		return {
			line: current.line,
			goalkeeper: value,
		};
	}

	return {
		line: value,
		goalkeeper: current.goalkeeper,
	};
}

function ensurePlayer(
	state: Map<number, HiddenStrengthCurrent>,
	playerId: number,
): HiddenStrengthCurrent {
	const existing = state.get(playerId);
	if (existing) {
		return existing;
	}

	const created = emptyCurrent();
	state.set(playerId, created);
	return created;
}

export function hiddenStrengthWalk(
	events: readonly ChampionshipEvent[],
): HiddenStrengthWalk {
	const ended = endedChampionshipHistoryEvents(events);
	const state = new Map<number, HiddenStrengthCurrent>();
	const hiddenBeforeEvent = new Map<number, Map<number, number>>();

	for (const event of ended) {
		const before = new Map<number, number>();
		const ceiling = eventPublicCeiling(event);

		for (const row of event.attendance) {
			const track = trackKey(row.is_goalkeeper);
			const storedHidden = trackHiddenSnapshot(
				row.is_goalkeeper,
				row.hidden_strength,
				row.hidden_goalkeeper_strength,
			);
			const current = ensurePlayer(state, row.player_id);
			const existing = readTrack(current, track);
			const resolved = hiddenStrengthResolve(
				hiddenStrengthKnown(existing, storedHidden),
				attendancePublicSnapshot(
					row.is_goalkeeper,
					row.rating,
					row.goalkeeper_rating,
				),
				ceiling,
			);

			if (resolved !== existing) {
				state.set(row.player_id, writeTrack(current, track, resolved));
			}

			before.set(row.player_id, resolved);
		}

		hiddenBeforeEvent.set(event.id, before);

		for (const row of event.attendance) {
			const track = trackKey(row.is_goalkeeper);
			const current = ensurePlayer(state, row.player_id);
			const hidden = readTrack(current, track);
			state.set(
				row.player_id,
				writeTrack(
					current,
					track,
					hiddenStrengthApply(
						hidden,
						hiddenStrengthDelta(
							row.wins,
							row.draws,
							row.losses,
							row.matches,
							hidden,
						),
					),
				),
			);
		}
	}

	return {
		current: state,
		hiddenBeforeEvent,
	};
}

export function hiddenStrengthCurrent(
	walk: HiddenStrengthWalk,
): ReadonlyMap<number, HiddenStrengthCurrent> {
	return walk.current;
}

export function hiddenStrengthForPlayer(
	walk: HiddenStrengthWalk,
	playerId: number,
	track: HiddenStrengthTrack = HIDDEN_STRENGTH_TRACK.line,
): number {
	const current = walk.current.get(playerId);
	if (!current) {
		return PLAYER_RATING.default;
	}

	return readTrack(current, track);
}

export function hiddenStrengthFromStored(
	stored: number | undefined,
	walkValue: number,
): number {
	if (stored !== undefined && stored !== PLAYER_RATING.default) {
		return stored;
	}

	return walkValue;
}

function teamWinCount(winnerTeamId: number | null, teamId: number): number {
	if (winnerTeamId === teamId) {
		return 1;
	}

	return 0;
}

function teamMatchRecord(
	event: ChampionshipEvent,
	teamId: number,
): { matches: number; wins: number } {
	return event.matches
		.filter((match) => match.ended_at !== null)
		.filter((match) => match.team_a_id === teamId || match.team_b_id === teamId)
		.reduce(
			(acc, match) => ({
				matches: acc.matches + 1,
				wins: acc.wins + teamWinCount(match.winner_team_id, teamId),
			}),
			{ matches: 0, wins: 0 },
		);
}

function favoriteWonWhenDecided(
	decided: boolean,
	favoriteTeamId: number | undefined,
	leaderTeamId: number | undefined,
): boolean | null {
	if (!decided) {
		return null;
	}

	return favoriteTeamId === leaderTeamId;
}

function hiddenBeforeForPlayer(
	hiddenBefore: ReadonlyMap<number, number> | undefined,
	playerId: number,
): number {
	if (!hiddenBefore) {
		return PLAYER_RATING.default;
	}

	return hiddenBefore.get(playerId) ?? PLAYER_RATING.default;
}

export function eventTeamHiddenBalance(
	event: ChampionshipEvent,
	hiddenBefore: ReadonlyMap<number, number> | undefined,
	playerIds: ReadonlySet<number> | null = null,
): TeamHiddenBalanceEvent | null {
	if (event.teams.length === 0) {
		return null;
	}

	const teams = event.teams.flatMap((team) => {
		const roster = playerIds
			? team.players.filter((player) => playerIds.has(player.player_id))
			: team.players;
		if (playerIds && roster.length === 0) {
			return [];
		}

		const drawRatings = eventDrawRatings(
			roster.map((player) => ({
				id: player.player_id,
				rating: hiddenBeforeForPlayer(hiddenBefore, player.player_id),
			})),
		);
		const ratingByPlayer = new Map(
			drawRatings.map((player) => [player.id, player.rating] as const),
		);
		const record = teamMatchRecord(event, team.id);
		const ratings = roster.map(
			(player) => ratingByPlayer.get(player.player_id) ?? 0,
		);

		return [
			{
				teamId: team.id,
				label: eventTeamName(team.color, team.sort_order),
				predictedHidden: eventTeamRatingAverage(ratings),
				matches: record.matches,
				wins: record.wins,
				winRate: rosterWinRate(record.wins, record.matches),
			},
		];
	});
	if (teams.length < 2) {
		return null;
	}

	const predicted = teams.map((team) => team.predictedHidden);
	const highest = Math.max(...predicted);
	const lowest = Math.min(...predicted);
	const favorites = teams.filter((team) => team.predictedHidden === highest);
	const actualLeaders = teams.filter((team) => {
		const bestWr = Math.max(...teams.map((item) => item.winRate));
		return team.winRate === bestWr && team.matches > 0;
	});
	const decided =
		favorites.length === 1 && actualLeaders.length === 1 && highest !== lowest;
	const favoriteTeamId = favorites[0]?.teamId ?? null;
	const favoriteWon = favoriteWonWhenDecided(
		decided,
		favorites[0]?.teamId,
		actualLeaders[0]?.teamId,
	);

	return {
		eventId: event.id,
		startsAt: event.starts_at,
		spread: highest - lowest,
		favoriteWon,
		favoriteTeamId,
		teams,
	};
}

export function championshipTeamHiddenBalance(
	events: readonly ChampionshipEvent[],
	walk: HiddenStrengthWalk,
	playerIds: ReadonlySet<number> | null = null,
): TeamHiddenBalanceSummary {
	const rows = events.flatMap((event) => {
		if (event.ended_at === null) {
			return [];
		}

		const row = eventTeamHiddenBalance(
			event,
			walk.hiddenBeforeEvent.get(event.id),
			playerIds,
		);
		if (!row) {
			return [];
		}

		return [row];
	});
	const favoriteDecided = rows.filter((row) => row.favoriteWon !== null);
	const favoriteWon = favoriteDecided.filter((row) => row.favoriteWon).length;
	const spreadTotal = rows.reduce((sum, row) => sum + row.spread, 0);

	return {
		events: rows.length,
		averageSpread: averageOrZero(spreadTotal, rows.length),
		favoriteDecided: favoriteDecided.length,
		favoriteWon,
		favoriteWinRate: rosterWinRate(favoriteWon, favoriteDecided.length),
		rows,
	};
}

export function formatTeamHiddenSpread(value: number): string {
	return value.toFixed(1);
}

export function formatTeamHiddenCount(value: number): string {
	return formatRosterCount(value);
}

export function formatTeamHiddenWinRate(value: number): string {
	return formatRosterWinRate(value);
}
