import type {
	ChampionshipEventGoal,
	ChampionshipEventMatch,
	ChampionshipEventMatchPlayer,
} from "../types/championship-event.ts";
import { CHAMPIONSHIP_EVENT } from "./championship-event.ts";
import type { EventTeamColor } from "./event-team-color.ts";
import { PLAYER_LABEL, playerVisibleName } from "./player-name.ts";

type MatchStarRosterPlayer = {
	nickname: string | null;
	display_name: string;
	rating: number;
};

export const EVENT_MATCH_STATUS = {
	open: "open",
	ended: "ended",
} as const;

export type EventMatchStatus =
	(typeof EVENT_MATCH_STATUS)[keyof typeof EVENT_MATCH_STATUS];

export const EVENT_MATCH_LABEL = {
	winner: "Vencedor",
	draw: "Empate",
	open: "Em andamento",
	selectTeams: "Selecione dois times para o confronto",
	emptySlot: "Vago",
	emptyTeam: "Ninguém no time.",
	copied: "Link copiado.",
	none: "Nenhuma partida ainda.",
	picked: "Time",
	select: "Selecionar",
	showMore: "Ver mais",
	showLess: "Ver menos",
} as const;

export const EVENT_MATCH_TEAM_PREVIEW = {
	players: 2,
} as const;

export const EVENT_MATCH_DURATION = {
	minMinutes: 1,
	maxMinutes: 90,
	defaultMinutes: 7,
	presetsMinutes: [5, 7, 10],
} as const;

export const EVENT_MATCH_CLOCK_LABEL = {
	duration: "Duração",
	minutes: "min",
	start: "Iniciar",
	pause: "Pausar",
	resume: "Proseguir",
	ended: "Encerrado",
} as const;

export type MatchClockFields = {
	duration_seconds: number;
	started_at: string | null;
	paused_at: string | null;
	pause_accumulated_seconds: number;
	ended_at: string | null;
};

export const MATCH_CLOCK_ACTION = {
	start: "start",
	pause: "pause",
	resume: "resume",
} as const;

export type MatchClockAction =
	(typeof MATCH_CLOCK_ACTION)[keyof typeof MATCH_CLOCK_ACTION];

export const MATCH_CLOCK_STORAGE_KEY = "baba-match-clock" as const;

export type MatchClockSnapshot = {
	started_at: string | null;
	paused_at: string | null;
	pause_accumulated_seconds: number;
	pending: MatchClockAction[];
};

export function matchClockSnapshotFromFields(
	fields: Pick<
		MatchClockFields,
		"started_at" | "paused_at" | "pause_accumulated_seconds"
	>,
): MatchClockSnapshot {
	return {
		started_at: fields.started_at,
		paused_at: fields.paused_at,
		pause_accumulated_seconds: fields.pause_accumulated_seconds,
		pending: [],
	};
}

export function hasMatchClockLocal(
	local: MatchClockSnapshot | undefined,
): local is MatchClockSnapshot {
	return (
		local !== undefined &&
		(local.started_at !== null || local.pending.length > 0)
	);
}

export function applyMatchClockAction(
	snapshot: MatchClockSnapshot,
	action: MatchClockAction,
	nowMs: number,
): MatchClockSnapshot {
	const nowIso = new Date(nowMs).toISOString();
	switch (action) {
		case MATCH_CLOCK_ACTION.start: {
			if (snapshot.started_at !== null) {
				return snapshot;
			}

			return {
				...snapshot,
				started_at: nowIso,
				pending: [...snapshot.pending, action],
			};
		}
		case MATCH_CLOCK_ACTION.pause: {
			if (snapshot.started_at === null || snapshot.paused_at !== null) {
				return snapshot;
			}

			return {
				...snapshot,
				paused_at: nowIso,
				pending: [...snapshot.pending, action],
			};
		}
		case MATCH_CLOCK_ACTION.resume: {
			if (snapshot.paused_at === null) {
				return snapshot;
			}

			const pausedAt = Date.parse(snapshot.paused_at);
			const extra = Number.isFinite(pausedAt)
				? Math.max(0, Math.floor((nowMs - pausedAt) / 1000))
				: 0;
			return {
				...snapshot,
				paused_at: null,
				pause_accumulated_seconds: snapshot.pause_accumulated_seconds + extra,
				pending: [...snapshot.pending, action],
			};
		}
		default: {
			const _exhaustive: never = action;
			return _exhaustive;
		}
	}
}

