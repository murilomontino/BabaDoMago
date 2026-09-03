import {
	canVoteEventPlayer,
	copyEventPlayerVoteLinkLabel,
	EVENT_PLAYER_VOTE,
	EVENT_PLAYER_VOTE_LABEL,
	eventPlayerVoteAppliedDelta,
	eventPlayerVoteChipLabel,
	eventPlayerVoteErrorMessage,
	eventPlayerVoteTeamSections,
	eventPlayerVoteUrl,
	isEventPlayerVoteLocked,
	nextEventPlayerVoteValue,
} from "./event-player-vote.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

const quorum = EVENT_PLAYER_VOTE.defaultQuorum;

check(EVENT_PLAYER_VOTE.defaultQuorum === 3, "default quorum");
check(EVENT_PLAYER_VOTE.delta === 0.5, "delta");
check(EVENT_PLAYER_VOTE.like === "like", "like");
check(EVENT_PLAYER_VOTE.dislike === "dislike", "dislike");
check(EVENT_PLAYER_VOTE.maintain === "maintain", "maintain");
check(EVENT_PLAYER_VOTE_LABEL.title === "Votar elenco", "title");
check(EVENT_PLAYER_VOTE_LABEL.appliedUp === "+0,5", "chip up");
check(EVENT_PLAYER_VOTE_LABEL.appliedDown === "−0,5", "chip down");
check(EVENT_PLAYER_VOTE_LABEL.noTeam === "Sem time", "no team label");

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
	EVENT_PLAYER_VOTE_LABEL.needPresent.includes("dono"),
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
	!canVoteEventPlayer({
		canVote: true,
		eventEnded: true,
		votesClosed: false,
		voterPresent: true,
		targetPlayerId: 1,
		voterPlayerId: 1,
		voteRatingDelta: 0,
	}),
	"cannot vote self",
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
check(nextEventPlayerVoteValue(null, "maintain") === "maintain", "press maintain");
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
	eventPlayerVoteErrorMessage("player votes closed") ===
		EVENT_PLAYER_VOTE_LABEL.votesClosed,
	"player votes closed error",
);

check(
	eventPlayerVoteErrorMessage("cannot vote self") === "Não dá para votar em si",
	"error map",
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

console.log("event-player-vote.check.ts: ok");
