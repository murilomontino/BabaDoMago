import { eventTeamByPlayerId } from "./championship-event.ts";
import { eventTeamName } from "./event-team-color.ts";

export const EVENT_PLAYER_VOTE = {
	like: "like",
	dislike: "dislike",
	maintain: "maintain",
	defaultQuorum: 3,
	likeBudget: 5,
	dislikeBudget: 5,
	delta: 0.5,
	ownerCountsPollMs: 4000,
} as const;

export const EVENT_PLAYER_VOTE_VALUE = {
	like: EVENT_PLAYER_VOTE.like,
	dislike: EVENT_PLAYER_VOTE.dislike,
	maintain: EVENT_PLAYER_VOTE.maintain,
} as const;

export type EventPlayerVoteChoice =
	(typeof EVENT_PLAYER_VOTE_VALUE)[keyof typeof EVENT_PLAYER_VOTE_VALUE];

export type EventPlayerVoteCount = {
	likes: number;
	dislikes: number;
};

export const EVENT_PLAYER_VOTE_LABEL = {
	title: "Votar elenco",
	open: "Votar elenco",
	copyLink: "Copiar link da votação",
	copied: "Link copiado.",
	like: "Like",
	dislike: "Dislike",
	maintain: "Manter",
	clear: "Limpar voto",
	empty: "Ninguém na presença.",
	needPresent: "Só dono, capitão, admin presente ou mensalista vota.",
	cannotVoteSelf: "Não dá para votar em si.",
	needEnded: "Voto só com a rodada encerrada.",
	closed: "Voto fechado",
	votesClosed: "Votação encerrada",
	closeVotes: "Encerrar votação",
	closeVotesFailed: "Não foi possível encerrar a votação",
	historyTitle: "Histórico de votação",
	historyEmpty: "Nenhuma rodada encerrada.",
	statusOpen: "Aberta",
	statusClosed: "Encerrada",
	statusVoided: "Cancelada",
	openHistory: "Abrir",
	cancelVotes: "Cancelar efeito",
	cancelVotesHint:
		"Notas voltam ao valor pré-voto. Os votos ficam gravados até reabrir.",
	cancelVotesFailed: "Não foi possível cancelar o efeito",
	reopenVotes: "Reabrir votação",
	reopenVotesHint: "Apaga os votos da rodada e abre a urna de novo.",
	reopenVotesFailed: "Não foi possível reabrir a votação",
	votesVoided: "Efeito da votação cancelado",
	noTeam: "Sem time",
	back: "Voltar",
	goals: "G",
	assists: "A",
	appliedUp: "+0,5",
	appliedDown: "−0,5",
	voteFailed: "Não foi possível registrar o voto",
	submitVotes: "Enviar votos",
	submitVotesFailed: "Não foi possível enviar os votos",
	votesSubmitted: "Votos enviados",
	votersSubmitted: "{submitted} de {monthly} mensalistas votaram",
	editVotes: "Alterar votos",
	likeBudget: "Likes",
	dislikeBudget: "Dislikes",
} as const;

export const EVENT_PLAYER_VOTE_ERROR_MESSAGE = {
	"not authenticated": "Faça login para votar",
	"not allowed": "Só dono, capitão, admin presente ou mensalista pode votar",
	"event not found": "Rodada não encontrada",
	"event still open": "Voto só com a rodada encerrada",
	"invalid vote": "Voto inválido",
	"cannot vote self": "Não dá para votar em si",
	"voter not present": "Você precisa estar na presença",
	"player not present": "Jogador fora da presença",
	"vote closed": "Voto deste jogador já fechou",
	"player votes closed": "Votação encerrada",
	"player votes voided": "Efeito da votação cancelado",
	"votes not voided": "A votação não está cancelada",
	"like budget exceeded": "No máximo 5 likes",
	"dislike budget exceeded": "No máximo 5 dislikes",
} as const;

export const EVENT_PLAYER_VOTE_STATUS = {
	open: "open",
	closed: "closed",
	voided: "voided",
} as const;

