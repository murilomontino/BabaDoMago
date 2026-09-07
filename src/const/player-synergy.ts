import type { ChampionshipPlayer } from "../types/championship.ts";
import type {
	ChampionshipEvent,
	ChampionshipEventMatch,
	ChampionshipEventMatchPlayer,
} from "../types/championship-event.ts";
import { endedChampionshipHistoryEvents } from "./championship-rating-history.ts";
import { CHAMPIONSHIP_ROLE } from "./championship-role.ts";
import { playerVisibleName } from "./player-name.ts";
import { PODIUM_PLACES, type PodiumPlace } from "./podium.ts";
import {
	formatRosterCount,
	formatRosterWinRate,
	rosterSafeCount,
	rosterWinRate,
} from "./roster-stats.ts";

// ponytail: 3-match floor hides 1/1 noise. Upgrade: raise with more history.
export const SYNERGY_MIN_MATCHES = 3 as const;
export const SYNERGY_RANKING_LIMIT = 20 as const;
export const SYNERGY_PARTNER_LIMIT = 30 as const;
export const SYNERGY_NETWORK_LIMIT_DEFAULT = 10 as const;

export const SYNERGY_NETWORK_LIMIT_OPTIONS = [5, 10, 15] as const;

export type SynergyNetworkLimit =
	(typeof SYNERGY_NETWORK_LIMIT_OPTIONS)[number];

export const SYNERGY_WINDOW = {
	last3: "last3",
	last5: "last5",
	last8: "last8",
	month1: "month1",
	month2: "month2",
	all: "all",
} as const;

export type SynergyWindow =
	(typeof SYNERGY_WINDOW)[keyof typeof SYNERGY_WINDOW];

export const SYNERGY_WINDOW_DEFAULT = SYNERGY_WINDOW.all;

export const SYNERGY_WINDOW_COUNT = {
	[SYNERGY_WINDOW.last3]: 3,
	[SYNERGY_WINDOW.last5]: 5,
	[SYNERGY_WINDOW.last8]: 8,
} as const;

export const SYNERGY_WINDOW_MONTHS = {
	[SYNERGY_WINDOW.month1]: 1,
	[SYNERGY_WINDOW.month2]: 2,
} as const;

export const SYNERGY_WINDOW_OPTIONS = [
	SYNERGY_WINDOW.last3,
	SYNERGY_WINDOW.last5,
	SYNERGY_WINDOW.last8,
	SYNERGY_WINDOW.month1,
	SYNERGY_WINDOW.month2,
	SYNERGY_WINDOW.all,
] as const;

export const SYNERGY_FOCUS = {
	best: "best",
	worst: "worst",
	all: "all",
} as const;

export type SynergyFocus = (typeof SYNERGY_FOCUS)[keyof typeof SYNERGY_FOCUS];

export const SYNERGY_FOCUS_DEFAULT = SYNERGY_FOCUS.all;

export const SYNERGY_FOCUS_OPTIONS = [
	SYNERGY_FOCUS.best,
	SYNERGY_FOCUS.worst,
	SYNERGY_FOCUS.all,
] as const;

export const SYNERGY_VOLUME = {
	small: "small",
	medium: "medium",
	large: "large",
} as const;

export type SynergyVolumeLevel =
	(typeof SYNERGY_VOLUME)[keyof typeof SYNERGY_VOLUME];

export const SYNERGY_VOLUME_BOUNDS = {
	smallMax: 4,
	mediumMax: 9,
} as const;

export const SYNERGY_WR_BAND = {
	low: "low",
	neutral: "neutral",
	high: "high",
} as const;

export type SynergyWrBand =
	(typeof SYNERGY_WR_BAND)[keyof typeof SYNERGY_WR_BAND];

export const SYNERGY_WR_THRESHOLDS = {
	low: 0.45,
	high: 0.55,
} as const;

export const SYNERGY_DELTA_BAND = {
	veryPositive: "veryPositive",
	positive: "positive",
	neutral: "neutral",
	negative: "negative",
	veryNegative: "veryNegative",
} as const;

