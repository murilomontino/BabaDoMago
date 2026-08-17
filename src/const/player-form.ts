import {
	formatPlayerProfileDelta,
	type PlayerProfileHistoryRow,
} from "./player-profile.ts";
import {
	formatRosterCount,
	formatRosterWinRate,
	rosterAverage,
	rosterSafeCount,
	rosterWinRate,
} from "./roster-stats.ts";

export const PLAYER_FORM = {
	eventLimit: 5,
} as const;

export const PLAYER_FORM_RESULT = {
	win: "win",
	draw: "draw",
	loss: "loss",
} as const;

export type PlayerFormResult =
	(typeof PLAYER_FORM_RESULT)[keyof typeof PLAYER_FORM_RESULT];

export const PLAYER_FORM_LABEL = {
	title: "Forma recente",
	empty: "Ainda não jogou",
	events: "Rodadas",
	winRate: "Aproveitamento",
	goals: "Gols",
	assists: "Assistências",
	delta: "Delta",
	streak: "Sequência",
} as const;

export const PLAYER_FORM_RESULT_LABEL = {
	[PLAYER_FORM_RESULT.win]: "V",
	[PLAYER_FORM_RESULT.draw]: "E",
	[PLAYER_FORM_RESULT.loss]: "D",
} as const;

export type PlayerForm = {
	events: number;
	wins: number;
	draws: number;
	losses: number;
	matches: number;
	goals: number;
	assists: number;
	ratingDelta: number;
	winRate: number;
	goalsAverage: number;
	assistsAverage: number;
	streakResult: PlayerFormResult | null;
	streakLength: number;
};

export function playerFormResult(
	row: Pick<PlayerProfileHistoryRow, "wins" | "draws" | "losses" | "matches">,
): PlayerFormResult | null {
	if (rosterSafeCount(row.matches) === 0) {
		return null;
	}

	const wins = rosterSafeCount(row.wins);
	const draws = rosterSafeCount(row.draws);
	const losses = rosterSafeCount(row.losses);
	if (wins >= draws && wins >= losses) {
		return PLAYER_FORM_RESULT.win;
	}

	if (draws >= losses) {
		return PLAYER_FORM_RESULT.draw;
	}

	return PLAYER_FORM_RESULT.loss;
}

export function playerFormStreak(
	historyNewestFirst: readonly PlayerProfileHistoryRow[],
): { result: PlayerFormResult | null; length: number } {
	const results = historyNewestFirst.flatMap((row) => {
		const result = playerFormResult(row);
		if (!result) {
			return [];
		}

		return [result];
	});
	const first = results[0];
	if (!first) {
		return { result: null, length: 0 };
	}

	const length = results.reduce((count, result, index) => {
		if (index !== count) {
			return count;
		}

		if (result !== first) {
			return count;
		}

		return count + 1;
	}, 0);

	return { result: first, length };
}

export function playerRecentForm(
	historyNewestFirst: readonly PlayerProfileHistoryRow[],
	limit = PLAYER_FORM.eventLimit,
): PlayerForm | null {
	const recent = historyNewestFirst.slice(0, limit);
	if (recent.length === 0) {
		return null;
	}

	const wins = recent.reduce((sum, row) => sum + rosterSafeCount(row.wins), 0);
	const draws = recent.reduce(
		(sum, row) => sum + rosterSafeCount(row.draws),
		0,
	);
	const losses = recent.reduce(
		(sum, row) => sum + rosterSafeCount(row.losses),
		0,
	);
	const matches = recent.reduce(
		(sum, row) => sum + rosterSafeCount(row.matches),
		0,
	);
	const goals = recent.reduce(
		(sum, row) => sum + rosterSafeCount(row.goals),
		0,
	);
	const assists = recent.reduce(
		(sum, row) => sum + rosterSafeCount(row.assists),
		0,
	);
	const ratingDelta = recent.reduce((sum, row) => sum + row.ratingDelta, 0);
	const streak = playerFormStreak(recent);

	return {
		events: recent.length,
		wins,
		draws,
		losses,
		matches,
		goals,
		assists,
		ratingDelta,
		winRate: rosterWinRate(wins, matches),
		goalsAverage: rosterAverage(goals, matches),
		assistsAverage: rosterAverage(assists, matches),
		streakResult: streak.result,
		streakLength: streak.length,
	};
}

export function formatPlayerFormStreak(form: PlayerForm): string {
	if (!form.streakResult || form.streakLength === 0) {
		return formatRosterCount(0);
	}

	return `${form.streakLength}${PLAYER_FORM_RESULT_LABEL[form.streakResult]}`;
}

export function formatPlayerFormDelta(value: number): string {
	return formatPlayerProfileDelta(value);
}

export function formatPlayerFormWinRate(value: number): string {
	return formatRosterWinRate(value);
}