export type EventPlayerVoteStatus =
	(typeof EVENT_PLAYER_VOTE_STATUS)[keyof typeof EVENT_PLAYER_VOTE_STATUS];

export function eventPlayerVoteErrorMessage(message: string): string {
	const known =
		EVENT_PLAYER_VOTE_ERROR_MESSAGE[
			message as keyof typeof EVENT_PLAYER_VOTE_ERROR_MESSAGE
		];
	if (known) {
		return known;
	}

	return EVENT_PLAYER_VOTE_LABEL.voteFailed;
}

export function eventPlayerVoteAppliedDelta(
	likeCount: number,
	dislikeCount: number,
	maintainCount: number,
	quorum: number,
): number {
	const likesAtQuorum = likeCount >= quorum;
	const dislikesAtQuorum = dislikeCount >= quorum;

	if (likesAtQuorum && likeCount > dislikeCount && likeCount > maintainCount) {
		return EVENT_PLAYER_VOTE.delta;
	}

	if (
		dislikesAtQuorum &&
		dislikeCount > likeCount &&
		dislikeCount > maintainCount
	) {
		return -EVENT_PLAYER_VOTE.delta;
	}

	return 0;
}

export function eventPlayerVoteChipLabel(
	voteRatingDelta: number,
): string | null {
	if (voteRatingDelta === EVENT_PLAYER_VOTE.delta) {
		return EVENT_PLAYER_VOTE_LABEL.appliedUp;
	}

	if (voteRatingDelta === -EVENT_PLAYER_VOTE.delta) {
		return EVENT_PLAYER_VOTE_LABEL.appliedDown;
	}

	return null;
}

export function isEventPlayerVoteLocked(voteRatingDelta: number): boolean {
	return voteRatingDelta !== 0;
}

export function isEventPlayerVotesClosed(
	playerVotesClosedAt: string | null,
): boolean {
	return playerVotesClosedAt !== null;
}

export function isEventPlayerVotesVoided(
	playerVotesVoidedAt: string | null | undefined,
): boolean {
	return playerVotesVoidedAt != null;
}

export function eventPlayerVoteStatus(input: {
	playerVotesClosedAt: string | null | undefined;
	playerVotesVoidedAt: string | null | undefined;
}): EventPlayerVoteStatus {
	if (isEventPlayerVotesVoided(input.playerVotesVoidedAt)) {
		return EVENT_PLAYER_VOTE_STATUS.voided;
	}

	if (isEventPlayerVotesClosed(input.playerVotesClosedAt ?? null)) {
		return EVENT_PLAYER_VOTE_STATUS.closed;
	}

	return EVENT_PLAYER_VOTE_STATUS.open;
}

export function eventPlayerVoteStatusLabel(
	status: EventPlayerVoteStatus,
): string {
	switch (status) {
		case EVENT_PLAYER_VOTE_STATUS.open:
			return EVENT_PLAYER_VOTE_LABEL.statusOpen;
		case EVENT_PLAYER_VOTE_STATUS.closed:
			return EVENT_PLAYER_VOTE_LABEL.statusClosed;
		case EVENT_PLAYER_VOTE_STATUS.voided:
			return EVENT_PLAYER_VOTE_LABEL.statusVoided;
		default: {
			const _exhaustive: never = status;
			return _exhaustive;
		}
	}
}

export function canVoteEventPlayer(input: {
	canVote: boolean;
	eventEnded: boolean;
	votesClosed: boolean;
	votesVoided?: boolean;
	voterPresent: boolean;
	targetPlayerId: number;
	voterPlayerId: number | null;
	voteRatingDelta: number;
	votingEnabled?: boolean;
	allowSelfVote?: boolean;
}): boolean {
	if (input.votingEnabled === false) {
		return false;
	}

	if (
		!input.canVote ||
		!input.eventEnded ||
		input.votesClosed ||
		input.votesVoided
	) {
		return false;
	}

	if (input.voterPlayerId === null) {
		return false;
	}

	if (!input.voterPresent) {
		return false;
	}

	if (isEventPlayerVoteLocked(input.voteRatingDelta)) {
		return false;
	}

	if (input.allowSelfVote === false) {
		return input.voterPlayerId !== input.targetPlayerId;
	}

	return true;
}

