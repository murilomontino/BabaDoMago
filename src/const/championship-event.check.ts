import {
	applyVisibleAttendance,
	areAllVisiblePresent,
	attendanceGoalkeeperIds,
	builderTeamsFromDrafts,
	builderTeamsFromEvent,
	canAddEventMatch,
	canEditEventTeams,
	canRemoveEventAttendance,
	canStartEventMatch,
	championshipEventErrorMessage,
	compareByAttendanceCount,
	countPlayerAttendance,
	draftAttendanceForEnd,
	drawBalancedEventTeams,
	EVENT_ATTENDANCE_MESSAGE,
	EVENT_ATTENDANCE_STAT_ABBR,
	EVENT_BUILDER_STEP,
	EVENT_ERROR_MESSAGE,
	EVENT_TEAM_MESSAGE,
	EVENT_TEAM_POSITION,
	EVENT_TEAM_POSITION_LABEL,
	type EventTeamDraft,
	emptyTeamSlots,
	eventTeamCount,
	eventTeamPlayerIds,
	eventTeamPlayerOptionLabel,
	eventTeamPlayerPosition,
	eventTeamRatingAverage,
	eventTeamSlotPosition,
	formatEventTeamRatingAverage,
	initialBuilderTeams,
	isEventBuilderStep,
	keepGoalkeepersPresent,
	keepPresentSlots,
	keepTeamPlayersPresent,
	nextEventTeamColor,
	parseAttendanceStatInput,
	pickTeamGoalkeeper,
	resizeBuilderTeams,
	setAttendanceRating,
	setAttendanceStat,
	teamHasMatches,
	teamPlayerSlots,
	teamSlotsToPlayerIds,
	validateEventAttendance,
	validateEventAttendanceStats,
	validateEventTeam,
	validateEventTeams,
	validateTeamsInAttendance,
} from "./championship-event.ts";
import { EVENT_TEAM_COLOR, type EventTeamColor } from "./event-team-color.ts";

function check(actual: unknown, expected: unknown): void {
	if (actual !== expected) {
		throw new Error(`expected ${String(expected)}, got ${String(actual)}`);
	}
}

function draft(
	color: EventTeamDraft["color"],
	playerIds: number[],
	goalkeeperId = playerIds[0] ?? 0,
): EventTeamDraft {
	return { color, playerIds, goalkeeperId };
}

check(validateEventTeams([], 5), EVENT_TEAM_MESSAGE.minTeams);

check(
	validateEventTeams(
		[draft(EVENT_TEAM_COLOR.white, [1]), draft(EVENT_TEAM_COLOR.black, [2])],
		5,
	),
	null,
);

check(validateEventTeams([draft(null, [1]), draft(null, [2])], 5), null);

check(
	validateEventTeams(
		[draft("#7c3aed", [1]), draft(EVENT_TEAM_COLOR.black, [2])],
		5,
	),
	null,
);

check(
	validateEventTeams([draft("#7c3aed", [1]), draft("#7c3aed", [2])], 5),
	EVENT_TEAM_MESSAGE.colorDuplicate,
);

check(
	validateEventTeams(
		[draft("white" as EventTeamColor, [1]), draft(EVENT_TEAM_COLOR.black, [2])],
		5,
	),
	EVENT_TEAM_MESSAGE.colorInvalid,
);

check(
	validateEventTeams(
		[draft(EVENT_TEAM_COLOR.white, [1]), draft(EVENT_TEAM_COLOR.white, [2])],
		5,
	),
	EVENT_TEAM_MESSAGE.colorDuplicate,
);

check(
	validateEventTeams(
		[draft(EVENT_TEAM_COLOR.white, [1]), draft(EVENT_TEAM_COLOR.black, [1])],
		5,
	),
	EVENT_TEAM_MESSAGE.playerDuplicate,
);

check(
	validateEventTeams(
		[draft(EVENT_TEAM_COLOR.white, []), draft(EVENT_TEAM_COLOR.black, [2])],
		5,
	),
	EVENT_TEAM_MESSAGE.playerEmpty,
);

