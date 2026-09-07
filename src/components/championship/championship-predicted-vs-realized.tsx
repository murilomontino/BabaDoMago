import { useNavigate } from "@tanstack/react-router";
import { ChartScatter, LoaderCircle, Share2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/button";
import { ChampionshipPredictedVsRealizedEvolution } from "@/components/championship/championship-predicted-vs-realized-evolution";
import { ChampionshipPredictedVsRealizedScatter } from "@/components/championship/championship-predicted-vs-realized-scatter";
import { ChampionshipPredictedVsRealizedSummary } from "@/components/championship/championship-predicted-vs-realized-summary";
import { ChampionshipPredictedVsRealizedTable } from "@/components/championship/championship-predicted-vs-realized-table";
import {
	championshipPredictedVsRealized,
	PREDICTED_VS_REALIZED_LABEL,
	PREDICTED_VS_REALIZED_MIN_MATCHES,
	PREDICTED_VS_REALIZED_ROSTER_OPTIONS,
	PREDICTED_VS_REALIZED_WINDOW_DEFAULT,
	PREDICTED_VS_REALIZED_WINDOW_OPTIONS,
	type PredictedVsRealizedMatch,
	type PredictedVsRealizedRoster,
	type PredictedVsRealizedWindow,
	parsePredictedVsRealizedRoster,
	parsePredictedVsRealizedWindow,
	predictedVsRealizedCsvFileName,
	predictedVsRealizedCsvRows,
	predictedVsRealizedRosterCaption,
	predictedVsRealizedWindowCaption,
	trendsAudienceToPredictedRoster,
} from "@/const/championship-predicted-vs-realized";
import type { TrendsAudience } from "@/const/championship-trends-window";
import { ROUTES } from "@/const/routes";
import { BUTTON_VARIANT, FIELD_CLASS } from "@/const/ui";
import { buildCsv, shareCsvText } from "@/lib/share-csv";
import { sharePredictedVsRealizedImage } from "@/lib/share-predicted-vs-realized-image";
import type { ChampionshipPlayer } from "@/types/championship";
import type { ChampionshipEvent } from "@/types/championship-event";

type ChampionshipPredictedVsRealizedProps = {
	championshipId: number;
	championshipName: string;
	players: readonly ChampionshipPlayer[];
	events: readonly ChampionshipEvent[];
	audience: TrendsAudience;
};

export function ChampionshipPredictedVsRealized({
	championshipId,
	championshipName,
	players,
	events,
	audience,
}: ChampionshipPredictedVsRealizedProps) {
	const navigate = useNavigate();
	const [window, setWindow] = useState<PredictedVsRealizedWindow>(
		PREDICTED_VS_REALIZED_WINDOW_DEFAULT,
	);
	const [roster, setRoster] = useState<PredictedVsRealizedRoster>(() =>
		trendsAudienceToPredictedRoster(audience),
	);
	const [isSharingPng, setIsSharingPng] = useState(false);
	const [isSharingCsv, setIsSharingCsv] = useState(false);
	const [shareError, setShareError] = useState<string | null>(null);

	const result = useMemo(
		() =>
			championshipPredictedVsRealized(players, events, {
				window,
				roster,
			}),
		[players, events, window, roster],
	);

	function openMatch(match: PredictedVsRealizedMatch) {
		void navigate({
			to: ROUTES.championshipEvent,
			params: {
				championshipId: String(championshipId),
				eventId: String(match.eventId),
			},
		});
	}

	async function sharePng() {
		setShareError(null);
		setIsSharingPng(true);
		try {
			await sharePredictedVsRealizedImage({
				championshipName,
				window,
				summary: result.summary,
				matches: result.matches,
			});
		} catch {
			setShareError(PREDICTED_VS_REALIZED_LABEL.shareFailed);
		} finally {
			setIsSharingPng(false);
		}
	}

	async function shareCsv() {
		setShareError(null);
		setIsSharingCsv(true);
		try {
			const { headers, rows } = predictedVsRealizedCsvRows(result);
			const csv = buildCsv(headers, rows);
			await shareCsvText(
				predictedVsRealizedCsvFileName(championshipName, window),
				csv,
				PREDICTED_VS_REALIZED_LABEL.title,
			);
		} catch {
			setShareError(PREDICTED_VS_REALIZED_LABEL.shareFailed);
		} finally {
			setIsSharingCsv(false);
		}
	}

	const hasData = result.summary.matches >= PREDICTED_VS_REALIZED_MIN_MATCHES;
	const isSharing = isSharingPng || isSharingCsv;

	return (
		<section className="space-y-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<ChartScatter className="size-4 text-pitch-fg" />
						<h3 className="text-sm font-semibold text-fg">
							{PREDICTED_VS_REALIZED_LABEL.title}
						</h3>
					</div>
					<p className="text-sm font-medium text-fg">
						{PREDICTED_VS_REALIZED_LABEL.subtitle}
					</p>
					<p className="text-sm text-fg-muted">
						{PREDICTED_VS_REALIZED_LABEL.hint}
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<label className="block text-xs text-fg-muted">
						{PREDICTED_VS_REALIZED_LABEL.filterWindow}
						<select
							value={window}
							className={`mt-1 ${FIELD_CLASS}`}
							onChange={(event) => {
								setWindow(parsePredictedVsRealizedWindow(event.target.value));
							}}
						>
							{PREDICTED_VS_REALIZED_WINDOW_OPTIONS.map((option) => (
								<option key={option} value={option}>
									{predictedVsRealizedWindowCaption(option)}
								</option>
							))}
						</select>
					</label>
					<label className="block text-xs text-fg-muted">
						{PREDICTED_VS_REALIZED_LABEL.filterRoster}
						<select
							value={roster}
							className={`mt-1 ${FIELD_CLASS}`}
							onChange={(event) => {
								setRoster(parsePredictedVsRealizedRoster(event.target.value));
							}}
						>
							{PREDICTED_VS_REALIZED_ROSTER_OPTIONS.map((option) => (
								<option key={option} value={option}>
									{predictedVsRealizedRosterCaption(option)}
								</option>
							))}
						</select>
					</label>
				</div>
			</div>

			{!hasData && (
				<p className="text-sm text-fg-muted">
					{PREDICTED_VS_REALIZED_LABEL.empty}
				</p>
			)}

			{hasData && (
				<>
					<div className="flex flex-wrap gap-2">
						<Button
							type="button"
							variant={BUTTON_VARIANT.secondary}
							disabled={isSharing}
							onClick={() => {
								void sharePng();
							}}
						>
							{isSharingPng && (
								<LoaderCircle className="size-4 animate-spin" aria-hidden />
							)}
							{!isSharingPng && <Share2 className="size-4" aria-hidden />}
							{isSharingPng && PREDICTED_VS_REALIZED_LABEL.sharing}
							{!isSharingPng && PREDICTED_VS_REALIZED_LABEL.sharePng}
						</Button>
						<Button
							type="button"
							variant={BUTTON_VARIANT.secondary}
							disabled={isSharing}
							onClick={() => {
								void shareCsv();
							}}
						>
							{isSharingCsv && (
								<LoaderCircle className="size-4 animate-spin" aria-hidden />
							)}
							{!isSharingCsv && <Share2 className="size-4" aria-hidden />}
							{isSharingCsv && PREDICTED_VS_REALIZED_LABEL.sharing}
							{!isSharingCsv && PREDICTED_VS_REALIZED_LABEL.shareCsv}
						</Button>
					</div>
					{shareError !== null && (
						<p className="text-sm text-danger-fg">{shareError}</p>
					)}
					<ChampionshipPredictedVsRealizedSummary summary={result.summary} />
					<ChampionshipPredictedVsRealizedScatter
						matches={result.matches}
						onMatchClick={openMatch}
					/>
					<ChampionshipPredictedVsRealizedEvolution rounds={result.rounds} />
					<ChampionshipPredictedVsRealizedTable
						matches={result.matches}
						rounds={result.rounds}
						bands={result.bands}
						onMatchClick={openMatch}
					/>
				</>
			)}
		</section>
	);
}
