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
	GOAL_MINUTE_HISTOGRAM_CHART,
	GOAL_TIMELINE_LABEL,
	type GoalMinuteHistogram,
	type GoalMinuteHistogramBar,
} from "@/const/championship-goal-timeline";

type ChampionshipGoalMinuteHistogramChartProps = {
	histogram: GoalMinuteHistogram;
};

type BarTooltipPayload = {
	payload?: GoalMinuteHistogramBar;
};

function histogramTooltipContent({
	active,
	payload,
}: {
	active?: boolean;
	payload?: readonly BarTooltipPayload[];
}) {
	if (!active) {
		return null;
	}

	const bar = payload?.[0]?.payload;
	if (!bar) {
		return null;
	}

	return (
		<div className="rounded-md border border-black/10 bg-surface px-2.5 py-2 text-xs shadow-sm">
			<p className="font-medium tabular-nums text-fg">
				{GOAL_TIMELINE_LABEL.minuteAxis} {bar.label}
			</p>
			<p className="text-fg-muted">
				{GOAL_TIMELINE_LABEL.goalsAxis}: {bar.goals}
			</p>
		</div>
	);
}

function yDomainMax(maxGoals: number): number {
	if (maxGoals <= 0) {
		return 1;
	}

	return maxGoals;
}

export function ChampionshipGoalMinuteHistogramChart({
	histogram,
}: ChampionshipGoalMinuteHistogramChartProps) {
	return (
		<div className="w-full text-pitch-fg">
			<ResponsiveContainer
				width="100%"
				height={GOAL_MINUTE_HISTOGRAM_CHART.height}
			>
				<BarChart
					data={[...histogram.bars]}
					margin={GOAL_MINUTE_HISTOGRAM_CHART.margin}
				>
					<CartesianGrid
						strokeDasharray="3 3"
						stroke="currentColor"
						opacity={0.15}
					/>
					<XAxis
						type="category"
						dataKey={GOAL_MINUTE_HISTOGRAM_CHART.minuteKey}
						name={GOAL_TIMELINE_LABEL.minuteAxis}
						tick={{ fontSize: 12 }}
						interval={0}
						label={{
							value: GOAL_TIMELINE_LABEL.minuteAxis,
							position: "insideBottom",
							offset: -4,
							fontSize: 11,
						}}
					/>
					<YAxis
						type="number"
						allowDecimals={false}
						domain={[0, yDomainMax(histogram.maxGoals)]}
						width={GOAL_MINUTE_HISTOGRAM_CHART.axisWidth}
						tick={{ fontSize: 12 }}
						label={{
							value: GOAL_TIMELINE_LABEL.goalsAxis,
							angle: -90,
							position: "insideLeft",
							fontSize: 11,
						}}
					/>
					<Tooltip content={histogramTooltipContent} />
					<Bar
						dataKey={GOAL_MINUTE_HISTOGRAM_CHART.goalsKey}
						fill={GOAL_MINUTE_HISTOGRAM_CHART.barFill}
						className="text-pitch-fg"
						radius={[2, 2, 0, 0]}
						isAnimationActive={false}
					/>
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