export function shiftMatchClockPending(
	snapshot: MatchClockSnapshot,
): MatchClockSnapshot {
	return {
		...snapshot,
		pending: snapshot.pending.slice(1),
	};
}

export function mergeMatchClock<T extends MatchClockFields>(
	server: T,
	local: MatchClockSnapshot | undefined,
): T {
	if (server.ended_at !== null || !hasMatchClockLocal(local)) {
		return server;
	}

	return {
		...server,
		started_at: local.started_at,
		paused_at: local.paused_at,
		pause_accumulated_seconds: local.pause_accumulated_seconds,
	};
}

export const EVENT_MATCH_END_INTENT = {
	end: "end",
	next: "next",
} as const;

export type EventMatchEndIntent =
	(typeof EVENT_MATCH_END_INTENT)[keyof typeof EVENT_MATCH_END_INTENT];

export const EVENT_MATCH_REOPEN_LABEL = {
	title: "Editar partida",
	hint: "A partida volta para edição. Estatísticas saem até encerrar de novo.",
	confirm: "Editar",
	cancel: "Cancelar",
} as const;

export const EVENT_MATCH_END_LABEL = {
	title: "Encerrar partida",
	nextTitle: "Próxima partida",
	hint: "Placar e vencedor ficam gravados.",
	confirm: "Encerrar",
	nextConfirm: "Próxima partida",
	cancel: "Cancelar",
} as const;

export const EVENT_MATCH_SUBSTITUTION_LABEL = {
	hint: "Conte se jogou a maior parte. Não conte se saiu no início ou foi embora.",
	count: "Contar",
	skip: "Não contar",
	chip: "Substituído",
} as const;

export function eventMatchSubstitutionTitle(playerName: string): string {
	return `Contar estatísticas de ${playerName}?`;
}

export const EVENT_GOAL_KIND = {
	assist: "assist",
	none: "none",
	ownGoal: "ownGoal",
} as const;

export type EventGoalKind =
	(typeof EVENT_GOAL_KIND)[keyof typeof EVENT_GOAL_KIND];

export const EVENT_GOAL_LABEL = {
	goal: "Gol",
	assist: "Assistência",
	whoAssisted: "Quem deu a assistência?",
	none: "Sem assistência",
	ownGoal: "Gol contra",
	ownGoalShort: "Contra",
} as const;

export const EVENT_MATCH_ICON = {
	goalkeeper: "goalkeeper",
	goal: "goal",
	assist: "assist",
	ownGoal: "ownGoal",
} as const;

export type EventMatchIcon =
	(typeof EVENT_MATCH_ICON)[keyof typeof EVENT_MATCH_ICON];

export const EVENT_MATCH_ICON_LEGEND = [
	{ id: EVENT_MATCH_ICON.goalkeeper, label: PLAYER_LABEL.goalkeeper },
	{ id: EVENT_MATCH_ICON.goal, label: EVENT_GOAL_LABEL.goal },
	{ id: EVENT_MATCH_ICON.assist, label: EVENT_GOAL_LABEL.assist },
	{ id: EVENT_MATCH_ICON.ownGoal, label: EVENT_GOAL_LABEL.ownGoal },
] as const;

export function eventGoalScorerHint(scorerName: string): string {
	return `Gol de ${scorerName}`;
}

export const EVENT_GOAL_KINDS = [
	EVENT_GOAL_KIND.none,
	EVENT_GOAL_KIND.ownGoal,
] as const;

export function eventMatchStatus(endedAt: string | null): EventMatchStatus {
	if (endedAt) {
		return EVENT_MATCH_STATUS.ended;
	}

	return EVENT_MATCH_STATUS.open;
}

export function openEventMatch<T extends { ended_at: string | null }>(
	matches: readonly T[],
): T | null {
	return matches.find((match) => match.ended_at === null) ?? null;
}

export function shouldStartEventMatch<T extends { ended_at: string | null }>(
	matches: readonly T[],
): boolean {
	return openEventMatch(matches) === null;
}

export function matchPlayerIds(
	players: readonly { player_id: number }[],
): number[] {
	return players.map((player) => player.player_id);
}

