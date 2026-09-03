import type {
	ChampionshipEventGoal,
	ChampionshipEventMatch,
	ChampionshipEventMatchPlayer,
	ChampionshipEventTeam,
} from "../types/championship-event.ts";
import { EVENT_TEAM_COLOR } from "./event-team-color.ts";
import {
	eventTeamStandings,
	formatStandingGoalDifference,
	formatStandingPointsRate,
	standingPointsRate,
} from "./event-team-standings.ts";

function checkEq<T>(actual: T, expected: T, message: string) {
	if (actual !== expected) {
		throw new Error(`${message}: got ${String(actual)}, want ${String(expected)}`);
	}
}

function team(
	id: number,
	color: (typeof EVENT_TEAM_COLOR)[keyof typeof EVENT_TEAM_COLOR],
	sortOrder: number,
): ChampionshipEventTeam {
	return {
		id,
		event_id: 1,
		color,
		sort_order: sortOrder,
		is_active: true,
		template_player_ids: [],
		template_goalkeeper_id: 0,
		players: [],
	};
}

function matchPlayer(
	id: number,
	teamId: number,
	playerId: number,
): ChampionshipEventMatchPlayer {
	return {
		id,
		match_id: 1,
		event_id: 1,
		team_id: teamId,
		player_id: playerId,
		display_name: `P${playerId}`,
		is_goalkeeper: false,
		slot: 1,
		is_substituted: false,
		include_stats: true,
	};
}

function goal(
	id: number,
	scorerPlayerId: number,
	isOwnGoal = false,
): ChampionshipEventGoal {
	return {
		id,
		match_id: 1,
		event_id: 1,
		scorer_player_id: scorerPlayerId,
		assist_player_id: null,
		is_own_goal: isOwnGoal,
		elapsed_seconds: 60,
		created_at: "2026-08-01T22:05:00.000Z",
	};
}

function endedMatch(input: {
	id: number;
	teamAId: number;
	teamBId: number;
	winnerTeamId: number | null;
	players: ChampionshipEventMatchPlayer[];
	goals: ChampionshipEventGoal[];
}): ChampionshipEventMatch {
	return {
		id: input.id,
		event_id: 1,
		team_a_id: input.teamAId,
		team_b_id: input.teamBId,
		created_at: "2026-08-01T22:00:00.000Z",
		ended_at: "2026-08-01T22:10:00.000Z",
		winner_team_id: input.winnerTeamId,
		duration_seconds: 420,
		started_at: "2026-08-01T22:00:00.000Z",
		paused_at: null,
		pause_accumulated_seconds: 0,
		players: input.players,
		goals: input.goals,
	};
}

const white = team(10, EVENT_TEAM_COLOR.white, 0);
const black = team(20, EVENT_TEAM_COLOR.black, 1);
const red = team(30, EVENT_TEAM_COLOR.red, 2);

checkEq(formatStandingGoalDifference(3), "+3", "sg positive");
checkEq(formatStandingGoalDifference(0), "0", "sg zero");
checkEq(formatStandingGoalDifference(-2), "-2", "sg negative");
checkEq(standingPointsRate(3, 1), 1, "full points rate");
checkEq(standingPointsRate(1, 1), 1 / 3, "draw points rate");
checkEq(standingPointsRate(0, 0), 0, "zero matches rate");
checkEq(formatStandingPointsRate(1), "100%", "format 100");
checkEq(formatStandingPointsRate(1 / 3), "33%", "format 33");
checkEq(formatStandingPointsRate(0), "0%", "format 0");

const emptyRows = eventTeamStandings([white, black, red], []);
checkEq(emptyRows.length, 3, "all teams without matches");
checkEq(emptyRows[0]?.teamId, 10, "empty keeps sort_order");
checkEq(emptyRows[0]?.matches, 0, "zero matches");
checkEq(emptyRows[0]?.points, 0, "zero points");

const winMatch = endedMatch({
	id: 1,
	teamAId: 10,
	teamBId: 20,
	winnerTeamId: 10,
	players: [
		matchPlayer(1, 10, 1),
		matchPlayer(2, 20, 2),
	],
	goals: [goal(1, 1), goal(2, 1), goal(3, 2)],
});

const winRows = eventTeamStandings([white, black], [winMatch]);
const whiteWin = winRows[0];
const blackLoss = winRows[1];
checkEq(whiteWin?.teamId, 10, "winner first");
checkEq(whiteWin?.wins, 1, "winner wins");
checkEq(whiteWin?.draws, 0, "winner draws");
checkEq(whiteWin?.losses, 0, "winner losses");
checkEq(whiteWin?.goalsFor, 2, "winner gp");
checkEq(whiteWin?.goalsAgainst, 1, "winner gc");
checkEq(whiteWin?.goalDifference, 1, "winner sg");
checkEq(whiteWin?.points, 3, "winner points");
checkEq(whiteWin?.pointsRate, 1, "winner points rate");
checkEq(blackLoss?.losses, 1, "loser losses");
checkEq(blackLoss?.points, 0, "loser points");
checkEq(blackLoss?.pointsRate, 0, "loser points rate");

const drawMatch = endedMatch({
	id: 2,
	teamAId: 10,
	teamBId: 20,
	winnerTeamId: null,
	players: [
		matchPlayer(3, 10, 1),
		matchPlayer(4, 20, 2),
	],
	goals: [goal(4, 1), goal(5, 2)],
});

const drawRows = eventTeamStandings([white, black], [drawMatch]);
checkEq(drawRows[0]?.draws, 1, "draw recorded");
checkEq(drawRows[0]?.points, 1, "draw points");
checkEq(drawRows[0]?.pointsRate, 1 / 3, "draw points rate");
checkEq(drawRows[0]?.goalsFor, 1, "draw gp");
checkEq(drawRows[1]?.draws, 1, "draw both sides");
checkEq(drawRows[1]?.points, 1, "draw both points");

const openMatch: ChampionshipEventMatch = {
	...winMatch,
	id: 99,
	ended_at: null,
	winner_team_id: null,
};
const openRows = eventTeamStandings([white, black], [openMatch]);
checkEq(openRows[0]?.matches, 0, "open match ignored");

const tieOnPoints = eventTeamStandings(
	[white, black, red],
	[
		endedMatch({
			id: 3,
			teamAId: 10,
			teamBId: 30,
			winnerTeamId: 10,
			players: [matchPlayer(5, 10, 1), matchPlayer(6, 30, 3)],
			goals: [goal(6, 1)],
		}),
		endedMatch({
			id: 4,
			teamAId: 20,
			teamBId: 30,
			winnerTeamId: 20,
			players: [matchPlayer(7, 20, 2), matchPlayer(8, 30, 3)],
			goals: [goal(7, 2), goal(8, 2), goal(9, 3)],
		}),
	],
);
checkEq(tieOnPoints[0]?.teamId, 20, "tiebreak by wins then sg: black first");
checkEq(tieOnPoints[0]?.wins, 1, "black wins");
checkEq(tieOnPoints[0]?.goalDifference, 1, "black sg +1");
checkEq(tieOnPoints[1]?.teamId, 10, "white second same points");
checkEq(tieOnPoints[1]?.goalDifference, 1, "white sg +1");
checkEq(tieOnPoints[0]?.goalsFor, 2, "black more gf breaks sg tie");
checkEq(tieOnPoints[2]?.teamId, 30, "red last");

console.log("event-team-standings ok");