export function ownerEventPlayerVoteCounts(
	isOwner: boolean,
	rows:
		| readonly {
				player_id: number;
				likes: number;
				dislikes: number;
		  }[]
		| undefined,
): Map<number, EventPlayerVoteCount> | null {
	if (!isOwner || !rows) {
		return null;
	}

	return new Map(
		rows.map((row) => [
			row.player_id,
			{ likes: row.likes, dislikes: row.dislikes },
		]),
	);
}

export function ownerEventPlayerVotesSubmitted(
	isOwner: boolean,
	submitted: number | undefined,
): number | null {
	if (!isOwner || submitted === undefined) {
		return null;
	}

	return submitted;
}

export function eventPlayerMonthlyCount(
	players: readonly {
		is_monthly?: boolean | null;
		deleted_at?: string | null;
	}[],
): number {
	return players.filter(
		(player) => player.is_monthly === true && !player.deleted_at,
	).length;
}

export function eventPlayerVotesSubmittedLabel(
	submitted: number,
	monthly: number,
): string {
	return EVENT_PLAYER_VOTE_LABEL.votersSubmitted
		.replace("{submitted}", String(submitted))
		.replace("{monthly}", String(monthly));
}

export function initialEventPlayerBallotLocked(
	savedVoteCount: number,
): boolean {
	return savedVoteCount > 0;
}

export function canEditEventPlayerBallot(input: {
	ballotLocked: boolean;
	canSubmitVotes: boolean;
}): boolean {
	return input.ballotLocked && input.canSubmitVotes;
}

export function eventPlayerVoteChoiceLabel(
	choice: EventPlayerVoteChoice,
): string {
	switch (choice) {
		case EVENT_PLAYER_VOTE.like:
			return EVENT_PLAYER_VOTE_LABEL.like;
		case EVENT_PLAYER_VOTE.dislike:
			return EVENT_PLAYER_VOTE_LABEL.dislike;
		case EVENT_PLAYER_VOTE.maintain:
			return EVENT_PLAYER_VOTE_LABEL.maintain;
		default: {
			const _exhaustive: never = choice;
			return _exhaustive;
		}
	}
}

export function eventPlayerVoteUrl(
	origin: string,
	championshipId: number,
	eventId: number,
	votePath: string,
): string {
	return `${origin}${votePath
		.replace("$championshipId", String(championshipId))
		.replace("$eventId", String(eventId))}`;
}

export function copyEventPlayerVoteLinkLabel(copied: boolean): string {
	if (copied) {
		return EVENT_PLAYER_VOTE_LABEL.copied;
	}

	return EVENT_PLAYER_VOTE_LABEL.copyLink;
}

export function nextEventPlayerVoteValue(
	current: EventPlayerVoteChoice | null,
	pressed: EventPlayerVoteChoice,
): EventPlayerVoteChoice | null {
	if (current === pressed) {
		return null;
	}

	return pressed;
}

export type EventPlayerVoteDraft = ReadonlyMap<
	number,
	EventPlayerVoteChoice | null
>;

export function countEventPlayerVoteDraft(
	draft: EventPlayerVoteDraft,
	choice: typeof EVENT_PLAYER_VOTE.like | typeof EVENT_PLAYER_VOTE.dislike,
): number {
	let count = 0;
	for (const value of draft.values()) {
		if (value === choice) {
			count += 1;
		}
	}

	return count;
}

export function canSetEventPlayerVoteDraft(
	draft: EventPlayerVoteDraft,
	targetPlayerId: number,
	nextValue: EventPlayerVoteChoice | null,
): boolean {
	if (nextValue === null) {
		return true;
	}

	const simulated = new Map(draft);
	simulated.set(targetPlayerId, nextValue);

	return (
		countEventPlayerVoteDraft(simulated, EVENT_PLAYER_VOTE.like) <=
			EVENT_PLAYER_VOTE.likeBudget &&
		countEventPlayerVoteDraft(simulated, EVENT_PLAYER_VOTE.dislike) <=
			EVENT_PLAYER_VOTE.dislikeBudget
	);
}