export type SynergyDeltaBand =
	(typeof SYNERGY_DELTA_BAND)[keyof typeof SYNERGY_DELTA_BAND];

export const SYNERGY_DELTA_THRESHOLDS = {
	strong: 0.1,
	mild: 0.05,
} as const;

export const SYNERGY_LABEL = {
	tab: "Sinergia",
	network: "Rede de sinergia",
	hint: "Desempenho do jogador quando atua no mesmo time que cada parceiro.",
	partners: "Parceiros",
	pair: "Dupla",
	partner: "Parceiro",
	best: "Melhores duplas",
	worst: "Piores duplas",
	bestPartners: "Melhores parceiros",
	worstPartners: "Piores parceiros",
	empty: "Nenhuma dupla ainda",
	emptyPartners: "Ainda não jogou em dupla",
	emptyQualified: "Poucos jogos em dupla",
	emptyWindow:
		"Nenhuma dupla possui 3 jogos no período selecionado. Experimente um período maior.",
	emptyBelowFloor:
		"Existem partidas em conjunto, mas nenhuma dupla possui amostra mínima para aparecer na rede.",
	emptyInsufficient:
		"Ainda não há dados suficientes para calcular sinergias. É necessário ter pelo menos 3 partidas jogadas junto com um parceiro.",
	filter: "Janela",
	focus: "Conexões",
	nodeLimit: "Parceiros",
	scatter: "Jogos × WinRate",
	playerWinRate: "WinRate individual",
	pairWinRate: "WinRate da dupla",
	synergyDelta: "Diferença",
	volume: "Amostra",
	games: "Jogos",
	wins: "Vitórias",
	draws: "Empates",
	losses: "Derrotas",
	betterTogether: "Melhor desempenho juntos",
	worseTogether: "Pior desempenho juntos",
	volumeSmall: "Amostra pequena",
	volumeMedium: "Amostra moderada",
	volumeLarge: "Boa amostra",
} as const;

export const SYNERGY_WINDOW_LABEL = {
	[SYNERGY_WINDOW.last3]: "Últimas 3",
	[SYNERGY_WINDOW.last5]: "Últimas 5",
	[SYNERGY_WINDOW.last8]: "Últimas 8",
	[SYNERGY_WINDOW.month1]: "1 mês",
	[SYNERGY_WINDOW.month2]: "2 meses",
	[SYNERGY_WINDOW.all]: "Todas",
} as const;

export const SYNERGY_FOCUS_LABEL = {
	[SYNERGY_FOCUS.best]: "Melhores",
	[SYNERGY_FOCUS.worst]: "Piores",
	[SYNERGY_FOCUS.all]: "Todas",
} as const;

export const SYNERGY_VOLUME_LABEL = {
	[SYNERGY_VOLUME.small]: SYNERGY_LABEL.volumeSmall,
	[SYNERGY_VOLUME.medium]: SYNERGY_LABEL.volumeMedium,
	[SYNERGY_VOLUME.large]: SYNERGY_LABEL.volumeLarge,
} as const;

export const SYNERGY_COLUMN = {
	player: "player",
	wins: "wins",
	matches: "matches",
	winRate: "winRate",
} as const;

export type SynergyColumnId =
	(typeof SYNERGY_COLUMN)[keyof typeof SYNERGY_COLUMN];

export const SYNERGY_STAT_COLUMNS = [
	SYNERGY_COLUMN.wins,
	SYNERGY_COLUMN.matches,
	SYNERGY_COLUMN.winRate,
] as const;

export type SynergyStatColumnId = (typeof SYNERGY_STAT_COLUMNS)[number];

export const SYNERGY_COLUMN_ABBR = {
	[SYNERGY_COLUMN.player]: "Dupla",
	[SYNERGY_COLUMN.wins]: "V",
	[SYNERGY_COLUMN.matches]: "J",
	[SYNERGY_COLUMN.winRate]: "WR",
} as const;

