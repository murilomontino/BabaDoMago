import type { ChampionshipPlayer } from "../types/championship.ts";
import type {
	ChampionshipEvent,
	ChampionshipEventAttendance,
	ChampionshipEventMatch,
} from "../types/championship-event.ts";
import {
	formatManagementAverage,
	formatManagementLastPlayed,
	formatManagementStat,
	formatManagementSummary,
	MANAGEMENT_ALERT,
	MANAGEMENT_COLUMN,
	MANAGEMENT_LABEL,
	MANAGEMENT_SUMMARY,
	managementAlerts,
	managementFrequencyRows,
	managementSummary,
	rankManagementFrequencyRows,
} from "./championship-management.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

function player(id: number, displayName: string): ChampionshipPlayer {
	return {
		id,
		championship_id: 1,
		user_id: null,
		display_name: displayName,
		nickname: null,
		nickname_tags: [],
		avatar_url: null,
		rating: 5,
		goalkeeper_rating: 0,
		role: "member",
		is_goalkeeper: false,
		is_monthly: false,
		deleted_at: null,
		goals: 0,
		assists: 0,
		assisted_goals: 0,
		own_goals: 0,
		wins: 0,
		losses: 0,
		draws: 0,
		matches: 0,
		mvps: 0,
	};
}

function attendance(
	playerId: number,
	stats: Partial<ChampionshipEventAttendance> = {},
): ChampionshipEventAttendance {
	return {
		id: playerId,
		event_id: 1,
		player_id: playerId,
		display_name: String(playerId),
		is_goalkeeper: false,
		event_date: "2026-08-01",
		goals: 0,
		assists: 0,
		assisted_goals: 0,
		own_goals: 0,
		wins: 0,
		losses: 0,
		draws: 0,
		matches: 0,
		rating: 3,
		rating_delta: 0,
		vote_rating_delta: 0,
		is_mvp: false,
		mvp_overridden: false,
		...stats,
		goalkeeper_rating: stats.goalkeeper_rating ?? 0,
		goalkeeper_rating_delta: stats.goalkeeper_rating_delta ?? 0,
		goalkeeper_vote_rating_delta: stats.goalkeeper_vote_rating_delta ?? 0,
	};
}

function matchRow(
	overrides: Partial<ChampionshipEventMatch> = {},
): ChampionshipEventMatch {
	return {
		id: 1,
		event_id: 1,
		team_a_id: 10,
		team_b_id: 20,
		created_at: "2026-08-01T22:00:00.000Z",
		ended_at: "2026-08-01T22:10:00.000Z",
		winner_team_id: 10,
		duration_seconds: 420,
		started_at: "2026-08-01T22:00:00.000Z",
		paused_at: null,
		pause_accumulated_seconds: 0,
		players: [],
		goals: [],
		...overrides,
	};
}

function eventRow(
	id: number,
	overrides: Partial<ChampionshipEvent> = {},
): ChampionshipEvent {
	return {
		id,
		championship_id: 1,
		starts_at: `2026-08-0${id}T22:00:00.000Z`,
		players_per_team: 5,
		skip_guest_goalkeeper_matches: true,
		ended_at: `2026-08-0${id}T23:00:00.000Z`,
		attendance: [],
		rsvps: [],
		teams: [],
		matches: [],
		...overrides,
	};
}

check(MANAGEMENT_LABEL.tab === "Gestão", "tab label");
check(
	formatManagementSummary(MANAGEMENT_SUMMARY.endedEvents, 4) === "4",
	"format ended",
);
check(formatManagementAverage(2.5) === "2.5", "format average");

const empty = managementSummary([]);
check(empty.endedEvents === 0, "empty ended");
check(empty.averageAttendance === 0, "empty average");
check(empty.openEvents === 0, "empty open events");
check(empty.openMatches === 0, "empty open matches");

const ana = player(1, "Ana");
const bruno = player(2, "Bruno");
const events = [
	eventRow(1, {
		attendance: [attendance(1), attendance(2)],
		matches: [matchRow()],
	}),
	eventRow(2, {
		attendance: [attendance(1)],
		matches: [matchRow({ id: 2 })],
	}),
	eventRow(3, {
		ended_at: null,
		attendance: [attendance(1)],
		matches: [matchRow({ id: 3, ended_at: null, winner_team_id: null })],
	}),
];
const summary = managementSummary(events);
check(summary.endedEvents === 2, "two ended");
check(summary.averageAttendance === 1.5, "average present");
check(summary.openEvents === 1, "one open event");
check(summary.openMatches === 1, "one open match");

const frequency = rankManagementFrequencyRows(
	managementFrequencyRows([ana, bruno], events),
);
check(frequency[0]?.player.id === 1, "ana more present first");
check(frequency[0]?.present === 2, "ana present twice");
check(frequency[0]?.events === 2, "ended events only");
check(frequency[0]?.streak === 2, "ana streak two");
check(frequency[1]?.player.id === 2, "bruno second");
check(frequency[1]?.present === 1, "bruno once");
check(frequency[1]?.streak === 0, "bruno missed latest");
const anaRow = frequency[0];
check(
	anaRow !== undefined &&
		formatManagementStat(MANAGEMENT_COLUMN.rate, anaRow) === "100%",
	"ana rate",
);
check(
	formatManagementLastPlayed(frequency[1]?.lastPlayedAt ?? null).includes("01"),
	"bruno last played date",
);

const alerts = managementAlerts(events);
check(
	alerts.some((alert) => alert.kind === MANAGEMENT_ALERT.openEvent),
	"open event alert",
);
check(
	alerts.some((alert) => alert.kind === MANAGEMENT_ALERT.openMatch),
	"open match alert",
);

const mismatch = managementAlerts([
	eventRow(1, {
		attendance: [attendance(1, { wins: 3, losses: 0, draws: 0, matches: 2 })],
	}),
]);
check(
	mismatch.some((alert) => alert.kind === MANAGEMENT_ALERT.resultMismatch),
	"result mismatch alert",
);

const noAttendance = managementAlerts([eventRow(1, { attendance: [] })]);
check(
	noAttendance.some(
		(alert) => alert.kind === MANAGEMENT_ALERT.endedWithoutAttendance,
	),
	"ended without attendance",
);

console.log("championship-management ok");
