import type { ChampionshipRatingHistorySeries } from "./championship-rating-history.ts";
import {
	parseRatingRaceLimit,
	ratingRaceFrames,
	ratingRaceGifFileName,
	ratingRaceLeaders,
	ratingRaceLimitCaption,
	ratingRaceSeriesPath,
	ratingRaceSeriesValues,
	ratingRaceValueAt,
} from "./rating-race-share.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

const ana: ChampionshipRatingHistorySeries = {
	playerId: 1,
	name: "Ana",
	avatarUrl: null,
	color: "#000000",
	dataKey: "p1",
};
const bruno: ChampionshipRatingHistorySeries = {
	playerId: 2,
	name: "Bruno",
	avatarUrl: null,
	color: "#111111",
	dataKey: "p2",
};

const frames = ratingRaceFrames(3);
check(frames.length === 21, "frames: 9 growing + 12 hold");
check(frames[1] === 0.25, "frames step 1 is 0.25");
check(frames[8] === 2, "frames step 8 is last index");
check(frames.at(-1) === 2, "hold stops at last point");

check(
	JSON.stringify(
		ratingRaceSeriesValues(
			[
				{ x: 0, startsAt: "a", p1: 3 },
				{ x: 1, startsAt: "b", p1: null },
			],
			ana,
		),
	) === JSON.stringify([3, null]),
	"series values keep numbers and nulls",
);

const values = [null, 3, 4];
check(ratingRaceValueAt(values, 0) === null, "value before first presence");
check(ratingRaceValueAt(values, 1) === 3, "value at first presence");
check(ratingRaceValueAt(values, 1.5) === 3.5, "value interpolates");
check(ratingRaceValueAt(values, 2) === 4, "value at last point");

check(
	ratingRaceSeriesPath([null, 3, 4], 0).length === 0,
	"path empty before first presence",
);

const midPath = ratingRaceSeriesPath([null, 3, 4], 1.5);
check(midPath.length === 2, "mid path has two points");
check(midPath[0]?.at === 1 && midPath[0]?.rating === 3, "mid path starts at 1");
check(
	midPath[1]?.at === 1.5 && midPath[1]?.rating === 3.5,
	"mid path tip interpolates",
);

const endPath = ratingRaceSeriesPath([null, 3, 4], 2);
check(endPath.length === 2, "end path does not duplicate tip");
check(endPath.at(-1)?.at === 2, "end path tip at last index");

const entries = [
	{ series: ana, values: [1, 5] },
	{ series: bruno, values: [2, 2] },
];
const startLeaders = ratingRaceLeaders(entries, 0, 1);
check(startLeaders.length === 1, "start top-1 has one leader");
check(
	startLeaders[0]?.series.playerId === bruno.playerId,
	"bruno leads at start",
);
const endLeaders = ratingRaceLeaders(entries, 1, 1);
check(endLeaders.length === 1, "end top-1 has one leader");
check(endLeaders[0]?.series.playerId === ana.playerId, "ana leads at end");

const allLeaders = ratingRaceLeaders(entries, 1, null);
check(allLeaders.length === 2, "null limit keeps every series");
check(
	allLeaders[0]?.position === 1 && allLeaders[1]?.position === 2,
	"positions 1 and 2",
);

check(
	ratingRaceLeaders([{ series: ana, values: [null, 3] }], 0, 10).length === 0,
	"series without rating stays out",
);
check(
	ratingRaceLeaders(entries, 0, 99).length === 2,
	"limit larger than series count still works",
);

check(parseRatingRaceLimit("all") === null, "parse all");
check(parseRatingRaceLimit("10") === 10, "parse 10");
check(parseRatingRaceLimit("999") === 10, "unknown number falls back");
check(parseRatingRaceLimit("abc") === 10, "invalid falls back");
check(ratingRaceLimitCaption(10) === "Top 10", "caption top 10");
check(ratingRaceLimitCaption(null) === "Todos", "caption all");

const fileName = ratingRaceGifFileName({
	championshipName: "Baba",
	limit: 10,
	generatedAt: "2026-08-27T22:00:00.000Z",
});
check(fileName.startsWith("corrida-nota"), "gif name prefix");
check(fileName.endsWith(".gif"), "gif extension");

console.log("rating-race-share ok");
