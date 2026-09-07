import type { ChampionshipPlayer } from "../types/championship.ts";
import type {
	ChampionshipEvent,
	ChampionshipEventAttendance,
	ChampionshipEventMatch,
	ChampionshipEventMatchPlayer,
	ChampionshipEventTeam,
} from "../types/championship-event.ts";
import {
	analyzeEventMatchup,
	buildMatchupSnapshot,
	defaultMatchupPairKeys,
	eventMatchupFavoriteStats,
	formatMatchupFavoriteHitRate,
	MATCHUP_BALANCE,
	MATCHUP_METRIC,
	MATCHUP_MIN_SAMPLE,
	MATCHUP_REVIEW_OUTCOME,
	MATCHUP_SIDE,
	type MatchupMetric,
	type MatchupTeamInput,
	matchFavoriteTeamId,
	matchupAdvantage,
	matchupBalanceLevel,
	matchupDecisiveFactor,
	matchupFavoriteSideFromFields,
	matchupFavoriteTeamId,
	matchupFavoriteWonValue,
	matchupHistoryEvents,
	matchupMarkedGoalkeeperId,
	matchupRelativeGap,
	matchupReviewOutcome,
	matchupTeamFromMatchLineup,
	matchupTeamsFromBuilderTeams,
	matchupTeamsFromShareCards,
	matchupWarningFactor,
	readMatchupSnapshot,
	teamAssistsPerGame,
	teamCleanSheetRate,
	teamGoalsConcededPerGame,
	teamGoalsPerGame,
	teamMatchupRatingAverage,
} from "./event-matchup-analysis.ts";

function check(condition: boolean, message: string): void {
	if (!condition) {
		throw new Error(message);
	}
}

function matchWinner(
	teamA: number,
	teamB: number,
	homeGoals: number,
	awayGoals: number,
): number | null {
	if (homeGoals > awayGoals) {
		return teamA;
	}

	if (awayGoals > homeGoals) {
		return teamB;
	}

	return null;
}

function nearly(actual: number, expected: number, eps = 1e-9): boolean {
	return Math.abs(actual - expected) < eps;
}

function player(
	id: number,
	name: string,
	opts: { rating?: number; goalkeeper_rating?: number } = {},
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
		goalkeeper_rating: opts.goalkeeper_rating ?? 0,
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
		is_monthly: false,
		deleted_at: null,
	};
}

function attendance(
	partial: Partial<ChampionshipEventAttendance> & {
		player_id: number;
		event_id: number;
		matches: number;
	},
): ChampionshipEventAttendance {
	return {
		id: partial.player_id,
		event_id: partial.event_id,
		player_id: partial.player_id,
		display_name: "x",
		is_goalkeeper: partial.is_goalkeeper === true,
		event_date: "2026-01-01",
		goals: partial.goals ?? 0,
		assists: partial.assists ?? 0,
		assisted_goals: 0,
		own_goals: 0,
		wins: partial.wins ?? 0,
		losses: partial.losses ?? 0,
		draws: partial.draws ?? 0,
		matches: partial.matches,
		rating: partial.rating ?? 3,
		rating_delta: partial.rating_delta ?? 0,
		goalkeeper_rating: partial.goalkeeper_rating ?? 0,
		goalkeeper_rating_delta: 0,
		vote_rating_delta: 0,
		goalkeeper_vote_rating_delta: 0,
		is_mvp: false,
		mvp_overridden: false,
	};
}

function matchPlayer(
	id: number,
	matchId: number,
	eventId: number,
	teamId: number,
	playerId: number,
	opts: { is_goalkeeper?: boolean } = {},
): ChampionshipEventMatchPlayer {
	return {
		id,
		match_id: matchId,
		event_id: eventId,
		team_id: teamId,
		player_id: playerId,
		display_name: "x",
		is_goalkeeper: opts.is_goalkeeper === true,
		slot: null,
		is_substituted: false,
		include_stats: true,
	};
}