check(
	validateEventTeams(
		[
			draft(EVENT_TEAM_COLOR.white, [1, 2, 3]),
			draft(EVENT_TEAM_COLOR.black, [4]),
		],
		2,
	),
	EVENT_TEAM_MESSAGE.playerLimit,
);

check(
	validateEventTeams(
		[
			draft(EVENT_TEAM_COLOR.white, [1, 2], 9),
			draft(EVENT_TEAM_COLOR.black, [3]),
		],
		5,
	),
	EVENT_TEAM_MESSAGE.goalkeeperMissing,
);

check(
	validateEventTeams(
		[
			draft(EVENT_TEAM_COLOR.white, [1, 2, 3, 4], 0),
			draft(EVENT_TEAM_COLOR.black, [5, 6, 7, 8], 0),
		],
		5,
	),
	null,
);

check(
	validateEventAttendance([1], [1, 2, 3]),
	EVENT_ATTENDANCE_MESSAGE.minPresent,
);
check(
	validateEventTeam(
		draft(EVENT_TEAM_COLOR.white, [1, 2]),
		5,
		[],
		[],
		[1, 2, 3],
	),
	null,
);
check(validateEventTeam(draft(null, [1, 2]), 5, [], [], [1, 2, 3]), null);
check(
	validateEventTeam(draft(null, [1]), 5, [EVENT_TEAM_COLOR.white], [], [1, 2]),
	null,
);
check(
	validateEventTeam(
		draft(EVENT_TEAM_COLOR.white, [1]),
		5,
		[EVENT_TEAM_COLOR.white],
		[],
		[1, 2],
	),
	EVENT_TEAM_MESSAGE.colorDuplicate,
);
check(
	validateEventTeam(draft(EVENT_TEAM_COLOR.white, [1]), 5, [], [1], [1, 2]),
	EVENT_TEAM_MESSAGE.playerDuplicate,
);
check(
	validateEventTeam(draft(EVENT_TEAM_COLOR.white, [9]), 5, [], [], [1, 2]),
	EVENT_TEAM_MESSAGE.playerNotPresent,
);

check(validateEventAttendance([1, 2], [1, 2, 3]), null);

check(
	validateEventAttendance([1, 9], [1, 2, 3]),
	EVENT_ATTENDANCE_MESSAGE.notInRoster,
);

check(
	validateEventAttendance([1, 1], [1, 2, 3]),
	EVENT_ATTENDANCE_MESSAGE.duplicate,
);

check(
	validateTeamsInAttendance(
		[draft(EVENT_TEAM_COLOR.white, [1]), draft(EVENT_TEAM_COLOR.black, [2])],
		[1, 2, 3],
	),
	null,
);

check(
	validateTeamsInAttendance(
		[draft(EVENT_TEAM_COLOR.white, [1]), draft(EVENT_TEAM_COLOR.black, [9])],
		[1, 2, 3],
	),
	EVENT_TEAM_MESSAGE.playerNotPresent,
);

const attendanceCounts = countPlayerAttendance([
	{ attendance: [{ player_id: 1 }, { player_id: 2 }] },
	{ attendance: [{ player_id: 1 }] },
]);
check(attendanceCounts.get(1), 2);
check(attendanceCounts.get(2), 1);
check(attendanceCounts.get(3), undefined);

check(
	compareByAttendanceCount(
		{ attendanceCount: 1, display_name: "Ana" },
		{ attendanceCount: 3, display_name: "Bia" },
	) > 0,
	true,
);

