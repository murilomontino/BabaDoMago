import type { ChampionshipEvent } from "../types/championship-event.ts";
import {
	ATTENDANCE_TREND_METRIC,
	championshipAttendanceTrend,
	championshipAttendanceTrendChart,
	formatAttendanceTrendKpi,
} from "./championship-attendance-trend.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

function eventRow(
	id: number,
	day: string,
	presentCount: number,
	ended: boolean,
): ChampionshipEvent {
	const attendance = Array.from({ length: presentCount }, (_, index) => ({
		id: index + 1,
		event_id: id,
		player_id: index + 1,
		display_name: `P${index + 1}`,
		is_goalkeeper: false,
		event_date: day,
		goals: 0,
		assists: 0,
		assisted_goals: 0,
		own_goals: 0,
		wins: 0,
		losses: 0,
		draws: 0,
		matches: 0,
		rating: 0,
		rating_delta: 0,
		vote_rating_delta: 0,
		is_mvp: false,
		mvp_overridden: false,
	}));

	return {
		id,
		championship_id: 1,
		starts_at: `${day}T22:00:00.000Z`,
		players_per_team: 5,
		skip_guest_goalkeeper_matches: false,
		ended_at: ended ? `${day}T23:00:00.000Z` : null,
		attendance,
		rsvps: [],
		teams: [],
		matches: [],
	};
}

const events = [
	eventRow(1, "2026-01-01", 8, true),
	eventRow(2, "2026-01-08", 10, true),
	eventRow(3, "2026-01-15", 6, true),
	eventRow(4, "2026-01-22", 12, false),
];

const summary = championshipAttendanceTrend(events, 12);
check(summary.events === 3, "three ended with attendance");
check(summary.averagePresent === 8, "average present count");
check(Math.abs(summary.averageShare - 8 / 12) < 0.001, "average share");

const chart = championshipAttendanceTrendChart(
	summary,
	ATTENDANCE_TREND_METRIC.count,
);
check(chart.length === 3, "chart points");
check(chart[0]?.value === 8, "first point count");
check(chart[1]?.value === 10, "second point count");

check(
	formatAttendanceTrendKpi(ATTENDANCE_TREND_METRIC.count, summary) === "8.0",
	"kpi count",
);

console.log("championship-attendance-trend.check.ts ok");