export const SYNERGY_PAIR_COLUMN_LABEL = {
	[SYNERGY_COLUMN.player]: SYNERGY_LABEL.pair,
	[SYNERGY_COLUMN.wins]: "Vitórias",
	[SYNERGY_COLUMN.matches]: "Jogos",
	[SYNERGY_COLUMN.winRate]: "WinRate",
} as const;

export const SYNERGY_PARTNER_COLUMN_LABEL = {
	[SYNERGY_COLUMN.player]: SYNERGY_LABEL.partner,
	[SYNERGY_COLUMN.wins]: "Vitórias",
	[SYNERGY_COLUMN.matches]: "Jogos",
	[SYNERGY_COLUMN.winRate]: "WinRate",
} as const;

export const SYNERGY_PAIR_COLUMNS = [
	SYNERGY_COLUMN.player,
	...SYNERGY_STAT_COLUMNS,
] as const;

export const SYNERGY_PAIR_LEGEND = SYNERGY_PAIR_COLUMNS.map((id) => ({
	id,
	abbr: SYNERGY_COLUMN_ABBR[id],
	label: SYNERGY_PAIR_COLUMN_LABEL[id],
}));

export function synergyPartnerColumnAbbr(id: SynergyColumnId): string {
	if (id === SYNERGY_COLUMN.player) {
		return "Parc";
	}

	return SYNERGY_COLUMN_ABBR[id];
}

export const SYNERGY_PARTNER_LEGEND = SYNERGY_PAIR_COLUMNS.map((id) => ({
	id,
	abbr: synergyPartnerColumnAbbr(id),
	label: SYNERGY_PARTNER_COLUMN_LABEL[id],
}));

export const SYNERGY_STAT_COLUMN_OPTIONS = SYNERGY_STAT_COLUMNS.map((id) => ({
	id,
	label: SYNERGY_PAIR_COLUMN_LABEL[id],
}));

export type SynergyPairRow = {
	left: ChampionshipPlayer;
	right: ChampionshipPlayer;
	matches: number;
	wins: number;
	draws: number;
	losses: number;
	winRate: number;
};

export type SynergyPartnerRow = {
	partner: ChampionshipPlayer;
	matches: number;
	wins: number;
	draws: number;
	losses: number;
	winRate: number;
	synergyDelta: number;
	volumeLevel: SynergyVolumeLevel;
};

export type PlayerSynergyOptions = {
	window?: SynergyWindow;
	minGames?: number;
	partnerLimit?: number;
	nowMs?: number;
};

export type PlayerSynergyResult = {
	playerId: number;
	playerWinRate: number;
	playerMatches: number;
	partners: SynergyPartnerRow[];
	bestPartners: SynergyPartnerRow[];
	worstPartners: SynergyPartnerRow[];
};

type SynergyAcc = {
	leftId: number;
	rightId: number;
	leftName: string;
	rightName: string;
	championshipId: number;
	matches: number;
	wins: number;
	draws: number;
	losses: number;
};

export function synergyPairKey(leftId: number, rightId: number): string {
	if (leftId < rightId) {
		return `${leftId}:${rightId}`;
	}

	return `${rightId}:${leftId}`;
}

export function synergyMeetsMinMatches(matches: number): boolean {
	return rosterSafeCount(matches) >= SYNERGY_MIN_MATCHES;
}

export function isSynergyWindow(value: string): value is SynergyWindow {
	return SYNERGY_WINDOW_OPTIONS.some((option) => option === value);
}

export function parseSynergyWindow(value: string): SynergyWindow {
	if (isSynergyWindow(value)) {
		return value;
	}

	return SYNERGY_WINDOW_DEFAULT;
}

export function isSynergyFocus(value: string): value is SynergyFocus {
	return SYNERGY_FOCUS_OPTIONS.some((option) => option === value);
}

