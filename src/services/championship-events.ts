import {
	championshipEventErrorMessage,
	type EventAttendanceStatsDraft,
	type PlayerEventStatsDraft,
	parsePlayersPerTeam,
} from "@/const/championship-event";
import {
	EVENT_MATCH_DURATION,
	matchDurationSeconds,
} from "@/const/championship-event-match";
import {
	type EventTeamColor,
	isEventTeamColor,
	normalizeEventTeamColor,
} from "@/const/event-team-color";
import { supabase } from "@/lib/supabase";
import type {
	ChampionshipEvent,
	ChampionshipEventAttendance,
	ChampionshipEventGoal,
	ChampionshipEventMatch,
	ChampionshipEventMatchPlayer,
	ChampionshipEventRsvp,
	ChampionshipEventTeam,
	ChampionshipEventTeamPlayer,
} from "@/types/championship-event";

const EVENT_COLUMNS = `
	id,
	championship_id,
	starts_at,
	players_per_team,
	skip_guest_goalkeeper_matches,
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
			display_name,
			is_goalkeeper
		)
	),
	championship_event_attendance (
		id,
		event_id,
		player_id,
		display_name,
		is_goalkeeper,
		event_date,
		goals,
		assists,
		assisted_goals,
		own_goals,
		wins,
		losses,
		draws,
		matches,
		rating,
		rating_delta,
		is_mvp,
		mvp_overridden
	),
	championship_event_rsvp (
		id,
		event_id,
		player_id,
		status,
		updated_at
	),
	championship_event_matches (
		id,
		event_id,
		team_a_id,
		team_b_id,
		created_at,
		ended_at,
		winner_team_id,
		duration_seconds,
		started_at,
		paused_at,
		pause_accumulated_seconds,
		championship_event_match_players (
			id,
			match_id,
			event_id,
			team_id,
			player_id,
			display_name,
			is_goalkeeper,
			slot,
			is_substituted,
			include_stats
		),
		championship_event_goals (
			id,
			match_id,
			event_id,
			scorer_player_id,
			assist_player_id,
			is_own_goal,
			created_at
		)
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
		is_goalkeeper: row.is_goalkeeper === true,
		event_date: String(row.event_date ?? ""),
		goals: Number(row.goals ?? 0),
		assists: Number(row.assists ?? 0),
		assisted_goals: Number(row.assisted_goals ?? 0),
		own_goals: Number(row.own_goals ?? 0),
		wins: Number(row.wins ?? 0),
		losses: Number(row.losses ?? 0),
		draws: Number(row.draws ?? 0),
		matches: Number(row.matches ?? 0),
		rating: Number(row.rating ?? 0),
		rating_delta: Number(row.rating_delta ?? 0),
		is_mvp: row.is_mvp === true,
		mvp_overridden: row.mvp_overridden === true,
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
		is_goalkeeper: row.is_goalkeeper === true,
	};
}

function asTeam(value: unknown): ChampionshipEventTeam {
	if (!value || typeof value !== "object") {
		throw new Error("event team: invalid payload");
	}

	const row = value as Record<string, unknown>;
	if (typeof row.id !== "number") {
		throw new Error("event team: invalid payload");
	}

	if (row.color !== null && typeof row.color !== "string") {
		throw new Error("event team: invalid payload");
	}

	const color = normalizeEventTeamColor(
		typeof row.color === "string" ? row.color : null,
	);
	if (color !== null && !isEventTeamColor(color)) {
		throw new Error("event team: invalid payload");
	}

	const nested = row.championship_event_team_players;
	const players = Array.isArray(nested) ? nested.map(asTeamPlayer) : [];
	const teamColor = color !== null && isEventTeamColor(color) ? color : null;

	return {
		id: row.id,
		event_id: Number(row.event_id),
		color: teamColor,
		sort_order: Number(row.sort_order),
		players: [...players].sort((a, b) => {
			if (a.is_goalkeeper !== b.is_goalkeeper) {
				if (a.is_goalkeeper) {
					return -1;
				}

				return 1;
			}

			return a.id - b.id;
		}),
	};
}

function asMatchPlayer(value: unknown): ChampionshipEventMatchPlayer {
	if (!value || typeof value !== "object") {
		throw new Error("event match player: invalid payload");
	}

	const row = value as Record<string, unknown>;
	if (typeof row.id !== "number" || typeof row.display_name !== "string") {
		throw new Error("event match player: invalid payload");
	}

	return {
		id: row.id,
		match_id: Number(row.match_id),
		event_id: Number(row.event_id),
		team_id: Number(row.team_id),
		player_id: Number(row.player_id),
		display_name: row.display_name,
		is_goalkeeper: row.is_goalkeeper === true,
		slot: typeof row.slot === "number" ? row.slot : null,
		is_substituted: row.is_substituted === true,
		include_stats: row.include_stats !== false,
	};
}

function asGoal(value: unknown): ChampionshipEventGoal {
	if (!value || typeof value !== "object") {
		throw new Error("event goal: invalid payload");
	}

	const row = value as Record<string, unknown>;
	if (typeof row.id !== "number") {
		throw new Error("event goal: invalid payload");
	}

	return {
		id: row.id,
		match_id: Number(row.match_id),
		event_id: Number(row.event_id),
		scorer_player_id: Number(row.scorer_player_id),
		assist_player_id:
			typeof row.assist_player_id === "number" ? row.assist_player_id : null,
		is_own_goal: row.is_own_goal === true,
		created_at: String(row.created_at),
	};
}

function asRsvp(value: unknown): ChampionshipEventRsvp {
	if (!value || typeof value !== "object") {
		throw new Error("event rsvp: invalid payload");
	}

	const row = value as Record<string, unknown>;
	if (typeof row.id !== "number" || typeof row.status !== "string") {
		throw new Error("event rsvp: invalid payload");
	}

	return {
		id: row.id,
		event_id: Number(row.event_id),
		player_id: Number(row.player_id),
		status: row.status,
		updated_at: String(row.updated_at),
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

	const players = Array.isArray(row.championship_event_match_players)
		? row.championship_event_match_players.map(asMatchPlayer)
		: [];
	const goals = Array.isArray(row.championship_event_goals)
		? row.championship_event_goals.map(asGoal)
		: [];

	return {
		id: row.id,
		event_id: Number(row.event_id),
		team_a_id: Number(row.team_a_id),
		team_b_id: Number(row.team_b_id),
		created_at: String(row.created_at),
		ended_at: typeof row.ended_at === "string" ? row.ended_at : null,
		winner_team_id:
			typeof row.winner_team_id === "number" ? row.winner_team_id : null,
		duration_seconds: Number(row.duration_seconds ?? 420),
		started_at: typeof row.started_at === "string" ? row.started_at : null,
		paused_at: typeof row.paused_at === "string" ? row.paused_at : null,
		pause_accumulated_seconds: Number(row.pause_accumulated_seconds ?? 0),
		players: [...players].sort((left, right) => {
			if (left.team_id !== right.team_id) {
				return left.team_id - right.team_id;
			}

			if (left.is_substituted !== right.is_substituted) {
				return left.is_substituted ? 1 : -1;
			}

			return (left.slot ?? 11) - (right.slot ?? 11);
		}),
		goals: [...goals].sort((left, right) =>
			left.created_at.localeCompare(right.created_at),
		),
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
	const rsvps = Array.isArray(row.championship_event_rsvp)
		? row.championship_event_rsvp.map(asRsvp)
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
		skip_guest_goalkeeper_matches: row.skip_guest_goalkeeper_matches !== false,
		ended_at: typeof row.ended_at === "string" ? row.ended_at : null,
		attendance: [...attendance].sort((a, b) => a.id - b.id),
		rsvps: [...rsvps].sort((a, b) => a.player_id - b.player_id),
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
		.order("starts_at", { ascending: false })
		.order("id", { ascending: false });

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

function eventIdFromRpc(data: unknown): number {
	if (!data || typeof data !== "object") {
		throw new Error("event: invalid payload");
	}

	const id = (data as { id: unknown }).id;
	if (typeof id !== "number") {
		throw new Error("event: invalid payload");
	}

	return id;
}

export async function createChampionshipEvent(
	championshipId: number,
	eventDate: string,
	eventTime: string,
): Promise<number> {
	const { data, error } = await supabase.rpc("create_championship_event", {
		championship_id: championshipId,
		event_date: eventDate,
		event_time: eventTime,
	});

	if (error) {
		throwEventError(error);
	}

	return eventIdFromRpc(data);
}

export async function saveChampionshipEventTeams(
	eventId: number,
	presentPlayerIds: readonly number[],
	teams: readonly {
		color: EventTeamColor | null;
		playerIds: readonly number[];
		goalkeeperId: number;
	}[],
	goalkeeperPlayerIds: readonly number[] = [],
): Promise<void> {
	const { error } = await supabase.rpc("save_championship_event_teams", {
		event_id: eventId,
		present_player_ids: [...presentPlayerIds],
		teams: teams.map((team) => ({
			color: normalizeEventTeamColor(team.color),
			player_ids: [...team.playerIds],
			goalkeeper_id: team.goalkeeperId,
		})),
		goalkeeper_player_ids: [...goalkeeperPlayerIds],
	});

	if (error) {
		throwEventError(error);
	}
}

export async function saveChampionshipEventAttendance(
	eventId: number,
	presentPlayerIds: readonly number[],
	goalkeeperPlayerIds: readonly number[] = [],
): Promise<void> {
	const { error } = await supabase.rpc("save_championship_event_attendance", {
		event_id: eventId,
		present_player_ids: [...presentPlayerIds],
		goalkeeper_player_ids: [...goalkeeperPlayerIds],
	});

	if (error) {
		throwEventError(error);
	}
}

export async function ensureChampionshipEventAttendancePlayer(
	eventId: number,
	playerId: number,
): Promise<void> {
	const { error } = await supabase.rpc(
		"ensure_championship_event_attendance_player",
		{
			event_id: eventId,
			player_id: playerId,
		},
	);

	if (error) {
		throwEventError(error);
	}
}

export async function upsertChampionshipEventRsvp(
	eventId: number,
	status: string,
): Promise<void> {
	const { error } = await supabase.rpc("upsert_championship_event_rsvp", {
		p_event_id: eventId,
		p_status: status,
	});

	if (error) {
		throwEventError(error);
	}
}

export async function promoteChampionshipEventRsvpGoing(
	eventId: number,
): Promise<void> {
	const { error } = await supabase.rpc(
		"promote_championship_event_rsvp_going",
		{
			event_id: eventId,
		},
	);

	if (error) {
		throwEventError(error);
	}
}

export async function saveChampionshipEventAttendanceStats(
	eventId: number,
	stats: readonly EventAttendanceStatsDraft[],
): Promise<void> {
	const { error } = await supabase.rpc(
		"save_championship_event_attendance_stats",
		{
			event_id: eventId,
			stats: [...stats],
		},
	);

	if (error) {
		throwEventError(error);
	}
}

export async function saveChampionshipPlayerEventStats(
	playerId: number,
	eventId: number,
	stats: PlayerEventStatsDraft,
): Promise<void> {
	const { error } = await supabase.rpc("save_championship_player_event_stats", {
		player_id: playerId,
		event_id: eventId,
		goals: stats.goals,
		assists: stats.assists,
		wins: stats.wins,
		losses: stats.losses,
		draws: stats.draws,
		matches: stats.matches,
	});

	if (error) {
		throwEventError(error);
	}
}

export async function addChampionshipEventTeam(
	eventId: number,
	team: {
		color: EventTeamColor | null;
		playerIds: readonly number[];
		goalkeeperId: number;
	},
): Promise<void> {
	const { error } = await supabase.rpc("add_championship_event_team", {
		event_id: eventId,
		team_color: normalizeEventTeamColor(team.color),
		player_ids: [...team.playerIds],
		goalkeeper_id: team.goalkeeperId,
	});

	if (error) {
		throwEventError(error);
	}
}

export async function updateChampionshipEventTeam(
	teamId: number,
	team: {
		color: EventTeamColor | null;
		playerIds: readonly number[];
		goalkeeperId: number;
	},
): Promise<void> {
	const { error } = await supabase.rpc("update_championship_event_team", {
		team_id: teamId,
		team_color: normalizeEventTeamColor(team.color),
		player_ids: [...team.playerIds],
		goalkeeper_id: team.goalkeeperId,
	});

	if (error) {
		throwEventError(error);
	}
}

export async function deleteChampionshipEventTeam(
	teamId: number,
): Promise<void> {
	const { error } = await supabase.rpc("delete_championship_event_team", {
		team_id: teamId,
	});

	if (error) {
		throwEventError(error);
	}
}

export async function startChampionshipEventMatch(
	eventId: number,
	teamAId: number,
	teamBId: number,
): Promise<void> {
	const { error } = await supabase.rpc("start_championship_event_match", {
		event_id: eventId,
		team_a_id: teamAId,
		team_b_id: teamBId,
		duration_seconds: matchDurationSeconds(EVENT_MATCH_DURATION.defaultMinutes),
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
	await startChampionshipEventMatch(eventId, teamAId, teamBId);
}

export async function startChampionshipEventClock(
	matchId: number,
): Promise<void> {
	const { error } = await supabase.rpc("start_championship_event_clock", {
		match_id: matchId,
	});

	if (error) {
		throwEventError(error);
	}
}

export async function pauseChampionshipEventMatch(
	matchId: number,
): Promise<void> {
	const { error } = await supabase.rpc("pause_championship_event_match", {
		match_id: matchId,
	});

	if (error) {
		throwEventError(error);
	}
}

export async function resumeChampionshipEventMatch(
	matchId: number,
): Promise<void> {
	const { error } = await supabase.rpc("resume_championship_event_match", {
		match_id: matchId,
	});

	if (error) {
		throwEventError(error);
	}
}

export async function setChampionshipEventMatchPlayer(
	matchId: number,
	teamId: number,
	slot: number,
	playerId: number | null,
	includeStats = false,
): Promise<void> {
	const { error } = await supabase.rpc("set_championship_event_match_player", {
		match_id: matchId,
		team_id: teamId,
		slot,
		player_id: playerId,
		include_stats: includeStats,
	});

	if (error) {
		throwEventError(error);
	}
}

export async function setChampionshipEventMatchGoalkeeper(
	matchId: number,
	teamId: number,
	playerId: number,
): Promise<void> {
	const { error } = await supabase.rpc(
		"set_championship_event_match_goalkeeper",
		{
			match_id: matchId,
			team_id: teamId,
			player_id: playerId,
		},
	);

	if (error) {
		throwEventError(error);
	}
}

export async function addChampionshipEventGoal(
	matchId: number,
	scorerPlayerId: number,
	assistPlayerId: number | null,
	isOwnGoal: boolean,
): Promise<void> {
	const { error } = await supabase.rpc("add_championship_event_goal", {
		match_id: matchId,
		scorer_player_id: scorerPlayerId,
		assist_player_id: assistPlayerId,
		is_own_goal: isOwnGoal,
	});

	if (error) {
		throwEventError(error);
	}
}

export async function undoChampionshipEventGoal(
	matchId: number,
	goalId: number,
): Promise<void> {
	const { error } = await supabase.rpc("undo_championship_event_goal", {
		match_id: matchId,
		goal_id: goalId,
	});

	if (error) {
		throwEventError(error);
	}
}

export async function endChampionshipEventMatch(
	matchId: number,
): Promise<void> {
	const { error } = await supabase.rpc("end_championship_event_match", {
		match_id: matchId,
	});

	if (error) {
		throwEventError(error);
	}
}

export async function reopenChampionshipEventMatch(
	matchId: number,
): Promise<void> {
	const { error } = await supabase.rpc("reopen_championship_event_match", {
		match_id: matchId,
	});

	if (error) {
		throwEventError(error);
	}
}

export async function deleteChampionshipEventMatch(
	matchId: number,
): Promise<void> {
	const { error } = await supabase.rpc("delete_championship_event_match", {
		match_id: matchId,
	});

	if (error) {
		throwEventError(error);
	}
}

export async function endChampionshipEvent(
	eventId: number,
	presentPlayerIds: readonly number[] | null = null,
	mvpPlayerIds: readonly number[] | null = null,
): Promise<void> {
	const { error } = await supabase.rpc("end_championship_event", {
		event_id: eventId,
		present_player_ids: presentPlayerIds ? [...presentPlayerIds] : null,
		mvp_player_ids: mvpPlayerIds == null ? null : [...mvpPlayerIds],
	});

	if (error) {
		throwEventError(error);
	}
}

export async function setChampionshipEventMvps(
	eventId: number,
	playerIds: readonly number[],
): Promise<void> {
	const { error } = await supabase.rpc("set_championship_event_mvps", {
		event_id: eventId,
		player_ids: [...playerIds],
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
