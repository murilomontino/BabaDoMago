import type {
	ChampionshipEventAttendance,
	ChampionshipEventMatch,
	ChampionshipEventTeam,
} from "@/types/championship-event";
import { formatEventStartsAt } from "./championship-event";
import {
	formatMatchScore,
	matchScore,
	matchTeamPlayers,
} from "./championship-event-match";
import type { EventRatingPreviewRow } from "./event-rating-adjustment";
import {
	applyEventRatingDelta,
	formatEventRating,
} from "./event-rating-adjustment";
import { eventTeamName } from "./event-team-color";
import { shareFileDateStamp, sharePngFileName } from "./share-file-name";

const DEFAULT_DELTA_DECIMALS = 1 as const;

export const EVENT_RECAP_SHARE = {
	width: 1080,
	padding: 40,
	gap: 32,
	headerHeight: 100,
	headerPadX: 28,
	sectionTitleSizePx: 24,
	sectionTitleGap: 16,
	cardRadius: 16,
	cardStrokeWidth: 2,
	cardPadX: 24,
	matchesRowHeight: 68,
	matchGap: 12,
	statCardHeight: 96,
	rankTitleHeight: 40,
	rankRowHeight: 40,
	rankCardPad: 16,
	ratingRowHeight: 108,
	ratingRowGap: 10,
	columnGap: 16,
	highlightLimit: 5,
	ratingDeltaLimit: 12,
	filePrefix: "recap",
	fileName: "recap.png",
	mimePng: "image/png",
	title: "Recap",
} as const;

export type EventRecapShareTop = {
	value: number;
	names: readonly string[];
};

export type EventRecapShareRank = {
	name: string;
	value: number;
};

export type EventRecapShareRatingChange = {
	playerId: number;
	name: string;
	from: number;
	to: number;
	delta: number;
	isMvp: boolean;
};

export type EventRecapShareMatchRow = {
	teamAName: string;
	teamBName: string;
	scoreLabel: string;
	winnerLabel: string | null;
};

export type EventRecapShareData = {
	championshipName: string;
	startsAt: string;
	endedMatches: readonly EventRecapShareMatchRow[];
	mvpNames: readonly string[];
	mostWinsTeam: EventRecapShareTop | null;
	topScorers: readonly EventRecapShareRank[];
	topAssists: readonly EventRecapShareRank[];
	ratingDeltaUp: readonly EventRecapShareRatingChange[];
	ratingDeltaDown: readonly EventRecapShareRatingChange[];
};

export const EVENT_RECAP_SHARE_LABEL = {
	share: "Compartilhar recap",
	sharing: "Gerando imagem...",
	shareFailed: "Não foi possível compartilhar o recap",
} as const;

export const EVENT_RECAP_SHARE_COPY = {
	matches: "Placar",
	highlights: "Destaques",
	rating: "Nota",
	emptyMatches: "Sem partidas encerradas",
	emptyRating: "Sem variação de nota",
	emptyMvp: "Sem MVP ainda",
	emptyMostWins: "Sem vitórias",
	mvp: "MVP",
	mostWins: "Time que mais ganhou",
	topScorers: "Artilheiros",
	topAssists: "Assistentes",
	wins: "vitórias",
	goals: "gols",
	assists: "assist",
	ratingFrom: "Antes",
	ratingTo: "Depois",
	arrow: "→",
	emptyValue: "—",
} as const;

export function eventRecapShareRatingChangesFromPreview(
	rows: readonly EventRatingPreviewRow[],
): readonly EventRecapShareRatingChange[] {
	return rows
		.filter((row) => row.from !== row.to)
		.map((row) => ({
			playerId: row.playerId,
			name: row.name,
			from: row.from,
			to: row.to,
			delta: row.to - row.from,
			isMvp: row.isMvp,
		}))
		.sort((left, right) => {
			if (left.delta !== right.delta) {
				return right.delta - left.delta;
			}

			return left.playerId - right.playerId;
		});
}

