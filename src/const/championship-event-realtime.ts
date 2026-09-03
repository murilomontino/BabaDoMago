import type {
	ChampionshipEvent,
	ChampionshipEventAttendance,
	ChampionshipEventGoal,
	ChampionshipEventMatch,
	ChampionshipEventMatchPlayer,
} from "../types/championship-event.ts";

export const EVENT_REALTIME_TABLE = {
	matches: "championship_event_matches",
	players: "championship_event_match_players",
	goals: "championship_event_goals",
	attendance: "championship_event_attendance",
} as const;

export const EVENT_REALTIME_CHANGE = {
	insert: "INSERT",
	update: "UPDATE",
	delete: "DELETE",
} as const;

export type EventRealtimeChange = {
	table: string;
	eventType: string;
	row: Record<string, unknown>;
};

function rowNumber(row: Record<string, unknown>, key: string): number | null {
	const value = row[key];
	if (typeof value !== "number") {
		return null;
	}

	return value;
}

function rowString(row: Record<string, unknown>, key: string): string | null {
	const value = row[key];
	if (typeof value !== "string") {
		return null;
	}

	return value;
}

function asMatchPlayerFromRow(
	row: Record<string, unknown>,
): ChampionshipEventMatchPlayer | null {
	const id = rowNumber(row, "id");
	const matchId = rowNumber(row, "match_id");
	const eventId = rowNumber(row, "event_id");
	const teamId = rowNumber(row, "team_id");
	const playerId = rowNumber(row, "player_id");
	const displayName = rowString(row, "display_name");
	if (
		id === null ||
		matchId === null ||
		eventId === null ||
		teamId === null ||
		playerId === null ||
		displayName === null
	) {
		return null;
	}

	return {
		id,
		match_id: matchId,
		event_id: eventId,
		team_id: teamId,
		player_id: playerId,
		display_name: displayName,
		is_goalkeeper: row.is_goalkeeper === true,
		slot: rowNumber(row, "slot"),
		is_substituted: row.is_substituted === true,
		include_stats: row.include_stats !== false,
	};
}

function asGoalFromRow(
	row: Record<string, unknown>,
): ChampionshipEventGoal | null {
	const id = rowNumber(row, "id");
	const matchId = rowNumber(row, "match_id");
	const eventId = rowNumber(row, "event_id");
	const scorerPlayerId = rowNumber(row, "scorer_player_id");
	if (
		id === null ||
		matchId === null ||
		eventId === null ||
		scorerPlayerId === null
	) {
		return null;
	}

	return {
		id,
		match_id: matchId,
		event_id: eventId,
		scorer_player_id: scorerPlayerId,
		assist_player_id: rowNumber(row, "assist_player_id"),
		is_own_goal: row.is_own_goal === true,
		elapsed_seconds: rowNumber(row, "elapsed_seconds"),
		created_at: rowString(row, "created_at") ?? "",
	};
}

function asMatchFromRow(
	row: Record<string, unknown>,
): ChampionshipEventMatch | null {
	const id = rowNumber(row, "id");
	const eventId = rowNumber(row, "event_id");
	const teamAId = rowNumber(row, "team_a_id");
	const teamBId = rowNumber(row, "team_b_id");
	if (id === null || eventId === null || teamAId === null || teamBId === null) {
		return null;
	}

	return {
		id,
		event_id: eventId,
		team_a_id: teamAId,
		team_b_id: teamBId,
		created_at: rowString(row, "created_at") ?? "",
		ended_at: rowString(row, "ended_at"),
		winner_team_id: rowNumber(row, "winner_team_id"),
		duration_seconds: rowNumber(row, "duration_seconds") ?? 420,
		started_at: rowString(row, "started_at"),
		paused_at: rowString(row, "paused_at"),
		pause_accumulated_seconds: rowNumber(row, "pause_accumulated_seconds") ?? 0,
		players: [],
		goals: [],
	};
}

function upsertById<T extends { id: number }>(
	rows: readonly T[],
	next: T,
): T[] {
	const without = rows.filter((row) => row.id !== next.id);
	return [...without, next];
}

function patchMatches(
	event: ChampionshipEvent,
	eventType: string,
	row: Record<string, unknown>,
): ChampionshipEvent {
	const id = rowNumber(row, "id");
	if (id === null) {
		return event;
	}

	if (eventType === EVENT_REALTIME_CHANGE.delete) {
		return {
			...event,
			matches: event.matches.filter((match) => match.id !== id),
		};
	}

	const incoming = asMatchFromRow(row);
	if (!incoming) {
		return event;
	}

	const current = event.matches.find((match) => match.id === id);
	if (!current) {
		return {
			...event,
			matches: [...event.matches, incoming],
		};
	}

	return {
		...event,
		matches: event.matches.map((match) => {
			if (match.id !== id) {
				return match;
			}

			return {
				...match,
				team_a_id: incoming.team_a_id,
				team_b_id: incoming.team_b_id,
				ended_at: incoming.ended_at,
				winner_team_id: incoming.winner_team_id,
				duration_seconds: incoming.duration_seconds,
				started_at: incoming.started_at,
				paused_at: incoming.paused_at,
				pause_accumulated_seconds: incoming.pause_accumulated_seconds,
			};
		}),
	};
}

