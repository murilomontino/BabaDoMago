import type { ChampionshipEvent } from "../types/championship-event.ts";
import {
	championshipTeamHiddenBalance,
	hiddenStrengthWalk,
	type TeamHiddenBalanceEvent,
} from "./hidden-strength.ts";
import {
	championshipTeamBalance,
	type TeamBalanceEvent,
} from "./team-balance-stats.ts";
import { formatRosterCount, formatRosterWinRate, rosterWinRate } from "./roster-stats.ts";

export const PROJECTION_CALIBRATION_MIN_EVENTS = 3 as const;

export const PROJECTION_CALIBRATION_BANDS = [
	{ id: "tight", label: "0–2", min: 0, max: 2 },
	{ id: "mild", label: "2–5", min: 2, max: 5 },
	{ id: "wide", label: "5–10", min: 5, max: 10 },
	{ id: "blowout", label: "10+", min: 10, max: Number.POSITIVE_INFINITY },
] as const;

export type ProjectionCalibrationBandId =
	(typeof PROJECTION_CALIBRATION_BANDS)[number]["id"];

export const PROJECTION_CALIBRATION_LABEL = {
	title: "Calibração do favorito",
	empty: "Poucas rodadas com favorito decidido",
	hint: "Compara diferença prevista com quantas vezes o favorito venceu. Faixa com poucos jogos some.",
	band: "Diferença",
	events: "Rodadas",
	favoriteRate: "Favorito venceu",
	sourcePublic: "Nota pública",
	sourceHidden: "Nota oculta",
} as const;

export type ProjectionCalibrationRow = {
	bandId: ProjectionCalibrationBandId;
	label: string;
	events: number;
	favoriteWon: number;
	favoriteWinRate: number;
};

export type ProjectionCalibrationSummary = {
	source: "public" | "hidden";
	rows: ProjectionCalibrationRow[];
	samples: { spread: number; favoriteWon: boolean }[];
};

type BalanceLike = {
	spread: number;
	favoriteWon: boolean | null;
};

function bandForSpread(spread: number) {
	const absolute = Math.abs(spread);
	return (
		PROJECTION_CALIBRATION_BANDS.find(
			(band) => absolute >= band.min && absolute < band.max,
		) ?? PROJECTION_CALIBRATION_BANDS[PROJECTION_CALIBRATION_BANDS.length - 1]
	);
}

function calibrationFromRows(
	rows: readonly BalanceLike[],
	source: "public" | "hidden",
): ProjectionCalibrationSummary {
	const decided = rows.flatMap((row) => {
		if (row.favoriteWon === null) {
			return [];
		}

		return [
			{
				spread: row.spread,
				favoriteWon: row.favoriteWon,
			},
		];
	});

	const buckets = new Map<
		ProjectionCalibrationBandId,
		{ label: string; events: number; favoriteWon: number }
	>();

	for (const band of PROJECTION_CALIBRATION_BANDS) {
		buckets.set(band.id, {
			label: band.label,
			events: 0,
			favoriteWon: 0,
		});
	}

	for (const sample of decided) {
		const band = bandForSpread(sample.spread);
		const bucket = buckets.get(band.id);
		if (!bucket) {
			continue;
		}

		bucket.events += 1;
		if (sample.favoriteWon) {
			bucket.favoriteWon += 1;
		}
	}

	const visible = PROJECTION_CALIBRATION_BANDS.flatMap((band) => {
		const bucket = buckets.get(band.id);
		if (!bucket || bucket.events < PROJECTION_CALIBRATION_MIN_EVENTS) {
			return [];
		}

		return [
			{
				bandId: band.id,
				label: bucket.label,
				events: bucket.events,
				favoriteWon: bucket.favoriteWon,
				favoriteWinRate: rosterWinRate(bucket.favoriteWon, bucket.events),
			},
		];
	});

	return {
		source,
		rows: visible,
		samples: decided,
	};
}

function publicBalanceRows(
	events: readonly ChampionshipEvent[],
): TeamBalanceEvent[] {
	return championshipTeamBalance(events).rows;
}

function hiddenBalanceRows(
	events: readonly ChampionshipEvent[],
): TeamHiddenBalanceEvent[] {
	const walk = hiddenStrengthWalk(events);
	return championshipTeamHiddenBalance(events, walk).rows;
}

export function championshipProjectionCalibration(
	events: readonly ChampionshipEvent[],
	useHidden = false,
): ProjectionCalibrationSummary {
	if (useHidden) {
		const hidden = calibrationFromRows(hiddenBalanceRows(events), "hidden");
		if (hidden.samples.length > 0) {
			return hidden;
		}
	}

	return calibrationFromRows(publicBalanceRows(events), "public");
}

export function formatProjectionCalibrationCount(value: number): string {
	return formatRosterCount(value);
}

export function formatProjectionCalibrationRate(value: number): string {
	return formatRosterWinRate(value);
}
