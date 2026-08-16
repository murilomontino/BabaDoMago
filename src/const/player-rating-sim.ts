import { eventMvpStarDelta } from "./event-mvp.ts";
import {
	applyEventRatingDelta,
	EVENT_RATING_ADJUSTMENT,
	eventRatingDelta,
	eventRatingDrawPoints,
	eventRatingPoints,
} from "./event-rating-adjustment.ts";
import { PLAYER_RATING } from "./player-rating.ts";

export const PLAYER_RATING_SIM_LABEL = {
	title: "Simulação",
	hint: "Simula a nota desta rodada com o teto atual da liga. Não grava nada.",
	wins: "Vitórias",
	draws: "Empates",
	losses: "Derrotas",
	matches: "Jogos",
	ceiling: "Teto",
	floor: "Piso",
	rate: "Aproveitamento",
	delta: "Delta",
	from: "De",
	to: "Para",
	mvp: "MVP (+0,1)",
	drawPoints: "Pontos por empate",
	belowMinMatches: "Menos de 3 jogos: a nota não muda.",
	deadZone: "Zona morta (45%–55%): delta 0.",
	seed: "Nota inicial (sentinela): a semente vira a nota.",
	drawBonus: "Empates > derrotas: empate vale 1,5.",
} as const;

export const PLAYER_RATING_SIM_FIELD = {
	wins: "wins",
	draws: "draws",
	losses: "losses",
} as const;

export type PlayerRatingSimFieldId =
	(typeof PLAYER_RATING_SIM_FIELD)[keyof typeof PLAYER_RATING_SIM_FIELD];

export const PLAYER_RATING_SIM_FIELDS = [
	{
		id: PLAYER_RATING_SIM_FIELD.wins,
		abbr: "V",
		label: PLAYER_RATING_SIM_LABEL.wins,
	},
	{
		id: PLAYER_RATING_SIM_FIELD.draws,
		abbr: "E",
		label: PLAYER_RATING_SIM_LABEL.draws,
	},
	{
		id: PLAYER_RATING_SIM_FIELD.losses,
		abbr: "D",
		label: PLAYER_RATING_SIM_LABEL.losses,
	},
] as const;

export type PlayerRatingSimDraft = {
	wins: number;
	draws: number;
	losses: number;
};

export type PlayerRatingSimResult = {
	matches: number;
	points: number;
	rate: number;
	drawPoints: number;
	delta: number;
	from: number;
	to: number;
	inDeadZone: boolean;
	belowMinMatches: boolean;
	isSeed: boolean;
};

export function emptyPlayerRatingSimDraft(): PlayerRatingSimDraft {
	return {
		wins: 0,
		draws: 0,
		losses: 0,
	};
}

export function setPlayerRatingSimField(
	draft: PlayerRatingSimDraft,
	field: PlayerRatingSimFieldId,
	value: number,
): PlayerRatingSimDraft {
	return {
		...draft,
		[field]: value,
	};
}

export function formatPlayerRatingSimRate(rate: number): string {
	return `${(rate * 100).toFixed(1)}%`;
}

function eventRatingInDeadZone(
	wins: number,
	draws: number,
	losses: number,
	matches: number,
): boolean {
	if (matches < EVENT_RATING_ADJUSTMENT.minMatches) {
		return false;
	}

	const points = eventRatingPoints(wins, draws, losses);
	const maxPoints = matches * EVENT_RATING_ADJUSTMENT.winPoints;
	const wrScale = 20;
	const pointUnits = points * wrScale;
	const upUnits =
		maxPoints * Math.round(EVENT_RATING_ADJUSTMENT.upThreshold * wrScale);
	const downUnits =
		maxPoints * Math.round(EVENT_RATING_ADJUSTMENT.downThreshold * wrScale);
	return pointUnits <= upUnits && pointUnits >= downUnits;
}

export function simulatePlayerEventRating({
	rating,
	wins,
	draws,
	losses,
	ceiling,
	isMvp = false,
}: {
	rating: number;
	wins: number;
	draws: number;
	losses: number;
	ceiling: number;
	isMvp?: boolean;
}): PlayerRatingSimResult {
	const matches = wins + draws + losses;
	const belowMinMatches = matches < EVENT_RATING_ADJUSTMENT.minMatches;
	const points = eventRatingPoints(wins, draws, losses);
	const drawPoints = eventRatingDrawPoints(draws, losses);
	const maxPoints = matches * EVENT_RATING_ADJUSTMENT.winPoints;
	const rate = maxPoints === 0 ? 0 : points / maxPoints;
	const inDeadZone = eventRatingInDeadZone(wins, draws, losses, matches);
	const isSeed = rating === PLAYER_RATING.default && !belowMinMatches;
	const mvpBonus = isMvp ? eventMvpStarDelta() : 0;
	const delta =
		eventRatingDelta(wins, draws, losses, matches, rating, ceiling) + mvpBonus;
	const to = applyEventRatingDelta(rating, delta);

	return {
		matches,
		points,
		rate,
		drawPoints,
		delta,
		from: rating,
		to,
		inDeadZone,
		belowMinMatches,
		isSeed,
	};
}