function team(
	id: number,
	eventId: number,
	playerIds: readonly number[],
): ChampionshipEventTeam {
	return {
		id,
		event_id: eventId,
		color: null,
		sort_order: id,
		is_active: true,
		template_player_ids: [...playerIds],
		template_goalkeeper_id: playerIds[0] ?? 0,
		players: playerIds.map((playerId, index) => ({
			id: id * 100 + index,
			event_id: eventId,
			team_id: id,
			player_id: playerId,
			display_name: "x",
			is_goalkeeper: index === 0,
		})),
	};
}

function match(
	id: number,
	eventId: number,
	teamA: number,
	teamB: number,
	players: ChampionshipEventMatchPlayer[],
	goals: ChampionshipEventMatch["goals"],
	winner: number | null,
): ChampionshipEventMatch {
	return {
		id,
		event_id: eventId,
		team_a_id: teamA,
		team_b_id: teamB,
		created_at: "2026-01-01T12:00:00Z",
		ended_at: "2026-01-01T12:10:00Z",
		winner_team_id: winner,
		duration_seconds: 420,
		started_at: "2026-01-01T12:00:00Z",
		paused_at: null,
		pause_accumulated_seconds: 0,
		players,
		goals,
	};
}

function event(input: {
	id: number;
	starts_at: string;
	ended_at: string | null;
	attendance: ChampionshipEventAttendance[];
	teams: ChampionshipEventTeam[];
	matches: ChampionshipEventMatch[];
}): ChampionshipEvent {
	return {
		id: input.id,
		championship_id: 1,
		starts_at: input.starts_at,
		players_per_team: 4,
		skip_guest_goalkeeper_matches: false,
		ended_at: input.ended_at,
		attendance: input.attendance,
		rsvps: [],
		teams: input.teams,
		matches: input.matches,
	};
}

function teamInput(
	key: string,
	title: string,
	playerIds: readonly number[],
	ratings: ReadonlyMap<number, number>,
	goalkeeperId: number | null = playerIds[0] ?? null,
): MatchupTeamInput {
	return {
		teamKey: key,
		title,
		color: null,
		playerIds,
		goalkeeperId,
		ratings,
	};
}

// --- balance / advantage (average scale) ---
check(matchupBalanceLevel(0.05) === MATCHUP_BALANCE.extreme, "balance extreme");
check(
	matchupBalanceLevel(0.2) === MATCHUP_BALANCE.balanced,
	"balance balanced",
);
check(matchupBalanceLevel(0.4) === MATCHUP_BALANCE.slight, "balance slight");
check(matchupBalanceLevel(0.6) === MATCHUP_BALANCE.clear, "balance clear");
check(matchupBalanceLevel(1) === MATCHUP_BALANCE.large, "balance large");

check(
	matchupAdvantage(1.2, 0.8, true, 0.08) === MATCHUP_SIDE.home,
	"advantage home higher",
);
check(
	matchupAdvantage(0.8, 1.2, false, 0.08) === MATCHUP_SIDE.home,
	"advantage home lower-better",
);
check(
	matchupAdvantage(1.0, 1.02, true, 0.08) === MATCHUP_SIDE.neutral,
	"advantage neutral threshold",
);
check(
	matchupAdvantage(null, 1, true, 0.08) === MATCHUP_SIDE.neutral,
	"advantage missing",
);
check(nearly(matchupRelativeGap(1.2, 0.8, 0.5), 0.8), "relative gap");

// --- anti-leakage ---
const current = { id: 10, starts_at: "2026-03-01T10:00:00Z" };
const hist = matchupHistoryEvents(
	[
		event({
			id: 8,
			starts_at: "2026-02-01T10:00:00Z",
			ended_at: "2026-02-01T12:00:00Z",
			attendance: [],
			teams: [],
			matches: [],
		}),
		event({
			id: 9,
			starts_at: "2026-02-15T10:00:00Z",
			ended_at: null,
			attendance: [],
			teams: [],
			matches: [],
		}),
		event({
			id: 10,
			starts_at: "2026-03-01T10:00:00Z",
			ended_at: null,
			attendance: [],
			teams: [],
			matches: [],
		}),
		event({
			id: 7,
			starts_at: "2026-03-01T10:00:00Z",
			ended_at: "2026-03-01T12:00:00Z",
			attendance: [],
			teams: [],
			matches: [],
		}),
		event({
			id: 11,
			starts_at: "2026-03-08T10:00:00Z",
			ended_at: "2026-03-08T12:00:00Z",
			attendance: [],
			teams: [],
			matches: [],
		}),
	],
	current,
);
check(hist.length === 2, "history excludes current/open/future");
check(
	hist.every((row) => row.id === 8 || row.id === 7),
	"history ids before current",
);

