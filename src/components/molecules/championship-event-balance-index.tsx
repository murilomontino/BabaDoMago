import {
	BALANCE_INDEX_LABEL,
	balanceIndexClassificationLabel,
	balanceIndexSummaryMessage,
	type EventBalanceIndex,
	formatBalanceIndexMean,
	formatBalanceIndexScore,
	formatBalanceTightRate,
	formatFavoriteWon,
} from "@/const/championship-event-balance-index";

type ChampionshipEventBalanceIndexProps = {
	row: EventBalanceIndex | null;
	emptyLabel: string;
};

function classificationToneClass(score: number): string {
	if (score >= 75) {
		return "text-pitch-fg";
	}

	if (score >= 40) {
		return "text-fg";
	}

	return "text-danger-fg";
}

function BalanceBar({ value }: { value: number }) {
	const width = Math.min(100, Math.max(0, value));

	return (
		<div
			className="h-2.5 w-full overflow-hidden rounded-full bg-surface-muted"
			aria-hidden
		>
			<div
				className="h-full rounded-full bg-pitch"
				style={{ width: `${width}%` }}
			/>
		</div>
	);
}

function CompositionRow({
	label,
	value,
}: {
	label: string;
	value: string;
}) {
	return (
		<div className="flex items-baseline justify-between gap-3 text-sm">
			<span className="text-fg-muted">{label}</span>
			<span className="tabular-nums font-medium text-fg">{value}</span>
		</div>
	);
}

function predictedScoreLabel(row: EventBalanceIndex): string {
	if (row.predictedScore === null) {
		return "—";
	}

	return `${formatBalanceIndexScore(row.predictedScore)} / 100`;
}

export function ChampionshipEventBalanceIndex({
	row,
	emptyLabel,
}: ChampionshipEventBalanceIndexProps) {
	if (!row) {
		return <p className="text-sm text-fg-muted">{emptyLabel}</p>;
	}

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<p
					className={`text-4xl font-semibold tabular-nums ${classificationToneClass(row.balanceIndex)}`}
				>
					{formatBalanceIndexScore(row.balanceIndex)}
					<span className="text-lg font-medium text-fg-muted">/100</span>
				</p>
				<p
					className={`text-sm font-semibold ${classificationToneClass(row.balanceIndex)}`}
				>
					{balanceIndexClassificationLabel(row.classification)}
				</p>
				<BalanceBar value={row.balanceIndex} />
				{row.smallSample && (
					<p className="text-xs text-fg-muted">
						{BALANCE_INDEX_LABEL.smallSample}.{" "}
						{BALANCE_INDEX_LABEL.smallSampleHint}
					</p>
				)}
				{row.incompletePredicted && (
					<p className="text-xs text-fg-muted">{BALANCE_INDEX_LABEL.incomplete}</p>
				)}
			</div>

			<div className="space-y-2 rounded-lg border border-black/10 bg-surface-muted/40 p-3">
				<p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
					{BALANCE_INDEX_LABEL.composition}
				</p>
				<CompositionRow
					label={BALANCE_INDEX_LABEL.predicted}
					value={predictedScoreLabel(row)}
				/>
				<CompositionRow
					label={BALANCE_INDEX_LABEL.realized}
					value={`${formatBalanceIndexScore(row.realizedScore)} / 100`}
				/>
				<CompositionRow
					label={BALANCE_INDEX_LABEL.tightGames}
					value={formatBalanceTightRate(row.tightGameRate)}
				/>
				<CompositionRow
					label={BALANCE_INDEX_LABEL.favorite}
					value={formatFavoriteWon(row.favoriteWon)}
				/>
				<CompositionRow
					label={BALANCE_INDEX_LABEL.matches}
					value={formatBalanceIndexScore(row.matches)}
				/>
			</div>

			<div className="space-y-1 text-sm text-fg-muted">
				<p>
					{BALANCE_INDEX_LABEL.predictedMean}:{" "}
					<span className="tabular-nums text-fg">
						{formatBalanceIndexMean(row.predictedDifferenceMean)}
					</span>
				</p>
				<p>
					{BALANCE_INDEX_LABEL.realizedMean}:{" "}
					<span className="tabular-nums text-fg">
						{formatBalanceIndexMean(row.realizedDifferenceMean)}
					</span>
				</p>
			</div>

			<p className="text-sm text-fg">{balanceIndexSummaryMessage(row)}</p>
		</div>
	);
}
