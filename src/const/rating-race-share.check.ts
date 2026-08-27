import type { ChampionshipRatingHistorySeries } from "./championship-rating-history.ts";
import {
	parseRatingRaceLimit,
	RATING_RACE_LIMIT_KIND,
	ratingRaceFrames,
	ratingRaceGifFileName,
	ratingRaceLeaders,
	ratingRaceLimitCaption,
	ratingRaceMp4FileName,
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
check(frames.length === 69, "frames: 33 growing + 36 hold");
check(frames[1] === 0.0625, "frames step 1 is 1/16");
check(frames[32] === 2, "frames step 32 is last index");
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
const top1 = { kind: RATING_RACE_LIMIT_KIND.top, count: 1 };
const worst1 = { kind: RATING_RACE_LIMIT_KIND.worst, count: 1 };
const top10 = { kind: RATING_RACE_LIMIT_KIND.top, count: 10 };
const top99 = { kind: RATING_RACE_LIMIT_KIND.top, count: 99 };
const worst10 = { kind: RATING_RACE_LIMIT_KIND.worst, count: 10 };

const startLeaders = ratingRaceLeaders(entries, 0, top1);
check(startLeaders.length === 1, "start top-1 has one leader");
check(
	startLeaders[0]?.series.playerId === bruno.playerId,
	"bruno leads at start",
);
const endLeaders = ratingRaceLeaders(entries, 1, top1);
check(endLeaders.length === 1, "end top-1 has one leader");
check(endLeaders[0]?.series.playerId === ana.playerId, "ana leads at end");

const allLeaders = ratingRaceLeaders(entries, 1, null);
check(allLeaders.length === 2, "null limit keeps every series");
check(
	allLeaders[0]?.position === 1 && allLeaders[1]?.position === 2,
	"positions 1 and 2",
);

check(
	ratingRaceLeaders([{ series: ana, values: [null, 3] }], 0, top10).length ===
		0,
	"series without rating stays out",
);
check(
	ratingRaceLeaders(entries, 0, top99).length === 2,
	"limit larger than series count still works",
);

const startWorst = ratingRaceLeaders(entries, 0, worst1);
check(startWorst.length === 1, "start worst-1 has one leader");
check(startWorst[0]?.series.playerId === ana.playerId, "ana is worst at start");
const endWorst = ratingRaceLeaders(entries, 1, worst1);
check(endWorst.length === 1, "end worst-1 has one leader");
check(endWorst[0]?.series.playerId === bruno.playerId, "bruno is worst at end");

const parsedAll = parseRatingRaceLimit("all");
check(parsedAll === null, "parse all");
const parsed10 = parseRatingRaceLimit("10");
check(
	parsed10?.kind === RATING_RACE_LIMIT_KIND.top && parsed10.count === 10,
	"parse 10 as top",
);
const parsedTop10 = parseRatingRaceLimit("top-10");
check(
	parsedTop10?.kind === RATING_RACE_LIMIT_KIND.top && parsedTop10.count === 10,
	"parse top-10",
);
const parsedWorst5 = parseRatingRaceLimit("worst-5");
check(
	parsedWorst5?.kind === RATING_RACE_LIMIT_KIND.worst &&
		parsedWorst5.count === 5,
	"parse worst-5",
);
const parsedUnknown = parseRatingRaceLimit("999");
check(
	parsedUnknown?.kind === RATING_RACE_LIMIT_KIND.top &&
		parsedUnknown.count === 10,
	"unknown number falls back",
);
const parsedAbc = parseRatingRaceLimit("abc");
check(
	parsedAbc?.kind === RATING_RACE_LIMIT_KIND.top && parsedAbc.count === 10,
	"invalid falls back",
);
check(ratingRaceLimitCaption(top10) === "Top 10", "caption top 10");
check(ratingRaceLimitCaption(worst10) === "Piores 10", "caption worst 10");
check(ratingRaceLimitCaption(null) === "Todos", "caption all");

const fileName = ratingRaceGifFileName({
	championshipName: "Baba",
	limit: top10,
	generatedAt: "2026-08-27T22:00:00.000Z",
});
check(fileName.startsWith("corrida-nota"), "gif name prefix");
check(fileName.endsWith(".gif"), "gif extension");

const mp4Name = ratingRaceMp4FileName({
	championshipName: "Baba",
	limit: top10,
	generatedAt: "2026-08-27T22:00:00.000Z",
});
check(mp4Name.startsWith("corrida-nota"), "mp4 name prefix");
check(mp4Name.endsWith(".mp4"), "mp4 extension");

const worstName = ratingRaceGifFileName({
	championshipName: "Baba",
	limit: worst10,
	generatedAt: "2026-08-27T22:00:00.000Z",
});
check(worstName.includes("piores-10"), "gif name includes worst caption");

console.log("rating-race-share ok");