export function eventRecapShareRatingChangesFromAttendance(
	attendance: readonly ChampionshipEventAttendance[],
): readonly EventRecapShareRatingChange[] {
	return attendance
		.map((row) => {
			const from = row.rating;
			const delta = row.rating_delta;
			const to = applyEventRatingDelta(from, delta);
			return {
				playerId: row.player_id,
				name: row.display_name,
				from,
				to,
				delta,
				isMvp: row.is_mvp,
			};
		})
		.filter((row) => row.from !== row.to)
		.sort((left, right) => {
			if (left.delta !== right.delta) {
				return right.delta - left.delta;
			}

			return left.playerId - right.playerId;
		});
}

export function eventRecapShareDeltaLabel(delta: number): string {
	const fixed = Math.abs(delta).toFixed(DEFAULT_DELTA_DECIMALS);
	if (delta > 0) {
		return `+${fixed}`;
	}

	return `-${fixed}`;
}

export function eventRecapShareRatingChangeLine(
	row: Pick<EventRecapShareRatingChange, "name" | "from" | "to" | "delta">,
): string {
	return `${row.name} ${formatEventRating(row.from)} ${EVENT_RECAP_SHARE_COPY.arrow} ${formatEventRating(row.to)} (${eventRecapShareDeltaLabel(row.delta)})`;
}

export function eventRecapShareDeltaText(
	rows: readonly EventRecapShareRatingChange[],
): string {
	return rows.map(eventRecapShareRatingChangeLine).join("\n");
}

function fitNames(names: readonly string[], max: number): readonly string[] {
	if (names.length <= max) {
		return names;
	}

	return names.slice(0, max);
}

function playerIdToNameFromMatches(
	matches: readonly ChampionshipEventMatch[],
): ReadonlyMap<number, string> {
	const map = new Map<number, string>();
	for (const match of matches) {
		for (const player of match.players) {
			map.set(player.player_id, player.display_name);
		}
	}

	return map;
}

function rankByValue(
	byId: ReadonlyMap<number, number>,
	idToName: ReadonlyMap<number, string>,
	limit: number,
): readonly EventRecapShareRank[] {
	return Array.from(byId.entries())
		.filter(([, value]) => value > 0)
		.map(([id, value]) => ({
			name: idToName.get(id) ?? String(id),
			value,
		}))
		.sort((left, right) => {
			if (left.value !== right.value) {
				return right.value - left.value;
			}

			return left.name.localeCompare(right.name, "pt-BR");
		})
		.slice(0, limit);
}

export function eventRecapShareTopScorersAndAssists(
	matches: readonly ChampionshipEventMatch[],
): {
	topScorers: readonly EventRecapShareRank[];
	topAssists: readonly EventRecapShareRank[];
} {
	const endedMatches = matches.filter((match) => match.ended_at !== null);
	if (endedMatches.length === 0) {
		return { topScorers: [], topAssists: [] };
	}

	const playerNameById = playerIdToNameFromMatches(endedMatches);

	const goalsByPlayerId = new Map<number, number>();
	const assistsByPlayerId = new Map<number, number>();

	for (const match of endedMatches) {
		for (const goal of match.goals) {
			if (goal.is_own_goal) {
				continue;
			}

			goalsByPlayerId.set(
				goal.scorer_player_id,
				(goalsByPlayerId.get(goal.scorer_player_id) ?? 0) + 1,
			);

			if (goal.assist_player_id === null) {
				continue;
			}

			assistsByPlayerId.set(
				goal.assist_player_id,
				(assistsByPlayerId.get(goal.assist_player_id) ?? 0) + 1,
			);
		}
	}

	return {
		topScorers: rankByValue(goalsByPlayerId, playerNameById, 3),
		topAssists: rankByValue(assistsByPlayerId, playerNameById, 3),
	};
}

function endedMatchesRows(
	matches: readonly ChampionshipEventMatch[],
	teams: readonly ChampionshipEventTeam[],
): readonly EventRecapShareMatchRow[] {
	const teamById = new Map(teams.map((team) => [team.id, team] as const));
	return matches
		.filter((match) => match.ended_at !== null)
		.map((match) => {
			const teamA = teamById.get(match.team_a_id);
			const teamB = teamById.get(match.team_b_id);
			if (!teamA || !teamB) {
				return null;
			}

			const playedA = matchTeamPlayers(match.players, match.team_a_id);
			const teamAIds = new Set(playedA.map((player) => player.player_id));
			const score = matchScore(match.goals, teamAIds);

			const scoreLabel = formatMatchScore(score.teamA, score.teamB);
			const winnerLabel =
				match.winner_team_id === null
					? null
					: match.winner_team_id === teamA.id
						? eventTeamName(teamA.color, teamA.sort_order)
						: eventTeamName(teamB.color, teamB.sort_order);

			return {
				teamAName: eventTeamName(teamA.color, teamA.sort_order),
				teamBName: eventTeamName(teamB.color, teamB.sort_order),
				scoreLabel,
				winnerLabel,
			};
		})
		.filter((row): row is EventRecapShareMatchRow => row !== null);
}

