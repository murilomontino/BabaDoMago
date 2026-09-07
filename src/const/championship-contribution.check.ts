import type { ChampionshipPlayer } from "../types/championship.ts";
import type {
	ChampionshipEvent,
	ChampionshipEventAttendance,
} from "../types/championship-event.ts";
import {
	CONTRIBUTION_METRIC,
	CONTRIBUTION_MIN_GAMES,
	championshipContribution,
	contributionBubbleRadius,
	contributionMetricCaption,
	formatContributionMetricValue,
	formatContributionWinRate,
} from "./championship-contribution.ts";
import {
	TRENDS_AUDIENCE,
	TRENDS_WINDOW,
} from "./championship-trends-window.ts";
import { EVENT_TEAM_COLOR } from "./event-team-color.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

function player(
	id: number,
	name: string,
	opts: { monthly?: boolean; rating?: number } = {},
): ChampionshipPlayer {
	return {
		id,
		championship_id: 1,
		user_id: null,
		display_name: name,
		nickname: null,
		nickname_tags: [],
		avatar_url: null,
		role: "member",
		rating: opts.rating ?? 5,
		goalkeeper_rating: 0,
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
		is_monthly: opts.monthly === true,
		deleted_at: null,
	};
}

function attendance(
	partial: Partial<ChampionshipEventAttendance> & {
		player_id: number;
		wins: number;
		draws: number;
		losses: number;
		matches: number;
	},
): ChampionshipEventAttendance {
	return {
		id: partial.player_id,
		event_id: 1,
		player_id: partial.player_id,
		display_name: "x",
		is_goalkeeper: false,
		event_date: "2026-01-01",
		goals: partial.goals ?? 0,
		assists: partial.assists ?? 0,
		assisted_goals: 0,
		own_goals: 0,
		wins: partial.wins,
		losses: partial.losses,
		draws: partial.draws,
		matches: partial.matches,
		rating: partial.rating ?? 3,
		rating_delta: partial.rating_delta ?? 0,
		goalkeeper_rating: 0,
		goalkeeper_rating_delta: 0,
		vote_rating_delta: partial.vote_rating_delta ?? 0,
		goalkeeper_vote_rating_delta: 0,
		is_mvp: partial.is_mvp ?? false,
		mvp_overridden: false,
	};
}

function matchPlayer(
	id: number,
	matchId: number,
	teamId: number,
	playerId: number,
) {
	return {
		id,
		match_id: matchId,
		event_id: 1,
		team_id: teamId,
		player_id: playerId,
		display_name: String(playerId),
		is_goalkeeper: false,
		slot: 0,
		is_substituted: false,
		include_stats: true,
	};
}

function goal(
	id: number,
	matchId: number,
	scorer: number,
	assist: number | null = null,
	own = false,
) {
	return {
		id,
		match_id: matchId,
		event_id: 1,
		scorer_player_id: scorer,
		assist_player_id: assist,
		is_own_goal: own,
		elapsed_seconds: 60,
		created_at: "2026-01-01T22:05:00.000Z",
	};
}

function endedMatch(
	id: number,
	winner: number | null,
	players: ReturnType<typeof matchPlayer>[],
	goals: ReturnType<typeof goal>[],
) {
	return {
		id,
		event_id: 1,
		team_a_id: 10,
		team_b_id: 20,
		created_at: "2026-01-01T22:00:00.000Z",
		ended_at: "2026-01-01T22:10:00.000Z",
		winner_team_id: winner,
		duration_seconds: 600,
		started_at: "2026-01-01T22:00:00.000Z",
		paused_at: null,
		pause_accumulated_seconds: 0,
		players,
		goals,
	};
}

function team(id: number, playerIds: readonly number[]) {
	return {
		id,
		event_id: 1,
		color: id === 10 ? EVENT_TEAM_COLOR.white : EVENT_TEAM_COLOR.black,
		sort_order: id,
		is_active: true,
		template_player_ids: [...playerIds],
		template_goalkeeper_id: playerIds[0] ?? 0,
		players: playerIds.map((playerId, index) => ({
			id: id * 100 + index,
			event_id: 1,
			team_id: id,
			player_id: playerId,
			display_name: String(playerId),
			is_goalkeeper: false,
		})),
	};
}

