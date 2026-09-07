import type { ChampionshipEvent } from "../types/championship-event.ts";
import {
	BALANCE_GOAL_DIFF_BUCKET,
	BALANCE_INDEX_CLASSIFICATION,
	BALANCE_INDEX_SCALE,
	BALANCE_INDEX_THRESHOLDS,
	BALANCE_VS_PREDICTED,
	balanceDifferenceScore,
	balanceIndexClassification,
	calculateChampionshipBalanceIndex,
	calculateEventBalanceIndex,
	goalDifferenceDistribution,
} from "./championship-event-balance-index.ts";
import { EVENT_TEAM_COLOR } from "./event-team-color.ts";
import { isCloseMatch, matchGoalMargin } from "./match-goal-counts.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

type GoalSpec = { scorer: number; own?: boolean };

function matchPlayers() {
	return [
		{
			id: 1,
			match_id: 1,
			event_id: 1,
			team_id: 10,
			player_id: 1,
			display_name: "Ana",
			is_goalkeeper: false,
			slot: 0,
			is_substituted: false,
			include_stats: true,
		},
		{
			id: 2,
			match_id: 1,
			event_id: 1,
			team_id: 20,
			player_id: 2,
			display_name: "Bruno",
			is_goalkeeper: false,
			slot: 0,
			is_substituted: false,
			include_stats: true,
		},
	];
}

function goalsFrom(
	matchId: number,
	eventId: number,
	day: string,
	goals: GoalSpec[],
) {
	return goals.map((goal, index) => ({
		id: matchId * 100 + index + 1,
		match_id: matchId,
		event_id: eventId,
		scorer_player_id: goal.scorer,
		assist_player_id: null,
		is_own_goal: goal.own === true,
		elapsed_seconds: 60,
		created_at: `${day}T22:05:00.000Z`,
	}));
}

function buildEvent(options: {
	id: number;
	day: string;
	ended: boolean;
	ratingA: number;
	ratingB: number;
	matches: {
		id: number;
		winner: number | null;
		goals: GoalSpec[];
		ended?: boolean;
		teamA?: number;
		teamB?: number;
	}[];
}): ChampionshipEvent {
	const { id, day, ended, ratingA, ratingB, matches } = options;

	return {
		id,
		championship_id: 1,
		starts_at: `${day}T22:00:00.000Z`,
		players_per_team: 5,
		skip_guest_goalkeeper_matches: false,
		ended_at: ended ? `${day}T23:00:00.000Z` : null,
		attendance: [
			{
				id: 1,
				event_id: id,
				player_id: 1,
				display_name: "Ana",
				is_goalkeeper: false,
				event_date: day,
				goals: 0,
				assists: 0,
				assisted_goals: 0,
				own_goals: 0,
				wins: 1,
				losses: 0,
				draws: 0,
				matches: 1,
				rating: ratingA,
				rating_delta: 0,
				goalkeeper_rating: 0,
				goalkeeper_rating_delta: 0,
				vote_rating_delta: 0,
				goalkeeper_vote_rating_delta: 0,
				is_mvp: false,
				mvp_overridden: false,
			},
			{
				id: 2,
				event_id: id,
				player_id: 2,
				display_name: "Bruno",
				is_goalkeeper: false,
				event_date: day,
				goals: 0,
				assists: 0,
				assisted_goals: 0,
				own_goals: 0,
				wins: 0,
				losses: 1,
				draws: 0,
				matches: 1,
				rating: ratingB,
				rating_delta: 0,
				goalkeeper_rating: 0,
				goalkeeper_rating_delta: 0,
				vote_rating_delta: 0,
				goalkeeper_vote_rating_delta: 0,
				is_mvp: false,
				mvp_overridden: false,
			},
		],
		rsvps: [],
		teams: [
			{
				id: 10,
				event_id: id,
				color: EVENT_TEAM_COLOR.white,
				sort_order: 0,
				is_active: true,
				template_player_ids: [],
				template_goalkeeper_id: 0,
				players: [
					{
						id: 1,
						event_id: id,
						team_id: 10,
						player_id: 1,
						display_name: "Ana",
						is_goalkeeper: false,
					},
				],
			},
			{
				id: 20,
				event_id: id,
				color: EVENT_TEAM_COLOR.black,
				sort_order: 1,
				is_active: true,
				template_player_ids: [],
				template_goalkeeper_id: 0,
				players: [
					{
						id: 2,
						event_id: id,
						team_id: 20,
						player_id: 2,
						display_name: "Bruno",
						is_goalkeeper: false,
					},
				],
			},
		],
		matches: matches.map((match) => {
			const teamA = match.teamA ?? 10;
			const teamB = match.teamB ?? 20;
			const matchEnded = match.ended !== false;
			return {
				id: match.id,
				event_id: id,
				team_a_id: teamA,
				team_b_id: teamB,
				created_at: `${day}T22:00:00.000Z`,
				ended_at: matchEnded ? `${day}T22:10:00.000Z` : null,
				winner_team_id: match.winner,
				duration_seconds: 600,
				started_at: `${day}T22:00:00.000Z`,
				paused_at: null,
				pause_accumulated_seconds: 0,
				players: matchPlayers().map((player) => ({
					...player,
					id: match.id * 10 + player.id,
					match_id: match.id,
					event_id: id,
					team_id: player.player_id === 1 ? teamA : teamB,
				})),
				goals: goalsFrom(match.id, id, day, match.goals),
			};
		}),
	};
}

