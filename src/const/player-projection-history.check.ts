import {
	PLAYER_PROJECTION_HISTORY_LABEL,
	playerProjectionHistory,
} from "./player-projection-history.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

function roundMiss(value: number): number {
	if (value < 0) {
		return -Math.round(Math.abs(value) * 10) / 10;
	}

	return Math.round(Math.abs(value) * 10) / 10;
}

check(
	PLAYER_PROJECTION_HISTORY_LABEL.title === "Projeção × realizado",
	"title label",
);

const openOther = {
	id: 99,
	championship_id: 1,
	starts_at: "2026-08-20T22:00:00.000Z",
	ended_at: null,
	attendance: [
		{
			player_id: 8,
			goals: 0,
			assists: 0,
			assisted_goals: 0,
			own_goals: 0,
			wins: 0,
			losses: 3,
			draws: 0,
			matches: 3,
			rating: 4,
			rating_delta: 0,
		},
	],
};

function ended(
	id: number,
	startsAt: string,
	row: {
		wins: number;
		draws: number;
		losses: number;
		matches: number;
		rating: number;
		rating_delta: number;
		rating_projected?: number | null;
		goalkeeper_rating?: number;
		goalkeeper_rating_delta?: number;
		is_goalkeeper?: boolean;
	},
	others: { player_id: number; rating: number; goalkeeper_rating?: number; is_goalkeeper?: boolean }[] = [],
) {
	return {
		id,
		championship_id: 1,
		starts_at: startsAt,
		ended_at: startsAt.replace("T22:", "T23:"),
		attendance: [
			{
				player_id: 7,
				goals: 0,
				assists: 0,
				assisted_goals: 0,
				own_goals: 0,
				...row,
			},
			...others.map((item) => ({
				player_id: item.player_id,
				goals: 0,
				assists: 0,
				assisted_goals: 0,
				own_goals: 0,
				wins: 1,
				draws: 0,
				losses: 0,
				matches: 1,
				rating: item.rating,
				rating_delta: 0,
				goalkeeper_rating: item.goalkeeper_rating ?? 0,
				goalkeeper_rating_delta: 0,
				is_goalkeeper: item.is_goalkeeper === true,
			})),
		],
	};
}

const first = ended(1, "2026-08-01T22:00:00.000Z", {
	wins: 0,
	draws: 0,
	losses: 3,
	matches: 3,
	rating: 4,
	rating_delta: -0.3,
});

const second = ended(
	2,
	"2026-08-08T22:00:00.000Z",
	{
		wins: 0,
		draws: 0,
		losses: 3,
		matches: 3,
		rating: 3.7,
		rating_delta: -0.2,
	},
	[{ player_id: 8, rating: 5 }],
);

const future = {
	id: 3,
	championship_id: 1,
	starts_at: "2026-08-15T22:00:00.000Z",
	ended_at: null,
	attendance: [
		{
			player_id: 7,
			goals: 0,
			assists: 0,
			assisted_goals: 0,
			own_goals: 0,
			wins: 0,
			losses: 0,
			draws: 0,
			matches: 0,
			rating: 3.5,
			rating_delta: 0,
			rating_projected: 3.2,
		},
	],
};

check(playerProjectionHistory([], 7).length === 0, "empty events");
check(
	playerProjectionHistory([openOther], 7).length === 0,
	"open other player skipped",
);

const firstOnly = playerProjectionHistory([first, openOther], 7);
check(firstOnly.length === 1, "one ended row");
check(firstOnly[0]?.hasProjection === false, "first round no projection");
check(firstOnly[0]?.miss === null, "first round miss null");

const withForm = playerProjectionHistory([first, second, openOther], 7);
check(withForm.length === 2, "two ended rows");
check(withForm[0]?.eventId === 2, "newest first");
check(withForm[0]?.hasProjection === true, "second has projection");
check(
	(withForm[0]?.projectedNext ?? 99) < (withForm[0]?.ratingFrom ?? 0),
	"negative gap projects down",
);

const row = withForm[0];
check(!!row && row.miss !== null, "projected row has miss");
if (row?.miss !== null && row && row.ratingTo !== null) {
	check(
		row.miss === roundMiss(row.ratingTo - row.projectedNext),
		"miss = to − projectedNext",
	);
}

const frozen = ended(
	4,
	"2026-08-09T22:00:00.000Z",
	{
		wins: 3,
		draws: 0,
		losses: 0,
		matches: 3,
		rating: 3.7,
		rating_delta: 0.5,
		rating_projected: 9.9,
	},
	[{ player_id: 8, rating: 5 }],
);

const withSaved = playerProjectionHistory([first, frozen], 7);
check(withSaved[0]?.fromSaved === true, "uses saved projection");
check(withSaved[0]?.projectedNext === 9.9, "saved value wins over rebuild");

const withFuture = playerProjectionHistory([first, second, future], 7);
check(withFuture[0]?.isFuture === true, "future first");
check(withFuture[0]?.eventId === 3, "future event id");
check(withFuture[0]?.ratingTo === null, "future has no realized");
check(withFuture[0]?.projectedNext === 3.2, "future uses saved");
check(withFuture[0]?.miss === null, "future miss null");

const pendingNext = playerProjectionHistory([first, second], 7, {
	nextProjected: 3.1,
	currentRating: 3.5,
	nowIso: "2026-08-16T22:00:00.000Z",
});
check(pendingNext[0]?.isFuture === true, "pending next is future");
check(pendingNext[0]?.projectedNext === 3.1, "pending uses player next");
check(pendingNext[0]?.fromSaved === true, "pending from saved");

const gkPrior = ended(10, "2026-07-01T22:00:00.000Z", {
	wins: 0,
	draws: 0,
	losses: 3,
	matches: 3,
	rating: 9,
	rating_delta: 0,
	goalkeeper_rating: 4,
	goalkeeper_rating_delta: -0.3,
	is_goalkeeper: true,
});

const gkNext = ended(
	11,
	"2026-07-08T22:00:00.000Z",
	{
		wins: 0,
		draws: 0,
		losses: 3,
		matches: 3,
		rating: 9,
		rating_delta: 0,
		goalkeeper_rating: 3.7,
		goalkeeper_rating_delta: -0.2,
		is_goalkeeper: true,
	},
	[{ player_id: 8, rating: 5, goalkeeper_rating: 5, is_goalkeeper: true }],
);

const gkHistory = playerProjectionHistory([gkPrior, gkNext], 7);
check(gkHistory[0]?.isGoalkeeper === true, "gk track flag");
check(gkHistory[0]?.ratingFrom === 3.7, "gk uses goalkeeper_rating");
check(
	(gkHistory[0]?.projectedNext ?? 99) < 3.7,
	"gk projects from goalkeeper form",
);
check(gkHistory[0]?.ratingTo === 3.5, "gk applies goalkeeper_rating_delta");

const lineAfterGk = ended(12, "2026-07-15T22:00:00.000Z", {
	wins: 0,
	draws: 0,
	losses: 3,
	matches: 3,
	rating: 4,
	rating_delta: 0,
	goalkeeper_rating: 3.5,
	goalkeeper_rating_delta: 0,
	is_goalkeeper: false,
});

const mixed = playerProjectionHistory([gkPrior, gkNext, lineAfterGk], 7);
check(mixed[0]?.hasProjection === false, "line ignores prior gk form");

console.log("player-projection-history.check.ts ok");
