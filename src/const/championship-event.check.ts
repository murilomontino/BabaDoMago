import {
	EVENT_TEAM_MESSAGE,
	validateEventTeams,
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
