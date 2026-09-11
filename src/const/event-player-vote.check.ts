import {
	canEditEventPlayerBallot,
	canOpenEventPlayerVoteShortcut,
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
	eventPlayerVoteDisplayRating,
	eventPlayerVoteDraftToSubmit,
	eventPlayerVoteErrorMessage,
	eventPlayerVoteLockedTargetIds,
	eventPlayerVoteListEntriesForRow,
	eventPlayerVoteParticipantEligible,
	eventPlayerVoteShowsSavedChoice,
	eventPlayerVoteStatus,
	eventPlayerVoteStatusLabel,
	eventPlayerVotesSubmittedLabel,
	eventPlayerVoteTargetFromKey,
	eventPlayerVoteTargetKey,
	eventPlayerVoteTargets,
	eventPlayerVoteTeamSections,
	eventPlayerVoteTrackDelta,
	eventPlayerVoteTrackEligible,
	eventPlayerVoteTrackLabel,
	eventPlayerVoteTotalMatches,
	eventPlayerVoteUrl,
	initialEventPlayerBallotLocked,
	isEventPlayerVoteDraftDirty,
	isEventPlayerVoteLocked,
	isEventPlayerVotesVoided,
	latestOpenEventPlayerVoteEvent,
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
		{ player_id: 1, track: "line", likes: 2, dislikes: 1 },
	]) === null,
	"owner counts hidden",
);
check(
	ownerEventPlayerVoteCounts(true, [
		{ player_id: 1, track: "line", likes: 2, dislikes: 1 },
		{ player_id: 1, track: "goalkeeper", likes: 1, dislikes: 0 },
	])?.get("1:line")?.likes === 2,
	"owner counts map likes by track",
);
check(
	ownerEventPlayerVoteCounts(true, [
		{ player_id: 1, track: "line", likes: 2, dislikes: 1 },
		{ player_id: 1, track: "goalkeeper", likes: 1, dislikes: 0 },
	])?.get("1:goalkeeper")?.likes === 1,
	"owner counts gk separate from line",
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
check(EVENT_PLAYER_VOTE.blank === "blank", "blank");
check(EVENT_PLAYER_VOTE_LABEL.blank === "Não votar", "blank label");
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

const lineKey = (playerId: number) =>
	eventPlayerVoteTargetKey(playerId, "line");
const gkKey = (playerId: number) =>
	eventPlayerVoteTargetKey(playerId, "goalkeeper");

check(lineKey(7) === "7:line", "line target key");
check(gkKey(7) === "7:goalkeeper", "goalkeeper target key");
check(eventPlayerVoteTargetFromKey("7:line")?.playerId === 7, "key player id");
check(
	eventPlayerVoteTargetFromKey("7:goalkeeper")?.track === "goalkeeper",
	"key track",
);
check(eventPlayerVoteTargetFromKey("7:keeper") === null, "key bad track");
check(eventPlayerVoteTargetFromKey("x:line") === null, "key bad player");
check(eventPlayerVoteTrackLabel("line") === "Como jogador", "track line label");
check(
	eventPlayerVoteTrackLabel("goalkeeper") === "Como goleiro",
	"track goalkeeper label",
);
check(eventPlayerVoteTrackEligible(3, 3), "track eligible at min");
check(!eventPlayerVoteTrackEligible(2, 3), "track below min");
check(
	eventPlayerVoteTrackDelta(
		{ vote_rating_delta: 0.5, goalkeeper_vote_rating_delta: -0.5 },
		"goalkeeper",
	) === -0.5,
	"track delta goalkeeper",
);
check(
	eventPlayerVoteTrackDelta({ vote_rating_delta: 0.5 }, "line") === 0.5,
	"track delta line",
);
check(
	eventPlayerVoteTotalMatches({
		player_id: 1,
		line_matches: 3,
		gk_matches: 2,
	}) === 5,
	"total matches sum tracks",
);
check(
	eventPlayerVoteParticipantEligible(
		{ player_id: 1, line_matches: 3, gk_matches: 2 },
		5,
	),
	"sum 5 enables",
);
check(
	!eventPlayerVoteParticipantEligible(
		{ player_id: 1, line_matches: 0, gk_matches: 1 },
		5,
	),
	"one gk match stays out",
);
check(
	eventPlayerVoteTargets([{ player_id: 1, line_matches: 3, gk_matches: 2 }], 5)
		.map((target) => target.key)
		.join("|") === "1:line",
	"sum 5 enables; only line has 3+ for card",
);
check(
	eventPlayerVoteTargets([{ player_id: 1, line_matches: 2, gk_matches: 3 }], 5)
		.map((target) => target.key)
		.join("|") === "1:goalkeeper",
	"sum 5 enables; only gk has 3+ for card",
);
check(
	eventPlayerVoteTargets([{ player_id: 1, line_matches: 3, gk_matches: 3 }], 5)
		.map((target) => target.key)
		.join("|") === "1:line|1:goalkeeper",
	"sum and both tracks at 3 show both cards",
);
check(
	eventPlayerVoteTargets([{ player_id: 1, line_matches: 2, gk_matches: 4 }], 3)
		.map((target) => target.key)
		.join("|") === "1:goalkeeper",
	"sum ok; line below 3 hides line card",
);
check(
	eventPlayerVoteTargets([{ player_id: 1, line_matches: 0, gk_matches: 1 }], 5)
		.length === 0,
	"one gk match hides card",
);
check(
	eventPlayerVoteTargets([{ player_id: 1, line_matches: 1, gk_matches: 1 }], 3)
		.length === 0,
	"sum below min hides",
);
check(
	eventPlayerVoteTargets([{ player_id: 1, line_matches: 5, gk_matches: 0 }], 5)
		.map((target) => target.key)
		.join("|") === "1:line",
	"only line when sum and track floor ok",
);
check(
	eventPlayerVoteListEntriesForRow(
		{ player_id: 1, line_matches: 3, gk_matches: 2 },
		5,
	)
		.map((entry) => `${entry.kind}:${entry.track}`)
		.join("|") === "eligible:line",
	"list only line card when gk below 3",
);
check(
	eventPlayerVoteListEntriesForRow(
		{ player_id: 1, line_matches: 0, gk_matches: 1 },
		5,
	).length === 0,
	"list hides single gk below sum",
);
check(
	eventPlayerVoteTargets([{ player_id: 1, matches: 4, is_goalkeeper: true }], 3)
		.map((target) => target.key)
		.join("|") === "1:goalkeeper",
	"legacy goalkeeper fallback",
);
check(
	eventPlayerVoteTargets([{ player_id: 1, matches: 4 }], 3)
		.map((target) => target.key)
		.join("|") === "1:line",
	"legacy line fallback",
);
check(
	eventPlayerVoteTargets([{ player_id: 1, matches: 1 }], 3).length === 0,
	"legacy below min",
);
check(
	eventPlayerVoteTargets(
		[{ player_id: 1, matches: 5, line_matches: 0, gk_matches: 0 }],
		3,
	)
		.map((target) => target.key)
		.join("|") === "1:line",
	"zero split falls back to totals",
);
check(
	eventPlayerVoteTargets(
		[
			{
				player_id: 1,
				matches: 5,
				line_matches: 0,
				gk_matches: 0,
				is_goalkeeper: true,
			},
		],
		3,
	)
		.map((target) => target.key)
		.join("|") === "1:goalkeeper",
	"zero split goalkeeper fallback",
);
check(
	eventPlayerVoteTargets([{ player_id: 1, line_matches: 2, gk_matches: 1 }], 3)
		.length === 0,
	"sum ok but no track reaches card floor 3",
);
check(
	eventPlayerVoteTargets([{ player_id: 1, line_matches: 4, gk_matches: 1 }], 5)
		.map((target) => target.key)
		.join("|") === "1:line",
	"4+1 min 5 hides gk card with 1 match",
);

const draft = new Map<string, EventPlayerVoteChoice | null>([
	[lineKey(1), "like"],
	[lineKey(2), "like"],
	[gkKey(3), "dislike"],
]);
check(countEventPlayerVoteDraft(draft, "like") === 2, "draft like count");
check(countEventPlayerVoteDraft(draft, "dislike") === 1, "draft dislike count");
check(
	canSetEventPlayerVoteDraft(draft, lineKey(4), "like"),
	"can add like under budget",
);
check(
	!canSetEventPlayerVoteDraft(
		new Map([
			[lineKey(1), "like"],
			[lineKey(2), "like"],
			[lineKey(3), "like"],
			[gkKey(3), "like"],
			[lineKey(5), "like"],
		]),
		lineKey(6),
		"like",
	),
	"like budget blocks across tracks",
);
check(
	eventPlayerVoteBudgetSummary(draft) === "Likes 2/5 · Dislikes 1/5",
	"budget summary",
);
check(
	isEventPlayerVoteDraftDirty(
		new Map([[lineKey(1), "like"]]),
		new Map([[lineKey(1), "dislike"]]),
	),
	"draft dirty",
);
check(
	!isEventPlayerVoteDraftDirty(
		savedEventPlayerVoteDraft(new Map([[lineKey(1), "like"]])),
		new Map([[lineKey(1), "like"]]),
	),
	"draft clean",
);
check(
	isEventPlayerVoteDraftDirty(
		new Map([[gkKey(1), "like"]]),
		new Map([[lineKey(1), "like"]]),
	),
	"draft dirty across tracks",
);
const submitted = eventPlayerVoteDraftToSubmit(
	new Map([
		[lineKey(1), "like"],
		[gkKey(1), "dislike"],
		[lineKey(2), null],
	]),
);
check(submitted.length === 2, "draft submit payload");
check(
	submitted[0]?.target_player_id === 1 && submitted[0]?.track === "line",
	"draft submit line track",
);
check(submitted[1]?.track === "goalkeeper", "draft submit goalkeeper track");
check(
	eventPlayerVoteDraftToSubmit(
		new Map([
			[lineKey(1), "like"],
			[gkKey(1), "dislike"],
		]),
		new Set([lineKey(1)]),
	).length === 1,
	"draft submit skips locked",
);
check(
	!isEventPlayerVoteDraftDirty(
		new Map([
			[lineKey(1), "dislike"],
			[lineKey(2), "like"],
		]),
		new Map([
			[lineKey(1), "like"],
			[lineKey(2), "like"],
		]),
		new Set([lineKey(1)]),
	),
	"draft dirty ignores locked",
);
const lockedKeys = eventPlayerVoteLockedTargetIds([
	{ player_id: 1, vote_rating_delta: 0.5, goalkeeper_vote_rating_delta: 0 },
	{ player_id: 2, vote_rating_delta: 0, goalkeeper_vote_rating_delta: -0.5 },
	{ player_id: 3, vote_rating_delta: 0, goalkeeper_vote_rating_delta: 0 },
]);
check(lockedKeys.has(lineKey(1)), "locked line target");
check(!lockedKeys.has(gkKey(1)), "open goalkeeper target");
check(lockedKeys.has(gkKey(2)), "locked goalkeeper target");
check(!lockedKeys.has(lineKey(2)), "open line target");
check(lockedKeys.size === 2, "locked target count");
check(
	eventPlayerVoteShowsSavedChoice({
		draftVote: "like",
		locked: true,
		votingEnabled: true,
	}),
	"shows locked choice while editing",
);
check(
	!eventPlayerVoteShowsSavedChoice({
		draftVote: "like",
		locked: false,
		votingEnabled: true,
	}),
	"hides open choice while editing",
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

const openDisplay = eventPlayerVoteDisplayRating({
	liveRating: 4,
	voteDelta: 0,
});
check(openDisplay.label === "4.0", "open shows live");
check(openDisplay.to === null, "open has no to");
check(openDisplay.display === 4, "open display is live");

const syncedClosed = eventPlayerVoteDisplayRating({
	liveRating: 4.5,
	voteDelta: 0.5,
});
check(syncedClosed.label === "4.0 → 4.5", "closed undoes live +0.5");
check(syncedClosed.from === 4, "closed from");
check(syncedClosed.to === 4.5, "closed to is live");
check(syncedClosed.display === 4.5, "closed display is live");

const downClosed = eventPlayerVoteDisplayRating({
	liveRating: 3.5,
	voteDelta: -0.5,
});
check(downClosed.label === "4.0 → 3.5", "closed undoes live -0.5");
check(downClosed.from === 4, "down from");
check(downClosed.to === 3.5, "down to is live");

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
check(nextEventPlayerVoteValue(null, "blank") === "blank", "press blank");
check(nextEventPlayerVoteValue("blank", "blank") === null, "toggle off blank");
check(nextEventPlayerVoteValue("like", "blank") === "blank", "switch to blank");
check(
	eventPlayerVoteChoiceLabel("blank") === "Não votar",
	"choice blank label",
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
	canOpenEventPlayerVoteShortcut({
		endedAt: "2026-01-01",
		playerVotesClosedAt: null,
		playerVotesVoidedAt: null,
		attendanceCount: 2,
	}),
	"vote shortcut open",
);
check(
	!canOpenEventPlayerVoteShortcut({
		endedAt: null,
		playerVotesClosedAt: null,
		playerVotesVoidedAt: null,
		attendanceCount: 2,
	}),
	"vote shortcut needs ended",
);
check(
	!canOpenEventPlayerVoteShortcut({
		endedAt: "2026-01-01",
		playerVotesClosedAt: "2026-01-02",
		playerVotesVoidedAt: null,
		attendanceCount: 2,
	}),
	"vote shortcut closed",
);
check(
	!canOpenEventPlayerVoteShortcut({
		endedAt: "2026-01-01",
		playerVotesClosedAt: null,
		playerVotesVoidedAt: "2026-01-02",
		attendanceCount: 2,
	}),
	"vote shortcut voided",
);
check(
	!canOpenEventPlayerVoteShortcut({
		endedAt: "2026-01-01",
		playerVotesClosedAt: null,
		playerVotesVoidedAt: null,
		attendanceCount: 0,
	}),
	"vote shortcut needs attendance",
);
check(
	latestOpenEventPlayerVoteEvent([
		{
			id: 1,
			starts_at: "2026-01-01T12:00:00Z",
			ended_at: "2026-01-01T14:00:00Z",
			player_votes_closed_at: null,
			player_votes_voided_at: null,
			attendance: [{}],
		},
		{
			id: 2,
			starts_at: "2026-01-08T12:00:00Z",
			ended_at: "2026-01-08T14:00:00Z",
			player_votes_closed_at: null,
			player_votes_voided_at: null,
			attendance: [{}],
		},
	])?.id === 2,
	"latest open vote event",
);
check(
	latestOpenEventPlayerVoteEvent([
		{
			id: 1,
			starts_at: "2026-01-01T12:00:00Z",
			ended_at: "2026-01-01T14:00:00Z",
			player_votes_closed_at: "2026-01-02T00:00:00Z",
			player_votes_voided_at: null,
			attendance: [{}],
		},
	]) === null,
	"no open vote event",
);
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