check(calculateEventBalanceIndex(buildEvent({
	id: 1,
	day: "2026-08-01",
	ended: true,
	ratingA: 5,
	ratingB: 3,
	matches: [],
})) === null, "rodada sem partidas retorna vazio");

const openEvent = buildEvent({
	id: 2,
	day: "2026-08-02",
	ended: false,
	ratingA: 5,
	ratingB: 3,
	matches: [
		{
			id: 1,
			winner: 10,
			goals: [{ scorer: 1 }],
		},
	],
});
check(calculateEventBalanceIndex(openEvent) === null, "rodada aberta não entra");

const unfinished = buildEvent({
	id: 3,
	day: "2026-08-03",
	ended: true,
	ratingA: 5,
	ratingB: 3,
	matches: [
		{
			id: 1,
			winner: 10,
			goals: [{ scorer: 1 }],
			ended: false,
		},
	],
});
check(
	calculateEventBalanceIndex(unfinished) === null,
	"partida não encerrada não entra",
);

check(isCloseMatch({
	id: 1,
	event_id: 1,
	team_a_id: 10,
	team_b_id: 20,
	created_at: "2026-01-01T22:00:00.000Z",
	ended_at: "2026-01-01T22:10:00.000Z",
	winner_team_id: null,
	duration_seconds: 600,
	started_at: "2026-01-01T22:00:00.000Z",
	paused_at: null,
	pause_accumulated_seconds: 0,
	players: matchPlayers(),
	goals: [],
}), "empate conta como jogo apertado");

check(isCloseMatch({
	id: 1,
	event_id: 1,
	team_a_id: 10,
	team_b_id: 20,
	created_at: "2026-01-01T22:00:00.000Z",
	ended_at: "2026-01-01T22:10:00.000Z",
	winner_team_id: 10,
	duration_seconds: 600,
	started_at: "2026-01-01T22:00:00.000Z",
	paused_at: null,
	pause_accumulated_seconds: 0,
	players: matchPlayers(),
	goals: goalsFrom(1, 1, "2026-01-01", [{ scorer: 1 }]),
}), "vitória por 1 gol conta como jogo apertado");

