import type { ChampionshipEvent } from "../types/championship-event.ts";
import {
	championshipFirstGoalOutcome,
	championshipGoalMinuteHistogram,
	championshipGoalScoreStateScatter,
	championshipGoalTimeline,
	formatGoalTimelineCoverage,
	formatGoalTimelineFirstGoal,
	GOAL_SCORE_STATE,
	GOAL_TIMELINE_MIN_COVERAGE,
	PLAYER_FIRST_GOAL_OUTCOME,
	playerFirstGoalOutcome,
	scoreStateFromMargin,
} from "./championship-goal-timeline.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

function goal(
	id: number,
	matchId: number,
	eventId: number,
	elapsed: number | null,
	scorerPlayerId: number,
	isOwnGoal = false,
) {
	return {
		id,
		match_id: matchId,
		event_id: eventId,
		scorer_player_id: scorerPlayerId,
		assist_player_id: null,
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
	durationSeconds = 600,
	winnerTeamId: number | null = 1,
): ChampionshipEvent["matches"][number] {
	return {
		id,
		event_id: eventId,
		team_a_id: 1,
		team_b_id: 2,
		created_at: "2026-01-01T22:00:00.000Z",
		ended_at: "2026-01-01T23:00:00.000Z",
		winner_team_id: winnerTeamId,
		duration_seconds: durationSeconds,
		started_at: "2026-01-01T22:00:00.000Z",
		paused_at: null,
		pause_accumulated_seconds: 0,
		players: [
			matchPlayer(1, id, eventId, 1, 1),
			matchPlayer(2, id, eventId, 2, 2),
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

const timed = championshipGoalTimeline([
	eventRow(1, [
		match(1, 1, [
			goal(1, 1, 1, 50, 1),
			goal(2, 1, 1, 250, 1),
			goal(3, 1, 1, 500, 1),
		]),
	]),
]);

check(timed.totalGoals === 3, "three goals");
check(timed.timedGoals === 3, "all timed");
check(timed.enoughCoverage, "coverage ok");
check(timed.buckets[0]?.goals === 1, "early bucket");
check(timed.buckets[1]?.goals === 1, "mid bucket");
check(timed.buckets[2]?.goals === 1, "late bucket");
check(timed.lateShare === 1 / 3, "late share");
check(timed.averageFirstGoalSeconds === 50, "first goal average");
check(formatGoalTimelineFirstGoal(timed) === "0.8 min", "first goal format");

const histogram = championshipGoalMinuteHistogram([
	eventRow(1, [
		match(1, 1, [
			goal(1, 1, 1, 50, 1),
			goal(2, 1, 1, 55, 1),
			goal(3, 1, 1, 250, 1),
			goal(4, 1, 1, null, 1),
		]),
	]),
]);

check(histogram.xMaxMinutes === 10, "x domain from duration");
check(histogram.bars[0]?.goals === 2, "two goals in minute 0");
check(histogram.bars[0]?.label === "0", "minute label");
check(histogram.bars[1]?.goals === 0, "empty minute 1");
check(histogram.bars[4]?.goals === 1, "one goal in minute 4");
check(histogram.maxGoals === 2, "max goals");

const firstGoal = championshipFirstGoalOutcome([
	eventRow(1, [
		match(1, 1, [goal(1, 1, 1, 30, 1), goal(2, 1, 1, 90, 1)], 600, 1),
		match(
			2,
			1,
			[goal(3, 2, 1, 20, 1), goal(4, 2, 1, 80, 2), goal(5, 2, 1, 100, 2)],
			600,
			2,
		),
		match(3, 1, [goal(6, 3, 1, 40, 1), goal(7, 3, 1, 90, 2)], 600, null),
		match(4, 1, [], 600, null),
	]),
]);

check(firstGoal.held === 1, "held win");
check(firstGoal.comeback === 1, "comeback");
check(firstGoal.draw === 1, "opened draw");
check(firstGoal.matches === 3, "skip goalless");
check(firstGoal.bars.length === 3, "three outcome bars");

const playerView = playerFirstGoalOutcome(
	[
		eventRow(1, [
			match(1, 1, [goal(1, 1, 1, 30, 1), goal(2, 1, 1, 90, 1)], 600, 1),
			match(
				2,
				1,
				[goal(3, 2, 1, 20, 1), goal(4, 2, 1, 80, 2), goal(5, 2, 1, 100, 2)],
				600,
				2,
			),
			match(3, 1, [goal(6, 3, 1, 40, 2), goal(7, 3, 1, 90, 1)], 600, 1),
			match(4, 1, [goal(8, 4, 1, 50, 2)], 600, 2),
			match(5, 1, [goal(9, 5, 1, 40, 1), goal(10, 5, 1, 90, 2)], 600, null),
		]),
	],
	1,
);

check(playerView.openedHeld === 1, "player opened held");
check(playerView.sufferedComeback === 1, "player suffered");
check(playerView.madeComeback === 1, "player made comeback");
check(playerView.failedChase === 1, "player failed chase");
check(playerView.draw === 1, "player draw");
check(playerView.matches === 5, "player five decided");
check(
	playerView.bars.some(
		(bar) =>
			bar.id === PLAYER_FIRST_GOAL_OUTCOME.madeComeback && bar.matches === 1,
	),
	"player bar for comeback",
);

const scoreScatter = championshipGoalScoreStateScatter([
	eventRow(1, [
		match(1, 1, [
			goal(1, 1, 1, 30, 1),
			goal(2, 1, 1, 90, 2),
			goal(3, 1, 1, 120, 1),
		]),
	]),
]);

check(scoreScatter.points.length === 3, "three score points");
check(scoreScatter.points[0]?.marginBefore === 0, "opener tied");
check(scoreScatter.points[0]?.state === GOAL_SCORE_STATE.tied, "opener state");
check(
	scoreScatter.points[1]?.marginBefore === -1,
	"B trailing before equalizer",
);
check(
	scoreScatter.points[1]?.state === GOAL_SCORE_STATE.trailing,
	"B was trailing",
);
check(scoreScatter.points[2]?.marginBefore === 0, "A tied before go-ahead");
check(scoreStateFromMargin(-2) === GOAL_SCORE_STATE.trailing, "margin helper");

const sparse = championshipGoalTimeline([
	eventRow(2, [
		match(2, 2, [
			goal(4, 2, 2, 100, 1),
			goal(5, 2, 2, null, 1),
			goal(6, 2, 2, null, 1),
		]),
	]),
]);

check(sparse.timedGoals === 1, "null elapsed skipped");
check(sparse.coverage < GOAL_TIMELINE_MIN_COVERAGE, "low coverage");
check(!sparse.enoughCoverage, "hide when sparse");
check(formatGoalTimelineCoverage(sparse) === "33%", "coverage format");

console.log("championship-goal-timeline.check.ts ok");
