import {
	canEditEventPlayerBallot,
	canSetEventPlayerVoteDraft,
	canVoteEventPlayer,
	copyEventPlayerVoteLinkLabel,
	countEventPlayerVoteDraft,
	EVENT_PLAYER_VOTE,
	EVENT_PLAYER_VOTE_LABEL,
	EVENT_PLAYER_VOTE_STATUS,
	type EventPlayerVoteChoice,
	eventPlayerMonthlyCount,
	eventPlayerVoteAppliedDelta,
	eventPlayerVoteBudgetSummary,
	eventPlayerVoteChipLabel,
	eventPlayerVoteChoiceLabel,
	eventPlayerVoteDraftToSubmit,
	eventPlayerVoteErrorMessage,
	eventPlayerVoteStatus,
	eventPlayerVoteStatusLabel,
	eventPlayerVotesSubmittedLabel,
	eventPlayerVoteTeamSections,
	eventPlayerVoteUrl,
	initialEventPlayerBallotLocked,
	isEventPlayerVoteDraftDirty,
	isEventPlayerVoteLocked,
	isEventPlayerVotesVoided,
	nextEventPlayerVoteValue,
	ownerEventPlayerVoteCounts,
	ownerEventPlayerVotesSubmitted,
	savedEventPlayerVoteDraft,
} from "./event-player-vote.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

const quorum = EVENT_PLAYER_VOTE.defaultQuorum;

check(EVENT_PLAYER_VOTE.defaultQuorum === 3, "default quorum");
check(EVENT_PLAYER_VOTE.likeBudget === 5, "like budget");
check(EVENT_PLAYER_VOTE.dislikeBudget === 5, "dislike budget");
check(EVENT_PLAYER_VOTE.delta === 0.5, "delta");
check(EVENT_PLAYER_VOTE.ownerCountsPollMs === 4000, "owner counts poll");
check(
	ownerEventPlayerVoteCounts(false, [
		{ player_id: 1, likes: 2, dislikes: 1 },
	]) === null,
	"owner counts hidden",
);
check(
	ownerEventPlayerVoteCounts(true, [
		{ player_id: 1, likes: 2, dislikes: 1 },
	])?.get(1)?.likes === 2,
	"owner counts map likes",
);
check(ownerEventPlayerVotesSubmitted(false, 3) === null, "submitted hidden");
check(
	ownerEventPlayerVotesSubmitted(true, undefined) === null,
	"submitted pending",
);
check(ownerEventPlayerVotesSubmitted(true, 0) === 0, "submitted zero");
check(ownerEventPlayerVotesSubmitted(true, 4) === 4, "submitted four");
check(
	eventPlayerMonthlyCount([
		{ is_monthly: true, deleted_at: null },
		{ is_monthly: false, deleted_at: null },
		{ is_monthly: true, deleted_at: "x" },
		{ is_monthly: true },
	]) === 2,
	"monthly count",
);
check(
	eventPlayerVotesSubmittedLabel(3, 12) === "3 de 12 mensalistas votaram",
	"submitted label",
);
check(EVENT_PLAYER_VOTE.like === "like", "like");
check(EVENT_PLAYER_VOTE.dislike === "dislike", "dislike");
check(EVENT_PLAYER_VOTE.maintain === "maintain", "maintain");
check(EVENT_PLAYER_VOTE_LABEL.title === "Votar elenco", "title");
check(EVENT_PLAYER_VOTE_LABEL.appliedUp === "+0,5", "chip up");
check(EVENT_PLAYER_VOTE_LABEL.appliedDown === "−0,5", "chip down");
check(EVENT_PLAYER_VOTE_LABEL.noTeam === "Sem time", "no team label");
check(
	EVENT_PLAYER_VOTE_LABEL.reopenVotes === "Reabrir votação",
	"reopen votes label",
);
check(
	EVENT_PLAYER_VOTE_LABEL.reopenVotesHint ===
		"Apaga os votos da rodada e abre a urna de novo.",
	"reopen votes hint",
);
check(
	EVENT_PLAYER_VOTE_LABEL.reopenVotesFailed ===
		"Não foi possível reabrir a votação",
	"reopen votes failed",
);
check(
	EVENT_PLAYER_VOTE_LABEL.cancelVotesHint ===
		"Notas voltam ao valor pré-voto. Os votos ficam gravados até reabrir.",
	"cancel votes hint",
);