function splitRatingDeltaUpDown(
	changes: readonly EventRecapShareRatingChange[],
): {
	ratingDeltaUp: readonly EventRecapShareRatingChange[];
	ratingDeltaDown: readonly EventRecapShareRatingChange[];
} {
	const up = changes.filter((row) => row.delta > 0);
	const down = changes.filter((row) => row.delta < 0);

	return {
		ratingDeltaUp: up.slice(0, EVENT_RECAP_SHARE.ratingDeltaLimit),
		ratingDeltaDown: down.slice(0, EVENT_RECAP_SHARE.ratingDeltaLimit),
	};
}

function mostWinsTeamFromMatches(
	rows: readonly EventRecapShareMatchRow[],
): EventRecapShareTop | null {
	const winsByTeam = new Map<string, number>();
	for (const row of rows) {
		if (!row.winnerLabel) {
			continue;
		}

		winsByTeam.set(row.winnerLabel, (winsByTeam.get(row.winnerLabel) ?? 0) + 1);
	}

	const entries = Array.from(winsByTeam.entries());
	if (entries.length === 0) {
		return null;
	}

	entries.sort(
		(left, right) =>
			right[1] - left[1] || left[0].localeCompare(right[0], "pt-BR"),
	);
	const topValue = entries[0]?.[1] ?? 0;
	const names = entries
		.filter(([, value]) => value === topValue)
		.map(([name]) => name);

	return {
		value: topValue,
		names: fitNames(names, EVENT_RECAP_SHARE.highlightLimit),
	};
}

export function eventRecapShareDataFromEvent(input: {
	championshipName: string;
	startsAt: string;
	matches: readonly ChampionshipEventMatch[];
	teams: readonly ChampionshipEventTeam[];
	ratingChanges: readonly EventRecapShareRatingChange[];
}): EventRecapShareData {
	const endedMatches = endedMatchesRows(input.matches, input.teams);
	const mostWinsTeam = mostWinsTeamFromMatches(endedMatches);
	const { topScorers, topAssists } = eventRecapShareTopScorersAndAssists(
		input.matches,
	);

	const mvpNames = fitNames(
		input.ratingChanges.filter((row) => row.isMvp).map((row) => row.name),
		EVENT_RECAP_SHARE.highlightLimit,
	);

	const { ratingDeltaUp, ratingDeltaDown } = splitRatingDeltaUpDown(
		input.ratingChanges,
	);

	return {
		championshipName: input.championshipName,
		startsAt: input.startsAt,
		endedMatches,
		mvpNames,
		mostWinsTeam,
		topScorers,
		topAssists,
		ratingDeltaUp,
		ratingDeltaDown,
	};
}

export function eventRecapShareHeading(input: {
	championshipName: string;
	startsAt: string;
}): string {
	const parsed = new Date(input.startsAt);
	if (Number.isNaN(parsed.getTime())) {
		return `${EVENT_RECAP_SHARE.title} · ${input.championshipName}`;
	}

	return `${EVENT_RECAP_SHARE.title} · ${formatEventStartsAt(input.startsAt).date}`;
}