function eventWith(
	id: number,
	rows: ChampionshipEventAttendance[],
	opts: {
		ended?: boolean;
		matches?: ReturnType<typeof endedMatch>[];
		day?: number;
	} = {},
): ChampionshipEvent {
	const day = opts.day ?? id;
	const dayStr = String(day).padStart(2, "0");
	return {
		id,
		championship_id: 1,
		starts_at: `2026-01-${dayStr}T20:00:00.000Z`,
		players_per_team: 5,
		skip_guest_goalkeeper_matches: false,
		ended_at: opts.ended === false ? null : `2026-01-${dayStr}T22:00:00.000Z`,
		attendance: rows,
		rsvps: [],
		teams: [team(10, [1, 2]), team(20, [3])],
		matches: opts.matches ?? [],
	};
}

const joao = player(1, "Joao");
const pedro = player(2, "Pedro", { monthly: true });
const lucas = player(3, "Lucas");
const carlos = player(4, "Carlos");
const allPlayers = [joao, pedro, lucas, carlos];

const match1 = endedMatch(
	1,
	10,
	[
		matchPlayer(1, 1, 10, 1),
		matchPlayer(2, 1, 10, 2),
		matchPlayer(3, 1, 20, 3),
	],
	[goal(1, 1, 1, 2), goal(2, 1, 1)],
);

const match2 = endedMatch(
	2,
	10,
	[
		matchPlayer(4, 2, 10, 1),
		matchPlayer(5, 2, 10, 2),
		matchPlayer(6, 2, 20, 3),
	],
	[goal(3, 2, 2, 1)],
);

const match3 = endedMatch(
	3,
	20,
	[
		matchPlayer(7, 3, 10, 1),
		matchPlayer(8, 3, 10, 2),
		matchPlayer(9, 3, 20, 3),
	],
	[goal(4, 3, 3)],
);

const matchZeroGoals = endedMatch(
	4,
	null,
	[matchPlayer(10, 4, 10, 1), matchPlayer(11, 4, 20, 3)],
	[],
);

const event1 = eventWith(
	1,
	[
		attendance({
			player_id: 1,
			wins: 2,
			draws: 0,
			losses: 1,
			matches: 3,
			goals: 2,
			assists: 1,
			rating_delta: 0.3,
			is_mvp: true,
		}),
		attendance({
			player_id: 2,
			wins: 2,
			draws: 0,
			losses: 1,
			matches: 3,
			goals: 1,
			assists: 1,
			rating_delta: 0.2,
		}),
		attendance({
			player_id: 3,
			wins: 1,
			draws: 0,
			losses: 2,
			matches: 3,
			goals: 1,
			assists: 0,
			rating_delta: -0.2,
		}),
	],
	{ matches: [match1, match2, match3], day: 1 },
);

const event2 = eventWith(
	2,
	[
		attendance({
			player_id: 1,
			wins: 1,
			draws: 0,
			losses: 0,
			matches: 1,
			goals: 0,
			assists: 0,
			rating_delta: 0.1,
		}),
		attendance({
			player_id: 2,
			wins: 0,
			draws: 0,
			losses: 1,
			matches: 1,
			goals: 0,
			assists: 0,
			rating_delta: -0.1,
			vote_rating_delta: 0.5,
		}),
	],
	{
		matches: [
			endedMatch(
				5,
				10,
				[matchPlayer(12, 5, 10, 1), matchPlayer(13, 5, 20, 2)],
				[goal(5, 5, 1)],
			),
		],
		day: 2,
	},
);

const event3 = eventWith(
	3,
	[
		attendance({
			player_id: 1,
			wins: 1,
			draws: 0,
			losses: 0,
			matches: 1,
			goals: 1,
			assists: 0,
			rating_delta: 0.2,
			is_mvp: true,
		}),
	],
	{
		matches: [
			endedMatch(
				6,
				10,
				[matchPlayer(14, 6, 10, 1), matchPlayer(15, 6, 20, 3)],
				[goal(6, 6, 1)],
			),
		],
		day: 3,
	},
);