export function parseSynergyFocus(value: string): SynergyFocus {
	if (isSynergyFocus(value)) {
		return value;
	}

	return SYNERGY_FOCUS_DEFAULT;
}

export function isSynergyNetworkLimit(
	value: number,
): value is SynergyNetworkLimit {
	return SYNERGY_NETWORK_LIMIT_OPTIONS.some((option) => option === value);
}

export function parseSynergyNetworkLimit(value: number): SynergyNetworkLimit {
	if (isSynergyNetworkLimit(value)) {
		return value;
	}

	return SYNERGY_NETWORK_LIMIT_DEFAULT;
}

export function synergyVolumeLevel(matches: number): SynergyVolumeLevel {
	const safe = rosterSafeCount(matches);
	if (safe <= SYNERGY_VOLUME_BOUNDS.smallMax) {
		return SYNERGY_VOLUME.small;
	}

	if (safe <= SYNERGY_VOLUME_BOUNDS.mediumMax) {
		return SYNERGY_VOLUME.medium;
	}

	return SYNERGY_VOLUME.large;
}

export function synergyWrBand(winRate: number): SynergyWrBand {
	if (winRate < SYNERGY_WR_THRESHOLDS.low) {
		return SYNERGY_WR_BAND.low;
	}

	if (winRate > SYNERGY_WR_THRESHOLDS.high) {
		return SYNERGY_WR_BAND.high;
	}

	return SYNERGY_WR_BAND.neutral;
}

export function synergyDeltaBand(delta: number): SynergyDeltaBand {
	if (delta >= SYNERGY_DELTA_THRESHOLDS.strong) {
		return SYNERGY_DELTA_BAND.veryPositive;
	}

	if (delta >= SYNERGY_DELTA_THRESHOLDS.mild) {
		return SYNERGY_DELTA_BAND.positive;
	}

	if (delta <= -SYNERGY_DELTA_THRESHOLDS.strong) {
		return SYNERGY_DELTA_BAND.veryNegative;
	}

	if (delta <= -SYNERGY_DELTA_THRESHOLDS.mild) {
		return SYNERGY_DELTA_BAND.negative;
	}

	return SYNERGY_DELTA_BAND.neutral;
}

export function formatSynergyDeltaPp(delta: number): string {
	const pp = Math.round(delta * 1000) / 10;
	if (pp > 0) {
		return `+${pp} pp`;
	}

	return `${pp} pp`;
}

export function synergyEdgeStrokeWidth(matches: number): number {
	const safe = rosterSafeCount(matches);
	if (safe >= 15) {
		return 5;
	}

	if (safe >= 10) {
		return 4;
	}

	if (safe >= 6) {
		return 3;
	}

	return 2;
}

export const SYNERGY_WR_BAND_COLOR = {
	[SYNERGY_WR_BAND.low]: "#dc2626",
	[SYNERGY_WR_BAND.neutral]: "#64748b",
	[SYNERGY_WR_BAND.high]: "#0f766e",
} as const;

export const SYNERGY_NETWORK_CHART = {
	size: 320,
	centerRadius: 28,
	partnerRadius: 22,
	orbit: 110,
	labelOffset: 18,
	scatterHeight: 220,
	rankingLimit: 3,
} as const;

export function synergyWrBandColor(winRate: number): string {
	return SYNERGY_WR_BAND_COLOR[synergyWrBand(winRate)];
}

export function synergyPartnerEdgeLabel(
	winRate: number,
	matches: number,
): string {
	return `${formatRosterWinRate(winRate)} · ${formatRosterCount(matches)}J`;
}

function filterEndedSinceMonths<T extends { starts_at: string }>(
	ended: readonly T[],
	months: number,
	nowMs: number,
): T[] {
	const cutoff = new Date(nowMs);
	cutoff.setMonth(cutoff.getMonth() - months);
	const cutoffMs = cutoff.getTime();

	return ended.filter((event) => Date.parse(event.starts_at) >= cutoffMs);
}

export function synergyWindowEvents<
	T extends { id: number; starts_at: string; ended_at: string | null },