check(emptyTeamSlots(3).join(","), ",,");
check(eventTeamCount(16, 5), 4);
check(eventTeamCount(15, 5), 3);
check(eventTeamCount(31, 10), 4);
check(eventTeamCount(2, 5), 2);
check(eventTeamCount(0, 5), 2);
check(eventTeamRatingAverage([]), 0);
check(eventTeamRatingAverage([10, 7, 6, 3]), 6.5);
check(formatEventTeamRatingAverage(6.5), "6.5");
check(initialBuilderTeams(2).length, 2);
check(initialBuilderTeams(5, 4).length, 4);
check(builderTeamsFromEvent([], 5, 16).length, 4);
check(
	initialBuilderTeams(5, 4).every((team) => team.color === null),
	true,
);
check(
	resizeBuilderTeams(initialBuilderTeams(5, 2), 4, 5, new Set([1, 2])).length,
	4,
);
check(keepPresentSlots(["1", "9", ""], new Set([1, 2])).join("|"), "1||");
check(nextEventTeamColor([EVENT_TEAM_COLOR.white]), EVENT_TEAM_COLOR.black);
check(
	builderTeamsFromEvent(
		[
			{
				id: 10,
				color: EVENT_TEAM_COLOR.white,
				players: [
					{ player_id: 2, is_goalkeeper: false },
					{ player_id: 1, is_goalkeeper: true },
				],
			},
			{
				id: 11,
				color: EVENT_TEAM_COLOR.black,
				players: [{ player_id: 3, is_goalkeeper: true }],
			},
		],
		3,
	)
		.map((team) => team.slots.join("|"))
		.join("/"),
	"1|2|/3||",
);
check(
	builderTeamsFromDrafts(
		[
			{
				color: EVENT_TEAM_COLOR.white,
				playerIds: [1, 2],
				goalkeeperId: 1,
			},
			{
				color: EVENT_TEAM_COLOR.black,
				playerIds: [3],
				goalkeeperId: 3,
			},
		],
		3,
	)
		.map((team) => team.slots.join("|"))
		.join("/"),
	"1|2|/3||",
);
check(
	builderTeamsFromDrafts(
		[
			{
				color: EVENT_TEAM_COLOR.white,
				playerIds: [1, 2, 3, 4],
				goalkeeperId: 0,
			},
		],
		5,
	)
		.map((team) => team.slots.join("|"))
		.join("/"),
	"|1|2|3|4",
);
check(canEditEventTeams({ ended_at: null, matches: [] }), true);
check(canEditEventTeams({ ended_at: "2026-08-13", matches: [] }), false);
check(canEditEventTeams({ ended_at: "2026-08-13", matches: [] }, true), true);
check(canEditEventTeams({ ended_at: null, matches: [{}] }), false);
check(
	canEditEventTeams({ ended_at: "2026-08-13", matches: [{}] }, true),
	false,
);
check(draftAttendanceForEnd(false, [1, 2]), null);
check(draftAttendanceForEnd(true, [1]), null);
check(draftAttendanceForEnd(true, [1, 2])?.join(","), "1,2");
check(
	championshipEventErrorMessage("event already ended"),
	EVENT_ERROR_MESSAGE["event already ended"],
);
check(
	championshipEventErrorMessage("event has matches"),
	EVENT_ERROR_MESSAGE["event has matches"],
);
check(
	championshipEventErrorMessage("team has matches"),
	EVENT_ERROR_MESSAGE["team has matches"],
);
check(teamHasMatches(1, [{ team_a_id: 1, team_b_id: 2 }]), true);
check(teamHasMatches(3, [{ team_a_id: 1, team_b_id: 2 }]), false);
check(
	teamPlayerSlots(
		[
			{ player_id: 2, is_goalkeeper: false },
			{ player_id: 1, is_goalkeeper: true },
		],
		3,
	).join("|"),
	"1|2|",
);
check(String(teamSlotsToPlayerIds(["1", "", "2"])), "1,2");
check(eventTeamSlotPosition(0), EVENT_TEAM_POSITION.goalkeeper);
check(eventTeamSlotPosition(1), EVENT_TEAM_POSITION.player);
check(eventTeamPlayerPosition(true), EVENT_TEAM_POSITION.goalkeeper);
check(eventTeamPlayerPosition(false), EVENT_TEAM_POSITION.player);

