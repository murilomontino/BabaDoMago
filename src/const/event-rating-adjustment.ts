import { eventTeamByPlayerId } from "./championship-event.ts";
import { eventMvpBonus } from "./event-mvp.ts";
import { playerVisibleName } from "./player-name.ts";
import { championshipRatingCeiling, PLAYER_RATING } from "./player-rating.ts";
import { rosterGoalInvolvement } from "./roster-stats.ts";

export const EVENT_RATING_ADJUSTMENT = {
	upThreshold: 0.55,
	downThreshold: 0.45,
	expectedRate: 0.5,
	minMatches: 3,
	scaleDivisor: 2,
	winPoints: 3,
	drawPoints: 1,
	drawPointsBonus: 1.5,
} as const;

export const EVENT_RATING_INITIAL = {
	low: 2.7,
	mid: 3,
	high: 3.5,
} as const;

export const EVENT_RATING_DROP_SHARE = {
	cap: 1,
	excludeTop: 10,
	minShare: 0.4,
} as const;

export function eventActivePlayerRating(
	isGoalkeeper: boolean,
	rating: number,
	goalkeeperRating: number,
): number {
	if (isGoalkeeper) {
		return goalkeeperRating;
	}

	return rating;
}

export function eventRatingDropShareExcludedPlayerIds(
	players: readonly { id: number; rating: number }[],
	limit: number = EVENT_RATING_DROP_SHARE.excludeTop,
): ReadonlySet<number> {
	if (limit <= 0) {
		return new Set();
	}

	return new Set(
		[...players]
			.filter((player) => player.rating > PLAYER_RATING.default)
			.sort((left, right) => {
				if (left.rating !== right.rating) {
					return right.rating - left.rating;
				}

				return left.id - right.id;
			})
			.slice(0, limit)
			.map((player) => player.id),
	);
}

export type EventRatingPreviewRow = {
	playerId: number;
	name: string;
	from: number;
	to: number;
	isMvp: boolean;
};

