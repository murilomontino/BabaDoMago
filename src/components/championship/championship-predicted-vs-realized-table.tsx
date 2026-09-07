import {
	formatPredictedVsRealizedCount,
	formatPredictedVsRealizedRate,
	formatPredictedVsRealizedSigned,
	formatPredictedVsRealizedValue,
	PREDICTED_VS_REALIZED_LABEL,
	type PredictedVsRealizedBand,
	type PredictedVsRealizedMatch,
	type PredictedVsRealizedRound,
	predictedVsRealizedFavoriteWonCaption,
	predictedVsRealizedRoundCaption,
} from "@/const/championship-predicted-vs-realized";

type ChampionshipPredictedVsRealizedTableProps = {
	matches: readonly PredictedVsRealizedMatch[];
	rounds: readonly PredictedVsRealizedRound[];
	bands: readonly PredictedVsRealizedBand[];
	onMatchClick?: (match: PredictedVsRealizedMatch) => void;
};

function bandFavoriteCaption(rate: number | null): string {
	if (rate === null) {
		return PREDICTED_VS_REALIZED_LABEL.favoriteWonDraw;
	}

	return formatPredictedVsRealizedRate(rate);
}

export function ChampionshipPredictedVsRealizedTable({
	matches,
	rounds,
	bands,
	onMatchClick,
}: ChampionshipPredictedVsRealizedTableProps) {
	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<h4 className="text-sm font-semibold text-fg">
					{PREDICTED_VS_REALIZED_LABEL.tableTitle}
				</h4>
				<div className="overflow-x-auto">
					<table className="w-full min-w-[40rem] border-collapse text-left text-sm">
						<thead>
							<tr className="border-b border-black/10 text-xs text-fg-muted">
								<th className="px-2 py-1.5 font-medium">
									{PREDICTED_VS_REALIZED_LABEL.round}
								</th>
								<th className="px-2 py-1.5 font-medium">
									{PREDICTED_VS_REALIZED_LABEL.match}
								</th>
								<th className="px-2 py-1.5 font-medium">
									{PREDICTED_VS_REALIZED_LABEL.score}
								</th>
								<th className="px-2 py-1.5 text-right font-medium">
									{PREDICTED_VS_REALIZED_LABEL.predicted}
								</th>
								<th className="px-2 py-1.5 text-right font-medium">
									{PREDICTED_VS_REALIZED_LABEL.realized}
								</th>
								<th className="px-2 py-1.5 text-right font-medium">
									{PREDICTED_VS_REALIZED_LABEL.error}
								</th>
								<th className="px-2 py-1.5 text-right font-medium">
									{PREDICTED_VS_REALIZED_LABEL.absoluteError}
								</th>
								<th className="px-2 py-1.5 font-medium">
									{PREDICTED_VS_REALIZED_LABEL.favoriteWin}
								</th>
							</tr>
						</thead>
						<tbody>
							{matches.map((row) => (
								<tr
									key={row.matchId}
									className="border-b border-black/5 hover:bg-black/5"
								>
									<td className="px-2 py-1.5">
										<button
											type="button"
											className="text-left text-pitch-fg underline-offset-2 hover:underline"
											onClick={() => onMatchClick?.(row)}
										>
											{predictedVsRealizedRoundCaption(
												row.roundIndex,
												row.eventStartsAt,
											)}
										</button>
									</td>
									<td className="px-2 py-1.5 tabular-nums">{row.matchIndex}</td>
									<td className="px-2 py-1.5 tabular-nums">
										{row.teamALabel} {row.teamAGoals}×{row.teamBGoals}{" "}
										{row.teamBLabel}
									</td>
									<td className="px-2 py-1.5 text-right tabular-nums">
										{formatPredictedVsRealizedValue(row.predictedDifference)}
									</td>
									<td className="px-2 py-1.5 text-right tabular-nums">
										{formatPredictedVsRealizedValue(row.realizedDifference)}
									</td>
									<td className="px-2 py-1.5 text-right tabular-nums">
										{formatPredictedVsRealizedSigned(row.error)}
									</td>
									<td className="px-2 py-1.5 text-right tabular-nums">
										{formatPredictedVsRealizedValue(row.absoluteError)}
									</td>
									<td className="px-2 py-1.5">
										{predictedVsRealizedFavoriteWonCaption(row.favoriteWon)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			<div className="space-y-2">
				<h4 className="text-sm font-semibold text-fg">
					{PREDICTED_VS_REALIZED_LABEL.roundsTitle}
				</h4>
				<div className="overflow-x-auto">
					<table className="w-full min-w-[32rem] border-collapse text-left text-sm">
						<thead>
							<tr className="border-b border-black/10 text-xs text-fg-muted">
								<th className="px-2 py-1.5 font-medium">
									{PREDICTED_VS_REALIZED_LABEL.round}
								</th>
								<th className="px-2 py-1.5 text-right font-medium">
									{PREDICTED_VS_REALIZED_LABEL.meanPredicted}
								</th>
								<th className="px-2 py-1.5 text-right font-medium">
									{PREDICTED_VS_REALIZED_LABEL.meanRealized}
								</th>
								<th className="px-2 py-1.5 text-right font-medium">
									{PREDICTED_VS_REALIZED_LABEL.error}
								</th>
								<th className="px-2 py-1.5 text-right font-medium">
									{PREDICTED_VS_REALIZED_LABEL.mae}
								</th>
							</tr>
						</thead>
						<tbody>
							{rounds.map((row) => (
								<tr key={row.eventId} className="border-b border-black/5">
									<td className="px-2 py-1.5">
										{predictedVsRealizedRoundCaption(
											row.roundIndex,
											row.eventStartsAt,
										)}
									</td>
									<td className="px-2 py-1.5 text-right tabular-nums">
										{formatPredictedVsRealizedValue(
											row.meanPredictedDifference,
										)}
									</td>
									<td className="px-2 py-1.5 text-right tabular-nums">
										{formatPredictedVsRealizedValue(row.meanRealizedDifference)}
									</td>
									<td className="px-2 py-1.5 text-right tabular-nums">
										{formatPredictedVsRealizedSigned(row.meanError)}
									</td>
									<td className="px-2 py-1.5 text-right tabular-nums">
										{formatPredictedVsRealizedValue(row.meanAbsoluteError)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{bands.length > 0 && (
				<div className="space-y-2">
					<h4 className="text-sm font-semibold text-fg">
						{PREDICTED_VS_REALIZED_LABEL.bandsTitle}
					</h4>
					<div className="overflow-x-auto">
						<table className="w-full min-w-[28rem] border-collapse text-left text-sm">
							<thead>
								<tr className="border-b border-black/10 text-xs text-fg-muted">
									<th className="px-2 py-1.5 font-medium">
										{PREDICTED_VS_REALIZED_LABEL.band}
									</th>
									<th className="px-2 py-1.5 text-right font-medium">
										{PREDICTED_VS_REALIZED_LABEL.matches}
									</th>
									<th className="px-2 py-1.5 text-right font-medium">
										{PREDICTED_VS_REALIZED_LABEL.mae}
									</th>
									<th className="px-2 py-1.5 text-right font-medium">
										{PREDICTED_VS_REALIZED_LABEL.closeMatches}
									</th>
									<th className="px-2 py-1.5 text-right font-medium">
										{PREDICTED_VS_REALIZED_LABEL.favoriteWin}
									</th>
								</tr>
							</thead>
							<tbody>
								{bands.map((row) => (
									<tr key={row.bandId} className="border-b border-black/5">
										<td className="px-2 py-1.5">{row.label}</td>
										<td className="px-2 py-1.5 text-right tabular-nums">
											{formatPredictedVsRealizedCount(row.matches)}
										</td>
										<td className="px-2 py-1.5 text-right tabular-nums">
											{formatPredictedVsRealizedValue(row.meanAbsoluteError)}
										</td>
										<td className="px-2 py-1.5 text-right tabular-nums">
											{formatPredictedVsRealizedRate(row.closeMatchRate)}
										</td>
										<td className="px-2 py-1.5 text-right tabular-nums">
											{bandFavoriteCaption(row.favoriteWinRate)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
}
