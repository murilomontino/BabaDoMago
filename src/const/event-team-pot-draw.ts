import {
	type EventTeamBuilderTeam,
	type EventTeamDraft,
	emptyTeamSlots,
	eventDrawRatings,
	eventTeamCount,
	eventTeamDraftIsActive,
	pickTeamGoalkeeper,
} from "./championship-event.ts";
import {
	EVENT_DRAW_REVEAL_LABEL,
	EVENT_DRAW_REVEAL_PHASE,
	type EventDrawRevealPhase,
	eventDrawRevealItemCount,
	eventDrawRevealPhase,
} from "./event-draw-reveal.ts";
import { EVENT_TEAM_COLOR_NONE } from "./event-team-color.ts";
import type { EventTeamShareCard } from "./event-team-share.ts";
import { playerVisibleName } from "./player-name.ts";

export const EVENT_TEAM_POT_DRAW_ALGORITHM_VERSION = 2;

type RankedPotPlayer = {
	id: number;
	rating: number;
};

type PotTeamBucket = {
	capacity: number;
	playerIds: number[];
};

function extraSlotForLargerTeam(index: number, largerTeams: number): number {
	if (index < largerTeams) {
		return 1;
	}

	return 0;
}

function potDrawTeamCapacities(
	playerCount: number,
	teamCount: number,
): number[] {
	const minimum = Math.floor(playerCount / teamCount);
	const largerTeams = playerCount % teamCount;
	return Array.from(
		{ length: teamCount },
		(_, index) => minimum + extraSlotForLargerTeam(index, largerTeams),
	);
}

function shuffledCopy<T>(items: readonly T[], random: () => number): T[] {
	return items.reduceRight(
		(next, _, index) => {
			if (index === 0) {
				return next;
			}

			const swapIndex = Math.floor(random() * (index + 1));
			const current = next[index];
			const swapped = next[swapIndex];
			if (current === undefined || swapped === undefined) {
				return next;
			}

			next[index] = swapped;
			next[swapIndex] = current;
			return next;
		},
		[...items],
	);
}

function rankPotDrawPlayers(
	players: readonly { id: number; rating: number }[],
	random: () => number,
): RankedPotPlayer[] {
	return eventDrawRatings(players)
		.map((player) => ({
			id: player.id,
			random: random(),
			rating: Math.round(player.rating * 10),
		}))
		.sort((left, right) => {
			if (left.rating !== right.rating) {
				return right.rating - left.rating;
			}

			return left.random - right.random;
		})
		.map((player) => ({
			id: player.id,
			rating: player.rating,
		}));
}

function chunkBySize<T>(items: readonly T[], size: number): T[][] {
	if (size < 1) {
		return [];
	}

	if (items.length === 0) {
		return [];
	}

	return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
		items.slice(index * size, (index + 1) * size),
	);
}

function openTeamIndexes(teams: readonly PotTeamBucket[]): number[] {
	return teams.flatMap((team, index) => {
		if (team.playerIds.length >= team.capacity) {
			return [];
		}

		return [index];
	});
}

function teamBucketAt(
	teams: readonly PotTeamBucket[],
	index: number | undefined,
): PotTeamBucket | undefined {
	if (index === undefined) {
		return undefined;
	}

	return teams[index];
}

function assignPotRound(
	pot: readonly number[],
	teams: PotTeamBucket[],
	random: () => number,
): void {
	const openIndexes = openTeamIndexes(teams);
	const shuffledPlayers = shuffledCopy(pot, random);
	const pairCount = Math.min(shuffledPlayers.length, openIndexes.length);

	shuffledPlayers.slice(0, pairCount).reduce((acc, playerId, index) => {
		const team = teamBucketAt(acc, openIndexes[index]);
		if (!team) {
			return acc;
		}

		team.playerIds.push(playerId);
		return acc;
	}, teams);
}

export const EVENT_POT_DRAW_LABEL = {
	heads: "Cabeças de chave",
	rest: "Pote {number}",
	potsTitle: "Potes",
} as const;

export const EVENT_POT_DRAW_STAGE = {
	pots: "pots",
	teams: "teams",
} as const;

export type EventPotDrawStage =
	(typeof EVENT_POT_DRAW_STAGE)[keyof typeof EVENT_POT_DRAW_STAGE];

export function eventPotDrawPotTitle(index: number): string {
	if (index === 0) {
		return EVENT_POT_DRAW_LABEL.heads;
	}

	return EVENT_POT_DRAW_LABEL.rest.replace("{number}", String(index + 1));
}

export function eventPotDrawPots(
	players: readonly { id: number; rating: number }[],
	playersPerTeam: number,
	random: () => number = Math.random,
): number[][] {
	const teamCount = eventTeamCount(players.length, playersPerTeam);
	const ranked = rankPotDrawPlayers(players, random);
	const heads = ranked.slice(0, teamCount).map((player) => player.id);
	const restPots = chunkBySize(ranked.slice(teamCount), teamCount).map((pot) =>
		pot.map((player) => player.id),
	);

	return [heads, ...restPots].filter((pot) => pot.length > 0);
}

