import {
	championshipTrendsEvents,
	championshipTrendsHasEnoughEnded,
	parseTrendsWindow,
	TRENDS_WINDOW,
	TRENDS_WINDOW_DEFAULT,
	TRENDS_WINDOW_MIN_ENDED,
} from "./championship-trends-window.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

check(parseTrendsWindow("last3") === TRENDS_WINDOW.last3, "parses last3");
check(parseTrendsWindow("nope") === TRENDS_WINDOW_DEFAULT, "fallback default");
check(TRENDS_WINDOW_MIN_ENDED === 3, "min ended is 3");

const events = [
	{ id: 1, starts_at: "2026-01-01", ended_at: "2026-01-01" },
	{ id: 2, starts_at: "2026-01-08", ended_at: "2026-01-08" },
	{ id: 3, starts_at: "2026-01-15", ended_at: null },
	{ id: 4, starts_at: "2026-01-22", ended_at: "2026-01-22" },
	{ id: 5, starts_at: "2026-01-29", ended_at: "2026-01-29" },
	{ id: 6, starts_at: "2026-02-05", ended_at: "2026-02-05" },
];

check(!championshipTrendsHasEnoughEnded(events.slice(0, 2)), "two ended short");
check(championshipTrendsHasEnoughEnded(events), "five ended enough");

const last3 = championshipTrendsEvents(events, TRENDS_WINDOW.last3);
check(last3.length === 3, "last3 length");
check(last3[0]?.id === 4, "last3 oldest in window");
check(last3[2]?.id === 6, "last3 newest");

const last5 = championshipTrendsEvents(events, TRENDS_WINDOW.last5);
check(last5.length === 5, "last5 length");
check(
	last5.every((event) => event.ended_at !== null),
	"only ended",
);

console.log("championship-trends-window ok");
