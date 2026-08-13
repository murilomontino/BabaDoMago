import {
	applyVisibleAttendance,
	areAllVisiblePresent,
	builderTeamsFromEvent,
	canAddEventMatch,
	canEditEventTeams,
	canRemoveEventAttendance,
	championshipEventErrorMessage,
	compareByAttendanceCount,
	countPlayerAttendance,
	draftAttendanceForEnd,
	EVENT_ATTENDANCE_MESSAGE,
	EVENT_ERROR_MESSAGE,
	EVENT_TEAM_MESSAGE,
	EVENT_TEAM_POSITION,
	type EventTeamDraft,
	emptyTeamSlots,
	eventTeamCount,
	eventTeamPlayerIds,
	eventTeamPlayerPosition,
	eventTeamSlotPosition,
	initialBuilderTeams,
	keepPresentSlots,
	keepTeamPlayersPresent,
	nextEventTeamColor,
	resizeBuilderTeams,
	teamSlotsToPlayerIds,
	validateEventAttendance,
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
check(initialBuilderTeams(2).length, 2);
check(initialBuilderTeams(5, 4).length, 4);
check(builderTeamsFromEvent([], 5, 16).length, 4);
check(
	initialBuilderTeams(5, 4)
		.map((team) => team.color)
		.join(","),
	[
		EVENT_TEAM_COLOR.white,
		EVENT_TEAM_COLOR.black,
		EVENT_TEAM_COLOR.red,
		EVENT_TEAM_COLOR.blue,
	].join(","),
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
check(String(teamSlotsToPlayerIds(["1", "", "2"])), "1,2");
check(eventTeamSlotPosition(0), EVENT_TEAM_POSITION.goalkeeper);
check(eventTeamSlotPosition(1), EVENT_TEAM_POSITION.player);
check(eventTeamPlayerPosition(true), EVENT_TEAM_POSITION.goalkeeper);
check(eventTeamPlayerPosition(false), EVENT_TEAM_POSITION.player);

check(String(applyVisibleAttendance([3], [1, 2], true)), "3,1,2");
check(String(applyVisibleAttendance([1, 2, 3], [1, 2], false)), "3");
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
		canManage: true,
		canOverrideEnded: false,
		ended: false,
		teamCount: 2,
	}),
	true,
);
check(
	canAddEventMatch({
		canManage: true,
		canOverrideEnded: false,
		ended: true,
		teamCount: 2,
	}),
	false,
);
check(
	canAddEventMatch({
		canManage: false,
		canOverrideEnded: true,
		ended: true,
		teamCount: 2,
	}),
	true,
);
check(
	canAddEventMatch({
		canManage: true,
		canOverrideEnded: true,
		ended: true,
		teamCount: 1,
	}),
	false,
);
