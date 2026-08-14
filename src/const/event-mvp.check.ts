import {
	EVENT_MVP,
	EVENT_MVP_LABEL,
	eventMvpCandidates,
	eventMvpNames,
	eventMvpPickCandidates,
	eventMvpPlayerIds,
	eventMvpStarDelta,
	formatEventMvpCount,
	toggleEventMvpPlayerId,
} from "./event-mvp.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

check(EVENT_MVP.starBonus === 0.1, "star bonus");
check(EVENT_MVP.candidateLimit === 3, "candidate limit");
check(EVENT_MVP_LABEL.badge === "MVP", "badge");
check(EVENT_MVP_LABEL.toggleHint.includes("nota"), "toggle hint");
check(EVENT_MVP_LABEL.pickHint.includes("3"), "pick hint");
check(EVENT_MVP_LABEL.explain.includes("+0,1"), "explain bonus");
check(EVENT_MVP_LABEL.explain.includes("3"), "explain limit");
check(eventMvpStarDelta() === 0.1, "bonus fixo no jogador");
check(formatEventMvpCount(1) === "1/3 MVP", "count 1/3");
check(formatEventMvpCount(3) === "3/3 MVP", "count 3/3");
check(formatEventMvpCount(0) === "0/3 MVP", "count 0/3");

const teamA = {
	id: 1,
	players: [{ player_id: 10 }, { player_id: 11 }],
};
const teamB = {
	id: 2,
	players: [{ player_id: 20 }, { player_id: 21 }],
};
const teamC = {
	id: 3,
	players: [{ player_id: 30 }],
};

check(
	eventMvpPlayerIds({
		matches: [
			{ ended_at: "x", winner_team_id: 1 },
			{ ended_at: "x", winner_team_id: 1 },
			{ ended_at: "x", winner_team_id: 2 },
			{ ended_at: null, winner_team_id: 2 },
			{ ended_at: "x", winner_team_id: null },
		],
		teams: [teamA, teamB, teamC],
		attendance: [
			{ player_id: 10, goals: 2, assists: 1 },
			{ player_id: 11, goals: 0, assists: 1 },
			{ player_id: 20, goals: 4, assists: 0 },
			{ player_id: 21, goals: 0, assists: 0 },
		],
	}).join(",") === "10",
	"winning team highest G+A",
);

check(
	eventMvpPlayerIds({
		matches: [
			{ ended_at: "x", winner_team_id: 1 },
			{ ended_at: "x", winner_team_id: 2 },
		],
		teams: [teamA, teamB],
		attendance: [
			{ player_id: 10, goals: 1, assists: 0 },
			{ player_id: 11, goals: 0, assists: 0 },
			{ player_id: 20, goals: 0, assists: 2 },
			{ player_id: 21, goals: 0, assists: 0 },
		],
	})
		.slice()
		.sort((left, right) => left - right)
		.join(",") === "10,20",
	"tied winning teams",
);

check(
	eventMvpPlayerIds({
		matches: [
			{ ended_at: "x", winner_team_id: 1 },
			{ ended_at: "x", winner_team_id: 1 },
		],
		teams: [teamA],
		attendance: [
			{ player_id: 10, goals: 1, assists: 1 },
			{ player_id: 11, goals: 2, assists: 0 },
		],
	})
		.slice()
		.sort((left, right) => left - right)
		.join(",") === "10,11",
	"tied G+A on winning team",
);

check(
	eventMvpPlayerIds({
		matches: [{ ended_at: "x", winner_team_id: null }],
		teams: [teamA],
		attendance: [{ player_id: 10, goals: 3, assists: 0 }],
	}).length === 0,
	"no wins no mvp",
);

check(
	eventMvpPlayerIds({
		matches: [{ ended_at: "x", winner_team_id: 1 }],
		teams: [teamA],
		attendance: [
			{ player_id: 10, goals: 0, assists: 0 },
			{ player_id: 11, goals: 0, assists: 0 },
		],
	}).length === 0,
	"zero involvement no mvp",
);

check(toggleEventMvpPlayerId([10], 11).join(",") === "10,11", "toggle add");
check(toggleEventMvpPlayerId([10, 11], 10).join(",") === "11", "toggle remove");
check(
	toggleEventMvpPlayerId([10, 11, 12], 13).join(",") === "10,11,12",
	"toggle refuses fourth",
);
check(
	toggleEventMvpPlayerId([10, 11, 12], 10).join(",") === "11,12",
	"toggle remove at limit",
);

check(
	eventMvpNames(
		[10],
		[{ id: 10, nickname: "Ana", display_name: "Ana Silva" }],
		[{ player_id: 10, display_name: "x" }],
	).join(",") === "Ana",
	"mvp name uses nickname",
);

check(
	eventMvpCandidates([
		{ player_id: 1, goals: 1, assists: 0, wins: 1, matches: 2 },
		{ player_id: 2, goals: 3, assists: 1, wins: 0, matches: 2 },
		{ player_id: 3, goals: 0, assists: 2, wins: 2, matches: 3 },
		{ player_id: 4, goals: 2, assists: 2, wins: 1, matches: 2 },
		{ player_id: 5, goals: 0, assists: 0, wins: 0, matches: 4 },
	])
		.map((row) => row.playerId)
		.join(",") === "2,4,3",
	"top 3 by G+A then G",
);

check(
	eventMvpCandidates([
		{ player_id: 1, goals: 0, assists: 0, wins: 0, matches: 3 },
		{ player_id: 2, goals: 0, assists: 0, wins: 0, matches: 2 },
	]).length === 0,
	"no stats no candidates",
);

check(
	eventMvpPickCandidates(
		[
			{ player_id: 1, goals: 3, assists: 0, wins: 1, matches: 2 },
			{ player_id: 2, goals: 2, assists: 0, wins: 1, matches: 2 },
			{ player_id: 3, goals: 1, assists: 0, wins: 1, matches: 2 },
			{ player_id: 9, goals: 0, assists: 0, wins: 0, matches: 1 },
		],
		[9],
	)
		.map((row) => row.playerId)
		.join(",") === "1,2,3,9",
	"keep current mvp outside top 3",
);

console.log("event-mvp ok");
