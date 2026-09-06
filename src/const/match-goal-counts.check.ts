import { isCloseMatch, matchGoalMargin } from "./match-goal-counts.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

function match(
	winner: number | null,
	goals: { scorer: number; own?: boolean }[],
) {
	return {
		id: 1,
		event_id: 1,
		team_a_id: 10,
		team_b_id: 20,
		created_at: "2026-01-01T22:00:00.000Z",
		ended_at: "2026-01-01T22:10:00.000Z",
		winner_team_id: winner,
		duration_seconds: 600,
		started_at: "2026-01-01T22:00:00.000Z",
		paused_at: null,
		pause_accumulated_seconds: 0,
		players: [
			{
				id: 1,
				match_id: 1,
				event_id: 1,
				team_id: 10,
				player_id: 1,
				display_name: "A",
				is_goalkeeper: false,
				slot: 0,
				is_substituted: false,
				include_stats: true,
			},
			{
				id: 2,
				match_id: 1,
				event_id: 1,
				team_id: 20,
				player_id: 2,
				display_name: "B",
				is_goalkeeper: false,
				slot: 0,
				is_substituted: false,
				include_stats: true,
			},
		],
		goals: goals.map((goal, index) => ({
			id: index + 1,
			match_id: 1,
			event_id: 1,
			scorer_player_id: goal.scorer,
			assist_player_id: null,
			is_own_goal: goal.own === true,
			elapsed_seconds: 60,
			created_at: "2026-01-01T22:05:00.000Z",
		})),
	};
}

check(isCloseMatch(match(null, [])), "draw is close");
check(isCloseMatch(match(10, [{ scorer: 1 }])), "1-0 close");
check(
	isCloseMatch(match(10, [{ scorer: 1 }, { scorer: 1 }, { scorer: 2 }])),
	"2-1 close",
);
check(
	matchGoalMargin(match(10, [{ scorer: 1 }, { scorer: 1 }, { scorer: 2 }])) ===
		1,
	"2-1 margin 1",
);
check(
	!isCloseMatch(match(10, [{ scorer: 1 }, { scorer: 1 }, { scorer: 1 }])),
	"3-0 not close",
);

console.log("match-goal-counts.check.ts ok");