>(
	events: readonly T[],
	window: SynergyWindow,
	nowMs: number = Date.now(),
): T[] {
	const ended = endedChampionshipHistoryEvents(events);

	if (window === SYNERGY_WINDOW.all) {
		return ended;
	}

	if (window === SYNERGY_WINDOW.last3) {
		return ended.slice(-SYNERGY_WINDOW_COUNT.last3);
	}

	if (window === SYNERGY_WINDOW.last5) {
		return ended.slice(-SYNERGY_WINDOW_COUNT.last5);
	}

	if (window === SYNERGY_WINDOW.last8) {
		return ended.slice(-SYNERGY_WINDOW_COUNT.last8);
	}

	if (window === SYNERGY_WINDOW.month1) {
		return filterEndedSinceMonths(ended, SYNERGY_WINDOW_MONTHS.month1, nowMs);
	}

	if (window === SYNERGY_WINDOW.month2) {
		return filterEndedSinceMonths(ended, SYNERGY_WINDOW_MONTHS.month2, nowMs);
	}

	const _never: never = window;
	return _never;
}

export function countsForSynergy(
	player: ChampionshipEventMatchPlayer,
	match: Pick<ChampionshipEventMatch, "ended_at" | "winner_team_id">,
	rosterTeamId: number | null,
	skipGuestGk: boolean,
): boolean {
	if (!player.include_stats) {
		return false;
	}

	if (match.ended_at == null) {
		return false;
	}

	if (!skipGuestGk) {
		return true;
	}

	if (!player.is_goalkeeper) {
		return true;
	}

	if (rosterTeamId === player.team_id) {
		return true;
	}

	if (match.winner_team_id === player.team_id) {
		return true;
	}

	return false;
}

export function formatSynergyStat(
	column: SynergyStatColumnId,
	value: number,
): string {
	switch (column) {
		case SYNERGY_COLUMN.wins:
		case SYNERGY_COLUMN.matches:
			return formatRosterCount(value);
		case SYNERGY_COLUMN.winRate:
			return formatRosterWinRate(value);
		default: {
			const _exhaustive: never = column;
			return _exhaustive;
		}
	}
}

function rosterTeamByPlayerId(
	event: ChampionshipEvent,
): ReadonlyMap<number, number> {
	return new Map(
		event.teams.flatMap((team) =>
			team.players.map((player) => [player.player_id, team.id] as const),
		),
	);
}

function synergyTeamPairs(
	players: readonly ChampionshipEventMatchPlayer[],
): ReadonlyArray<
	readonly [ChampionshipEventMatchPlayer, ChampionshipEventMatchPlayer]
> {
	return players.flatMap((left, index) =>
		players.slice(index + 1).map((right) => [left, right] as const),
	);
}

function orderedPair(
	left: ChampionshipEventMatchPlayer,
	right: ChampionshipEventMatchPlayer,
): {
	leftId: number;
	rightId: number;
	leftName: string;
	rightName: string;
} {
	if (left.player_id < right.player_id) {
		return {
			leftId: left.player_id,
			rightId: right.player_id,
			leftName: left.display_name,
			rightName: right.display_name,
		};
	}

	return {
		leftId: right.player_id,
		rightId: left.player_id,
		leftName: right.display_name,
		rightName: left.display_name,
	};
}

function applyMatchOutcome(
	acc: SynergyAcc,
	teamId: number,
	winnerTeamId: number | null,
): void {
	acc.matches += 1;
	if (winnerTeamId === teamId) {
		acc.wins += 1;
		return;
	}

	if (winnerTeamId == null) {
		acc.draws += 1;
		return;
	}

	acc.losses += 1;
}

