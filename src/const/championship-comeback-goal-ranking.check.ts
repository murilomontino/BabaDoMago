import type { ChampionshipPlayer } from "../types/championship.ts";
import type { ChampionshipEvent } from "../types/championship-event.ts";
import {
	championshipComebackAssistRanking,
	championshipComebackGoalRanking,
} from "./championship-comeback-goal-ranking.ts";
import {
	isComebackLeadGoal,
	walkMatchGoalScores,
} from "./match-goal-score-walk.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

function player(id: number, name: string): ChampionshipPlayer {
	return {
		id,
		championship_id: 1,
		user_id: null,
		display_name: name,
		nickname: null,
		nickname_tags: [],
		avatar_url: null,
		role: "member",
		rating: 3,
		goalkeeper_rating: 0,
		goals: 0,
		assists: 0,
		assisted_goals: 0,
		own_goals: 0,
		wins: 0,
		losses: 0,
		draws: 0,
		matches: 0,
		mvps: 0,
		is_goalkeeper: false,
		is_monthly: true,
		deleted_at: null,
	};
}

function goal(
	id: number,
	matchId: number,
	eventId: number,
	elapsed: number,
	scorerPlayerId: number,
	assistPlayerId: number | null = null,
	isOwnGoal = false,
) {
	return {
		id,
		match_id: matchId,
		event_id: eventId,
		scorer_player_id: scorerPlayerId,
		assist_player_id: assistPlayerId,
		is_own_goal: isOwnGoal,
		elapsed_seconds: elapsed,
		created_at: `2026-01-01T22:0${id}:00.000Z`,
	};
}

function matchPlayer(
	id: number,
	matchId: number,
	eventId: number,
	teamId: number,
	playerId: number,
) {
	return {
		id,
		match_id: matchId,
		event_id: eventId,
		team_id: teamId,
		player_id: playerId,
		display_name: `P${playerId}`,
		is_goalkeeper: false,
		slot: 1,
		is_substituted: false,
		include_stats: true,
	};
}

function match(
	id: number,
	eventId: number,
	goals: ReturnType<typeof goal>[],
): ChampionshipEvent["matches"][number] {
	return {
		id,
		event_id: eventId,
		team_a_id: 1,
		team_b_id: 2,
		created_at: "2026-01-01T22:00:00.000Z",
		ended_at: "2026-01-01T23:00:00.000Z",
		winner_team_id: 1,
		duration_seconds: 600,
		started_at: "2026-01-01T22:00:00.000Z",
		paused_at: null,
		pause_accumulated_seconds: 0,
		players: [
			matchPlayer(1, id, eventId, 1, 1),
			matchPlayer(2, id, eventId, 2, 2),
			matchPlayer(3, id, eventId, 1, 3),
		],
		goals,
	};
}

function eventRow(
	id: number,
	matches: ChampionshipEvent["matches"],
): ChampionshipEvent {
	return {
		id,
		championship_id: 1,
		starts_at: "2026-01-01T22:00:00.000Z",
		players_per_team: 5,
		skip_guest_goalkeeper_matches: false,
		ended_at: "2026-01-01T23:00:00.000Z",
		attendance: [],
		rsvps: [],
		teams: [],
		matches,
	};
}

check(
	isComebackLeadGoal({
		marginBefore: 0,
		marginAfter: 1,
		teamHadTrailed: true,
	}),
	"0 to +1 after trail is virada",
);
check(
	!isComebackLeadGoal({
		marginBefore: -1,
		marginAfter: 0,
		teamHadTrailed: true,
	}),
	"equalizer is not virada",
);
check(
	!isComebackLeadGoal({
		marginBefore: 0,
		marginAfter: 1,
		teamHadTrailed: false,
	}),
	"opening lead is not virada",
);

const steps = walkMatchGoalScores(
	match(1, 1, [
		goal(1, 1, 1, 30, 2),
		goal(2, 1, 1, 60, 1),
		goal(3, 1, 1, 90, 1),
	]),
);

check(steps[0]?.isComebackLead === false, "opener not virada");
check(steps[1]?.isComebackLead === false, "equalizer not virada");
check(steps[2]?.isComebackLead === true, "2-1 is virada");
check(steps[2]?.goal.scorer_player_id === 1, "player 1 scored virada");

const players = [player(1, "Ana"), player(2, "Beto"), player(3, "Caio")];
const events = [
	eventRow(1, [
		match(1, 1, [
			goal(1, 1, 1, 30, 2),
			goal(2, 1, 1, 60, 1),
			goal(3, 1, 1, 90, 1, 3),
		]),
		match(2, 1, [
			goal(4, 2, 1, 20, 2),
			goal(5, 2, 1, 50, 1),
			goal(6, 2, 1, 80, 1, 3),
		]),
	]),
];
const rows = championshipComebackGoalRanking(players, events);

check(rows.length === 1, "only ana ranked");
check(rows[0]?.player.id === 1, "ana first");
check(rows[0]?.comebackGoals === 2, "ana two viradas");

const assistRows = championshipComebackAssistRanking(players, events);
check(assistRows.length === 1, "only caio assist ranked");
check(assistRows[0]?.player.id === 3, "caio first assist");
check(assistRows[0]?.comebackAssists === 2, "caio two assist viradas");

console.log("championship-comeback-goal-ranking.check.ts ok");
