import {
	formatPredictedVsRealizedRate,
	formatPredictedVsRealizedSigned,
	formatPredictedVsRealizedValue,
	PREDICTED_VS_REALIZED_LABEL,
	PREDICTED_VS_REALIZED_QUALITY,
	type PredictedVsRealizedQuality,
	type PredictedVsRealizedSummary,
	predictedVsRealizedQualityCaption,
} from "@/const/championship-predicted-vs-realized";

type ChampionshipPredictedVsRealizedSummaryProps = {
	summary: PredictedVsRealizedSummary;
};

function qualityClassName(quality: PredictedVsRealizedQuality): string {
	switch (quality) {
		case PREDICTED_VS_REALIZED_QUALITY.good:
			return "text-pitch-fg";
		case PREDICTED_VS_REALIZED_QUALITY.watch:
			return "text-amber-700 dark:text-amber-400";
		case PREDICTED_VS_REALIZED_QUALITY.high:
			return "text-danger-fg";
		default: {
			const _never: never = quality;
			return _never;
		}
	}
}

function favoriteWinCaption(summary: PredictedVsRealizedSummary): string {
	if (summary.favoriteWinRate === null) {
		return PREDICTED_VS_REALIZED_LABEL.favoriteWonDraw;
	}

	return formatPredictedVsRealizedRate(summary.favoriteWinRate);
}

export function ChampionshipPredictedVsRealizedSummary({
	summary,
}: ChampionshipPredictedVsRealizedSummaryProps) {
	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
				<div>
					<p className="text-xs font-medium text-fg-muted">
						{PREDICTED_VS_REALIZED_LABEL.mae}
					</p>
					<p className="text-lg font-semibold tabular-nums text-fg">
						{formatPredictedVsRealizedValue(summary.meanAbsoluteError)}
					</p>
					<p className="text-xs text-fg-muted">
						{PREDICTED_VS_REALIZED_LABEL.maeHint}
					</p>
				</div>
				<div>
					<p className="text-xs font-medium text-fg-muted">
						{PREDICTED_VS_REALIZED_LABEL.bias}
					</p>
					<p className="text-lg font-semibold tabular-nums text-fg">
						{formatPredictedVsRealizedSigned(summary.meanError)}
					</p>
					<p className="text-xs text-fg-muted">
						{PREDICTED_VS_REALIZED_LABEL.biasHint}
					</p>
				</div>
				<div>
					<p className="text-xs font-medium text-fg-muted">
						{PREDICTED_VS_REALIZED_LABEL.withinOne}
					</p>
					<p className="text-lg font-semibold tabular-nums text-fg">
						{formatPredictedVsRealizedRate(summary.withinOneGoalRate)}
					</p>
					<p className="text-xs text-fg-muted">
						{PREDICTED_VS_REALIZED_LABEL.withinOneHint}
					</p>
				</div>
				<div>
					<p className="text-xs font-medium text-fg-muted">
						{PREDICTED_VS_REALIZED_LABEL.meanPredicted}
					</p>
					<p className="text-lg font-semibold tabular-nums text-fg">
						{formatPredictedVsRealizedValue(summary.meanPredictedDifference)}
					</p>
				</div>
				<div>
					<p className="text-xs font-medium text-fg-muted">
						{PREDICTED_VS_REALIZED_LABEL.meanRealized}
					</p>
					<p className="text-lg font-semibold tabular-nums text-fg">
						{formatPredictedVsRealizedValue(summary.meanRealizedDifference)}
					</p>
				</div>
				<div>
					<p className="text-xs font-medium text-fg-muted">
						{PREDICTED_VS_REALIZED_LABEL.favoriteWin}
					</p>
					<p className="text-lg font-semibold tabular-nums text-fg">
						{favoriteWinCaption(summary)}
					</p>
				</div>
			</div>
			{summary.quality !== null && (
				<p
					className={`text-sm font-medium ${qualityClassName(summary.quality)}`}
				>
					{predictedVsRealizedQualityCaption(summary.quality)}
				</p>
			)}
			{summary.smallSample && (
				<p className="text-sm text-fg-muted">
					{PREDICTED_VS_REALIZED_LABEL.smallSample}
				</p>
			)}
		</div>
	);
}
