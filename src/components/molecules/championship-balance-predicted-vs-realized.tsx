import {
	BALANCE_INDEX_LABEL,
	BALANCE_VS_PREDICTED,
	type EventBalanceIndex,
	balanceVsPredictedLabel,
	formatBalanceIndexDelta,
	formatBalanceIndexMean,
} from "@/const/championship-event-balance-index";

type ChampionshipBalancePredictedVsRealizedProps = {
	row: EventBalanceIndex;
};

export function ChampionshipBalancePredictedVsRealized({
	row,
}: ChampionshipBalancePredictedVsRealizedProps) {
	return (
		<div className="space-y-2 rounded-lg border border-black/10 p-3">
			<p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
				{BALANCE_INDEX_LABEL.predictedVsRealized}
			</p>
			<div className="space-y-1 text-sm">
				<div className="flex justify-between gap-3">
					<span className="text-fg-muted">{BALANCE_INDEX_LABEL.predictedMean}</span>
					<span className="tabular-nums font-medium text-fg">
						{formatBalanceIndexMean(row.predictedDifferenceMean)}
					</span>
				</div>
				<div className="flex justify-between gap-3">
					<span className="text-fg-muted">{BALANCE_INDEX_LABEL.realizedMean}</span>
					<span className="tabular-nums font-medium text-fg">
						{formatBalanceIndexMean(row.realizedDifferenceMean)}
					</span>
				</div>
				<div className="flex justify-between gap-3">
					<span className="text-fg-muted">{BALANCE_INDEX_LABEL.delta}</span>
					<span className="tabular-nums font-medium text-fg">
						{formatBalanceIndexDelta(row.predictedVsRealizedDelta)}
					</span>
				</div>
			</div>
			{row.vsPredicted !== BALANCE_VS_PREDICTED.unavailable && (
				<p className="text-sm text-fg">{balanceVsPredictedLabel(row.vsPredicted)}</p>
			)}
			{row.vsPredicted === BALANCE_VS_PREDICTED.unavailable && (
				<p className="text-sm text-fg-muted">
					{balanceVsPredictedLabel(row.vsPredicted)}
				</p>
			)}
		</div>
	);
}
