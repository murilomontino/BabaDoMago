import {
	compareStartsAtNewestFirst,
	formatEventStartsAt,
} from "./championship-event.ts";
import { mvpCount } from "./event-mvp.ts";
import {
	applyEventRatingDelta,
	EVENT_RATING_TRACK,
	type EventRatingTrack,
} from "./event-rating-adjustment.ts";
import { rosterSafeCount } from "./roster-stats.ts";

export const PLAYER_PROFILE_LABEL = {
	notFound: "Jogador não encontrado",
	championshipError: "Erro ao carregar campeonato",
	eventsError: "Erro ao carregar rodadas",
	career: "Carreira",
	history: "Histórico",
	emptyHistory: "Ainda não jogou",
	noAccount: "Sem conta",
	delta: "Delta",
	rating: "Nota",
	viewPhoto: "Ver foto de perfil",
} as const;

export const PLAYER_RATING_HISTORY_CHART = {
	height: 192,
	ratingKey: "rating",
	indexKey: "x",
	labelOffset: 8,
	labelFontSize: 12,
} as const;

export const PLAYER_PROFILE_HISTORY_COLUMN = {
	date: "date",
	goals: "goals",
	assists: "assists",
	assisted_goals: "assisted_goals",
	own_goals: "own_goals",
	wins: "wins",
	losses: "losses",
	draws: "draws",
	mvps: "mvps",
	matches: "matches",
	delta: "delta",
} as const;

export type PlayerProfileHistoryColumnId =
	(typeof PLAYER_PROFILE_HISTORY_COLUMN)[keyof typeof PLAYER_PROFILE_HISTORY_COLUMN];

export const PLAYER_PROFILE_HISTORY_COLUMNS = [
	PLAYER_PROFILE_HISTORY_COLUMN.date,
	PLAYER_PROFILE_HISTORY_COLUMN.goals,
	PLAYER_PROFILE_HISTORY_COLUMN.assists,
	PLAYER_PROFILE_HISTORY_COLUMN.assisted_goals,
	PLAYER_PROFILE_HISTORY_COLUMN.own_goals,
	PLAYER_PROFILE_HISTORY_COLUMN.wins,
	PLAYER_PROFILE_HISTORY_COLUMN.losses,
	PLAYER_PROFILE_HISTORY_COLUMN.draws,
	PLAYER_PROFILE_HISTORY_COLUMN.mvps,
	PLAYER_PROFILE_HISTORY_COLUMN.matches,
	PLAYER_PROFILE_HISTORY_COLUMN.delta,
] as const;

export const PLAYER_PROFILE_HISTORY_ABBR = {
	date: "Data",
	goals: "G",
	assists: "A",
	assisted_goals: "GS",
	own_goals: "GC",
	wins: "V",
	losses: "D",
	draws: "E",
	mvps: "MVP",
	matches: "J",
	delta: "Δ",
} as const;

export const PLAYER_PROFILE_HISTORY_COLUMN_LABEL = {
	date: "Data",
	goals: "Gols",
	assists: "Assistências",
	assisted_goals: "Gols servidos",
	own_goals: "Gols contra",
	wins: "Vitórias",
	losses: "Derrotas",
	draws: "Empates",
	mvps: "MVP",
	matches: "Jogos",
	delta: PLAYER_PROFILE_LABEL.delta,
} as const;

export const PLAYER_PROFILE_HISTORY_LEGEND = PLAYER_PROFILE_HISTORY_COLUMNS.map(
	(id) => ({
		id,
		abbr: PLAYER_PROFILE_HISTORY_ABBR[id],
		label: PLAYER_PROFILE_HISTORY_COLUMN_LABEL[id],
	}),
);

export type PlayerProfileEventInput = {
	id: number;
	championship_id: number;
	starts_at: string;
	ended_at: string | null;
	attendance: readonly {
		player_id: number;
		goals: number;
		assists: number;
		assisted_goals: number;
		own_goals: number;
		wins: number;
		losses: number;
		draws: number;
		matches: number;
		line_wins?: number;
		line_losses?: number;
		line_draws?: number;
		line_matches?: number;
		gk_wins?: number;
		gk_losses?: number;
		gk_draws?: number;
		gk_matches?: number;
		rating: number;
		rating_delta: number;
		rating_projected?: number | null;
		goalkeeper_rating?: number;
		goalkeeper_rating_delta?: number;
		is_goalkeeper?: boolean;
		is_mvp?: boolean;
	}[];
};

export type PlayerProfileHistoryRow = {
	eventId: number;
	championshipId: number;
	startsAt: string;
	goals: number;
	assists: number;
	assistedGoals: number;
	ownGoals: number;
	wins: number;
	losses: number;
	draws: number;
	mvps: number;
	matches: number;
	ratingFrom: number;
	ratingDelta: number;
	ratingTo: number;
	track: EventRatingTrack;
};

export type PlayerRatingHistoryChartPoint = {
	startsAt: string;
	rating: number;
	x: number;
};

export function playerProfileDelta(value: unknown): number {
	const n = Number(value);
	if (!Number.isFinite(n)) {
		return 0;
	}

	return n;
}

export function formatPlayerProfileDelta(value: number): string {
	const delta = playerProfileDelta(value);
	if (delta === 0) {
		return "0";
	}

	const abs = Math.abs(delta).toFixed(1);
	if (delta > 0) {
		return `+${abs}`;
	}

	return `−${abs}`;
}