function fallbackSynergyPlayer(
	playerId: number,
	championshipId: number,
	displayName: string,
): ChampionshipPlayer {
	return {
		id: playerId,
		championship_id: championshipId,
		user_id: null,
		display_name: displayName,
		nickname: null,
		nickname_tags: [],
		avatar_url: null,
		rating: 0,
		goalkeeper_rating: 0,
		role: CHAMPIONSHIP_ROLE.member,
		is_goalkeeper: false,
		is_monthly: false,
		deleted_at: null,
		goals: 0,
		assists: 0,
		assisted_goals: 0,
		own_goals: 0,
		wins: 0,
		losses: 0,
		draws: 0,
		matches: 0,
		mvps: 0,
	};
}

function resolveSynergyPlayer(
	playerId: number,
	championshipId: number,
	displayName: string,
	byId: ReadonlyMap<number, ChampionshipPlayer>,
): ChampionshipPlayer {
	return (
		byId.get(playerId) ??
		fallbackSynergyPlayer(playerId, championshipId, displayName)
	);
}

function compareSynergy(
	left: { winRate: number; matches: number; name: string },
	right: { winRate: number; matches: number; name: string },
): number {
	const winRateDiff = right.winRate - left.winRate;
	if (winRateDiff !== 0) {
		return winRateDiff;
	}

	const matchesDiff = right.matches - left.matches;
	if (matchesDiff !== 0) {
		return matchesDiff;
	}

	return left.name.localeCompare(right.name, "pt");
}

function compareSynergyWorst(
	left: { winRate: number; matches: number; name: string },
	right: { winRate: number; matches: number; name: string },
): number {
	const winRateDiff = left.winRate - right.winRate;
	if (winRateDiff !== 0) {
		return winRateDiff;
	}

	const matchesDiff = right.matches - left.matches;
	if (matchesDiff !== 0) {
		return matchesDiff;
	}

	return left.name.localeCompare(right.name, "pt");
}

export function aggregateSynergyPairs(
	events: readonly ChampionshipEvent[],
	players: readonly ChampionshipPlayer[],
): SynergyPairRow[] {
	const byId = new Map(players.map((player) => [player.id, player]));
	const accByKey = new Map<string, SynergyAcc>();

	for (const event of events) {
		const rosterByPlayer = rosterTeamByPlayerId(event);
		const skipGuestGk = event.skip_guest_goalkeeper_matches;

		for (const match of event.matches) {
			if (match.ended_at == null) {
				continue;
			}

			const eligible = match.players.filter((player) =>
				countsForSynergy(
					player,
					match,
					rosterByPlayer.get(player.player_id) ?? null,
					skipGuestGk,
				),
			);
			const byTeam = eligible.reduce((teams, player) => {
				const list = teams.get(player.team_id) ?? [];
				list.push(player);
				teams.set(player.team_id, list);
				return teams;
			}, new Map<number, ChampionshipEventMatchPlayer[]>());

			for (const teamPlayers of byTeam.values()) {
				for (const [left, right] of synergyTeamPairs(teamPlayers)) {
					const pair = orderedPair(left, right);
					const key = synergyPairKey(pair.leftId, pair.rightId);
					const acc = accByKey.get(key) ?? {
						...pair,
						championshipId: event.championship_id,
						matches: 0,
						wins: 0,
						draws: 0,
						losses: 0,
					};
					acc.leftName = pair.leftName;
					acc.rightName = pair.rightName;
					applyMatchOutcome(acc, left.team_id, match.winner_team_id);
					accByKey.set(key, acc);
				}
			}
		}
	}

	return [...accByKey.values()].flatMap((acc) => {
		if (!synergyMeetsMinMatches(acc.matches)) {
			return [];
		}

		return [
			{
				left: resolveSynergyPlayer(
					acc.leftId,
					acc.championshipId,
					acc.leftName,
					byId,
				),
				right: resolveSynergyPlayer(
					acc.rightId,
					acc.championshipId,
					acc.rightName,
					byId,
				),
				matches: acc.matches,
				wins: acc.wins,
				draws: acc.draws,
				losses: acc.losses,
				winRate: rosterWinRate(acc.wins, acc.matches),
			},
		];
	});
}

