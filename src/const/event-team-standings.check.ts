import type {
	ChampionshipEvent,
	ChampionshipEventGoal,
	ChampionshipEventMatch,
	ChampionshipEventMatchPlayer,
	ChampionshipEventTeam,
} from "../types/championship-event.ts";
import { EVENT_TEAM_COLOR } from "./event-team-color.ts";
import {
	championshipRoundStandings,
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

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

function team(
	id: number,
	color: (typeof EVENT_TEAM_COLOR)[keyof typeof EVENT_TEAM_COLOR],
	sortOrder: number,
	eventId = 1,
): ChampionshipEventTeam {
	return {
		id,
		event_id: eventId,
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
	eventId?: number;
}): ChampionshipEventMatch {
	return {
		id: input.id,
		event_id: input.eventId ?? 1,
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

function eventRow(input: {
	id: number;
	startsAt: string;
	teams: ChampionshipEventTeam[];
	matches: ChampionshipEventMatch[];
}): ChampionshipEvent {
	return {
		id: input.id,
		championship_id: 1,
		starts_at: input.startsAt,
		players_per_team: 5,
		skip_guest_goalkeeper_matches: false,
		ended_at: null,
		attendance: [],
		rsvps: [],
		teams: input.teams,
		matches: input.matches,
	};
}

const olderWhite = team(110, EVENT_TEAM_COLOR.white, 0, 2);
const olderBlack = team(120, EVENT_TEAM_COLOR.black, 1, 2);
const newerWhite = team(210, EVENT_TEAM_COLOR.white, 0, 3);
const newerBlack = team(220, EVENT_TEAM_COLOR.black, 1, 3);

const openOnly = eventRow({
	id: 1,
	startsAt: "2026-08-22T22:00:00.000Z",
	teams: [white, black],
	matches: [openMatch],
});

const olderEnded = eventRow({
	id: 2,
	startsAt: "2026-08-08T22:00:00.000Z",
	teams: [olderWhite, olderBlack],
	matches: [
		endedMatch({
			id: 10,
			eventId: 2,
			teamAId: 110,
			teamBId: 120,
			winnerTeamId: 110,
			players: [matchPlayer(11, 110, 1), matchPlayer(12, 120, 2)],
			goals: [goal(11, 1)],
		}),
	],
});

const newerEnded = eventRow({
	id: 3,
	startsAt: "2026-08-15T22:00:00.000Z",
	teams: [newerWhite, newerBlack],
	matches: [
		endedMatch({
			id: 20,
			eventId: 3,
			teamAId: 210,
			teamBId: 220,
			winnerTeamId: 220,
			players: [matchPlayer(21, 210, 1), matchPlayer(22, 220, 2)],
			goals: [goal(21, 2), goal(22, 2)],
		}),
	],
});

const roundList = championshipRoundStandings([
	openOnly,
	newerEnded,
	olderEnded,
]);
checkEq(roundList.length, 2, "skips round without ended match");
checkEq(roundList[0]?.eventId, 3, "keeps list order: newer first");
checkEq(roundList[1]?.eventId, 2, "older second");
checkEq(roundList[0]?.rows[0]?.teamId, 220, "newer round black won");
checkEq(roundList[0]?.rows[0]?.points, 3, "newer round points stay local");
checkEq(roundList[1]?.rows[0]?.teamId, 110, "older round white won");
checkEq(roundList[1]?.rows[0]?.points, 3, "older round points stay local");
check(
	roundList[0]?.rows.every((row) => row.matches <= 1) === true,
	"does not mix points across events",
);

console.log("event-team-standings ok");
