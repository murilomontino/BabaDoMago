import type { ChampionshipPlayer } from "../types/championship.ts";
import type {
	ChampionshipEvent,
	ChampionshipEventMatch,
	ChampionshipEventMatchPlayer,
} from "../types/championship-event.ts";
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

export const SYNERGY_LABEL = {
	tab: "Sinergia",
	partners: "Parceiros",
	pair: "Dupla",
	partner: "Parceiro",
	best: "Melhores duplas",
	worst: "Piores duplas",
	empty: "Nenhuma dupla ainda",
	emptyPartners: "Ainda não jogou em dupla",
	emptyQualified: "Poucos jogos em dupla",
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
	winRate: number;
};

export type SynergyPartnerRow = {
	partner: ChampionshipPlayer;
	matches: number;
	wins: number;
	winRate: number;
};

type SynergyAcc = {
	leftId: number;
	rightId: number;
	leftName: string;
	rightName: string;
	championshipId: number;
	matches: number;
	wins: number;
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
		role: CHAMPIONSHIP_ROLE.member,
		is_goalkeeper: false,
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
					};
					acc.leftName = pair.leftName;
					acc.rightName = pair.rightName;
					acc.matches += 1;
					if (match.winner_team_id === left.team_id) {
						acc.wins += 1;
					}
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
				winRate: rosterWinRate(acc.wins, acc.matches),
			},
		];
	});
}

export function synergyPartnersOf(
	pairs: readonly SynergyPairRow[],
	playerId: number,
): SynergyPartnerRow[] {
	return pairs.flatMap((row) => {
		if (row.left.id === playerId) {
			return [
				{
					partner: row.right,
					matches: row.matches,
					wins: row.wins,
					winRate: row.winRate,
				},
			];
		}

		if (row.right.id === playerId) {
			return [
				{
					partner: row.left,
					matches: row.matches,
					wins: row.wins,
					winRate: row.winRate,
				},
			];
		}

		return [];
	});
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

export function playerSynergyPartners(
	events: readonly ChampionshipEvent[],
	players: readonly ChampionshipPlayer[],
	playerId: number,
): SynergyPartnerRow[] {
	return topSynergyRows(
		rankSynergyPartnerRows(
			synergyPartnersOf(aggregateSynergyPairs(events, players), playerId),
		),
		SYNERGY_PARTNER_LIMIT,
	);
}
