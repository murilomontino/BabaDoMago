import type { ChampionshipPlayer } from "../types/championship.ts";
import type {
	ChampionshipEventAttendance,
	ChampionshipEventMatch,
	ChampionshipEventMatchPlayer,
	ChampionshipEventTeam,
} from "../types/championship-event.ts";
import {
	eventRatingSimHasEndedMatches,
	eventRatingSimMvpCandidateIds,
	eventRatingSimRows,
} from "./event-rating-sim.ts";

function checkEq<T>(actual: T, expected: T, message: string) {
	if (actual !== expected) {
		throw new Error(
			`${message}: got ${String(actual)}, want ${String(expected)}`,
		);
	}
}

function attendance(
	playerId: number,
	displayName: string,
	rating = 4,
): ChampionshipEventAttendance {
	return {
		id: playerId,
		event_id: 1,
		player_id: playerId,
		display_name: displayName,
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
		rating,
		rating_delta: 0,
		vote_rating_delta: 0,
		is_mvp: false,
		mvp_overridden: false,
	};
}

function player(id: number, name: string, rating: number): ChampionshipPlayer {
	return {
		id,
		championship_id: 1,
		user_id: null,
		display_name: name,
		nickname: null,
		nickname_tags: [],
		avatar_url: null,
		rating,
		role: "player",
		is_goalkeeper: false,
		deleted_at: null,
		goals: 0,
		assists: 0,
		assisted_goals: 0,
		own_goals: 0,
		wins: 0,
		losses: 0,
		draws: 0,
		mvps: 0,
		matches: 0,
	};
}

function team(
	id: number,
	playerIds: number[],
): ChampionshipEventTeam {
	return {
		id,
		event_id: 1,
		color: null,
		sort_order: id,
		is_active: true,
		template_player_ids: [],
		template_goalkeeper_id: 0,
		players: playerIds.map((playerId, index) => ({
			id: index + 1,
			event_id: 1,
			team_id: id,
			player_id: playerId,
			display_name: `P${playerId}`,
			is_goalkeeper: false,
		})),
	};
}

function matchPlayer(
	id: number,
	teamId: number,
	playerId: number,
): ChampionshipEventMatchPlayer {
	return {
		id,
		match_id: 1,
		event_id: 1,
		team_id: teamId,
		player_id: playerId,
		display_name: `P${playerId}`,
		is_goalkeeper: false,
		slot: 1,
		is_substituted: false,
		include_stats: true,
	};
}

function endedMatch(input: {
	id: number;
	winnerTeamId: number | null;
	players: ChampionshipEventMatchPlayer[];
	goals?: ChampionshipEventMatch["goals"];
}): ChampionshipEventMatch {
	return {
		id: input.id,
		event_id: 1,
		team_a_id: 10,
		team_b_id: 20,
		created_at: "2026-08-01T22:00:00.000Z",
		ended_at: "2026-08-01T22:10:00.000Z",
		winner_team_id: input.winnerTeamId,
		duration_seconds: 420,
		started_at: "2026-08-01T22:00:00.000Z",
		paused_at: null,
		pause_accumulated_seconds: 0,
		players: input.players,
		goals: input.goals ?? [],
	};
}

const teams = [team(10, [1]), team(20, [2])];
const players = [player(1, "Ana", 4), player(2, "Bruno", 4)];
const attendanceRows = [attendance(1, "Ana"), attendance(2, "Bruno")];

checkEq(eventRatingSimHasEndedMatches([]), false, "no ended");
checkEq(
	eventRatingSimHasEndedMatches([
		endedMatch({
			id: 1,
			winnerTeamId: 10,
			players: [matchPlayer(1, 10, 1), matchPlayer(2, 20, 2)],
		}),
	]),
	true,
	"has ended",
);

const threeWins = [1, 2, 3].map((id) =>
	endedMatch({
		id,
		winnerTeamId: 10,
		players: [matchPlayer(id * 10, 10, 1), matchPlayer(id * 10 + 1, 20, 2)],
		goals: [
			{
				id,
				match_id: id,
				event_id: 1,
				scorer_player_id: 1,
				assist_player_id: null,
				is_own_goal: false,
				elapsed_seconds: 10,
				created_at: "2026-08-01T22:05:00.000Z",
			},
		],
	}),
);

const rows = eventRatingSimRows({
	attendance: attendanceRows,
	players,
	matches: threeWins,
	teams,
	skipGuestGoalkeeperMatches: true,
	mvpPlayerIds: [],
});

const ana = rows.find((row) => row.playerId === 1);
const bruno = rows.find((row) => row.playerId === 2);
checkEq(ana?.wins, 3, "ana wins");
checkEq(ana?.matches, 3, "ana matches");
checkEq(bruno?.losses, 3, "bruno losses");
checkEq((ana?.to ?? 0) > (ana?.from ?? 0), true, "ana rating up");
checkEq((bruno?.to ?? 0) < (bruno?.from ?? 0), true, "bruno rating down");
checkEq(rows[0]?.playerId, 1, "larger |delta| first (ana up)");

const mvpIds = eventRatingSimMvpCandidateIds({
	attendance: attendanceRows,
	matches: threeWins,
	teams,
	skipGuestGoalkeeperMatches: true,
});
checkEq(mvpIds[0], 1, "mvp candidate is scorer");

const mvpRows = eventRatingSimRows({
	attendance: attendanceRows,
	players,
	matches: threeWins,
	teams,
	skipGuestGoalkeeperMatches: true,
	mvpPlayerIds: [1],
});
checkEq(mvpRows.find((row) => row.playerId === 1)?.isMvp, true, "mvp flag");
checkEq(
	(mvpRows.find((row) => row.playerId === 1)?.to ?? 0) >
		(ana?.to ?? 0),
	true,
	"mvp raises to",
);

const evolvedPlayers = [player(1, "Ana", ana?.to ?? 0), player(2, "Bruno", 4)];
const evolvedRows = eventRatingSimRows({
	attendance: [attendance(1, "Ana", 4), attendance(2, "Bruno", 4)],
	players: evolvedPlayers,
	matches: threeWins,
	teams,
	skipGuestGoalkeeperMatches: true,
	mvpPlayerIds: [],
});
checkEq(evolvedRows.find((row) => row.playerId === 1)?.from, 4, "sim usa presenca");
checkEq(
	evolvedRows.find((row) => row.playerId === 1)?.to,
	ana?.to,
	"sim nao aplica delta de novo",
);

console.log("event-rating-sim ok");