function playerProfileAttendanceTrackMatches(
	attendance: PlayerProfileEventInput["attendance"][number],
	track: EventRatingTrack,
): number {
	if (track === EVENT_RATING_TRACK.goalkeeper) {
		if (attendance.gk_matches !== undefined) {
			return rosterSafeCount(attendance.gk_matches);
		}

		if (attendance.is_goalkeeper === true) {
			return rosterSafeCount(attendance.matches);
		}

		return 0;
	}

	if (attendance.line_matches !== undefined) {
		return rosterSafeCount(attendance.line_matches);
	}

	if (attendance.is_goalkeeper === true) {
		return 0;
	}

	return rosterSafeCount(attendance.matches);
}

function playerProfileHistoryRowForTrack(
	event: PlayerProfileEventInput,
	attendance: PlayerProfileEventInput["attendance"][number],
	track: EventRatingTrack,
): PlayerProfileHistoryRow {
	const isGoalkeeper = track === EVENT_RATING_TRACK.goalkeeper;
	const ratingFrom = playerProfileDelta(
		isGoalkeeper ? attendance.goalkeeper_rating : attendance.rating,
	);
	const ratingDelta = playerProfileDelta(
		isGoalkeeper
			? attendance.goalkeeper_rating_delta
			: attendance.rating_delta,
	);
	const wins = isGoalkeeper
		? rosterSafeCount(attendance.gk_wins ?? attendance.wins)
		: rosterSafeCount(attendance.line_wins ?? attendance.wins);
	const losses = isGoalkeeper
		? rosterSafeCount(attendance.gk_losses ?? attendance.losses)
		: rosterSafeCount(attendance.line_losses ?? attendance.losses);
	const draws = isGoalkeeper
		? rosterSafeCount(attendance.gk_draws ?? attendance.draws)
		: rosterSafeCount(attendance.line_draws ?? attendance.draws);
	const matches = playerProfileAttendanceTrackMatches(attendance, track);

	return {
		eventId: event.id,
		championshipId: event.championship_id,
		startsAt: event.starts_at,
		goals: rosterSafeCount(attendance.goals),
		assists: rosterSafeCount(attendance.assists),
		assistedGoals: rosterSafeCount(attendance.assisted_goals),
		ownGoals: rosterSafeCount(attendance.own_goals),
		wins,
		losses,
		draws,
		mvps: mvpCount(attendance.is_mvp === true),
		matches,
		ratingFrom,
		ratingDelta,
		ratingTo: applyEventRatingDelta(ratingFrom, ratingDelta),
		track,
	};
}

export function playerProfileHistory(
	events: readonly PlayerProfileEventInput[],
	playerId: number,
	track: EventRatingTrack | null = null,
): PlayerProfileHistoryRow[] {
	return events
		.flatMap((event) => {
			if (!event.ended_at) {
				return [];
			}

			const attendance = event.attendance.find(
				(row) => row.player_id === playerId,
			);
			if (!attendance) {
				return [];
			}

			const lineMatches = playerProfileAttendanceTrackMatches(
				attendance,
				EVENT_RATING_TRACK.line,
			);
			const gkMatches = playerProfileAttendanceTrackMatches(
				attendance,
				EVENT_RATING_TRACK.goalkeeper,
			);
			const gkDelta = playerProfileDelta(attendance.goalkeeper_rating_delta);
			const tracks: EventRatingTrack[] = [];
			if (lineMatches > 0 || (gkMatches === 0 && track === null)) {
				tracks.push(EVENT_RATING_TRACK.line);
			}
			if (gkMatches > 0 || gkDelta !== 0) {
				tracks.push(EVENT_RATING_TRACK.goalkeeper);
			}
			if (tracks.length === 0) {
				tracks.push(EVENT_RATING_TRACK.line);
			}

			return tracks
				.filter((rowTrack) => track === null || rowTrack === track)
				.map((rowTrack) =>
					playerProfileHistoryRowForTrack(event, attendance, rowTrack),
				);
		})
		.sort((left, right) =>
			compareStartsAtNewestFirst(
				{ starts_at: left.startsAt, id: left.eventId },
				{ starts_at: right.startsAt, id: right.eventId },
			),
		);
}

export function playerRatingHistoryChartSeries(
	history: readonly PlayerProfileHistoryRow[],
	currentRating: number,
	nowIso: string,
): PlayerRatingHistoryChartPoint[] {
	if (history.length === 0) {
		return [];
	}

	const chronological = history.slice().reverse();
	const oldest = chronological[0];
	if (!oldest) {
		return [];
	}

	return [
		{
			x: 0,
			startsAt: oldest.startsAt,
			rating: oldest.ratingFrom,
		},
		...chronological.map((row, index) => ({
			x: index + 1,
			startsAt: row.startsAt,
			rating: row.ratingTo,
		})),
		{
			x: chronological.length + 1,
			startsAt: nowIso,
			rating: playerProfileDelta(currentRating),
		},
	];
}

export function playerRatingHistoryChartTickLabel(
	points: readonly PlayerRatingHistoryChartPoint[],
	x: number,
): string {
	const current = points[x];
	if (!current) {
		return "";
	}

	const next = points[x + 1];
	if (next && next.startsAt === current.startsAt) {
		return "";
	}

	return formatEventStartsAt(current.startsAt).date;
}

export function ratingsForProfileCeiling(
	players: readonly {
		id: number;
		deleted_at: string | null;
		rating: number;
	}[],
	playerId: number,
): number[] {
	return players.flatMap((item) => {
		if (item.deleted_at && item.id !== playerId) {
			return [];
		}

		return [item.rating];
	});
}