check(
	eventPlayerVoteTeamSections(
		[{ player_id: 1 }, { player_id: 2 }, { player_id: 3 }],
		[
			{
				id: 10,
				color: "#dc2626",
				sort_order: 1,
				players: [{ player_id: 2 }],
			},
			{
				id: 9,
				color: "#2563eb",
				sort_order: 0,
				players: [{ player_id: 1 }],
			},
		],
	)
		.map(
			(section) =>
				`${section.title}:${section.rows.map((row) => row.player_id).join("-")}`,
		)
		.join("|") === "Azul:1|Vermelho:2|Sem time:3",
	"sections by team",
);
check(
	EVENT_PLAYER_VOTE_LABEL.needPresent.includes("dono") &&
		EVENT_PLAYER_VOTE_LABEL.needPresent.includes("mensalista"),
	"need present roles",
);

check(eventPlayerVoteAppliedDelta(0, 0, 0, quorum) === 0, "empty");
check(eventPlayerVoteAppliedDelta(2, 0, 0, quorum) === 0, "likes below quorum");
check(eventPlayerVoteAppliedDelta(3, 0, 0, quorum) === 0.5, "3 likes");
check(eventPlayerVoteAppliedDelta(5, 2, 0, quorum) === 0.5, "likes win");
check(eventPlayerVoteAppliedDelta(0, 3, 0, quorum) === -0.5, "3 dislikes");
check(eventPlayerVoteAppliedDelta(2, 5, 0, quorum) === -0.5, "dislikes win");
check(eventPlayerVoteAppliedDelta(3, 3, 0, quorum) === 0, "both quorum tied");
check(
	eventPlayerVoteAppliedDelta(3, 0, 3, quorum) === 0,
	"like blocked by maintain",
);
check(
	eventPlayerVoteAppliedDelta(4, 0, 3, quorum) === 0.5,
	"like beats maintain",
);
check(
	eventPlayerVoteAppliedDelta(0, 3, 3, quorum) === 0,
	"dislike blocked by maintain",
);
check(
	eventPlayerVoteAppliedDelta(3, 0, 2, quorum) === 0.5,
	"like beats lower maintain",
);
check(eventPlayerVoteAppliedDelta(4, 0, 0, 5) === 0, "custom quorum not met");
check(eventPlayerVoteAppliedDelta(5, 0, 0, 5) === 0.5, "custom quorum met");

const draft = new Map<number, EventPlayerVoteChoice | null>([
	[1, "like"],
	[2, "like"],
	[3, "dislike"],
]);
check(countEventPlayerVoteDraft(draft, "like") === 2, "draft like count");
check(countEventPlayerVoteDraft(draft, "dislike") === 1, "draft dislike count");
check(
	canSetEventPlayerVoteDraft(draft, 4, "like"),
	"can add like under budget",
);
check(
	!canSetEventPlayerVoteDraft(
		new Map([
			[1, "like"],
			[2, "like"],
			[3, "like"],
			[4, "like"],
			[5, "like"],
		]),
		6,
		"like",
	),
	"like budget blocks",
);
check(
	eventPlayerVoteBudgetSummary(draft) === "Likes 2/5 · Dislikes 1/5",
	"budget summary",
);
check(
	isEventPlayerVoteDraftDirty(
		new Map([[1, "like"]]),
		new Map([[1, "dislike"]]),
	),
	"draft dirty",
);
check(
	!isEventPlayerVoteDraftDirty(
		savedEventPlayerVoteDraft(new Map([[1, "like"]])),
		new Map([[1, "like"]]),
	),
	"draft clean",
);
check(
	eventPlayerVoteDraftToSubmit(
		new Map([
			[1, "like"],
			[2, null],
		]),
	).length === 1,
	"draft submit payload",
);
check(
	eventPlayerVoteErrorMessage("like budget exceeded") === "No máximo 5 likes",
	"like budget error",
);
check(
	eventPlayerVoteErrorMessage("dislike budget exceeded") ===
		"No máximo 5 dislikes",
	"dislike budget error",
);

