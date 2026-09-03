import { eventTeamByPlayerId } from "./championship-event.ts";
import { eventTeamName } from "./event-team-color.ts";

export const EVENT_PLAYER_VOTE = {
	like: "like",
	dislike: "dislike",
	maintain: "maintain",
	defaultQuorum: 3,
	delta: 0.5,
} as const;

export const EVENT_PLAYER_VOTE_VALUE = {
	like: EVENT_PLAYER_VOTE.like,
	dislike: EVENT_PLAYER_VOTE.dislike,
	maintain: EVENT_PLAYER_VOTE.maintain,
} as const;

export type EventPlayerVoteChoice =
	(typeof EVENT_PLAYER_VOTE_VALUE)[keyof typeof EVENT_PLAYER_VOTE_VALUE];

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
	cannotVoteSelf: "Não dá para votar em si.",
	needPresent: "Só dono, capitão ou admin presente vota.",
	needEnded: "Voto só com a rodada encerrada.",
	closed: "Voto fechado",
	votesClosed: "Votação encerrada",
	closeVotes: "Encerrar votação",
	closeVotesFailed: "Não foi possível encerrar a votação",
	noTeam: "Sem time",
	back: "Voltar",
	goals: "G",
	assists: "A",
	appliedUp: "+0,5",
	appliedDown: "−0,5",
	voteFailed: "Não foi possível registrar o voto",
} as const;

export const EVENT_PLAYER_VOTE_ERROR_MESSAGE = {
	"not authenticated": "Faça login para votar",
	"not allowed": "Só dono, capitão ou admin presente pode votar",
	"event not found": "Rodada não encontrada",
	"event still open": "Voto só com a rodada encerrada",
	"invalid vote": "Voto inválido",
	"cannot vote self": "Não dá para votar em si",
	"voter not present": "Você precisa estar na presença",
	"player not present": "Jogador fora da presença",
	"vote closed": "Voto deste jogador já fechou",
	"player votes closed": "Votação encerrada",
} as const;

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

	if (
		likesAtQuorum &&
		likeCount > dislikeCount &&
		likeCount > maintainCount
	) {
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

export function canVoteEventPlayer(input: {
	canVote: boolean;
	eventEnded: boolean;
	votesClosed: boolean;
	voterPresent: boolean;
	targetPlayerId: number;
	voterPlayerId: number | null;
	voteRatingDelta: number;
}): boolean {
	if (!input.canVote || !input.eventEnded || input.votesClosed) {
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

	return input.voterPlayerId !== input.targetPlayerId;
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