// --- rating snapshot (draw ratings, not post-event) ---
const ratingsHome = new Map([
	[1, 6.9],
	[2, 4.9],
	[3, 4.7],
	[4, 4.5],
]);
const ratingsAway = new Map([
	[5, 5.7],
	[6, 5.1],
	[7, 4.6],
	[8, 4.3],
]);
const home = teamInput("h", "Azul", [1, 2, 3, 4], ratingsHome, 1);
const away = teamInput("a", "Vermelho", [5, 6, 7, 8], ratingsAway, 5);
check(
	nearly(teamMatchupRatingAverage(home), 5.25),
	"home rating average with GK track",
);
check(
	nearly(teamMatchupRatingAverage(away), 4.925),
	"away rating average with GK track",
);

const roster = [
	player(1, "Goleiro A", { rating: 5.8, goalkeeper_rating: 6.9 }),
	player(2, "Ata A", { rating: 4.9 }),
	player(3, "Mei A", { rating: 4.7 }),
	player(4, "Def A", { rating: 4.5 }),
	player(5, "Goleiro B", { rating: 5.5, goalkeeper_rating: 5.7 }),
	player(6, "Ata B", { rating: 5.1 }),
	player(7, "Mei B", { rating: 4.6 }),
	player(8, "Def B", { rating: 4.3 }),
];

