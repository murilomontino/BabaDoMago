import type { ChampionshipPlayer } from "../types/championship.ts";
import type {
	ChampionshipEvent,
	ChampionshipEventAttendance,
	ChampionshipEventGoal,
	ChampionshipEventMatch,
	ChampionshipEventMatchPlayer,
	ChampionshipEventTeam,
} from "../types/championship-event.ts";
import { eventRatingRate } from "./event-rating-adjustment.ts";
import { EVENT_TEAM_COLOR } from "./event-team-color.ts";
import { PLAYER_RATING } from "./player-rating.ts";
import {
	calculatePlayerRatingAlignment,
	calculatePlayersRatingAlignment,
	classifyRatingAlignmentGap,
	classifyRatingAlignmentPersistence,
	empiricalPercentile,
	formatRatingAlignmentGap,
	PLAYER_RATING_ALIGNMENT_LABEL,
	performanceIndexToExpectedRating,
	RATING_ALIGNMENT_EVIDENCE_LEVEL,
	RATING_ALIGNMENT_PERSISTENCE,
	RATING_ALIGNMENT_STATUS,
	RATING_ALIGNMENT_WINDOW,
	ratingAlignmentDrawWarnings,
	ratingAlignmentEvidence,
	ratingAlignmentOverrated,
	ratingAlignmentUnderrated,
} from "./player-rating-alignment.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