check(!isCloseMatch({
	id: 1,
	event_id: 1,
	team_a_id: 10,
	team_b_id: 20,
	created_at: "2026-01-01T22:00:00.000Z",
	ended_at: "2026-01-01T22:10:00.000Z",
	winner_team_id: 10,
	duration_seconds: 600,
	started_at: "2026-01-01T22:00:00.000Z",
	paused_at: null,
	pause_accumulated_seconds: 0,
	players: matchPlayers(),
	goals: goalsFrom(1, 1, "2026-01-01", [
		{ scorer: 1 },
		{ scorer: 1 },
	]),
}), "vitória por 2 gols não conta como jogo apertado");

check(
	Math.abs(
		balanceDifferenceScore(1.4, BALANCE_INDEX_SCALE.predicted) -
			100 * (1 - 1.4 / BALANCE_INDEX_SCALE.predicted),
	) < 0.0001,
	"score previsto normalizado corretamente",
);

check(
	Math.abs(
		balanceDifferenceScore(0.75, BALANCE_INDEX_SCALE.realized) -
			100 * (1 - 0.75 / BALANCE_INDEX_SCALE.realized),
	) < 0.0001,
	"score realizado normalizado corretamente",
);

check(balanceDifferenceScore(100, 8) === 0, "score clamp inferior");
check(balanceDifferenceScore(-1, 8) === 100, "score clamp superior via diff negativa");

check(
	balanceIndexClassification(90) === BALANCE_INDEX_CLASSIFICATION.excellent,
	"classificação excelente",
);
check(
	balanceIndexClassification(75) ===
		BALANCE_INDEX_CLASSIFICATION.veryBalanced,
	"classificação muito equilibrada",
);
check(
	balanceIndexClassification(60) === BALANCE_INDEX_CLASSIFICATION.balanced,
	"classificação equilibrada",
);
check(
	balanceIndexClassification(40) === BALANCE_INDEX_CLASSIFICATION.moderate,
	"classificação moderada",
);
check(
	balanceIndexClassification(20) === BALANCE_INDEX_CLASSIFICATION.unbalanced,
	"classificação desequilibrada",
);
check(
	balanceIndexClassification(19) ===
		BALANCE_INDEX_CLASSIFICATION.veryUnbalanced,
	"classificação muito desequilibrada",
);
check(
	BALANCE_INDEX_THRESHOLDS.excellent === 90,
	"threshold excellent",
);

const predictedEvent = buildEvent({
	id: 10,
	day: "2026-08-10",
	ended: true,
	ratingA: 5,
	ratingB: 3.6,
	matches: [
		{
			id: 1,
			winner: null,
			goals: [],
		},
		{
			id: 2,
			winner: 10,
			goals: [{ scorer: 1 }],
		},
		{
			id: 3,
			winner: 10,
			goals: [{ scorer: 1 }, { scorer: 1 }, { scorer: 2 }],
		},
		{
			id: 4,
			winner: 10,
			goals: [{ scorer: 1 }, { scorer: 1 }],
		},
	],
});

const predictedRow = calculateEventBalanceIndex(predictedEvent);
check(predictedRow !== null, "índice existe");
check(predictedRow?.predictedDifferenceMean === 1.4, "diferença prevista média");
check(
	predictedRow?.realizedDifferenceMean === 1,
	"diferença realizada média",
);
check(predictedRow?.tightGames === 3, "três jogos apertados");
check(predictedRow?.tightGameRate === 0.75, "score de jogos apertados / rate");
check(predictedRow?.tightGameScore === 75, "score apertados");
check(
	predictedRow?.predictedScore ===
		Math.round(balanceDifferenceScore(1.4, BALANCE_INDEX_SCALE.predicted)),
	"predicted score",
);
check(
	predictedRow?.realizedScore ===
		Math.round(balanceDifferenceScore(1, BALANCE_INDEX_SCALE.realized)),
	"realized score",
);
check(
	predictedRow !== null &&
		predictedRow.balanceIndex >= 0 &&
		predictedRow.balanceIndex <= 100,
	"índice limitado entre 0 e 100",
);
check(predictedRow?.smallSample === false, "4 partidas não é amostra pequena");
check(
	predictedRow?.vsPredicted === BALANCE_VS_PREDICTED.moreBalanced,
	"realizado menor que previsto",
);

