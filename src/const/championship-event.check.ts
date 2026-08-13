import {
	compareByAttendanceCount,
	countPlayerAttendance,
	EVENT_ATTENDANCE_MESSAGE,
	EVENT_TEAM_MESSAGE,
	validateEventAttendance,
	validateEventTeams,
	validateTeamsInAttendance,
} from "./championship-event.ts";
import { EVENT_TEAM_COLOR } from "./event-team-color.ts";

function check(actual: unknown, expected: unknown): void {
	if (actual !== expected) {
		throw new Error(`expected ${String(expected)}, got ${String(actual)}`);
	}
}

check(validateEventTeams([], 5), EVENT_TEAM_MESSAGE.minTeams);

check(
	validateEventTeams(
		[
			{ color: EVENT_TEAM_COLOR.white, playerIds: [1] },
			{ color: EVENT_TEAM_COLOR.black, playerIds: [2] },
		],
		5,
	),
	null,
);

check(
	validateEventTeams(
		[
			{ color: EVENT_TEAM_COLOR.white, playerIds: [1] },
			{ color: EVENT_TEAM_COLOR.white, playerIds: [2] },
		],
		5,
	),
	EVENT_TEAM_MESSAGE.colorDuplicate,
);

check(
	validateEventTeams(
		[
			{ color: EVENT_TEAM_COLOR.white, playerIds: [1] },
			{ color: EVENT_TEAM_COLOR.black, playerIds: [1] },
		],
		5,
	),
	EVENT_TEAM_MESSAGE.playerDuplicate,
);

check(
	validateEventTeams(
		[
			{ color: EVENT_TEAM_COLOR.white, playerIds: [] },
			{ color: EVENT_TEAM_COLOR.black, playerIds: [2] },
		],
		5,
	),
	EVENT_TEAM_MESSAGE.playerEmpty,
);

check(
	validateEventTeams(
		[
			{ color: EVENT_TEAM_COLOR.white, playerIds: [1, 2, 3] },
			{ color: EVENT_TEAM_COLOR.black, playerIds: [4] },
		],
		2,
	),
	EVENT_TEAM_MESSAGE.playerLimit,
);

check(
	validateEventAttendance([1], [1, 2, 3]),
	EVENT_ATTENDANCE_MESSAGE.minPresent,
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
		[
			{ color: EVENT_TEAM_COLOR.white, playerIds: [1] },
			{ color: EVENT_TEAM_COLOR.black, playerIds: [2] },
		],
		[1, 2, 3],
	),
	null,
);

check(
	validateTeamsInAttendance(
		[
			{ color: EVENT_TEAM_COLOR.white, playerIds: [1] },
			{ color: EVENT_TEAM_COLOR.black, playerIds: [9] },
		],
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