const openEvent = eventWith(
	4,
	[
		attendance({
			player_id: 1,
			wins: 5,
			draws: 0,
			losses: 0,
			matches: 5,
			goals: 9,
			assists: 9,
			rating_delta: 9,
		}),
	],
	{ ended: false, day: 4 },
);

const fewGamesEvent = eventWith(
	5,
	[
		attendance({
			player_id: 4,
			wins: 1,
			draws: 0,
			losses: 1,
			matches: 2,
			goals: 2,
			assists: 0,
			rating_delta: 0.1,
		}),
	],
	{
		matches: [
			endedMatch(
				7,
				10,
				[matchPlayer(16, 7, 20, 4), matchPlayer(17, 7, 10, 1)],
				[goal(7, 7, 4)],
			),
			endedMatch(
				8,
				20,
				[matchPlayer(18, 8, 20, 4), matchPlayer(19, 8, 10, 1)],
				[goal(8, 8, 4)],
			),
		],
		day: 5,
	},
);

const zeroGoalEvent = eventWith(
	6,
	[
		attendance({
			player_id: 1,
			wins: 0,
			draws: 3,
			losses: 0,
			matches: 3,
			goals: 0,
			assists: 0,
			rating_delta: 0,
		}),
	],
	{ matches: [matchZeroGoals, matchZeroGoals, matchZeroGoals], day: 6 },
);

const baseEvents = [event1, event2, event3, openEvent, fewGamesEvent];

const points = championshipContribution({
	players: allPlayers,
	events: baseEvents,
	window: TRENDS_WINDOW.last5,
	audience: TRENDS_AUDIENCE.all,
	metric: CONTRIBUTION_METRIC.goalShare,
});

const joaoPoint = points.find((row) => row.playerId === 1);
check(joaoPoint !== undefined, "joao appears with 3+ games");
check(joaoPoint?.games === 5, "joao games aggregated");
check(joaoPoint?.wins === 4, "joao wins");
check(joaoPoint?.winRate === 4 / 5, "winRate is wins/games");
check(
	formatContributionWinRate(joaoPoint?.winRate ?? 0) === "80%",
	"winRate format",
);

const lucasDefault = points.find((row) => row.playerId === 4);
check(lucasDefault === undefined, "player with 2 games excluded by default");

const withBelowMin = championshipContribution({
	players: allPlayers,
	events: baseEvents,
	window: TRENDS_WINDOW.last5,
	audience: TRENDS_AUDIENCE.all,
	metric: CONTRIBUTION_METRIC.goalsPerGame,
	includeBelowMin: true,
});
const carlosBelow = withBelowMin.find((row) => row.playerId === 4);
check(carlosBelow !== undefined, "2-game player included when toggled");
check(carlosBelow?.belowMinSample === true, "belowMinSample flagged");
check(carlosBelow?.games === 2, "carlos games");

const goalsMetric = championshipContribution({
	players: allPlayers,
	events: baseEvents,
	window: TRENDS_WINDOW.last5,
	audience: TRENDS_AUDIENCE.all,
	metric: CONTRIBUTION_METRIC.goalsPerGame,
});
const joaoGoals = goalsMetric.find((row) => row.playerId === 1);
check(joaoGoals?.goals === 3, "joao goals total");
check(joaoGoals?.goalsPerGame === 3 / 5, "goals/game");
check(joaoGoals?.selectedMetric === 3 / 5, "selectedMetric follows Y");

const assistsMetric = championshipContribution({
	players: allPlayers,
	events: baseEvents,
	window: TRENDS_WINDOW.last5,
	audience: TRENDS_AUDIENCE.all,
	metric: CONTRIBUTION_METRIC.assistsPerGame,
});
const joaoAssists = assistsMetric.find((row) => row.playerId === 1);
check(joaoAssists?.assistsPerGame === 1 / 5, "assists/game");
check(joaoAssists?.selectedMetric === 1 / 5, "selectedMetric assists");

