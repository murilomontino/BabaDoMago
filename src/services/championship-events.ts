import {
	championshipEventErrorMessage,
	parsePlayersPerTeam,
} from "@/const/championship-event";
import {
	type EventTeamColor,
	isEventTeamColor,
	normalizeEventTeamColor,
} from "@/const/event-team-color";
import { supabase } from "@/lib/supabase";
import type {
	ChampionshipEvent,
	ChampionshipEventAttendance,
	ChampionshipEventMatch,
	ChampionshipEventTeam,
	ChampionshipEventTeamPlayer,
} from "@/types/championship-event";

const EVENT_COLUMNS = `
	id,
	championship_id,
	starts_at,
	players_per_team,
	ended_at,
	championship_event_teams (
		id,
		event_id,
		color,
		sort_order,
		championship_event_team_players (
			id,
			event_id,
			team_id,
			player_id,
			display_name
		)
	),
	championship_event_attendance (
		id,
		event_id,
		player_id,
		display_name
	),
	championship_event_matches (
		id,
		event_id,
		team_a_id,
		team_b_id,
		created_at
	)
` as const;

function throwEventError(error: { message: string }): never {
	throw new Error(championshipEventErrorMessage(error.message));
}

function asAttendance(value: unknown): ChampionshipEventAttendance {
	if (!value || typeof value !== "object") {
		throw new Error("event attendance: invalid payload");
	}

	const row = value as Record<string, unknown>;
	if (typeof row.id !== "number" || typeof row.display_name !== "string") {
		throw new Error("event attendance: invalid payload");
	}

	return {
		id: row.id,
		event_id: Number(row.event_id),
		player_id: Number(row.player_id),
		display_name: row.display_name,
	};
}

function asTeamPlayer(value: unknown): ChampionshipEventTeamPlayer {
	if (!value || typeof value !== "object") {
		throw new Error("event player: invalid payload");
	}

	const row = value as Record<string, unknown>;
	if (typeof row.id !== "number" || typeof row.display_name !== "string") {
		throw new Error("event player: invalid payload");
	}

	return {
		id: row.id,
		event_id: Number(row.event_id),
		team_id: Number(row.team_id),
		player_id: Number(row.player_id),
		display_name: row.display_name,
	};
}

function asTeam(value: unknown): ChampionshipEventTeam {
	if (!value || typeof value !== "object") {
		throw new Error("event team: invalid payload");
	}

	const row = value as Record<string, unknown>;
	if (typeof row.id !== "number" || typeof row.color !== "string") {
		throw new Error("event team: invalid payload");
	}

	const color = normalizeEventTeamColor(row.color);
	if (!isEventTeamColor(color)) {
		throw new Error("event team: invalid payload");
	}

	const nested = row.championship_event_team_players;
	const players = Array.isArray(nested) ? nested.map(asTeamPlayer) : [];

	return {
		id: row.id,
		event_id: Number(row.event_id),
		color,
		sort_order: Number(row.sort_order),
		players: [...players].sort((a, b) => a.id - b.id),
	};
}

function asMatch(value: unknown): ChampionshipEventMatch {
	if (!value || typeof value !== "object") {
		throw new Error("event match: invalid payload");
	}

	const row = value as Record<string, unknown>;
	if (typeof row.id !== "number") {
		throw new Error("event match: invalid payload");
	}

	return {
		id: row.id,
		event_id: Number(row.event_id),
		team_a_id: Number(row.team_a_id),
		team_b_id: Number(row.team_b_id),
		created_at: String(row.created_at),
	};
}

function asEvent(value: unknown): ChampionshipEvent {
	if (!value || typeof value !== "object") {
		throw new Error("event: invalid payload");
	}

	const row = value as Record<string, unknown>;
	if (typeof row.id !== "number" || typeof row.starts_at !== "string") {
		throw new Error("event: invalid payload");
	}

	const attendance = Array.isArray(row.championship_event_attendance)
		? row.championship_event_attendance.map(asAttendance)
		: [];
	const teams = Array.isArray(row.championship_event_teams)
		? row.championship_event_teams.map(asTeam)
		: [];
	const matches = Array.isArray(row.championship_event_matches)
		? row.championship_event_matches.map(asMatch)
		: [];

	return {
		id: row.id,
		championship_id: Number(row.championship_id),
		starts_at: row.starts_at,
		players_per_team: parsePlayersPerTeam(row.players_per_team),
		ended_at: typeof row.ended_at === "string" ? row.ended_at : null,
		attendance: [...attendance].sort((a, b) => a.id - b.id),
		teams: [...teams].sort((a, b) => a.sort_order - b.sort_order),
		matches: [...matches].sort((a, b) =>
			a.created_at.localeCompare(b.created_at),
		),
	};
}

export async function listChampionshipEvents(
	championshipId: number,
): Promise<ChampionshipEvent[]> {
	const { data, error } = await supabase
		.from("championship_events")
		.select(EVENT_COLUMNS)
		.eq("championship_id", championshipId)
		.is("deleted_at", null)
		.order("starts_at", { ascending: false });

	if (error) {
		throw error;
	}

	return (data ?? []).map(asEvent);
}

export async function getChampionshipEventById(
	championshipId: number,
	eventId: number,
): Promise<ChampionshipEvent> {
	const { data, error } = await supabase
		.from("championship_events")
		.select(EVENT_COLUMNS)
		.eq("id", eventId)
		.eq("championship_id", championshipId)
		.is("deleted_at", null)
		.maybeSingle();

	if (error) {
		throw error;
	}

	if (!data) {
		throw new Error("event not found");
	}

	return asEvent(data);
}

export async function startChampionshipEvent(
	championshipId: number,
	eventDate: string,
	presentPlayerIds: readonly number[],
	teams: readonly { color: EventTeamColor; playerIds: readonly number[] }[],
): Promise<number> {
	const { data, error } = await supabase.rpc("start_championship_event", {
		championship_id: championshipId,
		event_date: eventDate,
		present_player_ids: [...presentPlayerIds],
		teams: teams.map((team) => ({
			color: normalizeEventTeamColor(team.color),
			player_ids: [...team.playerIds],
		})),
	});

	if (error) {
		throwEventError(error);
	}

	if (!data || typeof data !== "object") {
		throw new Error("event: invalid payload");
	}

	const id = (data as { id: unknown }).id;
	if (typeof id !== "number") {
		throw new Error("event: invalid payload");
	}

	return id;
}

export async function addChampionshipEventMatch(
	eventId: number,
	teamAId: number,
	teamBId: number,
): Promise<void> {
	const { error } = await supabase.rpc("add_championship_event_match", {
		event_id: eventId,
		team_a_id: teamAId,
		team_b_id: teamBId,
	});

	if (error) {
		throwEventError(error);
	}
}

export async function endChampionshipEvent(eventId: number): Promise<void> {
	const { error } = await supabase.rpc("end_championship_event", {
		event_id: eventId,
	});

	if (error) {
		throwEventError(error);
	}
}

export async function deleteChampionshipEvent(eventId: number): Promise<void> {
	const { error } = await supabase.rpc("soft_delete_championship_event", {
		event_id: eventId,
	});

	if (error) {
		throwEventError(error);
	}
}
