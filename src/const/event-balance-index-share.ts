import { formatEventStartsAt } from "./championship-event.ts";
import {
	BALANCE_INDEX_LABEL,
	balanceIndexClassificationLabel,
	type ChampionshipBalanceIndex,
	type EventBalanceIndex,
	formatBalanceIndexMean,
	formatBalanceIndexScore,
	formatBalanceTightRate,
} from "./championship-event-balance-index.ts";
import {
	SHARE_FILE,
	shareFileDateStamp,
	shareFileName,
	sharePngFileName,
} from "./share-file-name.ts";

export const EVENT_BALANCE_INDEX_SHARE = {
	width: 1080,
	padding: 40,
	gap: 20,
	headerHeight: 100,
	scoreBlockHeight: 220,
	statsHeight: 160,
	filePrefix: "equilibrio-rodada",
	mimePng: "image/png",
	title: BALANCE_INDEX_LABEL.title,
} as const;

export const EVENT_BALANCE_INDEX_SHARE_LABEL = {
	share: BALANCE_INDEX_LABEL.share,
	shareCsv: BALANCE_INDEX_LABEL.shareCsv,
	sharing: BALANCE_INDEX_LABEL.sharing,
	shareFailed: BALANCE_INDEX_LABEL.shareFailed,
} as const;

export const EVENT_BALANCE_INDEX_SHARE_COLOR = {
	field: "#fafaf9",
	surface: "#ffffff",
	fg: "#1c1917",
	fgMuted: "#57534e",
	fgSubtle: "#a8a29e",
	line: "#e7e5e4",
	pitch: "#166534",
	barTrack: "#e7e5e4",
} as const;

export const EVENT_BALANCE_INDEX_CSV_HEADERS = [
	"event_id",
	"event_date",
	"matches",
	"predicted_difference_mean",
	"realized_difference_mean",
	"tight_games",
	"tight_game_rate",
	"predicted_score",
	"realized_score",
	"tight_game_score",
	"balance_index",
	"classification",
] as const;

export type EventBalanceIndexShareCard = {
	championshipName: string;
	title: string;
	context: string;
	eventDate: string;
	balanceIndex: number;
	classification: string;
	tightGameRateLabel: string;
	predictedMeanLabel: string;
	realizedMeanLabel: string;
};

export function eventBalanceIndexShareCard(
	row: EventBalanceIndex,
	championshipName: string,
	context: string,
): EventBalanceIndexShareCard {
	return {
		championshipName,
		title: EVENT_BALANCE_INDEX_SHARE.title,
		context,
		eventDate: formatEventStartsAt(row.eventStartsAt).date,
		balanceIndex: row.balanceIndex,
		classification: balanceIndexClassificationLabel(row.classification),
		tightGameRateLabel: formatBalanceTightRate(row.tightGameRate),
		predictedMeanLabel: formatBalanceIndexMean(row.predictedDifferenceMean),
		realizedMeanLabel: formatBalanceIndexMean(row.realizedDifferenceMean),
	};
}

export function eventBalanceIndexShareContext(
	parts: readonly (string | null | undefined)[],
): string {
	return parts
		.flatMap((part) => {
			if (!part) {
				return [];
			}

			return [part];
		})
		.join(" · ");
}

export function eventBalanceIndexShareFileName(input: {
	championshipName: string;
	generatedAt: string;
}): string {
	return sharePngFileName([
		EVENT_BALANCE_INDEX_SHARE.filePrefix,
		input.championshipName,
		shareFileDateStamp(input.generatedAt),
	]);
}

export function eventBalanceIndexCsvFileName(input: {
	championshipName: string;
	generatedAt: string;
}): string {
	return shareFileName(
		[
			EVENT_BALANCE_INDEX_SHARE.filePrefix,
			input.championshipName,
			shareFileDateStamp(input.generatedAt),
		],
		SHARE_FILE.csv,
	);
}

export function eventBalanceIndexShareText(
	card: EventBalanceIndexShareCard,
): string {
	if (!card.context) {
		return `${card.title} — ${card.championshipName}`;
	}

	return `${card.title} (${card.context}) — ${card.championshipName}`;
}

export function eventBalanceIndexShareImageHeight(): number {
	return (
		EVENT_BALANCE_INDEX_SHARE.padding * 2 +
		EVENT_BALANCE_INDEX_SHARE.headerHeight +
		EVENT_BALANCE_INDEX_SHARE.gap +
		EVENT_BALANCE_INDEX_SHARE.scoreBlockHeight +
		EVENT_BALANCE_INDEX_SHARE.gap +
		EVENT_BALANCE_INDEX_SHARE.statsHeight
	);
}

function csvCell(value: string | number | null): string {
	if (value === null) {
		return "";
	}

	return String(value);
}

export function eventBalanceIndexCsvRows(
	summary: ChampionshipBalanceIndex,
): string[][] {
	return summary.history.map((row) => [
		csvCell(row.eventId),
		csvCell(formatEventStartsAt(row.eventStartsAt).date),
		csvCell(row.matches),
		csvCell(row.predictedDifferenceMean),
		csvCell(row.realizedDifferenceMean),
		csvCell(row.tightGames),
		csvCell(row.tightGameRate),
		csvCell(row.predictedScore),
		csvCell(row.realizedScore),
		csvCell(row.tightGameScore),
		csvCell(row.balanceIndex),
		csvCell(row.classification),
	]);
}

export function formatEventBalanceIndexShareScore(value: number): string {
	return `${formatBalanceIndexScore(value)}/100`;
}
