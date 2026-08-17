import {
	formatPlayerProfileDelta,
	PLAYER_PROFILE_HISTORY_COLUMN,
	PLAYER_PROFILE_LABEL,
	playerProfileDelta,
	playerProfileHistory,
	playerRatingHistoryChartSeries,
	ratingsForProfileCeiling,
} from "./player-profile.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

check(PLAYER_PROFILE_LABEL.emptyHistory === "Ainda não jogou", "empty label");
check(
	ratingsForProfileCeiling(
		[
			{ id: 1, deleted_at: null, rating: 4 },
			{ id: 2, deleted_at: "x", rating: 9 },
			{ id: 3, deleted_at: "x", rating: 1 },
		],
		2,
	).join(",") === "4,9",
	"ceiling keeps actives and the viewed player",
);
check(PLAYER_PROFILE_LABEL.notFound === "Jogador não encontrado", "not found");
check(PLAYER_PROFILE_LABEL.rating === "Nota", "rating label");
check(
	PLAYER_PROFILE_LABEL.viewPhoto === "Ver foto de perfil",
	"view photo label",
);
check(PLAYER_PROFILE_HISTORY_COLUMN.delta === "delta", "delta column");
check(
	PLAYER_PROFILE_HISTORY_COLUMN.assisted_goals === "assisted_goals",
	"gs column",
);

check(playerProfileDelta(1.2) === 1.2, "delta number");
check(playerProfileDelta(-0.5) === -0.5, "delta negative");
check(playerProfileDelta("x") === 0, "delta invalid");
check(playerProfileDelta(Number.NaN) === 0, "delta nan");

check(formatPlayerProfileDelta(0) === "0", "format zero");
check(formatPlayerProfileDelta(1.2) === "+1.2", "format plus");
check(formatPlayerProfileDelta(-0.5) === "−0.5", "format minus");
check(formatPlayerProfileDelta(-0) === "0", "format negative zero");

const openEvent = {
	id: 1,
	championship_id: 9,
	starts_at: "2026-08-14T22:00:00.000Z",
	ended_at: null,
	attendance: [
		{
			player_id: 7,
			goals: 1,
			assists: 0,
			assisted_goals: 0,
			own_goals: 0,
			wins: 1,
			losses: 1,
			draws: 0,
			matches: 2,
			rating: 50,
			rating_delta: 0,
		},
	],
};

const endedOther = {
	id: 2,
	championship_id: 9,
	starts_at: "2026-08-07T22:00:00.000Z",
	ended_at: "2026-08-07T23:00:00.000Z",
	attendance: [
		{
			player_id: 8,
			goals: 3,
			assists: 1,
			assisted_goals: 0,
			own_goals: 0,
			wins: 2,
			losses: 1,
			draws: 0,
			matches: 3,
			rating: 40,
			rating_delta: 1.2,
		},
	],
};

const endedOlder = {
	id: 3,
	championship_id: 9,
	starts_at: "2026-08-01T22:00:00.000Z",
	ended_at: "2026-08-01T23:00:00.000Z",
	attendance: [
		{
			player_id: 7,
			goals: 0,
			assists: 2,
			assisted_goals: 0,
			own_goals: 1,
			wins: 0,
			losses: 2,
			draws: 1,
			matches: 3,
			rating: 50,
			rating_delta: -0.5,
		},
	],
};

const endedNewer = {
	id: 4,
	championship_id: 9,
	starts_at: "2026-08-08T22:00:00.000Z",
	ended_at: "2026-08-08T23:00:00.000Z",
	attendance: [
		{
			player_id: 7,
			goals: 2,
			assists: 1,
			assisted_goals: 2,
			own_goals: 0,
			wins: 2,
			losses: 1,
			draws: 0,
			matches: 3,
			rating: 49.5,
			rating_delta: 1.2,
			is_mvp: true,
		},
	],
};

check(playerProfileHistory([], 7).length === 0, "empty events");
check(
	playerProfileHistory([openEvent, endedOther], 7).length === 0,
	"skips open and other player",
);

const history = playerProfileHistory(
	[openEvent, endedOther, endedOlder, endedNewer],
	7,
);
check(history.length === 2, "two ended rows");
check(history[0]?.eventId === 4, "newest first");
check(history[1]?.eventId === 3, "older second");
check(history[0]?.goals === 2, "newer goals");
check(history[0]?.assistedGoals === 2, "newer assisted goals");
check(history[0]?.mvps === 1, "newer mvp");
check(history[0]?.losses === 1, "newer losses");
check(history[1]?.draws === 1, "older draws");
check(history[1]?.ownGoals === 1, "older own goals");
check(history[0]?.ratingDelta === 1.2, "newer delta");
check(history[1]?.ratingDelta === -0.5, "older delta");
check(history[0]?.ratingFrom === 49.5, "newer from");
check(history[0]?.ratingTo === 50.7, "newer to");
check(history[1]?.ratingFrom === 50, "older from");
check(history[1]?.ratingTo === 49.5, "older to");
check(history[0]?.championshipId === 9, "championship id");

const capped = playerProfileHistory(
	[
		{
			id: 5,
			championship_id: 9,
			starts_at: "2026-08-09T22:00:00.000Z",
			ended_at: "2026-08-09T23:00:00.000Z",
			attendance: [
				{
					player_id: 7,
					goals: 0,
					assists: 0,
					assisted_goals: 0,
					own_goals: 0,
					wins: 5,
					losses: 0,
					draws: 0,
					matches: 5,
					rating: 99.5,
					rating_delta: 2,
				},
			],
		},
	],
	7,
);
check(capped[0]?.ratingTo === 100, "cap 100");

const nowIso = "2026-08-14T13:00:00.000Z";
const series = playerRatingHistoryChartSeries(history, 51, nowIso);
check(series.length === 3, "chart rounds plus current");
check(series[0]?.startsAt === endedOlder.starts_at, "chart oldest first");
check(series[0]?.rating === 49.5, "chart older to");
check(series[1]?.startsAt === endedNewer.starts_at, "chart last round");
check(series[1]?.rating === 50.7, "chart last round to");
check(series[2]?.startsAt === nowIso, "chart current date");
check(series[2]?.rating === 51, "chart current rating");
check(
	playerRatingHistoryChartSeries([], 51, nowIso).length === 0,
	"chart empty",
);

console.log("player-profile ok");
