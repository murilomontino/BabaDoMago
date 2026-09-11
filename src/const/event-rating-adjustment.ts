import { eventTeamByPlayerId } from "./championship-event.ts";
import { eventMvpBonus } from "./event-mvp.ts";
import {
	EVENT_TEAM_STANDINGS_POINTS,
	standingPointsRate,
} from "./event-team-standings.ts";
import { playerVisibleName } from "./player-name.ts";
import { championshipRatingCeiling, PLAYER_RATING } from "./player-rating.ts";
import { rosterGoalInvolvement } from "./roster-stats.ts";

export const EVENT_RATING_ADJUSTMENT = {
	upThreshold: 0.55,
	downThreshold: 0.45,
	dominantDownThreshold: 0.35,
	dominantTeamRate: 0.8,
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

export const EVENT_RATING_TRACK = {
	line: "line",
	goalkeeper: "goalkeeper",
} as const;

export type EventRatingTrack =
	(typeof EVENT_RATING_TRACK)[keyof typeof EVENT_RATING_TRACK];

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

export function eventRatingMvpOnLine(input: {
	isMvp: boolean;
	isGoalkeeper: boolean;
	lineMatches: number;
	gkMatches: number;
}): boolean {
	if (!input.isMvp) {
		return false;
	}

	if (input.isGoalkeeper) {
		return input.gkMatches === 0 && input.lineMatches > 0;
	}

	return input.lineMatches > 0 || input.gkMatches === 0;
}

export function eventRatingMvpOnGoalkeeper(input: {
	isMvp: boolean;
	isGoalkeeper: boolean;
	lineMatches: number;
	gkMatches: number;
}): boolean {
	if (!input.isMvp) {
		return false;
	}

	if (input.isGoalkeeper) {
		return input.gkMatches > 0 || input.lineMatches === 0;
	}

	return input.lineMatches === 0 && input.gkMatches > 0;
}

function eventRatingTrackMatchStats(
	stats:
		| {
				wins: number;
				draws: number;
				losses: number;
				matches: number;
				is_goalkeeper?: boolean;
				line_wins?: number;
				line_draws?: number;
				line_losses?: number;
				line_matches?: number;
				gk_wins?: number;
				gk_draws?: number;
				gk_losses?: number;
				gk_matches?: number;
		  }
		| undefined,
	track: EventRatingTrack,
): { wins: number; draws: number; losses: number; matches: number } {
	if (!stats) {
		return { wins: 0, draws: 0, losses: 0, matches: 0 };
	}

	const hasSplit =
		stats.line_matches !== undefined || stats.gk_matches !== undefined;
	if (!hasSplit) {
		const isGoalkeeper = stats.is_goalkeeper === true;
		if (track === EVENT_RATING_TRACK.goalkeeper) {
			if (!isGoalkeeper) {
				return { wins: 0, draws: 0, losses: 0, matches: 0 };
			}

			return {
				wins: stats.wins,
				draws: stats.draws,
				losses: stats.losses,
				matches: stats.matches,
			};
		}

		if (isGoalkeeper) {
			return { wins: 0, draws: 0, losses: 0, matches: 0 };
		}

		return {
			wins: stats.wins,
			draws: stats.draws,
			losses: stats.losses,
			matches: stats.matches,
		};
	}

	if (track === EVENT_RATING_TRACK.goalkeeper) {
		return {
			wins: stats.gk_wins ?? 0,
			draws: stats.gk_draws ?? 0,
			losses: stats.gk_losses ?? 0,
			matches: stats.gk_matches ?? 0,
		};
	}

	return {
		wins: stats.line_wins ?? 0,
		draws: stats.line_draws ?? 0,
		losses: stats.line_losses ?? 0,
		matches: stats.line_matches ?? 0,
	};
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
	track: EventRatingTrack;
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

export function eventRatingDeadZoneDownThreshold(
	hasDominantTeam: boolean,
): number {
	if (hasDominantTeam) {
		return EVENT_RATING_ADJUSTMENT.dominantDownThreshold;
	}

	return EVENT_RATING_ADJUSTMENT.downThreshold;
}

export function eventHasDominantTeam(
	rows: readonly { matches: number; pointsRate: number }[],
	minMatches: number = EVENT_RATING_ADJUSTMENT.minMatches,
): boolean {
	return rows.some(
		(row) =>
			row.matches >= minMatches &&
			row.pointsRate >= EVENT_RATING_ADJUSTMENT.dominantTeamRate,
	);
}

type EventDominantMatch = {
	ended_at: string | null;
	team_a_id: number;
	team_b_id: number;
	winner_team_id: number | null;
};

type TeamResultAcc = {
	matches: number;
	wins: number;
	draws: number;
};

function applyDominantTeamResult(
	acc: TeamResultAcc | undefined,
	winnerTeamId: number | null,
	teamId: number,
): TeamResultAcc {
	const next: TeamResultAcc = {
		matches: (acc?.matches ?? 0) + 1,
		wins: acc?.wins ?? 0,
		draws: acc?.draws ?? 0,
	};

	if (winnerTeamId === null) {
		next.draws += 1;
		return next;
	}

	if (winnerTeamId === teamId) {
		next.wins += 1;
		return next;
	}

	return next;
}

export function eventHasDominantTeamFromMatchups(
	matches: readonly EventDominantMatch[],
	minMatches: number = EVENT_RATING_ADJUSTMENT.minMatches,
): boolean {
	const byTeam = matches.reduce((acc, match) => {
		if (match.ended_at === null) {
			return acc;
		}

		acc.set(
			match.team_a_id,
			applyDominantTeamResult(
				acc.get(match.team_a_id),
				match.winner_team_id,
				match.team_a_id,
			),
		);
		acc.set(
			match.team_b_id,
			applyDominantTeamResult(
				acc.get(match.team_b_id),
				match.winner_team_id,
				match.team_b_id,
			),
		);
		return acc;
	}, new Map<number, TeamResultAcc>());

	return eventHasDominantTeam(
		[...byTeam.values()].map((acc) => {
			const points =
				acc.wins * EVENT_TEAM_STANDINGS_POINTS.win +
				acc.draws * EVENT_TEAM_STANDINGS_POINTS.draw;
			return {
				matches: acc.matches,
				pointsRate: standingPointsRate(points, acc.matches),
			};
		}),
		minMatches,
	);
}

function eventRatingPointUnits(
	wins: number,
	draws: number,
	losses: number,
	matches: number,
	downThreshold: number = EVENT_RATING_ADJUSTMENT.downThreshold,
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
		downUnits: maxPoints * Math.round(downThreshold * EVENT_RATING_WR_SCALE),
	};
}

export function eventRatingInDeadZone(
	wins: number,
	draws: number,
	losses: number,
	matches: number,
	downThreshold: number = EVENT_RATING_ADJUSTMENT.downThreshold,
	minMatches: number = EVENT_RATING_ADJUSTMENT.minMatches,
): boolean {
	if (matches < minMatches) {
		return false;
	}

	const { pointUnits, upUnits, downUnits } = eventRatingPointUnits(
		wins,
		draws,
		losses,
		matches,
		downThreshold,
	);
	return pointUnits <= upUnits && pointUnits >= downUnits;
}

export function eventRatingInitial(
	wins: number,
	draws: number,
	losses: number,
	matches: number,
	downThreshold: number = EVENT_RATING_ADJUSTMENT.downThreshold,
	minMatches: number = EVENT_RATING_ADJUSTMENT.minMatches,
): number {
	if (matches < minMatches) {
		return PLAYER_RATING.default;
	}

	const { pointUnits, upUnits } = eventRatingPointUnits(
		wins,
		draws,
		losses,
		matches,
		downThreshold,
	);

	if (
		eventRatingInDeadZone(
			wins,
			draws,
			losses,
			matches,
			downThreshold,
			minMatches,
		)
	) {
		return EVENT_RATING_INITIAL.mid;
	}

	if (pointUnits > upUnits) {
		return EVENT_RATING_INITIAL.high;
	}

	return EVENT_RATING_INITIAL.low;
}

function eventRatingRankedDelta(
	wins: number,
	draws: number,
	losses: number,
	matches: number,
	ceiling: number,
	downThreshold: number = EVENT_RATING_ADJUSTMENT.downThreshold,
	minMatches: number = EVENT_RATING_ADJUSTMENT.minMatches,
): number {
	if (matches < minMatches) {
		return 0;
	}

	if (
		eventRatingInDeadZone(
			wins,
			draws,
			losses,
			matches,
			downThreshold,
			minMatches,
		)
	) {
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

export function eventRatingDelta(
	wins: number,
	draws: number,
	losses: number,
	matches: number,
	rating: number,
	ceiling: number,
	downThreshold: number = EVENT_RATING_ADJUSTMENT.downThreshold,
	minMatches: number = EVENT_RATING_ADJUSTMENT.minMatches,
): number {
	if (matches < minMatches) {
		return 0;
	}

	if (rating === PLAYER_RATING.default) {
		const seed = eventRatingInitial(
			wins,
			draws,
			losses,
			matches,
			downThreshold,
			minMatches,
		);
		return applyEventRatingDelta(
			seed,
			eventRatingRankedDelta(
				wins,
				draws,
				losses,
				matches,
				ceiling,
				downThreshold,
				minMatches,
			),
		);
	}

	return eventRatingRankedDelta(
		wins,
		draws,
		losses,
		matches,
		ceiling,
		downThreshold,
		minMatches,
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
	downThreshold: number = EVENT_RATING_ADJUSTMENT.downThreshold,
	minMatches: number = EVENT_RATING_ADJUSTMENT.minMatches,
): number {
	return applyEventRatingDelta(
		rating,
		-oldDelta +
			eventRatingDelta(
				wins,
				draws,
				losses,
				matches,
				snapshotRating,
				ceiling,
				downThreshold,
				minMatches,
			),
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
	downThreshold = EVENT_RATING_ADJUSTMENT.downThreshold,
	minMatches = EVENT_RATING_ADJUSTMENT.minMatches,
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
	downThreshold?: number;
	minMatches?: number;
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
			downThreshold,
			minMatches,
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
		downThreshold,
		minMatches,
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
	ratingMinMatches = EVENT_RATING_ADJUSTMENT.minMatches,
	teams = [],
	matches = [],
	hasDominantTeam,
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
		line_wins?: number;
		line_draws?: number;
		line_losses?: number;
		line_matches?: number;
		gk_wins?: number;
		gk_draws?: number;
		gk_losses?: number;
		gk_matches?: number;
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
	ratingMinMatches?: number;
	teams?: readonly {
		id: number;
		color: string | null;
		sort_order: number;
		players: readonly { player_id: number }[];
	}[];
	matches?: readonly EventDominantMatch[];
	hasDominantTeam?: boolean;
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
	const dominant =
		hasDominantTeam ??
		eventHasDominantTeamFromMatchups(matches, ratingMinMatches);
	const downThreshold = eventRatingDeadZoneDownThreshold(dominant);

	return ids.flatMap((playerId) => {
		const player = playerById.get(playerId);
		const stats = statsById.get(playerId);
		const isGoalkeeper = stats?.is_goalkeeper === true;
		const lineStats = eventRatingTrackMatchStats(
			stats,
			EVENT_RATING_TRACK.line,
		);
		const gkStats = eventRatingTrackMatchStats(
			stats,
			EVENT_RATING_TRACK.goalkeeper,
		);
		const name = playerVisibleName(
			player ?? {
				nickname: null,
				display_name: stats?.display_name ?? "",
			},
		);
		const isMvp = mvpIds.has(playerId);
		const mvpLine = eventRatingMvpOnLine({
			isMvp,
			isGoalkeeper,
			lineMatches: lineStats.matches,
			gkMatches: gkStats.matches,
		});
		const mvpGk = eventRatingMvpOnGoalkeeper({
			isMvp,
			isGoalkeeper,
			lineMatches: lineStats.matches,
			gkMatches: gkStats.matches,
		});
		const tracks: EventRatingTrack[] = [];
		if (lineStats.matches > 0) {
			tracks.push(EVENT_RATING_TRACK.line);
		}
		if (gkStats.matches > 0) {
			tracks.push(EVENT_RATING_TRACK.goalkeeper);
		}
		if (tracks.length === 0) {
			tracks.push(
				isGoalkeeper
					? EVENT_RATING_TRACK.goalkeeper
					: EVENT_RATING_TRACK.line,
			);
		}

		return tracks.map((track) => {
			const trackStats =
				track === EVENT_RATING_TRACK.goalkeeper ? gkStats : lineStats;
			const snapshotRating =
				track === EVENT_RATING_TRACK.goalkeeper
					? stats?.goalkeeper_rating
					: stats?.rating;
			const rosterRating =
				track === EVENT_RATING_TRACK.goalkeeper
					? player?.goalkeeper_rating
					: player?.rating;
			const from = eventRatingPreviewFrom(snapshotRating, rosterRating);
			const ceiling =
				track === EVENT_RATING_TRACK.goalkeeper ? gkCeiling : lineCeiling;
			const excludedPlayerIds =
				track === EVENT_RATING_TRACK.goalkeeper
					? excludedGkIds
					: excludedLineIds;
			const trackIsMvp =
				track === EVENT_RATING_TRACK.goalkeeper ? mvpGk : mvpLine;
			const rawDelta =
				eventRatingDelta(
					trackStats.wins,
					trackStats.draws,
					trackStats.losses,
					trackStats.matches,
					from,
					ceiling,
					downThreshold,
					ratingMinMatches,
				) + eventMvpBonus(trackIsMvp, from);
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
				name,
				from,
				to,
				isMvp: trackIsMvp,
				track,
			};
		});
	});
}