const singleMatch = buildEvent({
	id: 11,
	day: "2026-08-11",
	ended: true,
	ratingA: 5,
	ratingB: 5,
	matches: [
		{
			id: 1,
			winner: null,
			goals: [],
		},
	],
});
const singleRow = calculateEventBalanceIndex(singleMatch);
check(singleRow?.smallSample === true, "rodada com poucas partidas marcada");
check(singleRow?.matches === 1, "uma partida válida");

const incomplete = buildEvent({
	id: 12,
	day: "2026-08-12",
	ended: true,
	ratingA: 5,
	ratingB: 3,
	matches: [
		{
			id: 1,
			winner: 10,
			goals: [{ scorer: 1 }],
			teamA: 10,
			teamB: 99,
		},
	],
});
const incompleteRow = calculateEventBalanceIndex(incomplete);
check(incompleteRow?.incompletePredicted === true, "dados incompletos marcados");
check(
	incompleteRow?.predictedDifferenceMean === null,
	"dados incompletos não viram zero automaticamente",
);
check(incompleteRow?.predictedScore === null, "score previsto ausente");

const early = buildEvent({
	id: 20,
	day: "2026-07-01",
	ended: true,
	ratingA: 5,
	ratingB: 4,
	matches: [
		{ id: 1, winner: null, goals: [] },
		{ id: 2, winner: null, goals: [] },
		{ id: 3, winner: null, goals: [] },
		{ id: 4, winner: null, goals: [] },
		{ id: 5, winner: null, goals: [] },
		{ id: 6, winner: null, goals: [] },
	],
});
const late = buildEvent({
	id: 21,
	day: "2026-07-08",
	ended: true,
	ratingA: 8,
	ratingB: 2,
	matches: [
		{
			id: 1,
			winner: 10,
			goals: [
				{ scorer: 1 },
				{ scorer: 1 },
				{ scorer: 1 },
				{ scorer: 1 },
			],
		},
	],
});
const championship = calculateChampionshipBalanceIndex([late, early]);
check(
	championship.history[0]?.eventId === 20,
	"histórico ordenado cronologicamente",
);
check(championship.current?.eventId === 21, "current é a mais recente");
check(championship.overall !== null, "overall existe");
check(championship.overall?.matches === 7, "overall soma partidas");

const equalWeightWouldBeWrong =
	((championship.history[0]?.balanceIndex ?? 0) +
		(championship.history[1]?.balanceIndex ?? 0)) /
	2;
check(
	championship.overall !== null &&
		championship.overall.balanceIndex !== Math.round(equalWeightWouldBeWrong),
	"índice geral pondera pelo número de partidas",
);

const dist = goalDifferenceDistribution([predictedEvent]);
check(
	dist.find((row) => row.bucket === BALANCE_GOAL_DIFF_BUCKET.zero)?.count === 1,
	"histograma 0",
);
check(
	dist.find((row) => row.bucket === BALANCE_GOAL_DIFF_BUCKET.one)?.count === 2,
	"histograma 1",
);
check(
	dist.find((row) => row.bucket === BALANCE_GOAL_DIFF_BUCKET.two)?.count === 1,
	"histograma 2",
);

check(
	matchGoalMargin({
		id: 1,
		event_id: 1,
		team_a_id: 10,
		team_b_id: 20,
		created_at: "2026-01-01T22:00:00.000Z",
		ended_at: "2026-01-01T22:10:00.000Z",
		winner_team_id: 10,
		duration_seconds: 600,
		started_at: "2026-01-01T22:00:00.000Z",
		paused_at: null,
		pause_accumulated_seconds: 0,
		players: matchPlayers(),
		goals: goalsFrom(1, 1, "2026-01-01", [
			{ scorer: 1 },
			{ scorer: 1 },
			{ scorer: 2 },
		]),
	}) === 1,
	"diferença realizada 2-1 = 1",
);

console.log("championship-event-balance-index.check.ts ok");
