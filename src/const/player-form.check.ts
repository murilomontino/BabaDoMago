import {
	formatPlayerFormStreak,
	PLAYER_FORM,
	PLAYER_FORM_RESULT,
	playerFormResult,
	playerFormStreak,
	playerRecentForm,
} from "./player-form.ts";
import type { PlayerProfileHistoryRow } from "./player-profile.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

function row(
	overrides: Partial<PlayerProfileHistoryRow>,
): PlayerProfileHistoryRow {
	return {
		eventId: 1,
		championshipId: 1,
		startsAt: "2026-08-01T22:00:00.000Z",
		goals: 0,
		assists: 0,
		assistedGoals: 0,
		ownGoals: 0,
		wins: 0,
		losses: 0,
		draws: 0,
		mvps: 0,
		matches: 0,
		ratingFrom: 3,
		ratingDelta: 0,
		ratingTo: 3,
		...overrides,
	};
}

check(PLAYER_FORM.eventLimit === 5, "five events");
check(playerRecentForm([]) === null, "empty history");
check(
	playerFormResult(row({ matches: 0 })) === null,
	"zero matches skips result",
);
check(
	playerFormResult(row({ wins: 2, losses: 1, matches: 3 })) ===
		PLAYER_FORM_RESULT.win,
	"win event",
);
check(
	playerFormResult(row({ wins: 0, draws: 2, losses: 1, matches: 3 })) ===
		PLAYER_FORM_RESULT.draw,
	"draw event",
);
check(
	playerFormResult(row({ wins: 0, losses: 2, matches: 2 })) ===
		PLAYER_FORM_RESULT.loss,
	"loss event",
);

const history = [
	row({ eventId: 6, wins: 2, matches: 2, goals: 1, ratingDelta: 0.2 }),
	row({ eventId: 5, wins: 1, matches: 2, goals: 0, ratingDelta: 0 }),
	row({
		eventId: 4,
		wins: 0,
		losses: 3,
		matches: 3,
		assists: 2,
		ratingDelta: -0.4,
	}),
	row({ eventId: 3, wins: 3, matches: 3, goals: 4, ratingDelta: 0.5 }),
	row({ eventId: 2, wins: 1, matches: 1, ratingDelta: 0.1 }),
	row({ eventId: 1, wins: 8, matches: 8, goals: 20, ratingDelta: 2 }),
];
const form = playerRecentForm(history);
check(form !== null, "form exists");
check(form?.events === 5, "uses last five");
check(form?.wins === 7, "recent wins");
check(form?.goals === 5, "recent goals");
check(form?.assists === 2, "recent assists");
check(form?.ratingDelta.toFixed(1) === "0.4", "recent delta");
check(form?.streakResult === PLAYER_FORM_RESULT.win, "streak is wins");
check(form?.streakLength === 2, "two win events");
check(form !== null && formatPlayerFormStreak(form) === "2V", "streak label");

check(
	playerFormStreak([row({ matches: 0 }), row({ wins: 1, matches: 1 })])
		.length === 1,
	"skips empty event in streak",
);

console.log("player-form ok");
