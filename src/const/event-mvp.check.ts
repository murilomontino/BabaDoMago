import {
	EVENT_MVP,
	EVENT_MVP_LABEL,
	eventMvpNames,
	eventMvpPlayerIds,
	eventMvpStarDelta,
	toggleEventMvpPlayerId,
} from "./event-mvp.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

check(EVENT_MVP.starBonus === 0.1, "star bonus");
check(EVENT_MVP_LABEL.badge === "MVP", "badge");
check(EVENT_MVP_LABEL.toggleHint.includes("nota"), "toggle hint");
check(eventMvpStarDelta(5) === 0.1, "teto 5");
check(eventMvpStarDelta(20) === 0.4, "teto 20");
check(eventMvpStarDelta(8) === 0.2, "teto 8");

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
	eventMvpNames(
		[10],
		[{ id: 10, nickname: "Ana", display_name: "Ana Silva" }],
		[{ player_id: 10, display_name: "x" }],
	).join(",") === "Ana",
	"mvp name uses nickname",
);

console.log("event-mvp ok");