function patchMatchPlayers(
	event: ChampionshipEvent,
	eventType: string,
	row: Record<string, unknown>,
): ChampionshipEvent {
	const matchId = rowNumber(row, "match_id");
	const id = rowNumber(row, "id");
	if (matchId === null || id === null) {
		return event;
	}

	return {
		...event,
		matches: event.matches.map((match) => {
			if (match.id !== matchId) {
				return match;
			}

			if (eventType === EVENT_REALTIME_CHANGE.delete) {
				return {
					...match,
					players: match.players.filter((player) => player.id !== id),
				};
			}

			const incoming = asMatchPlayerFromRow(row);
			if (!incoming) {
				return match;
			}

			return {
				...match,
				players: upsertById(match.players, incoming),
			};
		}),
	};
}

function patchGoals(
	event: ChampionshipEvent,
	eventType: string,
	row: Record<string, unknown>,
): ChampionshipEvent {
	const matchId = rowNumber(row, "match_id");
	const id = rowNumber(row, "id");
	if (matchId === null || id === null) {
		return event;
	}

	return {
		...event,
		matches: event.matches.map((match) => {
			if (match.id !== matchId) {
				return match;
			}

			if (eventType === EVENT_REALTIME_CHANGE.delete) {
				return {
					...match,
					goals: match.goals.filter((goal) => goal.id !== id),
				};
			}

			const incoming = asGoalFromRow(row);
			if (!incoming) {
				return match;
			}

			return {
				...match,
				goals: upsertById(match.goals, incoming),
			};
		}),
	};
}

function asAttendanceFromRow(
	row: Record<string, unknown>,
): ChampionshipEventAttendance | null {
	const id = rowNumber(row, "id");
	const eventId = rowNumber(row, "event_id");
	const playerId = rowNumber(row, "player_id");
	const displayName = rowString(row, "display_name");
	if (
		id === null ||
		eventId === null ||
		playerId === null ||
		displayName === null
	) {
		return null;
	}

	return {
		id,
		event_id: eventId,
		player_id: playerId,
		display_name: displayName,
		is_goalkeeper: row.is_goalkeeper === true,
		event_date: rowString(row, "event_date") ?? "",
		goals: rowNumber(row, "goals") ?? 0,
		assists: rowNumber(row, "assists") ?? 0,
		assisted_goals: rowNumber(row, "assisted_goals") ?? 0,
		own_goals: rowNumber(row, "own_goals") ?? 0,
		wins: rowNumber(row, "wins") ?? 0,
		losses: rowNumber(row, "losses") ?? 0,
		draws: rowNumber(row, "draws") ?? 0,
		matches: rowNumber(row, "matches") ?? 0,
		rating: rowNumber(row, "rating") ?? 0,
		rating_delta: rowNumber(row, "rating_delta") ?? 0,
		vote_rating_delta: rowNumber(row, "vote_rating_delta") ?? 0,
		is_mvp: row.is_mvp === true,
		mvp_overridden: row.mvp_overridden === true,
	};
}

function patchAttendance(
	event: ChampionshipEvent,
	eventType: string,
	row: Record<string, unknown>,
): ChampionshipEvent {
	const id = rowNumber(row, "id");
	if (id === null) {
		return event;
	}

	if (eventType === EVENT_REALTIME_CHANGE.delete) {
		return {
			...event,
			attendance: event.attendance.filter((item) => item.id !== id),
		};
	}

	const incoming = asAttendanceFromRow(row);
	if (!incoming) {
		return event;
	}

	return {
		...event,
		attendance: upsertById(event.attendance, incoming),
	};
}

export function patchChampionshipEventRealtime(
	event: ChampionshipEvent,
	table: string,
	eventType: string,
	row: Record<string, unknown>,
): ChampionshipEvent {
	switch (table) {
		case EVENT_REALTIME_TABLE.matches:
			return patchMatches(event, eventType, row);
		case EVENT_REALTIME_TABLE.players:
			return patchMatchPlayers(event, eventType, row);
		case EVENT_REALTIME_TABLE.goals:
			return patchGoals(event, eventType, row);
		case EVENT_REALTIME_TABLE.attendance:
			return patchAttendance(event, eventType, row);
		default:
			return event;
	}
}
