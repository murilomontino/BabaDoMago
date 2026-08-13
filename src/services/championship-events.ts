import {
	championshipEventErrorMessage,
	parsePlayersPerTeam,
} from "@/const/championship-event";
import {
	type EventTeamColor,
	isEventTeamColor,
} from "@/const/event-team-color";
import { supabase } from "@/lib/supabase";
import type {
	ChampionshipEvent,
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

	if (!isEventTeamColor(row.color)) {
		throw new Error("event team: invalid payload");
	}

	const nested = row.championship_event_team_players;
	const players = Array.isArray(nested) ? nested.map(asTeamPlayer) : [];

	return {
		id: row.id,
		event_id: Number(row.event_id),
		color: row.color,
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
		.order("starts_at", { ascending: false });

	if (error) {
		throw error;
	}

	return (data ?? []).map(asEvent);
}

export async function startChampionshipEvent(
	championshipId: number,
	eventDate: string,
	teams: readonly { color: EventTeamColor; playerIds: readonly number[] }[],
): Promise<void> {
	const { error } = await supabase.rpc("start_championship_event", {
		championship_id: championshipId,
		event_date: eventDate,
		teams: teams.map((team) => ({
			color: team.color,
			player_ids: team.playerIds,
		})),
	});

	if (error) {
		throwEventError(error);
	}
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