check(String(applyVisibleAttendance([3], [1, 2], true)), "3,1,2");
check(String(applyVisibleAttendance([1, 2, 3], [1, 2], false)), "3");
check(String(keepGoalkeepersPresent([1, 2, 9], [1, 3])), "1");
check(String(keepGoalkeepersPresent([2, 2, 1], [1, 2])), "2,1");
check(
	String(
		attendanceGoalkeeperIds([
			{ player_id: 1, is_goalkeeper: false },
			{ player_id: 2, is_goalkeeper: true },
		]),
	),
	"2",
);
check(eventTeamPlayerOptionLabel("Ana", false), "Ana");
check(
	eventTeamPlayerOptionLabel("Ana", true),
	`Ana · ${EVENT_TEAM_POSITION_LABEL.goalkeeper}`,
);
check(pickTeamGoalkeeper([1, 2, 3, 4], 5), 0);
check(pickTeamGoalkeeper([1, 2, 3, 4, 5], 5), 1);
check(pickTeamGoalkeeper([1, 2, 3, 4, 5], 5, [4]), 4);
check(pickTeamGoalkeeper([1, 2, 3, 4, 5], 5, [9, 2]), 2);
check(pickTeamGoalkeeper([], 5), 0);
check(areAllVisiblePresent([1, 2], [1, 2]), true);
check(areAllVisiblePresent([1], [1, 2]), false);
check(areAllVisiblePresent([1, 2, 3], []), false);
check(
	String(
		eventTeamPlayerIds([
			{ players: [{ player_id: 1 }, { player_id: 2 }] },
			{ players: [{ player_id: 2 }] },
		]),
	),
	"1,2",
);
check(String(keepTeamPlayersPresent([3], [1, 2])), "3,1,2");
check(canRemoveEventAttendance(3, 3, [1, 2]), true);
check(canRemoveEventAttendance(1, 3, [1, 2]), false);
check(canRemoveEventAttendance(3, 2, []), false);
check(
	canAddEventMatch({
		ended: false,
		teamCount: 2,
	}),
	true,
);
check(
	canAddEventMatch({
		ended: true,
		teamCount: 2,
	}),
	false,
);
check(
	canAddEventMatch({
		ended: false,
		teamCount: 2,
	}),
	true,
);
check(
	canAddEventMatch({
		ended: true,
		teamCount: 2,
	}),
	false,
);
check(canStartEventMatch({ ended: false, teamCount: 2 }), true);
check(canStartEventMatch({ ended: true, teamCount: 2 }), false);
check(
	canAddEventMatch({
		ended: true,
		teamCount: 1,
	}),
	false,
);

const rated = [
	{ id: 1, rating: 10 },
	{ id: 2, rating: 9 },
	{ id: 3, rating: 8 },
	{ id: 4, rating: 7 },
	{ id: 5, rating: 6 },
	{ id: 6, rating: 5 },
	{ id: 7, rating: 4 },
	{ id: 8, rating: 3 },
] as const;
const drawn = drawBalancedEventTeams(rated, 5, () => 0.999);
check(drawn.length, 2);
check(drawn[0]?.color, null);
check(drawn[1]?.color, null);
check(String(drawn[0]?.playerIds), "1,4,5,8");
check(String(drawn[1]?.playerIds), "2,3,6,7");
check(drawn[0]?.goalkeeperId, 0);
check(drawn[1]?.goalkeeperId, 0);
check(
	validateEventTeams(drawn, 5) ??
		validateTeamsInAttendance(
			drawn,
			rated.map((player) => player.id),
		),
	null,
);
const drawnAvg = (playerIds: readonly number[]) =>
	playerIds.reduce((sum, id) => {
		const player = rated.find((item) => item.id === id);
		return sum + (player?.rating ?? 0);
	}, 0) / playerIds.length;
