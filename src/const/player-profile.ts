import { applyEventRatingDelta } from "./event-rating-adjustment.ts";
import { rosterSafeCount } from "./roster-stats.ts";

export const PLAYER_PROFILE_LABEL = {
	loading: "Carregando perfil...",
	notFound: "Jogador não encontrado",
	championshipError: "Erro ao carregar campeonato",
	eventsError: "Erro ao carregar rodadas",
	eventsLoading: "Carregando rodadas...",
	career: "Carreira",
	history: "Histórico",
	emptyHistory: "Ainda não jogou",
	noAccount: "Sem conta",
	delta: "Delta",
	rating: "Nota",
} as const;

export const PLAYER_RATING_HISTORY_CHART = {
	height: 192,
	dateKey: "startsAt",
	ratingKey: "rating",
} as const;

export const PLAYER_PROFILE_HISTORY_COLUMN = {
	date: "date",
	goals: "goals",
	assists: "assists",
	own_goals: "own_goals",
	wins: "wins",
	matches: "matches",
	delta: "delta",
} as const;

export type PlayerProfileHistoryColumnId =
	(typeof PLAYER_PROFILE_HISTORY_COLUMN)[keyof typeof PLAYER_PROFILE_HISTORY_COLUMN];

export const PLAYER_PROFILE_HISTORY_COLUMNS = [
	PLAYER_PROFILE_HISTORY_COLUMN.date,
	PLAYER_PROFILE_HISTORY_COLUMN.goals,
	PLAYER_PROFILE_HISTORY_COLUMN.assists,
	PLAYER_PROFILE_HISTORY_COLUMN.own_goals,
	PLAYER_PROFILE_HISTORY_COLUMN.wins,
	PLAYER_PROFILE_HISTORY_COLUMN.matches,
	PLAYER_PROFILE_HISTORY_COLUMN.delta,
] as const;

export const PLAYER_PROFILE_HISTORY_ABBR = {
	date: "Data",
	goals: "G",
	assists: "A",
	own_goals: "GC",
	wins: "V",
	matches: "J",
	delta: "Δ",
} as const;

export const PLAYER_PROFILE_HISTORY_COLUMN_LABEL = {
	date: "Data",
	goals: "Gols",
	assists: "Assistências",
	own_goals: "Gols contra",
	wins: "Vitórias",
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
		own_goals: number;
		wins: number;
		matches: number;
		rating: number;
		rating_delta: number;
	}[];
};

export type PlayerProfileHistoryRow = {
	eventId: number;
	championshipId: number;
	startsAt: string;
	goals: number;
	assists: number;
	ownGoals: number;
	wins: number;
	matches: number;
	ratingFrom: number;
	ratingDelta: number;
	ratingTo: number;
};

export type PlayerRatingHistoryChartPoint = {
	startsAt: string;
	rating: number;
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

export function playerProfileHistory(
	events: readonly PlayerProfileEventInput[],
	playerId: number,
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

			const ratingFrom = playerProfileDelta(attendance.rating);
			const ratingDelta = playerProfileDelta(attendance.rating_delta);

			return [
				{
					eventId: event.id,
					championshipId: event.championship_id,
					startsAt: event.starts_at,
					goals: rosterSafeCount(attendance.goals),
					assists: rosterSafeCount(attendance.assists),
					ownGoals: rosterSafeCount(attendance.own_goals),
					wins: rosterSafeCount(attendance.wins),
					matches: rosterSafeCount(attendance.matches),
					ratingFrom,
					ratingDelta,
					ratingTo: applyEventRatingDelta(ratingFrom, ratingDelta),
				},
			];
		})
		.sort((left, right) => {
			if (left.startsAt === right.startsAt) {
				return right.eventId - left.eventId;
			}

			return left.startsAt < right.startsAt ? 1 : -1;
		});
}

export function playerRatingHistoryChartSeries(
	history: readonly PlayerProfileHistoryRow[],
	currentRating: number,
	nowIso: string,
): PlayerRatingHistoryChartPoint[] {
	const points = history
		.slice()
		.reverse()
		.map((row) => ({
			startsAt: row.startsAt,
			rating: row.ratingTo,
		}));

	if (points.length === 0) {
		return [];
	}

	return [
		...points,
		{
			startsAt: nowIso,
			rating: playerProfileDelta(currentRating),
		},
	];
}
