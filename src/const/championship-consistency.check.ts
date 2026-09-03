import type { ChampionshipPlayer } from "../types/championship.ts";
import type {
	ChampionshipEvent,
	ChampionshipEventAttendance,
} from "../types/championship-event.ts";
import {
	CONSISTENCY_METRIC,
	championshipConsistencyEmptyLabel,
	championshipConsistencyPoints,
} from "./championship-consistency.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
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
		role: "member",
		rating: 3,
		goals: 0,
		assists: 0,
		assisted_goals: 0,
		own_goals: 0,
		wins: 0,
		losses: 0,
		draws: 0,
		matches: 0,
		mvps: 0,
		is_goalkeeper: false,
		deleted_at: null,
	};
}

function attendance(
	playerId: number,
	goals: number,
	matches: number,
	ratingDelta: number,
	assists = 0,
): ChampionshipEventAttendance {
	return {
		id: playerId,
		event_id: 1,
		player_id: playerId,
		display_name: "x",
		is_goalkeeper: false,
		event_date: "2026-01-01",
		goals,
		assists,
		assisted_goals: 0,
		own_goals: 0,
		wins: 0,
		losses: 0,
		draws: 0,
		matches,
		rating: 3,
		rating_delta: ratingDelta,
		vote_rating_delta: 0,
		is_mvp: false,
		mvp_overridden: false,
	};
}

function event(
	id: number,
	day: string,
	rows: ChampionshipEventAttendance[],
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

const players = [player(1, "Joao"), player(2, "Pedro")];

const short = [
	event(1, "2026-01-01", [attendance(1, 2, 4, 0.2)]),
	event(2, "2026-01-08", [attendance(1, 0, 4, -0.1)]),
];
check(
	championshipConsistencyPoints(
		players,
		short,
		CONSISTENCY_METRIC.goalsPerMatch,
	).length === 0,
	"below min presences",
);

const enough = [
	event(1, "2026-01-01", [
		attendance(1, 4, 4, 0.4, 2),
		attendance(2, 1, 4, 0, 1),
	]),
	event(2, "2026-01-08", [
		attendance(1, 0, 4, -0.2, 0),
		attendance(2, 1, 4, 0, 1),
	]),
	event(3, "2026-01-15", [
		attendance(1, 2, 4, 0.1, 1),
		attendance(2, 1, 4, 0, 1),
	]),
];

const goalPoints = championshipConsistencyPoints(
	players,
	enough,
	CONSISTENCY_METRIC.goalsPerMatch,
);
check(goalPoints.length === 2, "two players");
const joao = goalPoints.find((point) => point.playerId === 1);
check(joao !== undefined, "joao present");
check(joao?.volume === 12, "joao volume");
check(joao?.presences === 3, "joao presences");
check((joao?.deviation ?? 0) > 0, "joao irregular goals");

const pedro = goalPoints.find((point) => point.playerId === 2);
check(pedro !== undefined, "pedro present");
check(pedro?.deviation === 0, "pedro stable goals");

const deltaPoints = championshipConsistencyPoints(
	players,
	enough,
	CONSISTENCY_METRIC.ratingDelta,
);
const joaoDelta = deltaPoints.find((point) => point.playerId === 1);
check((joaoDelta?.deviation ?? 0) > 0, "delta deviation");
check(
	championshipConsistencyEmptyLabel([]) === "Precisa de pelo menos 3 presenças",
	"empty label",
);
check(championshipConsistencyEmptyLabel(goalPoints) === null, "has points");

const assistPoints = championshipConsistencyPoints(
	players,
	enough,
	CONSISTENCY_METRIC.assistsPerMatch,
);
const joaoAssist = assistPoints.find((point) => point.playerId === 1);
check(joaoAssist !== undefined, "joao assists present");
check((joaoAssist?.deviation ?? 0) > 0, "joao irregular assists");

const pedroAssist = assistPoints.find((point) => point.playerId === 2);
check(pedroAssist !== undefined, "pedro assists present");
check(pedroAssist?.deviation === 0, "pedro stable assists");

const invPoints = championshipConsistencyPoints(
	players,
	enough,
	CONSISTENCY_METRIC.goalInvolvementPerMatch,
);
const joaoInv = invPoints.find((point) => point.playerId === 1);
check(joaoInv !== undefined, "joao involvement present");
check((joaoInv?.deviation ?? 0) > 0, "joao irregular involvement");

console.log("championship-consistency ok");
