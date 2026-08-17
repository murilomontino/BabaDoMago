import type {
	ChampionshipEventGoal,
	ChampionshipEventMatchPlayer,
} from "../types/championship-event.ts";
import { CHAMPIONSHIP_EVENT } from "./championship-event.ts";
import {
	canConfirmMatchTeams,
	clampMatchDurationMinutes,
	EVENT_GOAL_KIND,
	EVENT_GOAL_LABEL,
	EVENT_MATCH_CLOCK_LABEL,
	EVENT_MATCH_DURATION,
	EVENT_MATCH_END_INTENT,
	EVENT_MATCH_END_LABEL,
	EVENT_MATCH_ICON,
	EVENT_MATCH_ICON_LEGEND,
	EVENT_MATCH_LABEL,
	EVENT_MATCH_REOPEN_LABEL,
	EVENT_MATCH_STATUS,
	EVENT_MATCH_SUBSTITUTION_LABEL,
	EVENT_MATCH_TEAM_PREVIEW,
	eventGoalScorerHint,
	eventMatchEndConfirmLabel,
	eventMatchEndTitle,
	eventMatchStatus,
	eventMatchSubstitutionTitle,
	formatGoalTimelineLine,
	formatMatchClock,
	formatMatchScore,
	isMatchSlotGoalkeeper,
	isOpenMatch,
	lastMatchGoal,
	matchAssistCandidates,
	matchBenchPlayerIds,
	matchClockElapsedSeconds,
	matchClockIsPaused,
	matchClockIsStarted,
	matchDurationSeconds,
	matchEndWinnerLabel,
	matchGoalForTeamA,
	matchGoalPayload,
	matchGoalTimeline,
	matchPlayUrl,
	matchScore,
	matchSlotCount,
	matchSubstitutedTeamPlayers,
	matchTeamScore,
	matchTeamSlots,
	matchTeamStarName,
	matchWinnerColor,
	matchWinnerTeamId,
	openEventMatch,
	shouldStartEventMatch,
	sortBenchForSlot,
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
		Pick<ChampionshipEventMatchPlayer, "player_id" | "team_id"> & {
			slot: number | null;
		},
): ChampionshipEventMatchPlayer {
	return {
		id: overrides.id ?? overrides.player_id,
		match_id: 1,
		event_id: 1,
		display_name: String(overrides.player_id),
		is_goalkeeper: overrides.slot === 0,
		is_substituted: false,
		include_stats: true,
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
		elapsed_seconds: null,
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
check(shouldStartEventMatch([ended, open]), false, "open skips create");
check(shouldStartEventMatch([ended]), true, "ended starts new");
check(shouldStartEventMatch([]), true, "empty starts new");

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

const substituted = player({
	player_id: 4,
	team_id: 1,
	slot: null,
	is_substituted: true,
	include_stats: false,
});
const slotsWithSub = matchTeamSlots(
	[
		player({ player_id: 1, team_id: 1, slot: 0 }),
		substituted,
		player({ player_id: 5, team_id: 1, slot: 1 }),
	],
	1,
	3,
);
check(slotsWithSub[0]?.player_id, 1, "sub skipped gk");
check(slotsWithSub[1]?.player_id, 5, "sub skipped field");
check(slotsWithSub[2], null, "sub not occupying");
check(
	matchSubstitutedTeamPlayers(
		[substituted, player({ player_id: 1, team_id: 1, slot: 0 })],
		1,
	).length,
	1,
	"substituted list",
);
check(
	String(
		matchBenchPlayerIds(
			[1, 4, 9],
			[player({ player_id: 1, team_id: 1, slot: 0 }), substituted],
		),
	),
	"9",
	"bench excludes substituted",
);
const assistsSkipSub = matchAssistCandidates(
	[
		player({ player_id: 1, team_id: 1, slot: 0 }),
		substituted,
		player({ player_id: 2, team_id: 1, slot: 1 }),
	],
	1,
	1,
);
check(assistsSkipSub.length, 1, "assist skips substituted");
check(assistsSkipSub[0]?.player_id, 2, "active teammate");
const scoreWithSub = matchScore(
	[goal({ scorer_player_id: 4, is_own_goal: false })],
	new Set([1, 4]),
);
check(scoreWithSub.teamA, 1, "subbed scorer still counts score");
check(
	eventMatchSubstitutionTitle("Ana"),
	"Contar estatísticas de Ana?",
	"sub title",
);
check(eventGoalScorerHint("Ana"), "Gol de Ana", "goal scorer hint");
check(EVENT_MATCH_SUBSTITUTION_LABEL.chip, "Substituído", "sub chip");

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
check(
	sortBenchForSlot(
		[{ id: 1 }, { id: 2 }, { id: 3 }],
		0,
		(playerId) => playerId === 3 || playerId === 1,
	)
		.map((player) => player.id)
		.join(","),
	"1,3,2",
	"slot 0 gk first",
);
check(
	sortBenchForSlot(
		[{ id: 1 }, { id: 2 }, { id: 3 }],
		1,
		(playerId) => playerId === 3,
	)
		.map((player) => player.id)
		.join(","),
	"1,2,3",
	"field slot keeps order",
);
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
check(
	matchTeamStarName(
		[
			player({ player_id: 3, team_id: 1, slot: 0 }),
			player({
				player_id: 4,
				team_id: 1,
				slot: null,
				is_substituted: true,
				include_stats: false,
			}),
		],
		1,
		starRoster,
	),
	"Low",
	"star ignores substituted",
);

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
const elapsedTimeline = matchGoalTimeline([
	goal({
		id: 2,
		scorer_player_id: 2,
		is_own_goal: false,
		elapsed_seconds: 90,
		created_at: "2026-08-13T00:00:01Z",
	}),
	goal({
		id: 1,
		scorer_player_id: 1,
		is_own_goal: false,
		elapsed_seconds: 30,
		created_at: "2026-08-13T00:00:02Z",
	}),
]);
check(
	elapsedTimeline.map((item) => item.id).join(","),
	"1,2",
	"timeline elapsed order",
);
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
check(EVENT_GOAL_LABEL.ownGoalShort, "Contra", "own goal short");
check(
	EVENT_MATCH_ICON_LEGEND[0]?.id,
	EVENT_MATCH_ICON.goalkeeper,
	"legend gk id",
);
check(EVENT_MATCH_ICON_LEGEND[0]?.label, "Goleiro", "legend gk");
check(EVENT_MATCH_ICON_LEGEND[1]?.id, EVENT_MATCH_ICON.goal, "legend goal id");
check(EVENT_MATCH_ICON_LEGEND[1]?.label, "Gol", "legend goal");
check(
	EVENT_MATCH_ICON_LEGEND[2]?.id,
	EVENT_MATCH_ICON.assist,
	"legend assist id",
);
check(EVENT_MATCH_ICON_LEGEND[2]?.label, "Assistência", "legend assist");
check(
	EVENT_MATCH_ICON_LEGEND[3]?.id,
	EVENT_MATCH_ICON.ownGoal,
	"legend own id",
);
check(EVENT_MATCH_ICON_LEGEND[3]?.label, "Gol contra", "legend own");
check(lastMatchGoal(timeline)?.id, 2, "last goal");
check(lastMatchGoal([]), null, "empty last goal");
check(matchEndWinnerLabel(10, 10, "A", "B"), "A", "end winner a");
check(matchEndWinnerLabel(20, 10, "A", "B"), "B", "end winner b");
check(
	matchEndWinnerLabel(null, 10, "A", "B"),
	EVENT_MATCH_LABEL.draw,
	"end draw",
);
check(
	eventMatchEndTitle(EVENT_MATCH_END_INTENT.end),
	EVENT_MATCH_END_LABEL.title,
	"end title",
);
check(
	eventMatchEndTitle(EVENT_MATCH_END_INTENT.next),
	EVENT_MATCH_END_LABEL.nextTitle,
	"next title",
);
check(
	eventMatchEndConfirmLabel(EVENT_MATCH_END_INTENT.end),
	EVENT_MATCH_END_LABEL.confirm,
	"end confirm",
);
check(
	eventMatchEndConfirmLabel(EVENT_MATCH_END_INTENT.next),
	EVENT_MATCH_END_LABEL.nextConfirm,
	"next confirm",
);
check(EVENT_MATCH_REOPEN_LABEL.title, "Editar partida", "reopen title");
check(EVENT_MATCH_REOPEN_LABEL.hint.includes("edição"), true, "reopen hint");
check(EVENT_MATCH_TEAM_PREVIEW.players, 2, "team preview");
check(EVENT_MATCH_LABEL.showMore, "Ver mais", "show more");
check(EVENT_MATCH_LABEL.showLess, "Ver menos", "show less");
check(
	EVENT_MATCH_LABEL.selectTeams,
	"Selecione dois times para o confronto",
	"select teams",
);

const clockBase = {
	duration_seconds: 420,
	started_at: "2026-08-14T12:00:00.000Z",
	paused_at: null as string | null,
	pause_accumulated_seconds: 0,
	ended_at: null as string | null,
};
const startMs = Date.parse(clockBase.started_at);

check(matchDurationSeconds(7), 420, "duration seconds");
check(
	EVENT_MATCH_DURATION.presetsMinutes.join(","),
	"5,7,10",
	"duration presets",
);
check(
	clampMatchDurationMinutes(0),
	EVENT_MATCH_DURATION.minMinutes,
	"clamp min",
);
check(
	clampMatchDurationMinutes(100),
	EVENT_MATCH_DURATION.maxMinutes,
	"clamp max",
);
check(
	clampMatchDurationMinutes(Number.NaN),
	EVENT_MATCH_DURATION.defaultMinutes,
	"clamp nan",
);
check(formatMatchClock(0), "00:00", "clock zero");
check(formatMatchClock(65), "01:05", "clock 65");
check(formatMatchClock(420), "07:00", "clock 7min");
check(EVENT_MATCH_CLOCK_LABEL.start, "Iniciar", "start label");
check(EVENT_MATCH_CLOCK_LABEL.pause, "Pausar", "pause label");
check(matchClockElapsedSeconds(clockBase, startMs), 0, "elapsed at start");
check(
	matchClockElapsedSeconds(clockBase, startMs + 10_000),
	10,
	"elapsed after 10s",
);
check(
	matchClockElapsedSeconds(
		{ ...clockBase, paused_at: "2026-08-14T12:00:10.000Z" },
		startMs + 60_000,
	),
	10,
	"paused freeze",
);
check(
	matchClockIsPaused({
		paused_at: "2026-08-14T12:00:10.000Z",
		ended_at: null,
	}),
	true,
	"is paused",
);
check(
	matchClockIsPaused({ paused_at: null, ended_at: null }),
	false,
	"is running",
);
check(
	matchClockElapsedSeconds(
		{ ...clockBase, ended_at: "2026-08-14T12:01:00.000Z" },
		startMs + 120_000,
	),
	60,
	"ended freeze",
);
check(
	matchClockElapsedSeconds(
		{ ...clockBase, pause_accumulated_seconds: 30 },
		startMs + 40_000,
	),
	10,
	"accumulated pause",
);
check(
	matchClockElapsedSeconds(clockBase, startMs + 500_000),
	500,
	"counts past duration",
);
check(
	matchClockElapsedSeconds({ ...clockBase, started_at: null }, startMs),
	0,
	"elapsed before start",
);
check(
	matchClockIsStarted({ started_at: null, ended_at: null }),
	false,
	"not started",
);
check(
	matchClockIsStarted({
		started_at: clockBase.started_at,
		ended_at: null,
	}),
	true,
	"is started",
);

console.log("championship-event-match ok");
