import {
	CHAMPIONSHIP_SCATTER_PERIOD,
	CHAMPIONSHIP_SCATTER_PERIOD_DEFAULT,
	CHAMPIONSHIP_SCATTER_PERIOD_LABEL,
	championshipScatterPeriodCaption,
	championshipScatterPeriodEvents,
	parseChampionshipScatterPeriod,
} from "./championship-scatter-period.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

function event(
	id: number,
	startsAt: string,
	endedAt: string | null,
): {
	id: number;
	starts_at: string;
	ended_at: string | null;
} {
	return {
		id,
		starts_at: startsAt,
		ended_at: endedAt,
	};
}

const nowMs = Date.parse("2026-09-02T15:00:00.000Z");

const events = [
	event(1, "2026-06-01T22:00:00.000Z", "2026-06-01T23:00:00.000Z"),
	event(2, "2026-07-01T22:00:00.000Z", "2026-07-01T23:00:00.000Z"),
	event(3, "2026-08-01T22:00:00.000Z", "2026-08-01T23:00:00.000Z"),
	event(4, "2026-08-08T22:00:00.000Z", "2026-08-08T23:00:00.000Z"),
	event(5, "2026-08-15T22:00:00.000Z", "2026-08-15T23:00:00.000Z"),
	event(6, "2026-08-22T22:00:00.000Z", "2026-08-22T23:00:00.000Z"),
	event(7, "2026-08-29T22:00:00.000Z", null),
];

const last4 = championshipScatterPeriodEvents(
	events,
	CHAMPIONSHIP_SCATTER_PERIOD.last4,
	nowMs,
);
check(last4.length === 4, "last 4 ended");
check(last4[0]?.id === 3, "last 4 oldest is 3");
check(last4[3]?.id === 6, "last 4 newest is 6");

const last8 = championshipScatterPeriodEvents(
	events,
	CHAMPIONSHIP_SCATTER_PERIOD.last8,
	nowMs,
);
check(last8.length === 6, "last 8 caps at ended count");

const month1 = championshipScatterPeriodEvents(
	events,
	CHAMPIONSHIP_SCATTER_PERIOD.month1,
	nowMs,
);
check(month1.length === 3, "month1 three ended after Aug 2");
check(month1[0]?.id === 4, "month1 starts Aug 8");

const month2 = championshipScatterPeriodEvents(
	events,
	CHAMPIONSHIP_SCATTER_PERIOD.month2,
	nowMs,
);
check(month2.length === 4, "month2 four ended after Jul 2");
check(month2[0]?.id === 3, "month2 includes Aug 1");

check(
	parseChampionshipScatterPeriod("nope") ===
		CHAMPIONSHIP_SCATTER_PERIOD_DEFAULT,
	"parse fallback",
);
check(
	championshipScatterPeriodCaption(CHAMPIONSHIP_SCATTER_PERIOD.last4) ===
		CHAMPIONSHIP_SCATTER_PERIOD_LABEL.last4,
	"caption",
);

console.log("championship-scatter-period ok");
