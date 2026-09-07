import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	BALANCE_INDEX_LABEL,
	type BalanceGoalDiffBucketRow,
} from "@/const/championship-event-balance-index";

const DISTRIBUTION_CHART = {
	height: 220,
	margin: { top: 8, right: 16, bottom: 8, left: 8 },
	axisWidth: 36,
	barKey: "count",
	bucketKey: "bucket",
} as const;

type ChampionshipGoalDifferenceDistributionProps = {
	rows: readonly BalanceGoalDiffBucketRow[];
};

type BarTooltipPayload = {
	payload?: BalanceGoalDiffBucketRow;
};

function distributionTooltipContent({
	active,
	payload,
}: {
	active?: boolean;
	payload?: readonly BarTooltipPayload[];
}) {
	if (!active) {
		return null;
	}

	const row = payload?.[0]?.payload;
	if (!row) {
		return null;
	}

	return (
		<div className="rounded-md border border-black/10 bg-surface px-2.5 py-2 text-xs shadow-sm">
			<p className="font-medium tabular-nums text-fg">
				{BALANCE_INDEX_LABEL.distribution} {row.bucket}
			</p>
			<p className="text-fg-muted">
				{BALANCE_INDEX_LABEL.matches}: {row.count}
			</p>
		</div>
	);
}

function yDomainMax(rows: readonly BalanceGoalDiffBucketRow[]): number {
	const max = Math.max(0, ...rows.map((row) => row.count));
	if (max <= 0) {
		return 1;
	}

	return max;
}

export function ChampionshipGoalDifferenceDistribution({
	rows,
}: ChampionshipGoalDifferenceDistributionProps) {
	return (
		<div className="w-full text-pitch-fg">
			<ResponsiveContainer width="100%" height={DISTRIBUTION_CHART.height}>
				<BarChart
					layout="vertical"
					data={[...rows]}
					margin={DISTRIBUTION_CHART.margin}
				>
					<CartesianGrid
						strokeDasharray="3 3"
						stroke="currentColor"
						opacity={0.15}
					/>
					<XAxis
						type="number"
						allowDecimals={false}
						domain={[0, yDomainMax(rows)]}
						tick={{ fontSize: 12 }}
					/>
					<YAxis
						type="category"
						dataKey={DISTRIBUTION_CHART.bucketKey}
						width={DISTRIBUTION_CHART.axisWidth}
						tick={{ fontSize: 12 }}
					/>
					<Tooltip
						content={(props) =>
							distributionTooltipContent({
								active: props.active,
								payload: props.payload as
									| readonly BarTooltipPayload[]
									| undefined,
							})
						}
					/>
					<Bar
						dataKey={DISTRIBUTION_CHART.barKey}
						fill="#0f766e"
						radius={[0, 4, 4, 0]}
						isAnimationActive={false}
					/>
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