// Build 3 ended events with attack/defense samples (>= 3 matches each)
function endedRound(
	id: number,
	day: string,
	homeGoals: number,
	awayGoals: number,
): ChampionshipEvent {
	const teamA = 100 + id;
	const teamB = 200 + id;
	const matchId = 1000 + id;
	const players = [
		matchPlayer(1, matchId, id, teamA, 1, { is_goalkeeper: true }),
		matchPlayer(2, matchId, id, teamA, 2),
		matchPlayer(3, matchId, id, teamA, 3),
		matchPlayer(4, matchId, id, teamA, 4),
		matchPlayer(5, matchId, id, teamB, 5, { is_goalkeeper: true }),
		matchPlayer(6, matchId, id, teamB, 6),
		matchPlayer(7, matchId, id, teamB, 7),
		matchPlayer(8, matchId, id, teamB, 8),
	];
	const goals = [
		...Array.from({ length: homeGoals }, (_, index) => ({
			id: matchId * 10 + index,
			match_id: matchId,
			event_id: id,
			scorer_player_id: 2,
			assist_player_id: 3,
			is_own_goal: false,
			elapsed_seconds: 60 + index,
			created_at: `${day}T12:0${index}:00Z`,
		})),
		...Array.from({ length: awayGoals }, (_, index) => ({
			id: matchId * 10 + 50 + index,
			match_id: matchId,
			event_id: id,
			scorer_player_id: 6,
			assist_player_id: 7,
			is_own_goal: false,
			elapsed_seconds: 120 + index,
			created_at: `${day}T12:1${index}:00Z`,
		})),
	];
	const winner = matchWinner(teamA, teamB, homeGoals, awayGoals);

	return event({
		id,
		starts_at: `${day}T10:00:00Z`,
		ended_at: `${day}T13:00:00Z`,
		attendance: [
			attendance({
				player_id: 1,
				event_id: id,
				matches: 1,
				wins: Number(winner === teamA),
				losses: Number(winner === teamB),
				draws: Number(winner === null),
				goals: 0,
				assists: 0,
				rating: 5.8,
				goalkeeper_rating: 6.9,
			}),
			attendance({
				player_id: 2,
				event_id: id,
				matches: 1,
				wins: Number(winner === teamA),
				losses: Number(winner === teamB),
				draws: Number(winner === null),
				goals: homeGoals,
				assists: 0,
				rating: 4.9,
			}),
			attendance({
				player_id: 3,
				event_id: id,
				matches: 1,
				wins: Number(winner === teamA),
				losses: Number(winner === teamB),
				draws: Number(winner === null),
				goals: 0,
				assists: homeGoals,
				rating: 4.7,
			}),
			attendance({
				player_id: 4,
				event_id: id,
				matches: 1,
				wins: Number(winner === teamA),
				losses: Number(winner === teamB),
				draws: Number(winner === null),
				goals: 0,
				assists: 0,
				rating: 4.5,
			}),
			attendance({
				player_id: 5,
				event_id: id,
				matches: 1,
				wins: Number(winner === teamB),
				losses: Number(winner === teamA),
				draws: Number(winner === null),
				goals: 0,
				assists: 0,
				rating: 5.5,
				goalkeeper_rating: 5.7,
			}),
			attendance({
				player_id: 6,
				event_id: id,
				matches: 1,
				wins: Number(winner === teamB),
				losses: Number(winner === teamA),
				draws: Number(winner === null),
				goals: awayGoals,
				assists: 0,
				rating: 5.1,
			}),
			attendance({
				player_id: 7,
				event_id: id,
				matches: 1,
				wins: Number(winner === teamB),
				losses: Number(winner === teamA),
				draws: Number(winner === null),
				goals: 0,
				assists: awayGoals,
				rating: 4.6,
			}),
			attendance({
				player_id: 8,
				event_id: id,
				matches: 1,
				wins: Number(winner === teamB),
				losses: Number(winner === teamA),
				draws: Number(winner === null),
				goals: 0,
				assists: 0,
				rating: 4.3,
			}),
		],
		teams: [team(teamA, id, [1, 2, 3, 4]), team(teamB, id, [5, 6, 7, 8])],
		matches: [match(matchId, id, teamA, teamB, players, goals, winner)],
	});
}

const pastEvents = [
	endedRound(1, "2026-01-01", 2, 0),
	endedRound(2, "2026-01-08", 2, 1),
	endedRound(3, "2026-01-15", 1, 0),
];

const history = matchupHistoryEvents(pastEvents, {
	id: 10,
	starts_at: "2026-03-01T10:00:00Z",
});
check(history.length === 3, "three past events");

const homeGoals = teamGoalsPerGame(history, home.playerIds);
check(homeGoals !== null, "home attack has data");
check(homeGoals !== null && homeGoals > 0, "home attack positive from scorers");

const homeConceded = teamGoalsConcededPerGame(history, home.playerIds);
const awayConceded = teamGoalsConcededPerGame(history, away.playerIds);
check(homeConceded !== null && awayConceded !== null, "defense has data");
check(
	homeConceded !== null && awayConceded !== null && homeConceded < awayConceded,
	"home concedes less",
);

const homeCs = teamCleanSheetRate(history, home.playerIds);
check(homeCs !== null && homeCs > 0, "home clean sheet rate");

// insufficient sample player alone
const newbie = teamGoalsPerGame(history, [99]);
check(newbie === null, "missing player → null not zero");

// zero-match / present-with-0-matches must not dilute attack or creation
const onlyScorerGoals = teamGoalsPerGame(history, [2]);
const mixedWithBench = teamGoalsPerGame(history, [2, 99]);
check(onlyScorerGoals !== null, "scorer alone has goals/game");
check(
	onlyScorerGoals !== null &&
		mixedWithBench !== null &&
		nearly(mixedWithBench, onlyScorerGoals),
	"bench without matches does not dilute goals/game",
);

