import { supabase } from "@/lib/supabase";
import type {
	Championship,
	ChampionshipPlayer,
	ChampionshipWithPlayers,
} from "@/types/championship";

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

	return {
		id: row.id,
		championship_id: Number(row.championship_id),
		user_id: typeof row.user_id === "string" ? row.user_id : null,
		display_name: row.display_name,
		avatar_url: typeof row.avatar_url === "string" ? row.avatar_url : null,
	};
}

export async function listChampionships(): Promise<Championship[]> {
	const { data, error } = await supabase
		.from("championships")
		.select("id, name, invite_code, created_by")
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
		.select("id, name, invite_code, created_by")
		.eq("id", championshipId)
		.single();

	if (championshipError) {
		throw championshipError;
	}

	const { data: players, error: playersError } = await supabase
		.from("championship_players")
		.select("id, championship_id, user_id, display_name, avatar_url")
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
		.select("id, name, invite_code, created_by")
		.single();

	if (error) {
		throw error;
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

export async function addManualPlayer(
	championshipId: number,
	displayName: string,
): Promise<ChampionshipPlayer> {
	const { data, error } = await supabase
		.from("championship_players")
		.insert({
			championship_id: championshipId,
			display_name: displayName,
		})
		.select("id, championship_id, user_id, display_name, avatar_url")
		.single();

	if (error) {
		throw error;
	}

	return asPlayer(data);
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