check(eventPlayerVoteChipLabel(0.5) === "+0,5", "chip +");
check(eventPlayerVoteChipLabel(-0.5) === "−0,5", "chip -");
check(eventPlayerVoteChipLabel(0) === null, "chip none");
check(eventPlayerVoteChipLabel(0.1) === null, "chip ignore");

check(!isEventPlayerVoteLocked(0), "open when zero");
check(isEventPlayerVoteLocked(0.5), "locked up");
check(isEventPlayerVoteLocked(-0.5), "locked down");

check(
	canVoteEventPlayer({
		canVote: true,
		eventEnded: true,
		votesClosed: false,
		voterPresent: true,
		targetPlayerId: 2,
		voterPlayerId: 1,
		voteRatingDelta: 0,
	}),
	"can vote other",
);
check(
	canVoteEventPlayer({
		canVote: true,
		eventEnded: true,
		votesClosed: false,
		voterPresent: true,
		targetPlayerId: 1,
		voterPlayerId: 1,
		voteRatingDelta: 0,
	}),
	"can vote self",
);
check(
	!canVoteEventPlayer({
		canVote: true,
		eventEnded: true,
		votesClosed: false,
		voterPresent: true,
		targetPlayerId: 1,
		voterPlayerId: 1,
		voteRatingDelta: 0,
		allowSelfVote: false,
	}),
	"flag blocks vote self",
);
check(
	!canVoteEventPlayer({
		canVote: false,
		eventEnded: true,
		votesClosed: false,
		voterPresent: true,
		targetPlayerId: 2,
		voterPlayerId: 1,
		voteRatingDelta: 0,
	}),
	"member cannot vote",
);
check(
	!canVoteEventPlayer({
		canVote: true,
		eventEnded: true,
		votesClosed: false,
		voterPresent: false,
		targetPlayerId: 2,
		voterPlayerId: 1,
		voteRatingDelta: 0,
	}),
	"absent cannot vote",
);
check(
	!canVoteEventPlayer({
		canVote: true,
		eventEnded: false,
		votesClosed: false,
		voterPresent: true,
		targetPlayerId: 2,
		voterPlayerId: 1,
		voteRatingDelta: 0,
	}),
	"open event cannot vote",
);
check(
	!canVoteEventPlayer({
		canVote: true,
		eventEnded: true,
		votesClosed: false,
		voterPresent: true,
		targetPlayerId: 2,
		voterPlayerId: null,
		voteRatingDelta: 0,
	}),
	"no player id",
);
check(
	!canVoteEventPlayer({
		canVote: true,
		eventEnded: true,
		votesClosed: false,
		voterPresent: true,
		targetPlayerId: 2,
		voterPlayerId: 1,
		voteRatingDelta: 0.5,
	}),
	"locked after quorum like",
);
check(
	!canVoteEventPlayer({
		canVote: true,
		eventEnded: true,
		votesClosed: false,
		voterPresent: true,
		targetPlayerId: 2,
		voterPlayerId: 1,
		voteRatingDelta: -0.5,
	}),
	"locked after quorum dislike",
);

check(
	eventPlayerVoteUrl(
		"https://app.test",
		10,
		20,
		"/championships/$championshipId/events/$eventId/vote",
	) === "https://app.test/championships/10/events/20/vote",
	"url",
);

check(
	copyEventPlayerVoteLinkLabel(false) === EVENT_PLAYER_VOTE_LABEL.copyLink,
	"copy label",
);
check(
	copyEventPlayerVoteLinkLabel(true) === EVENT_PLAYER_VOTE_LABEL.copied,
	"copied label",
);

check(nextEventPlayerVoteValue(null, "like") === "like", "press like");
check(nextEventPlayerVoteValue("like", "like") === null, "toggle off like");
check(
	nextEventPlayerVoteValue("like", "dislike") === "dislike",
	"switch to dislike",
);
check(
	nextEventPlayerVoteValue("dislike", "dislike") === null,
	"toggle off dislike",
);
check(
	nextEventPlayerVoteValue(null, "maintain") === "maintain",
	"press maintain",
);
check(
	nextEventPlayerVoteValue("maintain", "maintain") === null,
	"toggle off maintain",
);
check(
	nextEventPlayerVoteValue("like", "maintain") === "maintain",
	"switch to maintain",
);