export function isEventPlayerVoteDraftDirty(
	draft: EventPlayerVoteDraft,
	saved: ReadonlyMap<number, EventPlayerVoteChoice>,
): boolean {
	const targetIds = new Set([...draft.keys(), ...saved.keys()]);

	for (const targetId of targetIds) {
		const draftValue = draft.get(targetId) ?? null;
		const savedValue = saved.get(targetId) ?? null;
		if (draftValue !== savedValue) {
			return true;
		}
	}

	return false;
}

export function eventPlayerVoteDraftToSubmit(
	draft: EventPlayerVoteDraft,
): { target_player_id: number; value: EventPlayerVoteChoice }[] {
	return [...draft.entries()].flatMap(([targetPlayerId, value]) => {
		if (!value) {
			return [];
		}

		return [{ target_player_id: targetPlayerId, value }];
	});
}

export function eventPlayerVoteBudgetSummary(
	draft: EventPlayerVoteDraft,
): string {
	const likes = countEventPlayerVoteDraft(draft, EVENT_PLAYER_VOTE.like);
	const dislikes = countEventPlayerVoteDraft(draft, EVENT_PLAYER_VOTE.dislike);

	return `${EVENT_PLAYER_VOTE_LABEL.likeBudget} ${likes}/${EVENT_PLAYER_VOTE.likeBudget} · ${EVENT_PLAYER_VOTE_LABEL.dislikeBudget} ${dislikes}/${EVENT_PLAYER_VOTE.dislikeBudget}`;
}

export function savedEventPlayerVoteDraft(
	saved: ReadonlyMap<number, EventPlayerVoteChoice>,
): Map<number, EventPlayerVoteChoice | null> {
	return new Map(
		[...saved.entries()].map(([targetPlayerId, value]) => [
			targetPlayerId,
			value,
		]),
	);
}

export type EventPlayerVoteTeamSection = {
	teamId: number | null;
	color: string | null;
	sortOrder: number;
	title: string;
	rows: readonly { player_id: number }[];
};

export function eventPlayerVoteTeamSections<T extends { player_id: number }>(
	attendance: readonly T[],
	teams: readonly {
		id: number;
		color: string | null;
		sort_order: number;
		players: readonly { player_id: number }[];
	}[],
): EventPlayerVoteTeamSection[] {
	const teamByPlayerId = eventTeamByPlayerId(teams);
	const assignedIds = new Set<number>();
	const sortedTeams = [...teams].sort(
		(left, right) => left.sort_order - right.sort_order,
	);

	const sections = sortedTeams.flatMap((team) => {
		const slots = new Map(
			team.players.map((player, slot) => [player.player_id, slot] as const),
		);
		const rows = attendance
			.filter((row) => slots.has(row.player_id))
			.sort(
				(left, right) =>
					(slots.get(left.player_id) ?? 0) - (slots.get(right.player_id) ?? 0),
			);

		if (rows.length === 0) {
			return [];
		}

		for (const row of rows) {
			assignedIds.add(row.player_id);
		}

		return [
			{
				teamId: team.id,
				color: team.color,
				sortOrder: team.sort_order,
				title: eventTeamName(team.color, team.sort_order),
				rows,
			},
		];
	});

	const unassigned = attendance.filter(
		(row) =>
			!teamByPlayerId.has(row.player_id) && !assignedIds.has(row.player_id),
	);
	if (unassigned.length === 0) {
		return sections;
	}

	return [
		...sections,
		{
			teamId: null,
			color: null,
			sortOrder: Number.MAX_SAFE_INTEGER,
			title: EVENT_PLAYER_VOTE_LABEL.noTeam,
			rows: unassigned,
		},
	];
}
