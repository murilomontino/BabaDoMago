import type {
	ChampionshipEventGoal,
	ChampionshipEventMatchPlayer,
} from "../types/championship-event.ts";
import { CHAMPIONSHIP_EVENT } from "./championship-event.ts";
import {
	canConfirmMatchTeams,
	EVENT_GOAL_KIND,
	EVENT_GOAL_LABEL,
	EVENT_MATCH_STATUS,
	eventMatchStatus,
	formatGoalTimelineLine,
	formatMatchScore,
	isMatchSlotGoalkeeper,
	isOpenMatch,
	matchAssistCandidates,
	matchBenchPlayerIds,
	matchGoalForTeamA,
	matchGoalPayload,
	matchGoalTimeline,
	matchPlayUrl,
	matchScore,
	matchSlotCount,
	matchTeamScore,
	matchTeamSlots,
	matchTeamStarName,
	matchWinnerColor,
	matchWinnerTeamId,
	openEventMatch,
	toggleMatchTeamSelection,
} from "./championship-event-match.ts";
import { EVENT_TEAM_COLOR } from "./event-team-color.ts";

function check(actual: unknown, expected: unknown, message: string): void {
	if (actual !== expected) {
		throw new Error(
			`${message}: expected ${String(expected)}, got ${String(actual)}`,
		);
	}
}

function player(
	overrides: Partial<ChampionshipEventMatchPlayer> &
		Pick<ChampionshipEventMatchPlayer, "player_id" | "team_id" | "slot">,
): ChampionshipEventMatchPlayer {
	return {
		id: overrides.id ?? overrides.player_id,
		match_id: 1,
		event_id: 1,
		display_name: String(overrides.player_id),
		is_goalkeeper: overrides.slot === 0,
		...overrides,
	};
}

function goal(
	overrides: Pick<ChampionshipEventGoal, "scorer_player_id" | "is_own_goal"> &
		Partial<ChampionshipEventGoal>,
): ChampionshipEventGoal {
	return {
		id: overrides.id ?? overrides.scorer_player_id,
		match_id: 1,
		event_id: 1,
		assist_player_id: overrides.assist_player_id ?? null,
		created_at: "2026-08-13T00:00:00Z",
		...overrides,
	};
}

check(eventMatchStatus(null), EVENT_MATCH_STATUS.open, "open status");
check(
	eventMatchStatus("2026-08-13T00:00:00Z"),
	EVENT_MATCH_STATUS.ended,
	"ended status",
);
check(isOpenMatch({ ended_at: null }), true, "open match");
check(isOpenMatch({ ended_at: "x" }), false, "ended match");

const open = { id: 2, ended_at: null };
const ended = { id: 1, ended_at: "x" };
check(openEventMatch([ended, open])?.id, 2, "finds open");
check(openEventMatch([ended]), null, "no open");

const slots = matchTeamSlots(
	[
		player({ player_id: 2, team_id: 1, slot: 1 }),
		player({ player_id: 1, team_id: 1, slot: 0 }),
		player({ player_id: 3, team_id: 2, slot: 0 }),
	],
	1,
	3,
);
check(slots[0]?.player_id, 1, "gk slot");
check(slots[1]?.player_id, 2, "field slot");
check(slots[2], null, "empty slot");

check(
	String(
		matchBenchPlayerIds([1, 2, 3, 4], [{ player_id: 1 }, { player_id: 3 }]),
	),
	"2,4",
	"bench",
);

const assists = matchAssistCandidates(
	[
		player({ player_id: 1, team_id: 1, slot: 0 }),
		player({ player_id: 2, team_id: 1, slot: 1 }),
		player({ player_id: 3, team_id: 2, slot: 0 }),
	],
	1,
	1,
);
check(assists.length, 1, "one assist candidate");
check(assists[0]?.player_id, 2, "teammate only");

const teamA = new Set([1, 2]);
const goals = [
	goal({ scorer_player_id: 1, is_own_goal: false }),
	goal({ scorer_player_id: 2, is_own_goal: true }),
	goal({ scorer_player_id: 3, is_own_goal: false }),
	goal({ scorer_player_id: 3, is_own_goal: true }),
];
const scored = matchScore(goals, teamA);
check(scored.teamA, 2, "a: own + opponent own goal");
check(scored.teamB, 2, "b: own + opponent own goal");
check(matchTeamScore(goals, teamA), 2, "team score helper");
check(matchWinnerTeamId(10, 20, 2, 1), 10, "winner a");
check(matchWinnerTeamId(10, 20, 1, 2), 20, "winner b");
check(matchWinnerTeamId(10, 20, 2, 2), null, "draw");
check(
	matchWinnerColor(10, new Map([[10, { color: EVENT_TEAM_COLOR.red }]])),
	EVENT_TEAM_COLOR.red,
	"winner color",
);
check(matchWinnerColor(null, new Map()), null, "draw color");
check(formatMatchScore(2, 1), "2 x 1", "score label");
check(isMatchSlotGoalkeeper(0), true, "slot 0 gk");
check(isMatchSlotGoalkeeper(1), false, "slot 1 field");
check(matchSlotCount(5), 5, "slot count");
check(
	matchSlotCount(CHAMPIONSHIP_EVENT.playersPerTeamMax + 1),
	CHAMPIONSHIP_EVENT.playersPerTeamMax,
	"slot cap",
);