export function eventRecapShareText(input: EventRecapShareData): string {
	const heading = eventRecapShareHeading({
		championshipName: input.championshipName,
		startsAt: input.startsAt,
	});

	const matchesText =
		input.endedMatches.length === 0
			? EVENT_RECAP_SHARE_COPY.emptyMatches
			: input.endedMatches
					.map((row) => `${row.teamAName}\n${row.scoreLabel}\n${row.teamBName}`)
					.join("\n\n");

	const mvpText =
		input.mvpNames.length === 0
			? EVENT_RECAP_SHARE_COPY.emptyMvp
			: `${EVENT_RECAP_SHARE_COPY.mvp}: ${input.mvpNames.join(", ")}`;

	const mostWinsTeamText = input.mostWinsTeam
		? `${EVENT_RECAP_SHARE_COPY.mostWins}: ${input.mostWinsTeam.names.join(", ")} — ${input.mostWinsTeam.value} ${EVENT_RECAP_SHARE_COPY.wins}`
		: null;
	const scorerText = input.topScorers.length
		? `${EVENT_RECAP_SHARE_COPY.topScorers}:\n${input.topScorers
				.map(
					(row, index) =>
						`${index + 1}. ${row.name} — ${row.value} ${EVENT_RECAP_SHARE_COPY.goals}`,
				)
				.join("\n")}`
		: null;
	const assistText = input.topAssists.length
		? `${EVENT_RECAP_SHARE_COPY.topAssists}:\n${input.topAssists
				.map(
					(row, index) =>
						`${index + 1}. ${row.name} — ${row.value} ${EVENT_RECAP_SHARE_COPY.assists}`,
				)
				.join("\n")}`
		: null;

	const highlightText = [
		mvpText,
		mostWinsTeamText,
		scorerText,
		assistText,
	].filter((line): line is string => Boolean(line));

	const deltasText = [
		...input.ratingDeltaUp.map(eventRecapShareRatingChangeLine),
		...input.ratingDeltaDown.map(eventRecapShareRatingChangeLine),
	];

	const deltasBlock =
		deltasText.length === 0
			? null
			: `${EVENT_RECAP_SHARE_COPY.rating}: \n${deltasText.join("\n")}`;

	return [heading, matchesText, highlightText.join("\n"), deltasBlock]
		.filter((block): block is string => block !== null)
		.join("\n\n");
}

export function eventRecapShareFileName(input: {
	championshipName: string;
	startsAt: string;
	generatedAt: string;
}): string {
	return sharePngFileName([
		EVENT_RECAP_SHARE.filePrefix,
		input.championshipName,
		shareFileDateStamp(input.startsAt),
		shareFileDateStamp(input.generatedAt),
	]);
}

export function eventRecapShareMatchesCount(input: {
	matches: readonly ChampionshipEventMatch[];
}): number {
	return input.matches.filter((match) => match.ended_at !== null).length;
}

function eventRecapShareSectionTitleBlock(): number {
	return (
		EVENT_RECAP_SHARE.sectionTitleSizePx + EVENT_RECAP_SHARE.sectionTitleGap
	);
}

export function eventRecapShareRankCardHeight(rowCount: number): number {
	const rows = Math.max(rowCount, 1);
	return (
		EVENT_RECAP_SHARE.rankCardPad * 2 +
		EVENT_RECAP_SHARE.rankTitleHeight +
		rows * EVENT_RECAP_SHARE.rankRowHeight
	);
}

export function eventRecapShareStackedRowsHeight(
	rowCount: number,
	rowHeight: number,
	gap: number,
): number {
	const rows = Math.max(rowCount, 1);
	return rows * rowHeight + Math.max(rows - 1, 0) * gap;
}

export function eventRecapShareImageHeight(input: {
	matchCount: number;
	scorerCount: number;
	assistCount: number;
	ratingCount: number;
}): number {
	const layout = EVENT_RECAP_SHARE;
	const sectionTitle = eventRecapShareSectionTitleBlock();
	const hasRankRow = input.scorerCount > 0 || input.assistCount > 0;
	const rankHeight = hasRankRow
		? eventRecapShareRankCardHeight(
				Math.max(input.scorerCount, input.assistCount),
			)
		: 0;

	return (
		layout.padding +
		layout.headerHeight +
		layout.gap +
		sectionTitle +
		eventRecapShareStackedRowsHeight(
			input.matchCount,
			layout.matchesRowHeight,
			layout.matchGap,
		) +
		layout.gap +
		sectionTitle +
		layout.statCardHeight +
		(hasRankRow ? layout.columnGap + rankHeight : 0) +
		layout.gap +
		sectionTitle +
		eventRecapShareStackedRowsHeight(
			input.ratingCount,
			layout.ratingRowHeight,
			layout.ratingRowGap,
		) +
		layout.padding
	);
}