export function previewRatingTos(
	preview: readonly EventRatingPreviewRow[] | false | null | undefined,
): number[] {
	if (!preview) {
		return [];
	}

	return preview.map((row) => row.to);
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

function roundRatioToTenths(numerator: number, denominator: number): number {
	if (denominator === 0) {
		return 0;
	}

	const absN = Math.abs(numerator);
	const absD = Math.abs(denominator);
	return (
		(signedUnit(numerator * denominator) *
			Math.floor((absN + absD / 2) / absD)) /
		10
	);
}

export function eventRatingDrawPoints(draws: number, losses: number): number {
	if (draws > losses) {
		return EVENT_RATING_ADJUSTMENT.drawPointsBonus;
	}

	return EVENT_RATING_ADJUSTMENT.drawPoints;
}

export function eventRatingPoints(
	wins: number,
	draws: number,
	losses: number,
): number {
	return (
		wins * EVENT_RATING_ADJUSTMENT.winPoints +
		draws * eventRatingDrawPoints(draws, losses)
	);
}

export function eventRatingRate(
	wins: number,
	draws: number,
	losses: number,
	matches: number,
): number {
	if (matches <= 0) {
		return 0;
	}

	return (
		eventRatingPoints(wins, draws, losses) /
		(matches * EVENT_RATING_ADJUSTMENT.winPoints)
	);
}

const EVENT_RATING_WR_SCALE = 20 as const;

function eventRatingPointUnits(
	wins: number,
	draws: number,
	losses: number,
	matches: number,
): {
	pointUnits: number;
	upUnits: number;
	downUnits: number;
} {
	const points = eventRatingPoints(wins, draws, losses);
	const maxPoints = matches * EVENT_RATING_ADJUSTMENT.winPoints;
	return {
		pointUnits: points * EVENT_RATING_WR_SCALE,
		upUnits:
			maxPoints *
			Math.round(EVENT_RATING_ADJUSTMENT.upThreshold * EVENT_RATING_WR_SCALE),
		downUnits:
			maxPoints *
			Math.round(EVENT_RATING_ADJUSTMENT.downThreshold * EVENT_RATING_WR_SCALE),
	};
}

export function eventRatingInDeadZone(
	wins: number,
	draws: number,
	losses: number,
	matches: number,
): boolean {
	if (matches < EVENT_RATING_ADJUSTMENT.minMatches) {
		return false;
	}

	const { pointUnits, upUnits, downUnits } = eventRatingPointUnits(
		wins,
		draws,
		losses,
		matches,
	);
	return pointUnits <= upUnits && pointUnits >= downUnits;
}

export function eventRatingDelta(
	wins: number,
	draws: number,
	losses: number,
	matches: number,
	rating: number,
	ceiling: number,
): number {
	if (matches < EVENT_RATING_ADJUSTMENT.minMatches) {
		return 0;
	}

	const { pointUnits, upUnits } = eventRatingPointUnits(
		wins,
		draws,
		losses,
		matches,
	);
	const inDeadZone = eventRatingInDeadZone(wins, draws, losses, matches);

	if (rating === PLAYER_RATING.default) {
		if (inDeadZone) {
			return EVENT_RATING_INITIAL.mid;
		}

		if (pointUnits > upUnits) {
			return EVENT_RATING_INITIAL.high;
		}

		return EVENT_RATING_INITIAL.low;
	}

	if (inDeadZone) {
		return 0;
	}

	const points = eventRatingPoints(wins, draws, losses);
	const maxPoints = matches * EVENT_RATING_ADJUSTMENT.winPoints;
	// ponytail: linear no teto; teto 75 e 83% = +12.5. Cap de delta se o baba maduro pular demais.
	const ceilingTenths = Math.round(
		Math.min(PLAYER_RATING.max, Math.max(PLAYER_RATING.min, ceiling)) * 10,
	);
	return roundRatioToTenths(
		(2 * points - maxPoints) * ceilingTenths,
		2 * EVENT_RATING_ADJUSTMENT.scaleDivisor * maxPoints,
	);
}

export function applyEventRatingDelta(rating: number, delta: number): number {
	const next = roundAwayFromZero1(rating + delta);
	if (rating === PLAYER_RATING.default && next <= PLAYER_RATING.default) {
		return PLAYER_RATING.default;
	}

	return Math.min(PLAYER_RATING.max, Math.max(PLAYER_RATING.floor, next));
}

export function recomputePlayerEventRating(
	rating: number,
	oldDelta: number,
	wins: number,
	draws: number,
	losses: number,
	matches: number,
	ceiling: number,
	snapshotRating = rating,
): number {
	return applyEventRatingDelta(
		rating,
		-oldDelta +
			eventRatingDelta(wins, draws, losses, matches, snapshotRating, ceiling),
	);
}

export function playerEventRatingAfterSave({
	rating,
	storedDelta,
	oldWins,
	oldDraws,
	oldLosses,
	oldMatches,
	wins,
	draws,
	losses,
	matches,
	ceiling,
	snapshotRating,
}: {
	rating: number;
	storedDelta: number;
	oldWins: number;
	oldDraws: number;
	oldLosses: number;
	oldMatches: number;
	wins: number;
	draws: number;
	losses: number;
	matches: number;
	ceiling: number;
	snapshotRating?: number;
}): number {
	if (
		rating !== PLAYER_RATING.default &&
		storedDelta === 0 &&
		eventRatingDelta(
			oldWins,
			oldDraws,
			oldLosses,
			oldMatches,
			rating,
			ceiling,
		) !== 0
	) {
		return rating;
	}

	return recomputePlayerEventRating(
		rating,
		storedDelta,
		wins,
		draws,
		losses,
		matches,
		ceiling,
		snapshotRating ?? rating,
	);
}

export function formatEventRating(rating: number): string {
	return rating.toFixed(1);
}

export function eventRatingPreviewFrom(
	snapshotRating: number | undefined,
	playerRating: number | undefined,
): number {
	if (snapshotRating !== undefined) {
		return snapshotRating;
	}

	if (playerRating !== undefined) {
		return playerRating;
	}

	return PLAYER_RATING.default;
}

export function eventRatingTeamGoalShare(
	playerInvolvement: number,
	teamInvolvement: number,
): number {
	if (teamInvolvement <= 0 || playerInvolvement <= 0) {
		return 0;
	}

	const share = playerInvolvement / teamInvolvement;
	if (share <= EVENT_RATING_DROP_SHARE.minShare) {
		return 0;
	}

	return Math.min(EVENT_RATING_DROP_SHARE.cap, Math.max(0, share));
}

export function eventRatingApplyDropShare(
	delta: number,
	share: number,
): number {
	if (delta >= 0 || share <= 0) {
		return delta;
	}

	return roundAwayFromZero1(delta * (1 - share));
}

function eventRatingDropShareForPlayer({
	enabled,
	playerId,
	excludedPlayerIds,
	statsById,
	teamByPlayerId,
	teamInvolvementById,
}: {
	enabled: boolean;
	playerId: number;
	excludedPlayerIds: ReadonlySet<number>;
	statsById: ReadonlyMap<number, { goals?: number; assists?: number }>;
	teamByPlayerId: ReadonlyMap<number, { team_id: number }>;
	teamInvolvementById: ReadonlyMap<number, number>;
}): number {
	if (!enabled || excludedPlayerIds.has(playerId)) {
		return 0;
	}

	const team = teamByPlayerId.get(playerId);
	if (!team) {
		return 0;
	}

	const stats = statsById.get(playerId);
	return eventRatingTeamGoalShare(
		rosterGoalInvolvement(stats?.goals ?? 0, stats?.assists ?? 0),
		teamInvolvementById.get(team.team_id) ?? 0,
	);
}

function eventRatingTeamInvolvementById(
	attendance: readonly {
		player_id: number;
		goals?: number;
		assists?: number;
	}[],
	teamByPlayerId: ReadonlyMap<number, { team_id: number }>,
): Map<number, number> {
	return attendance.reduce((totals, row) => {
		const team = teamByPlayerId.get(row.player_id);
		if (!team) {
			return totals;
		}

		const involvement = rosterGoalInvolvement(row.goals ?? 0, row.assists ?? 0);
		totals.set(team.team_id, (totals.get(team.team_id) ?? 0) + involvement);
		return totals;
	}, new Map<number, number>());
}

export function eventRatingPreview({
	attendance,
	players,
	presentPlayerIds,
	mvpPlayerIds = [],
	ratingDropGoalShare = false,
	ratingDropShareExcludeTop = false,
	teams = [],
}: {
	attendance: readonly {
		player_id: number;
		display_name: string;
		wins: number;
		draws: number;
		losses: number;
		matches: number;
		is_goalkeeper?: boolean;
		rating?: number;
		goalkeeper_rating?: number;
		goals?: number;
		assists?: number;
	}[];
	players: readonly {
		id: number;
		rating: number;
		goalkeeper_rating?: number;
		nickname: string | null;
		display_name: string;
	}[];
	presentPlayerIds: readonly number[] | null;
	mvpPlayerIds?: readonly number[];
	ratingDropGoalShare?: boolean;
	ratingDropShareExcludeTop?: boolean;
	teams?: readonly {
		id: number;
		color: string | null;
		sort_order: number;
		players: readonly { player_id: number }[];
	}[];
}): EventRatingPreviewRow[] {
	const playerById = new Map(players.map((player) => [player.id, player]));
	const statsById = new Map(attendance.map((row) => [row.player_id, row]));
	const mvpIds = new Set(mvpPlayerIds);
	const lineCeiling = championshipRatingCeiling(
		players.map((player) => player.rating),
	);
	const gkCeiling = championshipRatingCeiling(
		players.map((player) => player.goalkeeper_rating ?? PLAYER_RATING.default),
	);
	const ids = presentPlayerIds ?? attendance.map((row) => row.player_id);
	const teamByPlayerId = eventTeamByPlayerId(teams);
	const teamInvolvementById = eventRatingTeamInvolvementById(
		attendance,
		teamByPlayerId,
	);
	const excludedLineIds =
		ratingDropGoalShare && ratingDropShareExcludeTop
			? eventRatingDropShareExcludedPlayerIds(players)
			: new Set<number>();
	const excludedGkIds =
		ratingDropGoalShare && ratingDropShareExcludeTop
			? eventRatingDropShareExcludedPlayerIds(
					players.map((player) => ({
						id: player.id,
						rating: player.goalkeeper_rating ?? PLAYER_RATING.default,
					})),
				)
			: new Set<number>();

	return ids.map((playerId) => {
		const player = playerById.get(playerId);
		const stats = statsById.get(playerId);
		const isGoalkeeper = stats?.is_goalkeeper === true;
		const snapshotRating = isGoalkeeper
			? stats?.goalkeeper_rating
			: stats?.rating;
		const rosterRating = isGoalkeeper
			? player?.goalkeeper_rating
			: player?.rating;
		const from = eventRatingPreviewFrom(snapshotRating, rosterRating);
		const isMvp = mvpIds.has(playerId);
		const ceiling = isGoalkeeper ? gkCeiling : lineCeiling;
		const excludedPlayerIds = isGoalkeeper ? excludedGkIds : excludedLineIds;
		const rawDelta =
			eventRatingDelta(
				stats?.wins ?? 0,
				stats?.draws ?? 0,
				stats?.losses ?? 0,
				stats?.matches ?? 0,
				from,
				ceiling,
			) + eventMvpBonus(isMvp, from);
		const share = eventRatingDropShareForPlayer({
			enabled: ratingDropGoalShare,
			playerId,
			excludedPlayerIds,
			statsById,
			teamByPlayerId,
			teamInvolvementById,
		});
		const to = applyEventRatingDelta(
			from,
			eventRatingApplyDropShare(rawDelta, share),
		);

		return {
			playerId,
			name: playerVisibleName(
				player ?? {
					nickname: null,
					display_name: stats?.display_name ?? "",
				},
			),
			from,
			to,
			isMvp,
		};
	});
}