check(
	!canVoteEventPlayer({
		canVote: true,
		eventEnded: true,
		votesClosed: true,
		voterPresent: true,
		targetPlayerId: 2,
		voterPlayerId: 1,
		voteRatingDelta: 0,
	}),
	"votes closed blocks vote",
);
check(
	!canVoteEventPlayer({
		canVote: true,
		eventEnded: true,
		votesClosed: false,
		votesVoided: true,
		voterPresent: true,
		targetPlayerId: 2,
		voterPlayerId: 1,
		voteRatingDelta: 0,
	}),
	"votes voided blocks vote",
);
check(isEventPlayerVotesVoided("2026-09-03T12:00:00Z"), "voided true");
check(!isEventPlayerVotesVoided(null), "voided false");
check(
	eventPlayerVoteStatus({
		playerVotesClosedAt: null,
		playerVotesVoidedAt: null,
	}) === EVENT_PLAYER_VOTE_STATUS.open,
	"status open",
);
check(
	eventPlayerVoteStatus({
		playerVotesClosedAt: "2026-09-03T12:00:00Z",
		playerVotesVoidedAt: null,
	}) === EVENT_PLAYER_VOTE_STATUS.closed,
	"status closed",
);
check(
	eventPlayerVoteStatus({
		playerVotesClosedAt: "2026-09-03T12:00:00Z",
		playerVotesVoidedAt: "2026-09-03T13:00:00Z",
	}) === EVENT_PLAYER_VOTE_STATUS.voided,
	"status voided wins",
);
check(
	eventPlayerVoteStatusLabel(EVENT_PLAYER_VOTE_STATUS.voided) ===
		EVENT_PLAYER_VOTE_LABEL.statusVoided,
	"status voided label",
);
check(
	eventPlayerVoteErrorMessage("player votes closed") ===
		EVENT_PLAYER_VOTE_LABEL.votesClosed,
	"player votes closed error",
);
check(
	eventPlayerVoteErrorMessage("player votes voided") ===
		EVENT_PLAYER_VOTE_LABEL.votesVoided,
	"player votes voided error",
);
check(
	eventPlayerVoteErrorMessage("votes not voided") ===
		"A votação não está cancelada",
	"votes not voided error",
);

check(
	eventPlayerVoteErrorMessage("cannot vote self") === "Não dá para votar em si",
	"cannot vote self error",
);
check(
	eventPlayerVoteErrorMessage("not allowed") ===
		"Só dono, capitão, admin presente ou mensalista pode votar",
	"not allowed error",
);
check(
	eventPlayerVoteErrorMessage("vote closed") === "Voto deste jogador já fechou",
	"vote closed error",
);
check(
	eventPlayerVoteErrorMessage("event still open") ===
		"Voto só com a rodada encerrada",
	"event open error",
);
check(
	eventPlayerVoteErrorMessage("weird") === EVENT_PLAYER_VOTE_LABEL.voteFailed,
	"error fallback",
);

check(initialEventPlayerBallotLocked(0) === false, "ballot unlocked empty");
check(initialEventPlayerBallotLocked(2) === true, "ballot locked with votes");
check(
	canEditEventPlayerBallot({ ballotLocked: true, canSubmitVotes: true }),
	"can edit when locked and open",
);
check(
	!canEditEventPlayerBallot({ ballotLocked: true, canSubmitVotes: false }),
	"cannot edit when closed",
);
check(
	!canEditEventPlayerBallot({ ballotLocked: false, canSubmitVotes: true }),
	"no edit button while editing",
);
check(eventPlayerVoteChoiceLabel("like") === "Like", "choice like label");
check(
	!canVoteEventPlayer({
		canVote: true,
		eventEnded: true,
		votesClosed: false,
		voterPresent: true,
		targetPlayerId: 2,
		voterPlayerId: 1,
		voteRatingDelta: 0,
		votingEnabled: false,
	}),
	"votingEnabled false blocks",
);

console.log("event-player-vote.check.ts: ok");