const mvpMetric = championshipContribution({
	players: allPlayers,
	events: baseEvents,
	window: TRENDS_WINDOW.last5,
	audience: TRENDS_AUDIENCE.all,
	metric: CONTRIBUTION_METRIC.mvpRate,
});
const joaoMvp = mvpMetric.find((row) => row.playerId === 1);
check(joaoMvp?.mvps === 2, "mvp count");
check(joaoMvp?.mvpRate === 2 / 5, "mvp/rate");

const deltaMetric = championshipContribution({
	players: allPlayers,
	events: baseEvents,
	window: TRENDS_WINDOW.last5,
	audience: TRENDS_AUDIENCE.all,
	metric: CONTRIBUTION_METRIC.ratingDelta,
});
const joaoDelta = deltaMetric.find((row) => row.playerId === 1);
check(joaoDelta?.ratingDelta === 0.6, "rating delta sum in window");
const pedroDelta = deltaMetric.find((row) => row.playerId === 2);
check(pedroDelta?.ratingDelta === 0.1, "vote delta ignored; only rating_delta");

check(joaoPoint?.goalShare !== null, "goal share computed");
check(
	typeof joaoPoint?.goalShare === "number" && joaoPoint.goalShare > 0,
	"goal share positive",
);

const zeroShare = championshipContribution({
	players: [joao],
	events: [zeroGoalEvent],
	window: TRENDS_WINDOW.last5,
	audience: TRENDS_AUDIENCE.all,
	metric: CONTRIBUTION_METRIC.goalShare,
});
check(zeroShare.length === 0, "0/0 goal share excluded, not 0%");

const openOnly = championshipContribution({
	players: allPlayers,
	events: [openEvent],
	window: TRENDS_WINDOW.last5,
	audience: TRENDS_AUDIENCE.all,
	metric: CONTRIBUTION_METRIC.goalsPerGame,
});
check(openOnly.length === 0, "open events excluded");

const monthly = championshipContribution({
	players: allPlayers,
	events: baseEvents,
	window: TRENDS_WINDOW.last5,
	audience: TRENDS_AUDIENCE.monthly,
	metric: CONTRIBUTION_METRIC.goalsPerGame,
});
check(
	monthly.every((row) => row.playerId === 2),
	"monthly filter keeps mensalistas",
);

const last3 = championshipContribution({
	players: allPlayers,
	events: baseEvents,
	window: TRENDS_WINDOW.last3,
	audience: TRENDS_AUDIENCE.all,
	metric: CONTRIBUTION_METRIC.goalsPerGame,
	includeBelowMin: true,
});
const joaoLast3 = last3.find((row) => row.playerId === 1);
const joaoLast5 = goalsMetric.find((row) => row.playerId === 1);
check(joaoLast3 !== undefined, "joao in last3 with below min");
check(
	(joaoLast3?.games ?? 0) < (joaoLast5?.games ?? 0),
	"last3 uses fewer events than last5",
);

const yOnly = championshipContribution({
	players: allPlayers,
	events: baseEvents,
	window: TRENDS_WINDOW.last5,
	audience: TRENDS_AUDIENCE.all,
	metric: CONTRIBUTION_METRIC.mvpRate,
});
const yJoao = yOnly.find((row) => row.playerId === 1);
check(yJoao?.winRate === joaoPoint?.winRate, "metric change keeps WinRate X");
check(yJoao?.selectedMetric === yJoao?.mvpRate, "Y switches to mvp");
check(
	contributionMetricCaption(CONTRIBUTION_METRIC.goalShare) ===
		"Participação em gols",
	"metric label",
);

const emptyPlayers = championshipContribution({
	players: [player(99, "Ninguem")],
	events: baseEvents,
	window: TRENDS_WINDOW.last5,
	audience: TRENDS_AUDIENCE.all,
	metric: CONTRIBUTION_METRIC.goalsPerGame,
});
check(emptyPlayers.length === 0, "players without stats do not break");

check(CONTRIBUTION_MIN_GAMES === 3, "min games threshold");
check(
	contributionBubbleRadius(3) < contributionBubbleRadius(15),
	"bubble grows",
);
check(
	formatContributionMetricValue(CONTRIBUTION_METRIC.mvpRate, 0.25) === "25%",
	"mvp format",
);

console.log("championship-contribution.check.ts ok");
