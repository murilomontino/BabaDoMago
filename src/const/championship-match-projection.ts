import { averageOrZero } from "./player-rating.ts";
import { formatRosterWinRate, rosterWinRate } from "./roster-stats.ts";

// ponytail: logistica de 1 parametro, escala fixa calibrada no historico.
// Teto: nao modela empate nem ordem das partidas. Upgrade = 3 saidas (V/E/D).
export const MATCH_PROJECTION_DEFAULT_SCALE = 8 as const;

export const MATCH_PROJECTION_LABEL = {
	title: "Probabilidade de vitória",
	empty: "Precisa de times sorteados",
	hint: "Diferença de força prevista vira chance. Não modela empate.",
	favorite: "Favorito",
	underdog: "Azarão",
} as const;

export function projectedWinRate(
	spread: number,
	scale: number = MATCH_PROJECTION_DEFAULT_SCALE,
): number {
	if (scale <= 0) {
		return 0.5;
	}

	const odds = Math.exp(spread / scale);
	return odds / (1 + odds);
}

export function projectedTeamWinRates(
	teamAStrength: number,
	teamBStrength: number,
	scale: number = MATCH_PROJECTION_DEFAULT_SCALE,
): { teamA: number; teamB: number } {
	const spread = teamAStrength - teamBStrength;
	const teamA = projectedWinRate(spread, scale);
	return {
		teamA,
		teamB: 1 - teamA,
	};
}

export function projectedFieldWinRates(
	strengths: readonly number[],
	scale: number = MATCH_PROJECTION_DEFAULT_SCALE,
): number[] {
	if (strengths.length === 0) {
		return [];
	}

	if (scale <= 0) {
		const even = 1 / strengths.length;
		return strengths.map(() => even);
	}

	const weights = strengths.map((strength) => Math.exp(strength / scale));
	const total = weights.reduce((sum, weight) => sum + weight, 0);
	if (total <= 0) {
		const even = 1 / strengths.length;
		return strengths.map(() => even);
	}

	return weights.map((weight) => weight / total);
}

export function formatProjectedWinRate(value: number): string {
	return formatRosterWinRate(value);
}

export function projectionScaleFromFavoriteRates(
	samples: readonly { spread: number; favoriteWon: boolean }[],
): number {
	const decided = samples.filter((row) => Math.abs(row.spread) > 0);
	if (decided.length === 0) {
		return MATCH_PROJECTION_DEFAULT_SCALE;
	}

	const wins = decided.filter((row) => row.favoriteWon).length;
	const rate = rosterWinRate(wins, decided.length);
	if (rate <= 0.5 || rate >= 1) {
		return MATCH_PROJECTION_DEFAULT_SCALE;
	}

	const avgSpread = averageOrZero(
		decided.reduce((sum, row) => sum + Math.abs(row.spread), 0),
		decided.length,
	);
	if (avgSpread <= 0) {
		return MATCH_PROJECTION_DEFAULT_SCALE;
	}

	const logit = Math.log(rate / (1 - rate));
	const scale = avgSpread / logit;
	if (!Number.isFinite(scale) || scale <= 0) {
		return MATCH_PROJECTION_DEFAULT_SCALE;
	}

	return Math.round(scale * 10) / 10;
}
