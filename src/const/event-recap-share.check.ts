import type {
	ChampionshipEventAttendance,
	ChampionshipEventMatch,
	ChampionshipEventMatchPlayer,
	ChampionshipEventTeam,
} from "@/types/championship-event";
import { formatEventStartsAt } from "./championship-event.ts";
import { applyEventRatingDelta } from "./event-rating-adjustment.ts";
import {
	EVENT_RECAP_SHARE,
	eventRecapShareDataFromEvent,
	eventRecapShareFileName,
	eventRecapShareImageHeight,
	eventRecapShareRatingChangeLine,
	eventRecapShareRatingChangesFromAttendance,
	eventRecapShareRatingChangesFromPreview,
	eventRecapShareText,
} from "./event-recap-share.ts";
import { EVENT_TEAM_COLOR, type EventTeamColor } from "./event-team-color.ts";

function check(actual: unknown, expected: unknown): void {
	if (actual !== expected) {
		throw new Error(`expected ${String(expected)}, got ${String(actual)}`);
	}
}

function team(
	id: number,
	color: EventTeamColor | null,
	sortOrder: number,
): ChampionshipEventTeam {
	return {
		id,
		event_id: 1,
		color,
		sort_order: sortOrder,
		is_active: true,
		template_player_ids: [],
		template_goalkeeper_id: 0,
		players: [],
	};
}

function matchPlayer(
	playerId: number,
	teamId: number,
	displayName: string,
	slot: number,
): ChampionshipEventMatchPlayer {
	return {
		id: playerId,
		match_id: 1,
		event_id: 1,
		team_id: teamId,
		player_id: playerId,
		display_name: displayName,
		is_goalkeeper: false,
		slot,
		is_substituted: false,
		include_stats: true,
	};
}

function matchGoal(
	id: number,
	scorerPlayerId: number,
	assistPlayerId: number | null,
	isOwnGoal: boolean,
): {
	id: number;
	match_id: number;
	event_id: number;
	scorer_player_id: number;
	assist_player_id: number | null;
	is_own_goal: boolean;
	elapsed_seconds: number | null;
	created_at: string;
} {
	return {
		id,
		match_id: 1,
		event_id: 1,
		scorer_player_id: scorerPlayerId,
		assist_player_id: assistPlayerId,
		is_own_goal: isOwnGoal,
		elapsed_seconds: null,
		created_at: "2026-08-14T00:00:00.000Z",
	};
}

function endedMatch(
	teamAId: number,
	teamBId: number,
	winnerTeamId: number | null,
	players: ChampionshipEventMatchPlayer[],
	goals: ChampionshipEventMatch["goals"],
): ChampionshipEventMatch {
	return {
		id: 1,
		event_id: 1,
		team_a_id: teamAId,
		team_b_id: teamBId,
		created_at: "2026-08-14T00:00:00.000Z",
		ended_at: "2026-08-14T22:10:00.000Z",
		winner_team_id: winnerTeamId,
		duration_seconds: 420,
		started_at: "2026-08-14T22:00:00.000Z",
		paused_at: null,
		pause_accumulated_seconds: 0,
		players,
		goals,
	};
}

const redTeam = team(1, EVENT_TEAM_COLOR.red, 0);
const blueTeam = team(2, EVENT_TEAM_COLOR.blue, 1);

const match = endedMatch(
	1,
	2,
	1,
	[
		matchPlayer(10, 1, "Ana", 0),
		matchPlayer(11, 1, "Caio", 1),
		matchPlayer(20, 2, "Bruno", 0),
		matchPlayer(21, 2, "Duda", 1),
	],
	[
		matchGoal(1, 10, 20, false),
		matchGoal(2, 10, null, false),
		matchGoal(3, 11, null, false),
		matchGoal(4, 21, null, false),
	],
);

const startsAt = "2026-08-14T22:00:00.000Z";

const ratingPreview = [
	{ playerId: 10, name: "Ana", from: 5, to: 6, isMvp: true },
	{ playerId: 20, name: "Bruno", from: 6, to: 5, isMvp: false },
];

check(
	eventRecapShareRatingChangesFromPreview(ratingPreview)
		.map((row) => row.delta)
		.join(","),
	"1,-1",
);

const ratingFromAttendance: readonly ChampionshipEventAttendance[] = [
	{
		id: 1,
		event_id: 1,
		player_id: 10,
		display_name: "Ana",
		is_goalkeeper: false,
		event_date: startsAt,
		goals: 2,
		assists: 1,
		assisted_goals: 1,
		own_goals: 0,
		wins: 0,
		losses: 0,
		draws: 0,
		matches: 3,
		rating: 5,
		rating_delta: 1,
		vote_rating_delta: 0,
		is_mvp: true,
		mvp_overridden: false,
	},
	{
		id: 2,
		event_id: 1,
		player_id: 20,
		display_name: "Bruno",
		is_goalkeeper: false,
		event_date: startsAt,
		goals: 0,
		assists: 0,
		assisted_goals: 0,
		own_goals: 0,
		wins: 0,
		losses: 0,
		draws: 0,
		matches: 3,
		rating: 6,
		rating_delta: -1,
		vote_rating_delta: 0,
		is_mvp: false,
		mvp_overridden: false,
	},
];

check(
	eventRecapShareRatingChangesFromAttendance(ratingFromAttendance)
		.map((row) => row.to)
		.join(","),
	`${applyEventRatingDelta(5, 1)},${applyEventRatingDelta(6, -1)}`,
);

const teams = [redTeam, blueTeam] as const;

const ratingChanges = eventRecapShareRatingChangesFromPreview(ratingPreview);

const data = eventRecapShareDataFromEvent({
	championshipName: "Baba do Mago",
	startsAt,
	matches: [match],
	teams,
	ratingChanges,
});

check(data.endedMatches.length, 1);
check(data.endedMatches[0]?.teamAName, "Vermelho");
check(data.endedMatches[0]?.teamBName, "Azul");
check(data.endedMatches[0]?.scoreLabel, "3 x 1");
check(data.mvpNames.join(","), "Ana");

check(data.mostWinsTeam?.names.join(","), "Vermelho");
check(data.mostWinsTeam?.value, 1);
check(data.topScorers[0]?.name, "Ana");
check(data.topScorers[0]?.value, 2);
check(data.topScorers[1]?.name, "Caio");
check(data.topScorers[1]?.value, 1);
check(data.topAssists[0]?.name, "Bruno");
check(data.topAssists[0]?.value, 1);

const heading = `Recap · ${formatEventStartsAt(startsAt).date}`;
check(eventRecapShareText(data).startsWith(heading), true);

check(
	ratingChanges.map(eventRecapShareRatingChangeLine).join("|"),
	"Ana 5.0 → 6.0 (+1.0)|Bruno 6.0 → 5.0 (-1.0)",
);
check(eventRecapShareText(data).includes("Ana 5.0 → 6.0 (+1.0)"), true);
check(eventRecapShareText(data).includes("Bruno 6.0 → 5.0 (-1.0)"), true);

const taller = eventRecapShareImageHeight({
	matchCount: 2,
	scorerCount: 3,
	assistCount: 2,
	ratingCount: 4,
});
const shorter = eventRecapShareImageHeight({
	matchCount: 0,
	scorerCount: 0,
	assistCount: 0,
	ratingCount: 0,
});
check(taller > shorter, true);

check(
	eventRecapShareFileName({
		championshipName: "",
		startsAt: "",
		generatedAt: "nope",
	}),
	EVENT_RECAP_SHARE.fileName,
);

console.log("event-recap-share ok");