check(drawnAvg(drawn[0]?.playerIds ?? []), 6.5);
check(drawnAvg(drawn[1]?.playerIds ?? []), 6.5);
const leftover = drawBalancedEventTeams(rated.slice(0, 5), 3, () => 0.999);
check(leftover.length, 2);
check(
	leftover
		.flatMap((team) => team.playerIds)
		.sort((a, b) => a - b)
		.join(","),
	"1,2,3,4,5",
);
check(
	leftover.every((team) => team.playerIds.length <= 3),
	true,
);
check(
	leftover.every((team) =>
		team.playerIds.length < 3
			? team.goalkeeperId === 0
			: team.playerIds.includes(team.goalkeeperId) && team.goalkeeperId !== 0,
	),
	true,
);
const fullRated = [
	...rated,
	{ id: 9, rating: 2 },
	{ id: 10, rating: 1 },
] as const;
const fullDrawn = drawBalancedEventTeams(fullRated, 5, () => 0.999);
check(fullDrawn.length, 2);
check(
	fullDrawn.every(
		(team) =>
			team.playerIds.length === 5 && team.goalkeeperId === team.playerIds[0],
	),
	true,
);
const volunteerDrawn = drawBalancedEventTeams(fullRated, 5, () => 0.999, [8]);
check(
	volunteerDrawn.some(
		(team) => team.playerIds.includes(8) && team.goalkeeperId === 8,
	),
	true,
);
check(
	volunteerDrawn.every((team) =>
		team.playerIds.includes(8)
			? team.goalkeeperId === 8
			: team.goalkeeperId === team.playerIds[0],
	),
	true,
);

check(isEventBuilderStep(EVENT_BUILDER_STEP.attendance), true);
check(isEventBuilderStep(EVENT_BUILDER_STEP.teams), true);
check(isEventBuilderStep("nope"), false);
check(isEventBuilderStep(null), false);
check(EVENT_ATTENDANCE_STAT_ABBR.goals, "G");
check(EVENT_ATTENDANCE_STAT_ABBR.ownGoals, "GC");

const statsDraft = [
	{
		player_id: 1,
		rating: 7.5,
		goals: 2,
		assists: 1,
		own_goals: 0,
		wins: 1,
		matches: 2,
	},
	{
		player_id: 2,
		rating: 5,
		goals: 0,
		assists: 0,
		own_goals: 0,
		wins: 0,
		matches: 2,
	},
];
check(validateEventAttendanceStats(statsDraft, [1, 2]), null);
check(
	validateEventAttendanceStats(statsDraft, [1]),
	EVENT_ATTENDANCE_MESSAGE.invalidStats,
);
check(
	validateEventAttendanceStats(
		[{ ...statsDraft[0], wins: 3, matches: 2 }, statsDraft[1]],
		[1, 2],
	),
	EVENT_ATTENDANCE_MESSAGE.winsExceedMatches,
);
check(
	validateEventAttendanceStats(
		[{ ...statsDraft[0], goals: -1 }, statsDraft[1]],
		[1, 2],
	),
	EVENT_ATTENDANCE_MESSAGE.invalidStats,
);
check(
	validateEventAttendanceStats(
		[{ ...statsDraft[0], rating: 101 }, statsDraft[1]],
		[1, 2],
	),
	EVENT_ATTENDANCE_MESSAGE.invalidRating,
);
check(parseAttendanceStatInput(""), 0);
check(parseAttendanceStatInput("4"), 4);
check(parseAttendanceStatInput("-1"), null);
check(setAttendanceStat(statsDraft, 1, "goals", 9)[0]?.goals, 9);
check(setAttendanceRating(statsDraft, 1, 8)[0]?.rating, 8);
check(
	championshipEventErrorMessage("invalid attendance stats"),
	EVENT_ERROR_MESSAGE["invalid attendance stats"],
);
check(
	championshipEventErrorMessage("wins exceed matches"),
	EVENT_ERROR_MESSAGE["wins exceed matches"],
);
check(
	championshipEventErrorMessage("invalid rating"),
	EVENT_ERROR_MESSAGE["invalid rating"],
);

console.log("championship-event ok");