export function matchTeamPlayers(
	players: readonly ChampionshipEventMatchPlayer[],
	teamId: number,
): ChampionshipEventMatchPlayer[] {
	return [...players]
		.filter((player) => player.team_id === teamId)
		.sort((left, right) => {
			if (left.is_substituted !== right.is_substituted) {
				return left.is_substituted ? 1 : -1;
			}

			return (left.slot ?? 11) - (right.slot ?? 11);
		});
}

export function matchActiveTeamPlayers(
	players: readonly ChampionshipEventMatchPlayer[],
	teamId: number,
): ChampionshipEventMatchPlayer[] {
	return matchTeamPlayers(players, teamId).filter(
		(player) => !player.is_substituted,
	);
}

export function matchSubstitutedTeamPlayers(
	players: readonly ChampionshipEventMatchPlayer[],
	teamId: number,
): ChampionshipEventMatchPlayer[] {
	return matchTeamPlayers(players, teamId).filter(
		(player) => player.is_substituted,
	);
}

export function matchTeamSlots(
	players: readonly ChampionshipEventMatchPlayer[],
	teamId: number,
	playersPerTeam: number,
): (ChampionshipEventMatchPlayer | null)[] {
	const slots = Array.from(
		{ length: playersPerTeam },
		() => null as ChampionshipEventMatchPlayer | null,
	);
	const team = matchActiveTeamPlayers(players, teamId);

	return team.reduce((next, player) => {
		const slot = player.slot;
		if (slot === null || slot < 0 || slot >= next.length) {
			return next;
		}

		next[slot] = player;
		return next;
	}, slots);
}

export function matchBenchPlayerIds(
	presentIds: readonly number[],
	matchPlayers: readonly { player_id: number }[],
): number[] {
	const taken = new Set(matchPlayers.map((player) => player.player_id));
	return presentIds.filter((playerId) => !taken.has(playerId));
}

export function matchAssistCandidates(
	players: readonly ChampionshipEventMatchPlayer[],
	teamId: number,
	scorerPlayerId: number,
): ChampionshipEventMatchPlayer[] {
	return matchActiveTeamPlayers(players, teamId).filter(
		(player) => player.player_id !== scorerPlayerId,
	);
}

export function matchTeamScore(
	goals: readonly ChampionshipEventGoal[],
	teamPlayerIds: ReadonlySet<number>,
): number {
	return goals.reduce((score, goal) => {
		const scorerInTeam = teamPlayerIds.has(goal.scorer_player_id);
		if (scorerInTeam === goal.is_own_goal) {
			return score;
		}

		return score + 1;
	}, 0);
}

export function matchScore(
	goals: readonly ChampionshipEventGoal[],
	teamAPlayerIds: ReadonlySet<number>,
): { teamA: number; teamB: number } {
	return goals.reduce(
		(score, goal) => {
			const scorerInA = teamAPlayerIds.has(goal.scorer_player_id);
			if (goal.is_own_goal) {
				if (scorerInA) {
					return { teamA: score.teamA, teamB: score.teamB + 1 };
				}

				return { teamA: score.teamA + 1, teamB: score.teamB };
			}

			if (scorerInA) {
				return { teamA: score.teamA + 1, teamB: score.teamB };
			}

			return { teamA: score.teamA, teamB: score.teamB + 1 };
		},
		{ teamA: 0, teamB: 0 },
	);
}

export function matchWinnerTeamId(
	teamAId: number,
	teamBId: number,
	scoreA: number,
	scoreB: number,
): number | null {
	if (scoreA > scoreB) {
		return teamAId;
	}

	if (scoreB > scoreA) {
		return teamBId;
	}

	return null;
}

export function matchWinnerColor(
	winnerTeamId: number | null,
	teams: ReadonlyMap<number, { color: EventTeamColor | null }>,
): EventTeamColor | null {
	if (winnerTeamId === null) {
		return null;
	}

	return teams.get(winnerTeamId)?.color ?? null;
}

export function matchPlayUrl(
	origin: string,
	championshipId: number,
	eventId: number,
	playPath: string,
): string {
	return `${origin}${playPath
		.replace("$championshipId", String(championshipId))
		.replace("$eventId", String(eventId))}`;
}

export function isMatchSlotGoalkeeper(slot: number): boolean {
	return slot === 0;
}