export function synergyPartnersOf(
	pairs: readonly SynergyPairRow[],
	playerId: number,
	playerWinRate = 0,
): SynergyPartnerRow[] {
	return pairs.flatMap((row) => {
		if (row.left.id === playerId) {
			return [
				{
					partner: row.right,
					matches: row.matches,
					wins: row.wins,
					draws: row.draws,
					losses: row.losses,
					winRate: row.winRate,
					synergyDelta: row.winRate - playerWinRate,
					volumeLevel: synergyVolumeLevel(row.matches),
				},
			];
		}

		if (row.right.id === playerId) {
			return [
				{
					partner: row.left,
					matches: row.matches,
					wins: row.wins,
					draws: row.draws,
					losses: row.losses,
					winRate: row.winRate,
					synergyDelta: row.winRate - playerWinRate,
					volumeLevel: synergyVolumeLevel(row.matches),
				},
			];
		}

		return [];
	});
}

export function rankSynergyPairRowsWorst(
	rows: readonly SynergyPairRow[],
): SynergyPairRow[] {
	return [...rows].sort((left, right) =>
		compareSynergyWorst(
			{
				winRate: left.winRate,
				matches: left.matches,
				name: `${playerVisibleName(left.left)} ${playerVisibleName(left.right)}`,
			},
			{
				winRate: right.winRate,
				matches: right.matches,
				name: `${playerVisibleName(right.left)} ${playerVisibleName(right.right)}`,
			},
		),
	);
}

export function rankSynergyPairRows(
	rows: readonly SynergyPairRow[],
): SynergyPairRow[] {
	return [...rows].sort((left, right) =>
		compareSynergy(
			{
				winRate: left.winRate,
				matches: left.matches,
				name: `${playerVisibleName(left.left)} ${playerVisibleName(left.right)}`,
			},
			{
				winRate: right.winRate,
				matches: right.matches,
				name: `${playerVisibleName(right.left)} ${playerVisibleName(right.right)}`,
			},
		),
	);
}

export function rankSynergyPartnerRows(
	rows: readonly SynergyPartnerRow[],
): SynergyPartnerRow[] {
	return [...rows].sort((left, right) =>
		compareSynergy(
			{
				winRate: left.winRate,
				matches: left.matches,
				name: playerVisibleName(left.partner),
			},
			{
				winRate: right.winRate,
				matches: right.matches,
				name: playerVisibleName(right.partner),
			},
		),
	);
}

export function rankSynergyPartnerRowsWorst(
	rows: readonly SynergyPartnerRow[],
): SynergyPartnerRow[] {
	return [...rows].sort((left, right) =>
		compareSynergyWorst(
			{
				winRate: left.winRate,
				matches: left.matches,
				name: playerVisibleName(left.partner),
			},
			{
				winRate: right.winRate,
				matches: right.matches,
				name: playerVisibleName(right.partner),
			},
		),
	);
}

export function topSynergyRows<T>(rows: readonly T[], limit: number): T[] {
	if (limit <= 0) {
		return [];
	}

	return rows.slice(0, limit);
}

export function championshipSynergyRanking(
	events: readonly ChampionshipEvent[],
	players: readonly ChampionshipPlayer[],
): SynergyPairRow[] {
	return topSynergyRows(
		rankSynergyPairRows(aggregateSynergyPairs(events, players)),
		SYNERGY_RANKING_LIMIT,
	);
}

export function championshipSynergyWorst(
	events: readonly ChampionshipEvent[],
	players: readonly ChampionshipPlayer[],
): SynergyPairRow[] {
	return topSynergyRows(
		rankSynergyPairRowsWorst(aggregateSynergyPairs(events, players)),
		SYNERGY_RANKING_LIMIT,
	);
}

export type SynergyPodiumStanding = {
	place: PodiumPlace;
	rows: SynergyPairRow[];
};