function player(id: number, name: string, rating = 5): ChampionshipPlayer {
	return {
		id,
		championship_id: 1,
		user_id: null,
		display_name: name,
		nickname: null,
		nickname_tags: [],
		avatar_url: null,
		rating,
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

function matchPlayer(
	overrides: Partial<ChampionshipEventMatchPlayer> &
		Pick<ChampionshipEventMatchPlayer, "player_id" | "team_id">,
): ChampionshipEventMatchPlayer {
	return {
		id: overrides.id ?? overrides.player_id,
		match_id: 1,
		event_id: 1,
		display_name: String(overrides.player_id),
		is_goalkeeper: false,
		slot: 1,
		is_substituted: false,
		include_stats: true,
		...overrides,
	};
}

function match(
	overrides: Partial<ChampionshipEventMatch> & {
		players: ChampionshipEventMatchPlayer[];
	},
): ChampionshipEventMatch {
	return {
		id: 1,
		event_id: 1,
		team_a_id: 10,
		team_b_id: 20,
		created_at: "2026-08-14T22:00:00.000Z",
		ended_at: "2026-08-14T22:10:00.000Z",
		winner_team_id: 10,
		duration_seconds: 420,
		started_at: "2026-08-14T22:00:00.000Z",
		paused_at: null,
		pause_accumulated_seconds: 0,
		goals: [],
		...overrides,
	};
}

function team(id: number, playerIds: readonly number[]): ChampionshipEventTeam {
	return {
		id,
		event_id: 1,
		color: EVENT_TEAM_COLOR.white,
		sort_order: id,
		is_active: true,
		template_player_ids: [],
		template_goalkeeper_id: 0,
		players: playerIds.map((playerId) => ({
			id: playerId,
			event_id: 1,
			team_id: id,
			player_id: playerId,
			display_name: String(playerId),
			is_goalkeeper: false,
		})),
	};
}

function attendance(
	playerId: number,
	partial: Partial<ChampionshipEventAttendance> = {},
): ChampionshipEventAttendance {
	return {
		id: playerId,
		event_id: 1,
		player_id: playerId,
		display_name: String(playerId),
		is_goalkeeper: false,
		event_date: "2026-01-01",
		goals: 0,
		assists: 0,
		assisted_goals: 0,
		own_goals: 0,
		wins: 0,
		losses: 0,
		draws: 0,
		matches: 1,
		rating: 5,
		rating_delta: 0,
		goalkeeper_rating: 0,
		goalkeeper_rating_delta: 0,
		vote_rating_delta: 0,
		goalkeeper_vote_rating_delta: 0,
		is_mvp: false,
		mvp_overridden: false,
		...partial,
	};
}

function eventOf(
	id: number,
	startsAt: string,
	matches: ChampionshipEventMatch[],
	opts: {
		ended?: boolean;
		attendanceRows?: ChampionshipEventAttendance[];
		teams?: ChampionshipEventTeam[];
	} = {},
): ChampionshipEvent {
	const ended = opts.ended !== false;
	return {
		id,
		championship_id: 1,
		starts_at: startsAt,
		players_per_team: 5,
		skip_guest_goalkeeper_matches: false,
		ended_at: ended ? startsAt : null,
		attendance: opts.attendanceRows ?? [],
		rsvps: [],
		teams: opts.teams ?? [team(10, [1]), team(20, [2])],
		matches: matches.map((row) => ({ ...row, event_id: id })),
	};
}

function linePair(
	matchId: number,
	playerId: number,
	opponentId: number,
	winnerTeamId: number | null,
	goals: ChampionshipEventGoal[] = [],
	endedAt: string | null = "2026-08-14T22:10:00.000Z",
): ChampionshipEventMatch {
	return match({
		id: matchId,
		created_at: `2026-08-14T${String(20 + (matchId % 9)).padStart(2, "0")}:00:00.000Z`,
		ended_at: endedAt,
		winner_team_id: winnerTeamId,
		players: [
			matchPlayer({ player_id: playerId, team_id: 10, match_id: matchId }),
			matchPlayer({ player_id: opponentId, team_id: 20, match_id: matchId }),
		],
		goals,
	});
}

// --- evidence / gap / percentile ---

check(ratingAlignmentEvidence(0) === "insufficient", "0 games insufficient");
check(ratingAlignmentEvidence(2) === "insufficient", "2 games insufficient");
check(ratingAlignmentEvidence(3) === "initial", "3 games initial");
check(ratingAlignmentEvidence(4) === "initial", "4 games initial");
check(ratingAlignmentEvidence(5) === "moderate", "5 games moderate");
check(ratingAlignmentEvidence(7) === "moderate", "7 games moderate");
check(ratingAlignmentEvidence(8) === "strong", "8 games strong");

check(
	classifyRatingAlignmentGap(1) === RATING_ALIGNMENT_STATUS.below_performance,
	"gap +1 below",
);
check(
	classifyRatingAlignmentGap(0.5) === RATING_ALIGNMENT_STATUS.slightly_below,
	"gap +0.5 slight below",
);
check(
	classifyRatingAlignmentGap(0) === RATING_ALIGNMENT_STATUS.aligned,
	"gap 0 aligned",
);
check(
	classifyRatingAlignmentGap(-0.5) === RATING_ALIGNMENT_STATUS.slightly_above,
	"gap -0.5 slight above",
);
check(
	classifyRatingAlignmentGap(-1) === RATING_ALIGNMENT_STATUS.above_performance,
	"gap -1 above",
);
check(
	classifyRatingAlignmentGap(null) === RATING_ALIGNMENT_STATUS.aligned,
	"null gap aligned",
);

check(
	classifyRatingAlignmentPersistence({
		10: 1.2,
		20: 1.1,
		30: 1.0,
	}) === RATING_ALIGNMENT_PERSISTENCE.persistent_below,
	"persistent below",
);
check(
	classifyRatingAlignmentPersistence({
		10: -1.2,
		20: -1.1,
		30: -1.0,
	}) === RATING_ALIGNMENT_PERSISTENCE.persistent_above,
	"persistent above",
);
check(
	classifyRatingAlignmentPersistence({
		10: 1.2,
		20: 0.5,
		30: 1.0,
	}) === RATING_ALIGNMENT_PERSISTENCE.normal,
	"persistence normal",
);

check(empiricalPercentile(5, [1, 2, 3, 4, 5]) === 80, "percentile 80");
check(empiricalPercentile(1, [1, 2, 3]) === 0, "percentile 0");
check(empiricalPercentile(9, []) === null, "percentile empty");

check(
	performanceIndexToExpectedRating(50, []) === null,
	"expected empty peers",
);
check(
	performanceIndexToExpectedRating(80, [
		{ performanceIndex: 40, rating: 4 },
		{ performanceIndex: 80, rating: 6 },
	]) === 6,
	"expected linear map",
);

check(formatRatingAlignmentGap(1.3) === "+1.3", "format +gap");
check(formatRatingAlignmentGap(-1.7) === "-1.7", "format -gap");
check(formatRatingAlignmentGap(null) === "—", "format null gap");

// --- window: last N of player, skip absent / open ---

const joao = player(1, "João", 4.8);
const carlos = player(2, "Carlos", 7.2);
const pedro = player(3, "Pedro", 6);

const eventsSkipAbsent: ChampionshipEvent[] = [
	eventOf(1, "2026-01-01T20:00:00.000Z", [
		linePair(1, 1, 2, 10, [
			{
				id: 1,
				match_id: 1,
				event_id: 1,
				scorer_player_id: 1,
				assist_player_id: null,
				is_own_goal: false,
				elapsed_seconds: 10,
				created_at: "2026-01-01T20:01:00.000Z",
			},
		]),
	]),
	eventOf(2, "2026-01-08T20:00:00.000Z", [linePair(2, 1, 2, 10)]),
	eventOf(3, "2026-01-15T20:00:00.000Z", [
		linePair(3, 2, 3, 20), // João ausente
	]),
	eventOf(4, "2026-01-22T20:00:00.000Z", [linePair(4, 1, 2, null)]),
	eventOf(5, "2026-01-29T20:00:00.000Z", [
		linePair(5, 1, 2, 10, [], null), // aberta
	]),
];

const joaoAlign = calculatePlayerRatingAlignment(
	[joao, carlos, pedro],
	eventsSkipAbsent,
	1,
	{ windowSize: RATING_ALIGNMENT_WINDOW.default },
);
check(joaoAlign !== null, "joao alignment exists");
check(joaoAlign?.games === 3, "ignores absent + open → 3 games");
check(
	joaoAlign?.evidence === RATING_ALIGNMENT_EVIDENCE_LEVEL.initial,
	"3 games = initial",
);

const openOnly = calculatePlayerRatingAlignment(
	[joao],
	[eventOf(9, "2026-02-01T20:00:00.000Z", [linePair(9, 1, 2, 10, [], null)])],
	1,
);
check(openOnly?.games === 0, "open matches ignored");
check(
	openOnly?.evidence === RATING_ALIGNMENT_EVIDENCE_LEVEL.insufficient,
	"0 games insufficient evidence",
);
check(openOnly?.performanceIndex === null, "no PI under 3 games");
check(openOnly?.ratingGap === null, "no gap under 3 games");

// discarded = match gone from array (implicit)
const withDiscard = calculatePlayerRatingAlignment(
	[joao, carlos],
	[
		eventOf(1, "2026-01-01T20:00:00.000Z", [linePair(1, 1, 2, 10)]),
		eventOf(2, "2026-01-08T20:00:00.000Z", []), // descartada
		eventOf(3, "2026-01-15T20:00:00.000Z", [linePair(3, 1, 2, 10)]),
		eventOf(4, "2026-01-22T20:00:00.000Z", [linePair(4, 1, 2, 10)]),
	],
	1,
);
check(withDiscard?.games === 3, "discarded matches absent from data");

// --- aproveitamento / winRate ---

const rate = eventRatingRate(2, 1, 0, 3);
check(rate > 0.7, "aproveitamento win+draw bonus path");

// build 5 wins for João vs mixed for Carlos so percentiles differ
function winEvent(
	id: number,
	day: number,
	winnerId: number,
	_loserId: number,
	goals = 1,
	assists = 0,
): ChampionshipEvent {
	const goalsRows: ChampionshipEventGoal[] = [];
	for (let i = 0; i < goals; i += 1) {
		goalsRows.push({
			id: id * 10 + i,
			match_id: id,
			event_id: id,
			scorer_player_id: winnerId,
			assist_player_id: assists > i ? winnerId : null,
			is_own_goal: false,
			elapsed_seconds: 10 + i,
			created_at: `2026-03-${String(day).padStart(2, "0")}T20:01:00.000Z`,
		});
	}
	const winnerTeamId = winnerId === 1 ? 10 : 20;
	return eventOf(
		id,
		`2026-03-${String(day).padStart(2, "0")}T20:00:00.000Z`,
		[linePair(id, 1, 2, winnerTeamId, goalsRows)],
		{
			attendanceRows: [
				attendance(1, {
					goals: winnerId === 1 ? goals : 0,
					assists: winnerId === 1 ? assists : 0,
					wins: winnerId === 1 ? 1 : 0,
					losses: winnerId === 1 ? 0 : 1,
					matches: 1,
				}),
				attendance(2, {
					goals: winnerId === 2 ? goals : 0,
					assists: 0,
					wins: winnerId === 2 ? 1 : 0,
					losses: winnerId === 2 ? 0 : 1,
					matches: 1,
				}),
				attendance(3, { matches: 0 }),
			],
			teams: [team(10, [1, 3]), team(20, [2])],
		},
	);
}

const richEvents: ChampionshipEvent[] = [
	winEvent(1, 1, 1, 2, 2, 1),
	winEvent(2, 2, 1, 2, 1, 0),
	winEvent(3, 3, 1, 2, 1, 1),
	winEvent(4, 4, 1, 2, 2, 0),
	winEvent(5, 5, 1, 2, 1, 0),
	winEvent(6, 6, 2, 1, 1, 0),
	winEvent(7, 7, 2, 1, 0, 0),
	winEvent(8, 8, 2, 1, 1, 0),
];

const roster = [joao, carlos, pedro];
const joaoRich = calculatePlayerRatingAlignment(roster, richEvents, 1);
const carlosRich = calculatePlayerRatingAlignment(roster, richEvents, 2);

check((joaoRich?.games ?? 0) >= 5, "joao has enough games");
check((carlosRich?.games ?? 0) >= 3, "carlos has games");
check(joaoRich?.performanceIndex !== null, "joao has PI");
check(joaoRich?.expectedRating !== null, "joao has expected");
check(joaoRich?.ratingGap !== null, "joao has gap");
check(joaoRich?.currentRating === 4.8, "official rating untouched");
check(
	joaoRich?.resultScore !== null && (joaoRich?.resultScore ?? 0) >= 0,
	"result score",
);
check(
	joaoRich?.attackScore !== null && (joaoRich?.attackScore ?? 0) >= 0,
	"attack score",
);
check(
	joaoRich?.defenseScore !== null && (joaoRich?.defenseScore ?? 0) >= 0,
	"defense score",
);

// --- zero team goals → participation null path (no crash) ---

const noGoalEvents = [
	eventOf(1, "2026-04-01T20:00:00.000Z", [linePair(1, 1, 2, 10)]),
	eventOf(2, "2026-04-08T20:00:00.000Z", [linePair(2, 1, 2, 10)]),
	eventOf(3, "2026-04-15T20:00:00.000Z", [linePair(3, 1, 2, 10)]),
];
const noGoalAlign = calculatePlayerRatingAlignment(
	[joao, carlos],
	noGoalEvents,
	1,
);
check(noGoalAlign?.games === 3, "no goals still counts games");
check(noGoalAlign?.performanceIndex !== null, "PI without goal participation");

// --- clean sheet / conceded context ---

const cleanEvents = [
	eventOf(1, "2026-05-01T20:00:00.000Z", [linePair(1, 1, 2, 10)]),
	eventOf(2, "2026-05-08T20:00:00.000Z", [linePair(2, 1, 2, 10)]),
	eventOf(3, "2026-05-15T20:00:00.000Z", [
		linePair(3, 1, 2, 20, [
			{
				id: 30,
				match_id: 3,
				event_id: 3,
				scorer_player_id: 2,
				assist_player_id: null,
				is_own_goal: false,
				elapsed_seconds: 5,
				created_at: "2026-05-15T20:01:00.000Z",
			},
		]),
	]),
];
const cleanAlign = calculatePlayerRatingAlignment(
	[joao, carlos],
	cleanEvents,
	1,
);
check(cleanAlign?.defenseScore !== null, "defense score with conceded");
check(
	PLAYER_RATING_ALIGNMENT_LABEL.defenseContext.includes("contexto"),
	"defense copy is contextual not individual blame",
);

// --- goalkeeper separate ---

function gkMatch(
	matchId: number,
	gkId: number,
	conceded: number,
): ChampionshipEventMatch {
	const goals: ChampionshipEventGoal[] = [];
	for (let i = 0; i < conceded; i += 1) {
		goals.push({
			id: matchId * 100 + i,
			match_id: matchId,
			event_id: 1,
			scorer_player_id: 2,
			assist_player_id: null,
			is_own_goal: false,
			elapsed_seconds: i,
			created_at: "2026-06-01T20:01:00.000Z",
		});
	}
	return match({
		id: matchId,
		created_at: `2026-06-0${matchId}T20:00:00.000Z`,
		ended_at: `2026-06-0${matchId}T20:10:00.000Z`,
		winner_team_id: conceded === 0 ? 10 : 20,
		players: [
			matchPlayer({
				player_id: gkId,
				team_id: 10,
				is_goalkeeper: true,
				match_id: matchId,
			}),
			matchPlayer({ player_id: 2, team_id: 20, match_id: matchId }),
		],
		goals,
	});
}

const gkEvents = [
	eventOf(1, "2026-06-01T20:00:00.000Z", [gkMatch(1, 1, 0)]),
	eventOf(2, "2026-06-02T20:00:00.000Z", [gkMatch(2, 1, 0)]),
	eventOf(3, "2026-06-03T20:00:00.000Z", [gkMatch(3, 1, 1)]),
];
const gkAlign = calculatePlayerRatingAlignment([joao, carlos], gkEvents, 1);
check(gkAlign?.goalkeeperMetrics !== null, "gk metrics when 3+ gk games");
check((gkAlign?.goalkeeperMetrics?.matches ?? 0) === 3, "gk matches counted");
check(
	gkAlign?.goalkeeperMetrics?.cleanSheetRate === 2 / 3,
	"gk clean sheet rate",
);

const noGkAlign = calculatePlayerRatingAlignment(
	[joao, carlos],
	noGoalEvents,
	1,
);
check(noGkAlign?.goalkeeperMetrics === null, "no gk history → null");

// --- roster sort + lists ---

const allRows = calculatePlayersRatingAlignment(roster, richEvents);
check(allRows.length === 3, "roster rows");
check(
	(allRows[0]?.ratingGap ?? 0) >= (allRows[1]?.ratingGap ?? 0),
	"sorted gap desc",
);

const below = ratingAlignmentUnderrated(allRows);
const above = ratingAlignmentOverrated(allRows);
for (const row of below) {
	check((row.ratingGap ?? 0) > 0, "underrated positive gap");
}
for (const row of above) {
	check((row.ratingGap ?? 0) < 0, "overrated negative gap");
}

const warnings = ratingAlignmentDrawWarnings(allRows, [1, 2]);
for (const row of warnings) {
	check(
		row.status === RATING_ALIGNMENT_STATUS.below_performance ||
			row.status === RATING_ALIGNMENT_STATUS.above_performance,
		"draw warning only strong statuses",
	);
	check(
		row.evidence === RATING_ALIGNMENT_EVIDENCE_LEVEL.moderate ||
			row.evidence === RATING_ALIGNMENT_EVIDENCE_LEVEL.strong,
		"draw warning needs moderate+",
	);
}

// --- sentinel rating ---

const seed = player(9, "Seed", PLAYER_RATING.default);
const seedAlign = calculatePlayerRatingAlignment([seed, joao], richEvents, 9);
check(seedAlign?.ratingGap === null, "sentinel no gap");
check(
	seedAlign?.evidence === RATING_ALIGNMENT_EVIDENCE_LEVEL.insufficient,
	"sentinel insufficient",
);

// --- official rating not mutated ---

const before = joao.rating;
calculatePlayerRatingAlignment(roster, richEvents, 1);
check(joao.rating === before, "does not mutate official rating");

// --- window size option ---

const shortWindow = calculatePlayerRatingAlignment(roster, richEvents, 1, {
	windowSize: RATING_ALIGNMENT_WINDOW.short,
});
check(
	(shortWindow?.games ?? 99) <= RATING_ALIGNMENT_WINDOW.short,
	"short window caps games",
);
check(
	shortWindow?.windows[10] !== undefined &&
		shortWindow?.windows[20] !== undefined &&
		shortWindow?.windows[30] !== undefined,
	"three persistence windows present",
);

check(
	PLAYER_RATING_ALIGNMENT_LABEL[RATING_ALIGNMENT_STATUS.below_performance]
		.length > 0,
	"status label",
);

console.log("player-rating-alignment.check.ts ok");