check(String(toggleMatchTeamSelection([], 1)), "1", "select first");
check(String(toggleMatchTeamSelection([1], 2)), "1,2", "select second");
check(String(toggleMatchTeamSelection([1, 2], 1)), "2", "deselect");
check(String(toggleMatchTeamSelection([1, 2], 3)), "2,3", "replace oldest");
check(canConfirmMatchTeams([1]), false, "one team");
check(canConfirmMatchTeams([1, 2]), true, "two teams");

check(
	matchGoalPayload({
		scorerPlayerId: 1,
		kind: EVENT_GOAL_KIND.none,
		assistPlayerId: 2,
	}).assistPlayerId,
	null,
	"no assist",
);
check(
	matchGoalPayload({
		scorerPlayerId: 1,
		kind: EVENT_GOAL_KIND.ownGoal,
		assistPlayerId: 2,
	}).isOwnGoal,
	true,
	"own goal",
);
check(
	matchGoalPayload({
		scorerPlayerId: 1,
		kind: EVENT_GOAL_KIND.assist,
		assistPlayerId: 2,
	}).assistPlayerId,
	2,
	"assist",
);
check(
	matchPlayUrl(
		"https://baba",
		8,
		3,
		"/championships/$championshipId/events/$eventId/play",
	),
	"https://baba/championships/8/events/3/play",
	"play url",
);

const starRoster = new Map([
	[1, { nickname: "Star", display_name: "A", rating: 80 }],
	[2, { nickname: null, display_name: "B", rating: 80 }],
	[3, { nickname: "Low", display_name: "C", rating: 50 }],
	[4, { nickname: "Ace", display_name: "D", rating: 99 }],
]);
check(
	matchTeamStarName(
		[
			player({ player_id: 2, team_id: 1, slot: 1 }),
			player({ player_id: 1, team_id: 1, slot: 0 }),
			player({ player_id: 3, team_id: 1, slot: 2 }),
		],
		1,
		starRoster,
	),
	"Star",
	"star rating then slot",
);
check(
	matchTeamStarName(
		[
			player({ player_id: 1, team_id: 1, slot: 0 }),
			player({ player_id: 4, team_id: 1, slot: 2 }),
		],
		1,
		starRoster,
	),
	"Ace",
	"higher rating later slot",
);
check(
	matchTeamStarName(
		[player({ player_id: 3, team_id: 1, slot: 0, display_name: "Ghost" })],
		1,
		new Map(),
	),
	"Ghost",
	"star fallback display",
);
check(matchTeamStarName([], 1, starRoster), null, "empty team star");

const timeline = matchGoalTimeline([
	goal({
		id: 2,
		scorer_player_id: 2,
		is_own_goal: false,
		created_at: "2026-08-13T00:00:02Z",
	}),
	goal({
		id: 3,
		scorer_player_id: 3,
		is_own_goal: true,
		created_at: "2026-08-13T00:00:01Z",
	}),
	goal({
		id: 1,
		scorer_player_id: 1,
		is_own_goal: false,
		created_at: "2026-08-13T00:00:01Z",
	}),
]);
check(timeline.map((item) => item.id).join(","), "1,3,2", "timeline order");
check(
	matchGoalForTeamA(goal({ scorer_player_id: 1, is_own_goal: false }), teamA),
	true,
	"a goal side",
);
check(
	matchGoalForTeamA(goal({ scorer_player_id: 2, is_own_goal: true }), teamA),
	false,
	"a own goal side",
);
check(
	matchGoalForTeamA(goal({ scorer_player_id: 3, is_own_goal: false }), teamA),
	false,
	"b goal side",
);
check(
	matchGoalForTeamA(goal({ scorer_player_id: 3, is_own_goal: true }), teamA),
	true,
	"b own goal side",
);
check(
	formatGoalTimelineLine({
		scorerName: "A",
		assistName: null,
		isOwnGoal: false,
	}),
	"A",
	"timeline scorer",
);
check(
	formatGoalTimelineLine({
		scorerName: "A",
		assistName: "B",
		isOwnGoal: false,
	}),
	"A · B",
	"timeline assist",
);
check(
	formatGoalTimelineLine({
		scorerName: "A",
		assistName: "B",
		isOwnGoal: true,
	}),
	`A · ${EVENT_GOAL_LABEL.ownGoal}`,
	"timeline own goal",
);

console.log("championship-event-match ok");
