import {
	championshipEventErrorMessage,
	parseChampionshipLocation,
	parseEventTime,
	parseEventWeekday,
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
import { normalizeNicknameTags } from "@/const/player-name";
import { PLAYER_RATING } from "@/const/player-rating";
import { rosterSafeCount } from "@/const/roster-stats";
import { supabase } from "@/lib/supabase";
import { optionalString } from "@/lib/unknown-value";
import type {
	Championship,
	ChampionshipPlayer,
	ChampionshipWithPlayers,
} from "@/types/championship";

const PLAYER_COLUMNS =
	"id, championship_id, user_id, display_name, nickname, nickname_tags, avatar_url, rating, role, is_goalkeeper, deleted_at, goals, assists, assisted_goals, own_goals, wins, losses, draws, matches, mvps" as const;

const CHAMPIONSHIP_COLUMNS =
	"id, name, invite_code, created_by, logo_path, event_time, event_weekday, location, players_per_team, skip_guest_goalkeeper_matches, is_visible" as const;

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
		logo_path: optionalString(row.logo_path),
		event_time: parseEventTime(row.event_time),
		event_weekday: parseEventWeekday(row.event_weekday),
		location: parseChampionshipLocation(row.location),
		players_per_team: parsePlayersPerTeam(row.players_per_team),
		skip_guest_goalkeeper_matches: row.skip_guest_goalkeeper_matches !== false,
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
		user_id: optionalString(row.user_id),
		display_name: row.display_name,
		nickname: optionalString(row.nickname),
		nickname_tags: normalizeNicknameTags(
			Array.isArray(row.nickname_tags)
				? row.nickname_tags.filter(
						(item): item is string => typeof item === "string",
					)
				: [],
		),
		avatar_url: optionalString(row.avatar_url),
		rating,
		role: optionalString(row.role) ?? CHAMPIONSHIP_ROLE.member,
		is_goalkeeper: row.is_goalkeeper === true,
		deleted_at: optionalString(row.deleted_at),
		goals: rosterSafeCount(row.goals),
		assists: rosterSafeCount(row.assists),
		assisted_goals: rosterSafeCount(row.assisted_goals),
		own_goals: rosterSafeCount(row.own_goals),
		wins: rosterSafeCount(row.wins),
		losses: rosterSafeCount(row.losses),
		draws: rosterSafeCount(row.draws),
		matches: rosterSafeCount(row.matches),
		mvps: rosterSafeCount(row.mvps),
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
		.is("removed_at", null)
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
	isGoalkeeper = false,
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
				is_goalkeeper: isGoalkeeper,
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
	isGoalkeeper = false,
): Promise<ChampionshipPlayer> {
	const [player] = await addManualPlayers(
		championshipId,
		[displayName],
		rating,
		isGoalkeeper,
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
	nicknameTags: string[],
): Promise<ChampionshipPlayer> {
	const { data, error } = await supabase.rpc("update_player_nickname", {
		player_id: playerId,
		nickname,
		nickname_tags: normalizeNicknameTags(nicknameTags),
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
	skipGuestGoalkeeperMatches: boolean,
	eventWeekday: number | null,
	location: string | null,
): Promise<Championship> {
	const { data, error } = await supabase.rpc(
		"update_championship_event_config",
		{
			championship_id: championshipId,
			event_time: eventTime,
			players_per_team: playersPerTeam,
			skip_guest_goalkeeper_matches: skipGuestGoalkeeperMatches,
			event_weekday: eventWeekday,
			location,
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

export async function setPlayerIsGoalkeeper(
	playerId: number,
	isGoalkeeper: boolean,
): Promise<ChampionshipPlayer> {
	const { data, error } = await supabase.rpc("set_player_is_goalkeeper", {
		player_id: playerId,
		is_goalkeeper: isGoalkeeper,
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

export async function mergeChampionshipPlayers(
	keepPlayerId: number,
	absorbPlayerId: number,
): Promise<ChampionshipPlayer> {
	const { data, error } = await supabase.rpc("merge_championship_players", {
		keep_player_id: keepPlayerId,
		absorb_player_id: absorbPlayerId,
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

export async function removePlayer(playerId: number): Promise<void> {
	const { error } = await supabase.rpc("remove_player", {
		player_id: playerId,
	});

	if (error) {
		throw error;
	}
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
