import type { ChampionshipPlayer } from "../types/championship.ts";
import {
	CHAMPIONSHIP_ROLE_LABEL,
	resolveChampionshipRole,
} from "./championship-role.ts";
import { legalNameIfDifferent, playerVisibleName } from "./player-name.ts";
import {
	PLAYER_PROFILE_LABEL,
	type PlayerProfileHistoryRow,
	type PlayerRatingHistoryChartPoint,
	playerRatingHistoryChartSeries,
} from "./player-profile.ts";
import {
	formatRosterStat,
	ROSTER_COLUMN_ABBR,
	ROSTER_COLUMN_LABEL,
	ROSTER_STAT_COLUMNS,
	type RosterRow,
} from "./roster-stats.ts";
import { shareFileDateStamp, sharePngFileName } from "./share-file-name.ts";

export const PLAYER_PROFILE_SHARE = {
	width: 1080,
	padding: 48,
	gap: 20,
	avatar: 160,
	star: 36,
	statColumns: 3,
	chartHeight: 260,
	chartAxis: 56,
	chartTitle: 28,
	chartLabelGap: 22,
	chartXLabel: 28,
	filePrefix: "perfil",
	mimePng: "image/png",
	title: "Perfil",
} as const;

export const PLAYER_PROFILE_SHARE_LABEL = {
	share: "Compartilhar",
	sharing: "Gerando imagem...",
	shareFailed: "Não foi possível compartilhar o perfil",
	chart: "Evolução",
} as const;

export const PLAYER_PROFILE_SHARE_COLOR = {
	field: "#fafaf9",
	surface: "#ffffff",
	fg: "#1c1917",
	fgMuted: "#57534e",
	line: "#e7e5e4",
	pitch: "#166534",
	pitchSoft: "#ecfdf5",
	starEmpty: "#a8a29e",
	starFill: "#fbbf24",
	avatar: "#e7e5e4",
} as const;

export type PlayerProfileShareStat = {
	id: string;
	abbr: string;
	label: string;
	value: string;
};

export type PlayerProfileShareCard = {
	playerId: number;
	name: string;
	legalName: string | null;
	roleLabel: string;
	championshipName: string;
	rating: number;
	avatarUrl: string | null;
	stats: PlayerProfileShareStat[];
	chart: readonly PlayerRatingHistoryChartPoint[];
};

export function playerProfileShareFileName({
	championshipName,
	name,
	playerId,
	generatedAt,
}: {
	championshipName: string;
	name: string;
	playerId: number;
	generatedAt: string;
}): string {
	return sharePngFileName([
		PLAYER_PROFILE_SHARE.filePrefix,
		championshipName,
		name || String(playerId),
		shareFileDateStamp(generatedAt),
	]);
}

export function playerProfileShareText(card: PlayerProfileShareCard): string {
	const stats = card.stats
		.map((stat) => `${stat.abbr} ${stat.value}`)
		.join(" · ");
	const lines = [
		card.name,
		card.championshipName,
		card.roleLabel,
		stats,
	].filter((line) => line.length > 0);
	return lines.join("\n");
}

function shareRoleLabel(player: ChampionshipPlayer, createdBy: string): string {
	if (!player.user_id) {
		return PLAYER_PROFILE_LABEL.noAccount;
	}

	return CHAMPIONSHIP_ROLE_LABEL[
		resolveChampionshipRole(createdBy, player.user_id, player.role)
	];
}

export function playerProfileShareCard(
	player: ChampionshipPlayer,
	career: RosterRow,
	createdBy: string,
	championshipName: string,
	history: readonly PlayerProfileHistoryRow[],
	nowIso: string,
): PlayerProfileShareCard {
	const name = playerVisibleName(player);
	const roleLabel = shareRoleLabel(player, createdBy);

	return {
		playerId: player.id,
		name,
		legalName: legalNameIfDifferent(name, player.display_name),
		roleLabel,
		championshipName,
		rating: player.rating,
		avatarUrl: player.avatar_url,
		stats: ROSTER_STAT_COLUMNS.map((column) => ({
			id: column,
			abbr: ROSTER_COLUMN_ABBR[column],
			label: ROSTER_COLUMN_LABEL[column],
			value: formatRosterStat(column, career[column]),
		})),
		chart: playerRatingHistoryChartSeries(history, player.rating, nowIso),
	};
}