export function synergyPodiumStandings(
	ranked: readonly SynergyPairRow[],
): SynergyPodiumStanding[] {
	const scored = ranked.filter((row) => row.winRate > 0);
	const distinct = [...new Set(scored.map((row) => row.winRate))].slice(
		0,
		PODIUM_PLACES.length,
	);

	return distinct.flatMap((score, index) => {
		const place = PODIUM_PLACES[index];
		if (!place) {
			return [];
		}

		return [
			{
				place,
				rows: scored.filter((row) => row.winRate === score),
			},
		];
	});
}

export function playerIndividualWinRate(
	events: readonly ChampionshipEvent[],
	playerId: number,
): { wins: number; matches: number; winRate: number } {
	let wins = 0;
	let matches = 0;

	for (const event of events) {
		const rosterByPlayer = rosterTeamByPlayerId(event);
		const skipGuestGk = event.skip_guest_goalkeeper_matches;

		for (const match of event.matches) {
			const seat = match.players.find((row) => row.player_id === playerId);
			if (!seat) {
				continue;
			}

			if (
				!countsForSynergy(
					seat,
					match,
					rosterByPlayer.get(playerId) ?? null,
					skipGuestGk,
				)
			) {
				continue;
			}

			matches += 1;
			if (match.winner_team_id === seat.team_id) {
				wins += 1;
			}
		}
	}

	return {
		wins,
		matches,
		winRate: rosterWinRate(wins, matches),
	};
}

export function playerSynergyPartners(
	events: readonly ChampionshipEvent[],
	players: readonly ChampionshipPlayer[],
	playerId: number,
): SynergyPartnerRow[] {
	const individual = playerIndividualWinRate(events, playerId);
	return topSynergyRows(
		rankSynergyPartnerRows(
			synergyPartnersOf(
				aggregateSynergyPairs(events, players),
				playerId,
				individual.winRate,
			),
		),
		SYNERGY_PARTNER_LIMIT,
	);
}

export function playerSynergy(
	events: readonly ChampionshipEvent[],
	players: readonly ChampionshipPlayer[],
	playerId: number,
	options: PlayerSynergyOptions = {},
): PlayerSynergyResult {
	const window = options.window ?? SYNERGY_WINDOW_DEFAULT;
	const minGames = options.minGames ?? SYNERGY_MIN_MATCHES;
	const partnerLimit = options.partnerLimit ?? SYNERGY_PARTNER_LIMIT;
	const windowed = synergyWindowEvents(events, window, options.nowMs);
	const individual = playerIndividualWinRate(windowed, playerId);
	const pairs = aggregateSynergyPairs(windowed, players).filter(
		(row) => rosterSafeCount(row.matches) >= minGames,
	);
	const partners = topSynergyRows(
		rankSynergyPartnerRows(
			synergyPartnersOf(pairs, playerId, individual.winRate),
		),
		partnerLimit,
	);
	const bestPartners = topSynergyRows(partners, 3);
	const worstPartners = topSynergyRows(
		rankSynergyPartnerRowsWorst(partners),
		3,
	);

	return {
		playerId,
		playerWinRate: individual.winRate,
		playerMatches: individual.matches,
		partners,
		bestPartners,
		worstPartners,
	};
}

export function synergyPartnersForFocus(
	partners: readonly SynergyPartnerRow[],
	focus: SynergyFocus,
	limit: number,
): SynergyPartnerRow[] {
	if (focus === SYNERGY_FOCUS.best) {
		return topSynergyRows(rankSynergyPartnerRows(partners), limit);
	}

	if (focus === SYNERGY_FOCUS.worst) {
		return topSynergyRows(rankSynergyPartnerRowsWorst(partners), limit);
	}

	return topSynergyRows(partners, limit);
}

export function synergyEmptyMessage(
	partners: readonly SynergyPartnerRow[],
	window: SynergyWindow,
): string {
	if (partners.length > 0) {
		return "";
	}

	if (window !== SYNERGY_WINDOW.all) {
		return SYNERGY_LABEL.emptyWindow;
	}

	return SYNERGY_LABEL.emptyInsufficient;
}