const onlyCreatorAssists = teamAssistsPerGame(history, [3]);
const mixedCreatorBench = teamAssistsPerGame(history, [3, 99]);
check(onlyCreatorAssists !== null, "creator alone has assists/game");
check(
	onlyCreatorAssists !== null &&
		mixedCreatorBench !== null &&
		nearly(mixedCreatorBench, onlyCreatorAssists),
	"bench without matches does not dilute assists/game",
);

const zeroMatchAttendance = event({
	id: 50,
	starts_at: "2026-01-20T10:00:00Z",
	ended_at: "2026-01-20T13:00:00Z",
	attendance: [
		attendance({
			player_id: 2,
			event_id: 50,
			matches: 0,
			goals: 0,
			assists: 0,
		}),
	],
	teams: [],
	matches: [],
});
check(
	teamGoalsPerGame([zeroMatchAttendance], [2]) === null,
	"attendance with matches=0 excluded from goals average",
);
check(
	teamAssistsPerGame([zeroMatchAttendance], [2]) === null,
	"attendance with matches=0 excluded from assists average",
);

const analysis = analyzeEventMatchup({
	home,
	away,
	historyEvents: history,
	roster,
});

check(analysis.favoriteSide === MATCHUP_SIDE.home, "favorite by field wins");
check(nearly(analysis.ratingDifference, 0.325), "rating average difference");
check(
	analysis.fieldWins.home > analysis.fieldWins.away,
	"home leads more fields",
);

check(
	matchupFavoriteSideFromFields({ home: 4, away: 2 }) === MATCHUP_SIDE.home,
	"more fields → home favorite",
);
check(
	matchupFavoriteSideFromFields({ home: 1, away: 3 }) === MATCHUP_SIDE.away,
	"more fields → away favorite",
);
check(
	matchupFavoriteSideFromFields({ home: 2, away: 2 }) === MATCHUP_SIDE.neutral,
	"tied fields → neutral favorite",
);
check(
	matchupFavoriteTeamId(MATCHUP_SIDE.home, 10, 20) === 10,
	"favorite team id home",
);
check(
	matchupFavoriteTeamId(MATCHUP_SIDE.away, 10, 20) === 20,
	"favorite team id away",
);
check(
	matchupFavoriteTeamId(MATCHUP_SIDE.neutral, 10, 20) === null,
	"favorite team id neutral",
);
check(
	analysis.home.goalkeeperRating === 6.9,
	"goalkeeper rating from marked snapshot",
);
check(analysis.away.goalkeeperRating === 5.7, "away goalkeeper rating");

const gkMetric = analysis.metrics.find(
	(row) => row.key === MATCHUP_METRIC.goalkeeper,
);
check(gkMetric?.advantage === MATCHUP_SIDE.home, "gk advantage home");

check(
	analysis.keyPlayers.goalkeeper?.playerId === 1,
	"key goalkeeper is best rating",
);
check(analysis.keyPlayers.scorer !== null, "scorer highlight exists");

check(
	analysis.decisiveFactor !== MATCHUP_SIDE.neutral ||
		analysis.metrics.some((m) => m.advantage !== MATCHUP_SIDE.neutral),
	"decisive or some advantage",
);

// neutral metrics → neutral decisive
const tiedMetrics: MatchupMetric[] = [
	{
		key: MATCHUP_METRIC.attack,
		homeValue: 1,
		awayValue: 1,
		advantage: MATCHUP_SIDE.neutral,
		difference: 0,
		relativeGap: 0,
		higherIsBetter: true,
	},
];
check(
	matchupDecisiveFactor(tiedMetrics) === MATCHUP_SIDE.neutral,
	"tied metrics decisive neutral",
);

const warningNeutral = matchupWarningFactor(tiedMetrics, MATCHUP_SIDE.home);
check(warningNeutral === MATCHUP_SIDE.neutral, "no underdog edge → neutral");

// no goalkeeper
const noGkHome = teamInput("h2", "Azul", [2, 3, 4], ratingsHome, null);
const noGkAnalysis = analyzeEventMatchup({
	home: noGkHome,
	away,
	historyEvents: history,
	roster,
});
check(noGkAnalysis.home.goalkeeperRating === null, "missing gk → null rating");
check(noGkAnalysis.home.goalkeeperName === null, "missing gk → null name");

