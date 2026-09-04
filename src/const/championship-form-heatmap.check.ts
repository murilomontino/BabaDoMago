import type { ChampionshipPlayer } from "../types/championship.ts";
import type { ChampionshipEvent } from "../types/championship-event.ts";
import {
	championshipFormHeatmap,
	eventAttendanceFormCell,
	FORM_HEATMAP_CELL,
	playerFormHeatmapCells,
} from "./championship-form-heatmap.ts";
import {
	TRENDS_AUDIENCE,
	trendsAudiencePlayers,
} from "./championship-trends-window.ts";
import { EVENT_RATING_ADJUSTMENT } from "./event-rating-adjustment.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

function attendance(
	playerId: number,
	wins: number,
	draws: number,
	losses: number,
	matches: number,
) {
	return {
		id: playerId,
		event_id: 1,
		player_id: playerId,
		display_name: `P${playerId}`,
		is_goalkeeper: false,
		event_date: "2026-01-01",
		goals: 0,
		assists: 0,
		assisted_goals: 0,
		own_goals: 0,
		wins,
		losses,
		draws,
		matches,
		rating: 5,
		rating_delta: 0,
		goalkeeper_rating: 0,
		goalkeeper_rating_delta: 0,
		vote_rating_delta: 0,
		goalkeeper_vote_rating_delta: 0,
		is_mvp: false,
		mvp_overridden: false,
	};
}

function player(id: number, name: string): ChampionshipPlayer {
	return {
		id,
		championship_id: 1,
		user_id: null,
		display_name: name,
		nickname: null,
		nickname_tags: [],
		avatar_url: null,
		rating: 5,
		goalkeeper_rating: 0,
		role: "player",
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

function eventRow(
	id: number,
	day: string,
	rows: ReturnType<typeof attendance>[],
): ChampionshipEvent {
	return {
		id,
		championship_id: 1,
		starts_at: `${day}T22:00:00.000Z`,
		players_per_team: 5,
		skip_guest_goalkeeper_matches: false,
		ended_at: `${day}T23:00:00.000Z`,
		attendance: rows,
		rsvps: [],
		teams: [],
		matches: [],
	};
}

const zeroCell = eventAttendanceFormCell({
	wins: 0,
	draws: 0,
	losses: 0,
	matches: 0,
});
check(zeroCell.kind === FORM_HEATMAP_CELL.insufficient, "zero matches insufficient");

const fewCell = eventAttendanceFormCell({
	wins: 1,
	draws: 0,
	losses: 1,
	matches: 2,
});
check(fewCell.kind === FORM_HEATMAP_CELL.insufficient, "two matches insufficient");

const upCell = eventAttendanceFormCell({
	wins: 3,
	draws: 0,
	losses: 0,
	matches: 3,
});
check(upCell.kind === FORM_HEATMAP_CELL.up, "high rate up");

const deadCell = eventAttendanceFormCell({
	wins: 2,
	draws: 0,
	losses: 2,
	matches: 4,
});
check(deadCell.kind === FORM_HEATMAP_CELL.deadZone, "mid rate dead zone");

const downCell = eventAttendanceFormCell({
	wins: 0,
	draws: 0,
	losses: 3,
	matches: 3,
});
check(downCell.kind === FORM_HEATMAP_CELL.down, "low rate down");

const events = [
	eventRow(1, "2026-01-01", [attendance(1, 3, 0, 0, 3)]),
	eventRow(2, "2026-01-08", []),
];
const players = [player(1, "Ana"), player(2, "Bruno")];
const monthlyPlayer: ChampionshipPlayer = {
	...player(1, "Carla"),
	is_monthly: true,
};

const strip = playerFormHeatmapCells(1, events);
check(strip.length === 2, "player strip two cells");
check(strip[0]?.kind === FORM_HEATMAP_CELL.up, "player strip present");
check(strip[1]?.kind === FORM_HEATMAP_CELL.absent, "player strip absent");
check(playerFormHeatmapCells(99, []).length === 0, "empty window strip");

const grid = championshipFormHeatmap(players, events);
check(grid.columns.length === 2, "two columns");
check(grid.rows.length === 1, "one active player");
check(grid.rows[0]?.cells[0]?.kind === FORM_HEATMAP_CELL.up, "present cell");
check(grid.rows[0]?.cells[1]?.kind === FORM_HEATMAP_CELL.absent, "absent cell");

const monthlyGrid = championshipFormHeatmap(
	trendsAudiencePlayers([monthlyPlayer, player(2, "Bruno")], TRENDS_AUDIENCE.monthly),
	events,
);
check(monthlyGrid.rows.length === 1, "monthly filter one row");
check(monthlyGrid.rows[0]?.player.is_monthly === true, "monthly filter player");
check(
	trendsAudiencePlayers([monthlyPlayer, player(2, "Bruno")], TRENDS_AUDIENCE.monthly)
		.length === 1,
	"monthly audience players",
);

check(
	EVENT_RATING_ADJUSTMENT.minMatches === 3,
	"min matches aligned with recent form",
);

console.log("championship-form-heatmap.check.ts ok");