export function sortBenchForSlot<T extends { id: number }>(
	players: readonly T[],
	slot: number,
	isGoalkeeper: (playerId: number) => boolean,
): T[] {
	if (!isMatchSlotGoalkeeper(slot)) {
		return [...players];
	}

	const goalkeepers = players.filter((player) => isGoalkeeper(player.id));
	const others = players.filter((player) => !isGoalkeeper(player.id));
	return [...goalkeepers, ...others];
}

export function matchSlotCount(playersPerTeam: number): number {
	if (playersPerTeam < CHAMPIONSHIP_EVENT.playersPerTeamMin) {
		return CHAMPIONSHIP_EVENT.playersPerTeamMin;
	}

	if (playersPerTeam > CHAMPIONSHIP_EVENT.playersPerTeamMax) {
		return CHAMPIONSHIP_EVENT.playersPerTeamMax;
	}

	return playersPerTeam;
}

export function toggleMatchTeamSelection(
	selected: readonly number[],
	teamId: number,
): number[] {
	if (selected.includes(teamId)) {
		return selected.filter((id) => id !== teamId);
	}

	if (selected.length < CHAMPIONSHIP_EVENT.minTeams) {
		return [...selected, teamId];
	}

	const last = selected[selected.length - 1];
	if (last === undefined) {
		return [teamId];
	}

	return [last, teamId];
}

export function canConfirmMatchTeams(selected: readonly number[]): boolean {
	return selected.length === CHAMPIONSHIP_EVENT.minTeams;
}

export type MatchGoalDraft = {
	scorerPlayerId: number;
	kind: EventGoalKind;
	assistPlayerId: number | null;
};

export function matchGoalPayload(draft: MatchGoalDraft): {
	scorerPlayerId: number;
	assistPlayerId: number | null;
	isOwnGoal: boolean;
} {
	switch (draft.kind) {
		case EVENT_GOAL_KIND.ownGoal:
			return {
				scorerPlayerId: draft.scorerPlayerId,
				assistPlayerId: null,
				isOwnGoal: true,
			};
		case EVENT_GOAL_KIND.none:
			return {
				scorerPlayerId: draft.scorerPlayerId,
				assistPlayerId: null,
				isOwnGoal: false,
			};
		case EVENT_GOAL_KIND.assist:
			return {
				scorerPlayerId: draft.scorerPlayerId,
				assistPlayerId: draft.assistPlayerId,
				isOwnGoal: false,
			};
		default: {
			const _exhaustive: never = draft.kind;
			return _exhaustive;
		}
	}
}

export function formatMatchScore(scoreA: number, scoreB: number): string {
	return `${scoreA} x ${scoreB}`;
}

export function matchDurationSeconds(minutes: number): number {
	return minutes * 60;
}

export function clampMatchDurationMinutes(minutes: number): number {
	if (!Number.isFinite(minutes)) {
		return EVENT_MATCH_DURATION.defaultMinutes;
	}

	if (minutes < EVENT_MATCH_DURATION.minMinutes) {
		return EVENT_MATCH_DURATION.minMinutes;
	}

	if (minutes > EVENT_MATCH_DURATION.maxMinutes) {
		return EVENT_MATCH_DURATION.maxMinutes;
	}

	return Math.floor(minutes);
}

export function matchClockIsStarted(
	match: Pick<MatchClockFields, "started_at" | "ended_at">,
): boolean {
	return match.ended_at === null && match.started_at !== null;
}

export function matchClockIsPaused(
	match: Pick<MatchClockFields, "paused_at" | "ended_at">,
): boolean {
	return match.ended_at === null && match.paused_at !== null;
}

export function matchClockFreezeAtMs(
	match: MatchClockFields,
	nowMs: number,
): number {
	if (match.paused_at) {
		return Date.parse(match.paused_at);
	}

	if (match.ended_at) {
		return Date.parse(match.ended_at);
	}

	return nowMs;
}

export function matchClockElapsedSeconds(
	match: MatchClockFields,
	nowMs: number,
): number {
	if (match.started_at === null) {
		return 0;
	}

	const freezeAt = matchClockFreezeAtMs(match, nowMs);
	const startedAt = Date.parse(match.started_at);
	if (!Number.isFinite(freezeAt) || !Number.isFinite(startedAt)) {
		return 0;
	}

	return Math.max(
		0,
		Math.floor((freezeAt - startedAt) / 1000) - match.pause_accumulated_seconds,
	);
}