// current event must not leak into history-fed analysis
const leakyCurrent = endedRound(10, "2026-03-01", 10, 0);
const historyNoLeak = matchupHistoryEvents([...pastEvents, leakyCurrent], {
	id: 10,
	starts_at: "2026-03-01T10:00:00Z",
});
check(
	historyNoLeak.every((row) => row.id !== 10),
	"current event excluded from history",
);

const pair = defaultMatchupPairKeys([home, away]);
check(
	pair?.homeKey === "h" && pair?.awayKey === "a",
	"default pair by average",
);

check(MATCHUP_MIN_SAMPLE === 3, "min sample 3");

// marked GK only — not slot 1, not GK history alone
check(
	matchupMarkedGoalkeeperId([1, 2, 3], [2]) === 2,
	"marked volunteer on team",
);
check(
	matchupMarkedGoalkeeperId([1, 2, 3], [9]) === null,
	"marked volunteer not on team → null",
);
check(
	matchupMarkedGoalkeeperId([1, 2, 3], []) === null,
	"no mark → null even with slot players",
);

const unmarkedShare = matchupTeamsFromShareCards([
	{
		title: "Azul",
		color: null,
		players: [
			{
				id: 1,
				number: 1,
				name: "Slot1",
				rating: 5,
				isGoalkeeperRating: false,
				avatarUrl: null,
			},
			{
				id: 2,
				number: 2,
				name: "Voluntario",
				rating: 6,
				isGoalkeeperRating: true,
				avatarUrl: null,
			},
		],
	},
]);
check(
	unmarkedShare[0]?.goalkeeperId === 2,
	"share cards use isGoalkeeperRating not slot 1",
);

const noMarkShare = matchupTeamsFromShareCards([
	{
		title: "Vermelho",
		color: null,
		players: [
			{
				id: 5,
				number: 1,
				name: "LinhaNoGol",
				rating: 5,
				isGoalkeeperRating: false,
				avatarUrl: null,
			},
		],
	},
]);
check(
	noMarkShare[0]?.goalkeeperId === null,
	"share slot 1 without mark is not GK",
);

const builderTeams = matchupTeamsFromBuilderTeams(
	[
		{
			key: "t1",
			color: null,
			slots: ["10", "11"],
			isActive: true,
		},
	],
	[
		player(10, "Linha", { goalkeeper_rating: 7.5 }),
		player(11, "Vol", { goalkeeper_rating: 4 }),
	],
	[11],
	(row, isGk) => (isGk ? row.goalkeeper_rating : row.rating),
);
check(
	builderTeams[0]?.goalkeeperId === 11,
	"builder uses volunteer mark not slots[0]",
);

const builderNoMark = matchupTeamsFromBuilderTeams(
	[
		{
			key: "t2",
			color: null,
			slots: ["10", "11"],
			isActive: true,
		},
	],
	[player(10, "Linha", { goalkeeper_rating: 7.5 }), player(11, "Outro")],
	[],
	(row) => row.rating,
);
check(
	builderNoMark[0]?.goalkeeperId === null,
	"builder without mark ignores GK rating history",
);

check(
	matchupReviewOutcome(MATCHUP_SIDE.home, 100, 100, 200, true) ===
		MATCHUP_REVIEW_OUTCOME.hit,
	"review hit when favorite wins",
);
check(
	matchupReviewOutcome(MATCHUP_SIDE.home, 200, 100, 200, true) ===
		MATCHUP_REVIEW_OUTCOME.miss,
	"review miss when favorite loses",
);
check(
	matchupReviewOutcome(MATCHUP_SIDE.home, null, 100, 200, true) ===
		MATCHUP_REVIEW_OUTCOME.draw,
	"review draw when match draws",
);
check(
	matchupReviewOutcome(MATCHUP_SIDE.neutral, 100, 100, 200, true) ===
		MATCHUP_REVIEW_OUTCOME.neutral,
	"review neutral when no favorite",
);
check(
	matchupReviewOutcome(MATCHUP_SIDE.home, 100, 100, 200, false) ===
		MATCHUP_REVIEW_OUTCOME.open,
	"review open while match running",
);

