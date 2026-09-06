import type { ChampionshipEvent } from "../types/championship-event.ts";
import { formatEventStartsAt } from "./championship-event.ts";
import {
	championshipGoalTimeline,
	championshipGoalTimelineChart,
	formatGoalTimelineCoverage,
	formatGoalTimelineFirstGoal,
	GOAL_TIMELINE_MIN_COVERAGE,
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
) {
	return {
		id,
		match_id: matchId,
		event_id: eventId,
		scorer_player_id: 1,
		assist_player_id: null,
		is_own_goal: false,
		elapsed_seconds: elapsed,
		created_at: "2026-01-01T22:05:00.000Z",
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
		players: [],
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
			goal(1, 1, 1, 50),
			goal(2, 1, 1, 250),
			goal(3, 1, 1, 500),
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
const chart = championshipGoalTimelineChart(timed);
check(chart.length === 3, "chart points");
check(
	formatEventStartsAt(chart[0]?.startsAt ?? "").date === timed.buckets[0]?.label,
	"chart tick is bucket label",
);
check(formatEventStartsAt("").date === "—", "empty date fallback");

const sparse = championshipGoalTimeline([
	eventRow(2, [
		match(2, 2, [
			goal(4, 2, 2, 100),
			goal(5, 2, 2, null),
			goal(6, 2, 2, null),
		]),
	]),
]);

check(sparse.timedGoals === 1, "null elapsed skipped");
check(sparse.coverage < GOAL_TIMELINE_MIN_COVERAGE, "low coverage");
check(!sparse.enoughCoverage, "hide when sparse");
check(championshipGoalTimelineChart(sparse).length === 0, "no chart when sparse");
check(formatGoalTimelineCoverage(sparse) === "33%", "coverage format");

console.log("championship-goal-timeline.check.ts ok");