export function eventPotDrawVisiblePots<T>(
	pots: readonly T[],
	visibleCount: number,
): T[] {
	return pots.slice(0, Math.max(0, visibleCount));
}

export function eventPotDrawNextCount(
	visibleCount: number,
	total: number,
): number {
	if (visibleCount >= total) {
		return total;
	}

	return visibleCount + 1;
}

export function eventPotDrawPotsComplete(
	visibleCount: number,
	total: number,
): boolean {
	return total > 0 && visibleCount >= total;
}

export function eventPotDrawIsPotsStage(stage: EventPotDrawStage): boolean {
	return stage === EVENT_POT_DRAW_STAGE.pots;
}

export function eventPotDrawShowsPosition(stage: EventPotDrawStage): boolean {
	return stage === EVENT_POT_DRAW_STAGE.teams;
}

export function eventPotDrawAdvanceOverride(
	stage: EventPotDrawStage,
): boolean | undefined {
	if (eventPotDrawIsPotsStage(stage)) {
		return true;
	}

	return undefined;
}

export function eventPotDrawRevealPhase(
	stage: EventPotDrawStage,
	potVisibleCount: number,
	teamVisibleCount: number,
	teamTotal: number,
): EventDrawRevealPhase {
	if (eventPotDrawIsPotsStage(stage)) {
		if (potVisibleCount <= 0) {
			return EVENT_DRAW_REVEAL_PHASE.poster;
		}

		return EVENT_DRAW_REVEAL_PHASE.playing;
	}

	return eventDrawRevealPhase(teamVisibleCount, teamTotal);
}

export function eventPotDrawCeremonyTitle(stage: EventPotDrawStage): string {
	if (eventPotDrawIsPotsStage(stage)) {
		return EVENT_POT_DRAW_LABEL.potsTitle;
	}

	return EVENT_DRAW_REVEAL_LABEL.potTitle;
}

export function eventPotDrawCeremonyCards(
	stage: EventPotDrawStage,
	potCards: readonly EventTeamShareCard[],
	potVisibleCount: number,
	teamCards: readonly EventTeamShareCard[],
): EventTeamShareCard[] {
	if (eventPotDrawIsPotsStage(stage)) {
		return eventPotDrawVisiblePots(potCards, potVisibleCount);
	}

	return [...teamCards];
}

export function eventPotDrawCeremonyVisibleCount(
	stage: EventPotDrawStage,
	ceremonyCards: readonly EventTeamShareCard[],
	teamVisibleCount: number,
): number {
	if (eventPotDrawIsPotsStage(stage)) {
		return eventDrawRevealItemCount(ceremonyCards);
	}

	return teamVisibleCount;
}

export function drawPotEventTeams(
	players: readonly { id: number; rating: number }[],
	playersPerTeam: number,
	random: () => number = Math.random,
	volunteerIds: readonly number[] = [],
): EventTeamDraft[] {
	const capacities = potDrawTeamCapacities(
		players.length,
		eventTeamCount(players.length, playersPerTeam),
	);
	const pots = eventPotDrawPots(players, playersPerTeam, random);
	const teams = capacities.map((capacity) => ({
		capacity,
		playerIds: [] as number[],
	}));

	pots.reduce((acc, pot) => {
		assignPotRound(pot, acc, random);
		return acc;
	}, teams);

	return teams.map((team) => ({
		color: EVENT_TEAM_COLOR_NONE,
		playerIds: team.playerIds,
		goalkeeperId: pickTeamGoalkeeper(
			team.playerIds,
			playersPerTeam,
			volunteerIds,
		),
	}));
}

function potDraftSlots(
	playerIds: readonly number[],
	playersPerTeam: number,
): string[] {
	return playerIds.reduce((slots, playerId, index) => {
		if (index >= slots.length) {
			return slots;
		}

		slots[index] = String(playerId);
		return slots;
	}, emptyTeamSlots(playersPerTeam));
}

export function builderTeamsFromPotDrafts(
	teams: readonly EventTeamDraft[],
	playersPerTeam: number,
): EventTeamBuilderTeam[] {
	return teams.map((team, index) => ({
		key: `team-draw-${index}`,
		color: team.color,
		slots: potDraftSlots(team.playerIds, playersPerTeam),
		isActive: eventTeamDraftIsActive(team),
	}));
}

export function eventPotDrawShareCards(
	pots: readonly (readonly number[])[],
	players: readonly {
		id: number;
		nickname: string | null;
		display_name: string;
		rating: number;
		avatar_url: string | null;
	}[],
): EventTeamShareCard[] {
	const byId = new Map(players.map((player) => [player.id, player]));

	return pots.map((playerIds, index) => ({
		title: eventPotDrawPotTitle(index),
		color: null,
		players: playerIds.flatMap((playerId, slotIndex) => {
			const player = byId.get(playerId);
			if (!player) {
				return [];
			}

			return [
				{
					id: player.id,
					number: slotIndex + 1,
					name: playerVisibleName(player),
					rating: player.rating,
					avatarUrl: player.avatar_url,
				},
			];
		}),
	}));
}