// GK advantage only from attendance.is_goalkeeper — not match slot alone
const attByPlayer = new Map([
	[
		1,
		attendance({
			player_id: 1,
			event_id: 1,
			matches: 3,
			is_goalkeeper: false,
			goalkeeper_rating: 9,
			rating: 4,
		}),
	],
	[
		2,
		attendance({
			player_id: 2,
			event_id: 1,
			matches: 3,
			is_goalkeeper: true,
			goalkeeper_rating: 6.5,
			rating: 3,
		}),
	],
]);
const lineupOnlySlotGk = [
	matchPlayer(1, 1, 1, 10, 1, { is_goalkeeper: true }),
	matchPlayer(2, 1, 1, 10, 2, { is_goalkeeper: false }),
];
const fromLineup = matchupTeamFromMatchLineup({
	team: team(10, 1, [1, 2]),
	lineup: lineupOnlySlotGk,
	attendanceByPlayer: attByPlayer,
});
check(
	fromLineup.goalkeeperId === 2,
	"match lineup uses attendance mark, not match is_goalkeeper slot",
);
check(
	fromLineup.ratings.get(2) === 6.5,
	"marked attendance GK uses goalkeeper_rating snapshot",
);
check(
	fromLineup.ratings.get(1) === 4,
	"unmarked presence keeps line rating even if match slot is GK",
);

const noPresenceMark = matchupTeamFromMatchLineup({
	team: team(11, 1, [1]),
	lineup: [matchPlayer(3, 1, 1, 11, 1, { is_goalkeeper: true })],
	attendanceByPlayer: new Map([
		[
			1,
			attendance({
				player_id: 1,
				event_id: 1,
				matches: 3,
				is_goalkeeper: false,
				goalkeeper_rating: 9,
				rating: 5,
			}),
		],
	]),
});
check(
	noPresenceMark.goalkeeperId === null,
	"no attendance GK mark → no GK advantage",
);

const hitStats = eventMatchupFavoriteStats([
	{ favorite_team_id: 10, favorite_won: true },
	{ favorite_team_id: 20, favorite_won: true },
	{ favorite_team_id: 10, favorite_won: true },
	{ favorite_team_id: 20, favorite_won: true },
	{ favorite_team_id: 10, favorite_won: true },
	{ favorite_team_id: 20, favorite_won: false },
	{ favorite_team_id: null, favorite_won: null },
]);
check(hitStats.decreed === 6, "decreed counts favorites");
check(hitStats.hits === 5, "hits count favorite wins");
check(nearly(hitStats.rate ?? 0, 5 / 6), "hit rate 5/6");
check(
	formatMatchupFavoriteHitRate(hitStats) === "5/6 · 83%",
	"favorite hit caption",
);
check(
	eventMatchupFavoriteStats([{ favorite_team_id: null, favorite_won: null }])
		.rate === null,
	"no decreed → empty rate",
);

const snap = buildMatchupSnapshot(analysis);
const roundTrip = readMatchupSnapshot(snap);
check(
	roundTrip?.analysis.favoriteSide === analysis.favoriteSide,
	"snapshot round-trip",
);
check(
	matchFavoriteTeamId({
		matchup_snapshot: snap,
		favorite_team_id: 10,
	}) === 10,
	"frozen favorite id",
);
check(
	matchFavoriteTeamId({
		matchup_snapshot: null,
		favorite_team_id: 10,
	}) === undefined,
	"no snapshot → undefined favorite",
);
check(matchupFavoriteWonValue(10, 10) === true, "favorite won");
check(matchupFavoriteWonValue(10, 20) === false, "favorite lost");
check(matchupFavoriteWonValue(null, 10) === null, "no favorite → null won");
check(matchupFavoriteWonValue(10, null) === null, "draw → null won");

console.log("event-matchup-analysis.check.ts ok");
