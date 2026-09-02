import {
	CHAMPIONSHIP_RATING_SCATTER_KIND,
	CHAMPIONSHIP_RATING_SCATTER_LABEL,
	championshipRatingScatterDomain,
	championshipRatingScatterEmptyLabel,
	championshipRatingScatterPoints,
	championshipRatingScatterSeries,
	championshipRatingScatterTitle,
} from "./championship-rating-scatter.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

function attendance(
	playerId: number,
	rating: number,
	ratingDelta: number,
): {
	player_id: number;
	goals: number;
	assists: number;
	assisted_goals: number;
	own_goals: number;
	wins: number;
	losses: number;
	draws: number;
	matches: number;
	rating: number;
	rating_delta: number;
} {
	return {
		player_id: playerId,
		goals: 0,
		assists: 0,
		assisted_goals: 0,
		own_goals: 0,
		wins: 1,
		losses: 1,
		draws: 0,
		matches: 3,
		rating,
		rating_delta: ratingDelta,
	};
}

function player(
	id: number,
	rating: number,
): {
	id: number;
	display_name: string;
	nickname: string | null;
	avatar_url: string | null;
	rating: number;
} {
	return {
		id,
		display_name: `Player ${id}`,
		nickname: null,
		avatar_url: null,
		rating,
	};
}

const seededDebut = {
	id: 11,
	championship_id: 9,
	starts_at: "2026-08-20T22:00:00.000Z",
	ended_at: "2026-08-20T23:00:00.000Z",
	attendance: [attendance(11, 0, 3)],
};

const rankedDebut = {
	id: 7,
	championship_id: 9,
	starts_at: "2026-08-01T22:00:00.000Z",
	ended_at: "2026-08-01T23:00:00.000Z",
	attendance: [attendance(7, 4, 0.5)],
};

const rankedLater = {
	id: 8,
	championship_id: 9,
	starts_at: "2026-08-08T22:00:00.000Z",
	ended_at: "2026-08-08T23:00:00.000Z",
	attendance: [attendance(7, 4.5, 1)],
};

const openEvent = {
	id: 1,
	championship_id: 9,
	starts_at: "2026-08-14T22:00:00.000Z",
	ended_at: null,
	attendance: [attendance(7, 50, 0)],
};

const sentinelOnly = {
	id: 5,
	championship_id: 9,
	starts_at: "2026-08-10T22:00:00.000Z",
	ended_at: "2026-08-10T23:00:00.000Z",
	attendance: [attendance(9, 0, 0)],
};

const seeded = championshipRatingScatterPoints(
	[player(11, 3.5)],
	[seededDebut],
);
check(seeded.length === 1, "seeded point");
check(seeded[0]?.initialRating === 3, "seeded initial is ratingTo");
check(seeded[0]?.currentRating === 3, "seeded current from history");

const ranked = championshipRatingScatterPoints(
	[player(7, 5.5), player(11, 3.5)],
	[openEvent, rankedLater, rankedDebut, seededDebut],
);
check(ranked.length === 2, "two points");

const initialSeries = championshipRatingScatterSeries(
	ranked,
	CHAMPIONSHIP_RATING_SCATTER_KIND.initial,
);
check(initialSeries[0]?.rating === 4, "initial sorted high first");
check(initialSeries[1]?.rating === 3, "initial sorted low second");
check(
	championshipRatingScatterTitle(CHAMPIONSHIP_RATING_SCATTER_KIND.initial) ===
		CHAMPIONSHIP_RATING_SCATTER_LABEL.initial,
	"initial title",
);

const currentSeries = championshipRatingScatterSeries(
	ranked,
	CHAMPIONSHIP_RATING_SCATTER_KIND.current,
);
check(currentSeries[0]?.rating === 5.5, "current sorted high first");
check(
	championshipRatingScatterTitle(CHAMPIONSHIP_RATING_SCATTER_KIND.current) ===
		CHAMPIONSHIP_RATING_SCATTER_LABEL.current,
	"current title",
);

const sentinel = championshipRatingScatterPoints(
	[player(9, 0)],
	[sentinelOnly],
);
check(sentinel.length === 0, "skip sentinel current");
check(
	championshipRatingScatterEmptyLabel(sentinel) ===
		CHAMPIONSHIP_RATING_SCATTER_LABEL.empty,
	"empty label",
);

const noHistory = championshipRatingScatterPoints([player(12, 4)], []);
check(noHistory.length === 0, "skip without history");

const domain = championshipRatingScatterDomain(currentSeries);
check(domain.min <= 3.5, "domain includes low");
check(domain.max >= 5.5, "domain includes high");

console.log("championship-rating-scatter ok");
