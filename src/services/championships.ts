import {
	championshipEventErrorMessage,
	parseEventTime,
	parsePlayersPerTeam,
} from "@/const/championship-event";
import {
	assertChampionshipLogoFile,
	CHAMPIONSHIP_LOGO,
	championshipLogoObjectPath,
} from "@/const/championship-logo";
import {
	CHAMPIONSHIP_QUOTA,
	championshipQuotaErrorMessage,
} from "@/const/championship-quota";
import { CHAMPIONSHIP_ROLE } from "@/const/championship-role";
import { PLAYER_RATING } from "@/const/player-rating";
import { rosterSafeCount } from "@/const/roster-stats";
import { supabase } from "@/lib/supabase";
import type {
	Championship,
	ChampionshipPlayer,
	ChampionshipWithPlayers,
} from "@/types/championship";

const PLAYER_COLUMNS =
	"id, championship_id, user_id, display_name, nickname, avatar_url, rating, role, deleted_at, goals, assists, own_goals, wins, matches" as const;

const CHAMPIONSHIP_COLUMNS =
	"id, name, invite_code, created_by, logo_path, event_time, players_per_team, is_visible" as const;

function asChampionship(value: unknown): Championship {
	if (!value || typeof value !== "object") {
		throw new Error("championship: invalid payload");
	}

	const row = value as Record<string, unknown>;
	if (typeof row.id !== "number" || typeof row.name !== "string") {
		throw new Error("championship: invalid payload");
	}

	return {
		id: row.id,
		name: row.name,
		invite_code: String(row.invite_code),
		created_by: String(row.created_by),
		logo_path: typeof row.logo_path === "string" ? row.logo_path : null,
		event_time: parseEventTime(row.event_time),
		players_per_team: parsePlayersPerTeam(row.players_per_team),
		is_visible: row.is_visible !== false,
	};
}

function asPlayer(value: unknown): ChampionshipPlayer {
	if (!value || typeof value !== "object") {
		throw new Error("player: invalid payload");
	}

	const row = value as Record<string, unknown>;
	if (typeof row.id !== "number" || typeof row.display_name !== "string") {
		throw new Error("player: invalid payload");
	}

	const rating = Number(row.rating);
	if (
		!Number.isFinite(rating) ||
		rating < PLAYER_RATING.min ||
		rating > PLAYER_RATING.max
	) {
		throw new Error("player: invalid payload");
	}

	return {
		id: row.id,
		championship_id: Number(row.championship_id),
		user_id: typeof row.user_id === "string" ? row.user_id : null,
		display_name: row.display_name,
		nickname: typeof row.nickname === "string" ? row.nickname : null,
		avatar_url: typeof row.avatar_url === "string" ? row.avatar_url : null,
		rating,
		role: typeof row.role === "string" ? row.role : CHAMPIONSHIP_ROLE.member,
		deleted_at: typeof row.deleted_at === "string" ? row.deleted_at : null,
		goals: rosterSafeCount(row.goals),
		assists: rosterSafeCount(row.assists),
		own_goals: rosterSafeCount(row.own_goals),
		wins: rosterSafeCount(row.wins),
		matches: rosterSafeCount(row.matches),
	};
}

function throwChampionshipWriteError(error: { message: string }): never {
	if (error.message.includes(CHAMPIONSHIP_QUOTA.exceededCode)) {
		throw new Error(championshipQuotaErrorMessage());
	}

	throw error;
}

export async function listChampionships(
	userId: string,
): Promise<Championship[]> {
	const { data, error } = await supabase
		.from("championships")
		.select(CHAMPIONSHIP_COLUMNS)
		.is("deleted_at", null)
		.or(`is_visible.eq.true,created_by.eq.${userId}`)
		.order("id", { ascending: false });

	if (error) {
		throw error;
	}

	return (data ?? []).map(asChampionship);
}

export async function getChampionshipById(
	championshipId: number,
): Promise<ChampionshipWithPlayers> {
	const { data: championship, error: championshipError } = await supabase
		.from("championships")
		.select(CHAMPIONSHIP_COLUMNS)
		.eq("id", championshipId)
		.is("deleted_at", null)
		.single();

	if (championshipError) {
		throw championshipError;
	}

	const { data: players, error: playersError } = await supabase
		.from("championship_players")
		.select(PLAYER_COLUMNS)
		.eq("championship_id", championshipId)
		.order("id", { ascending: true });

	if (playersError) {
		throw playersError;
	}

	return {
		...asChampionship(championship),
		players: (players ?? []).map(asPlayer),
	};
}

export async function getChampionshipByInvite(
	inviteCode: string,
): Promise<ChampionshipWithPlayers> {
	const { data, error } = await supabase.rpc("get_championship_by_invite", {
		invite_code: inviteCode,
	});

	if (error) {
		throw error;
	}

	const payload = data as ChampionshipWithPlayers | null;
	if (!payload) {
		throw new Error("championship not found");
	}

	return {
		...asChampionship(payload),
		players: (payload.players ?? []).map(asPlayer),
	};
}

export async function createChampionship(
	name: string,
	userId: string,
	displayName: string,
	avatarUrl: string | null,
): Promise<Championship> {
	const { data, error } = await supabase
		.from("championships")
		.insert({ name })
		.select(CHAMPIONSHIP_COLUMNS)
		.single();

	if (error) {
		throwChampionshipWriteError(error);
	}

	const championship = asChampionship(data);

	const { error: playerError } = await supabase
		.from("championship_players")
		.insert({
			championship_id: championship.id,
			user_id: userId,
			display_name: displayName,
			avatar_url: avatarUrl,
		});

	if (playerError) {
		throw playerError;
	}

	return championship;
}