export function formatMatchClock(totalSeconds: number): string {
	const safe = Math.max(0, Math.floor(totalSeconds));
	const minutes = Math.floor(safe / 60);
	const seconds = safe % 60;
	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function matchTeamStarName(
	players: readonly ChampionshipEventMatchPlayer[],
	teamId: number,
	roster: ReadonlyMap<number, MatchStarRosterPlayer>,
): string | null {
	const team = matchActiveTeamPlayers(players, teamId);
	const star = team.reduce<ChampionshipEventMatchPlayer | null>(
		(best, player) => {
			if (!best) {
				return player;
			}

			const playerRating = roster.get(player.player_id)?.rating ?? 0;
			const bestRating = roster.get(best.player_id)?.rating ?? 0;
			if (playerRating !== bestRating) {
				return playerRating > bestRating ? player : best;
			}

			if ((player.slot ?? 11) !== (best.slot ?? 11)) {
				return (player.slot ?? 11) < (best.slot ?? 11) ? player : best;
			}

			return player.player_id < best.player_id ? player : best;
		},
		null,
	);

	if (!star) {
		return null;
	}

	const named = roster.get(star.player_id);
	if (!named) {
		return star.display_name;
	}

	return playerVisibleName(named);
}

export function matchGoalForTeamA(
	goal: ChampionshipEventGoal,
	teamAPlayerIds: ReadonlySet<number>,
): boolean {
	const scorerInA = teamAPlayerIds.has(goal.scorer_player_id);
	if (goal.is_own_goal) {
		return !scorerInA;
	}

	return scorerInA;
}

export function matchGoalTimeline(
	goals: readonly ChampionshipEventGoal[],
): ChampionshipEventGoal[] {
	return [...goals].sort((left, right) => {
		const leftElapsed = left.elapsed_seconds;
		const rightElapsed = right.elapsed_seconds;
		if (leftElapsed !== null && rightElapsed !== null) {
			if (leftElapsed !== rightElapsed) {
				return leftElapsed - rightElapsed;
			}

			return left.id - right.id;
		}

		if (left.created_at !== right.created_at) {
			return left.created_at < right.created_at ? -1 : 1;
		}

		return left.id - right.id;
	});
}

export function lastMatchGoal(
	goals: readonly ChampionshipEventGoal[],
): ChampionshipEventGoal | null {
	const timeline = matchGoalTimeline(goals);
	return timeline[timeline.length - 1] ?? null;
}

export function eventMatchEndTitle(intent: EventMatchEndIntent): string {
	switch (intent) {
		case EVENT_MATCH_END_INTENT.end:
			return EVENT_MATCH_END_LABEL.title;
		case EVENT_MATCH_END_INTENT.next:
			return EVENT_MATCH_END_LABEL.nextTitle;
		default: {
			const _exhaustive: never = intent;
			return _exhaustive;
		}
	}
}

export function eventMatchEndConfirmLabel(intent: EventMatchEndIntent): string {
	switch (intent) {
		case EVENT_MATCH_END_INTENT.end:
			return EVENT_MATCH_END_LABEL.confirm;
		case EVENT_MATCH_END_INTENT.next:
			return EVENT_MATCH_END_LABEL.nextConfirm;
		default: {
			const _exhaustive: never = intent;
			return _exhaustive;
		}
	}
}

export function matchEndWinnerLabel(
	winnerTeamId: number | null,
	teamAId: number,
	nameA: string,
	nameB: string,
): string {
	if (winnerTeamId === teamAId) {
		return nameA;
	}

	if (winnerTeamId !== null) {
		return nameB;
	}

	return EVENT_MATCH_LABEL.draw;
}

export function formatGoalTimelineLine(values: {
	scorerName: string;
	assistName: string | null;
	isOwnGoal: boolean;
}): string {
	if (values.isOwnGoal) {
		return `${values.scorerName} · ${EVENT_GOAL_LABEL.ownGoal}`;
	}

	if (values.assistName) {
		return `${values.scorerName} · ${values.assistName}`;
	}

	return values.scorerName;
}

export function isOpenMatch(
	match: Pick<ChampionshipEventMatch, "ended_at">,
): boolean {
	return match.ended_at === null;
}