export async function addManualPlayers(
	championshipId: number,
	displayNames: string[],
	rating: number = PLAYER_RATING.default,
): Promise<ChampionshipPlayer[]> {
	if (displayNames.length === 0) {
		return [];
	}

	const { data, error } = await supabase
		.from("championship_players")
		.insert(
			displayNames.map((displayName) => ({
				championship_id: championshipId,
				display_name: displayName,
				rating,
			})),
		)
		.select(PLAYER_COLUMNS);

	if (error) {
		throw error;
	}

	return (data ?? []).map(asPlayer);
}

export async function addManualPlayer(
	championshipId: number,
	displayName: string,
	rating: number = PLAYER_RATING.default,
): Promise<ChampionshipPlayer> {
	const [player] = await addManualPlayers(
		championshipId,
		[displayName],
		rating,
	);
	if (!player) {
		throw new Error("player: invalid payload");
	}

	return player;
}

export async function joinChampionship(
	inviteCode: string,
): Promise<ChampionshipPlayer> {
	const { data, error } = await supabase.rpc("join_championship", {
		invite_code: inviteCode,
	});

	if (error) {
		throw error;
	}

	return asPlayer(data);
}

export async function claimPlayer(
	playerId: number,
): Promise<ChampionshipPlayer> {
	const { data, error } = await supabase.rpc("claim_player", {
		player_id: playerId,
	});

	if (error) {
		throw error;
	}

	return asPlayer(data);
}

export async function updatePlayerRating(
	playerId: number,
	rating: number,
): Promise<ChampionshipPlayer> {
	const { data, error } = await supabase.rpc("update_player_rating", {
		player_id: playerId,
		rating,
	});

	if (error) {
		throw error;
	}

	return asPlayer(data);
}

export async function updatePlayerNickname(
	playerId: number,
	nickname: string,
): Promise<ChampionshipPlayer> {
	const { data, error } = await supabase.rpc("update_player_nickname", {
		player_id: playerId,
		nickname,
	});

	if (error) {
		throw error;
	}

	return asPlayer(data);
}

export async function renameChampionship(
	championshipId: number,
	name: string,
): Promise<Championship> {
	const { data, error } = await supabase.rpc("update_championship_name", {
		championship_id: championshipId,
		name,
	});

	if (error) {
		throw error;
	}

	return asChampionship(data);
}

export async function updateChampionshipEventConfig(
	championshipId: number,
	eventTime: string,
	playersPerTeam: number,
): Promise<Championship> {
	const { data, error } = await supabase.rpc(
		"update_championship_event_config",
		{
			championship_id: championshipId,
			event_time: eventTime,
			players_per_team: playersPerTeam,
		},
	);

	if (error) {
		throw new Error(championshipEventErrorMessage(error.message));
	}

	return asChampionship(data);
}

export async function updateChampionshipVisibility(
	championshipId: number,
	isVisible: boolean,
): Promise<Championship> {
	const { data, error } = await supabase.rpc("update_championship_visibility", {
		championship_id: championshipId,
		is_visible: isVisible,
	});

	if (error) {
		throw error;
	}

	return asChampionship(data);
}

export async function setPlayerRole(
	playerId: number,
	role: string,
): Promise<ChampionshipPlayer> {
	const { data, error } = await supabase.rpc("set_player_role", {
		player_id: playerId,
		role,
	});

	if (error) {
		throw error;
	}

	return asPlayer(data);
}

export async function transferChampionshipOwner(
	playerId: number,
): Promise<Championship> {
	const { data, error } = await supabase.rpc("transfer_championship_owner", {
		player_id: playerId,
	});

	if (error) {
		throwChampionshipWriteError(error);
	}

	return asChampionship(data);
}

export async function unlinkPlayer(
	playerId: number,
): Promise<ChampionshipPlayer> {
	const { data, error } = await supabase.rpc("unlink_player", {
		player_id: playerId,
	});

	if (error) {
		throw error;
	}

	return asPlayer(data);
}

export async function deactivatePlayer(playerId: number): Promise<void> {
	const { error } = await supabase.rpc("deactivate_player", {
		player_id: playerId,
	});

	if (error) {
		throw error;
	}
}

export async function reactivatePlayer(
	playerId: number,
): Promise<ChampionshipPlayer> {
	const { data, error } = await supabase.rpc("reactivate_player", {
		player_id: playerId,
	});

	if (error) {
		throw error;
	}

	return asPlayer(data);
}

export async function deleteChampionship(
	championshipId: number,
): Promise<void> {
	const { error } = await supabase.rpc("soft_delete_championship", {
		championship_id: championshipId,
	});

	if (error) {
		throw error;
	}
}

export function championshipLogoPublicUrl(path: string): string {
	const { data } = supabase.storage
		.from(CHAMPIONSHIP_LOGO.bucket)
		.getPublicUrl(path);

	return data.publicUrl;
}

export async function uploadChampionshipLogo(
	championshipId: number,
	file: File,
	previousPath: string | null,
): Promise<string> {
	assertChampionshipLogoFile(file);

	const path = championshipLogoObjectPath(championshipId, file.type);
	if (!path) {
		throw new Error("Use PNG ou JPEG");
	}

	const { error: uploadError } = await supabase.storage
		.from(CHAMPIONSHIP_LOGO.bucket)
		.upload(path, file, {
			upsert: true,
			contentType: file.type,
		});

	if (uploadError) {
		throw uploadError;
	}

	if (previousPath && previousPath !== path) {
		await supabase.storage
			.from(CHAMPIONSHIP_LOGO.bucket)
			.remove([previousPath]);
	}

	const { error: updateError } = await supabase
		.from("championships")
		.update({ logo_path: path })
		.eq("id", championshipId);

	if (updateError) {
		throw updateError;
	}

	return path;
}
