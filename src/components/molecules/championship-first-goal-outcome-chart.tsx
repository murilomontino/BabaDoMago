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
	FIRST_GOAL_OUTCOME_CHART,
	type FirstGoalOutcomeBar,
	GOAL_TIMELINE_LABEL,
} from "@/const/championship-goal-timeline";

type ChampionshipFirstGoalOutcomeChartProps = {
	bars: readonly FirstGoalOutcomeBar[];
};

type BarTooltipPayload = {
	payload?: FirstGoalOutcomeBar;
};

function outcomeTooltipContent({
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
			<p className="font-medium text-fg">{bar.label}</p>
			<p className="text-fg-muted">
				{GOAL_TIMELINE_LABEL.matchesAxis}: {bar.matches}
			</p>
		</div>
	);
}

function yDomainMax(bars: readonly FirstGoalOutcomeBar[]): number {
	const max = bars.reduce((best, bar) => {
		if (bar.matches > best) {
			return bar.matches;
		}

		return best;
	}, 0);
	if (max <= 0) {
		return 1;
	}

	return max;
}

export function ChampionshipFirstGoalOutcomeChart({
	bars,
}: ChampionshipFirstGoalOutcomeChartProps) {
	return (
		<div className="w-full text-pitch-fg">
			<ResponsiveContainer
				width="100%"
				height={FIRST_GOAL_OUTCOME_CHART.height}
			>
				<BarChart data={[...bars]} margin={FIRST_GOAL_OUTCOME_CHART.margin}>
					<CartesianGrid
						strokeDasharray="3 3"
						stroke="currentColor"
						opacity={0.15}
					/>
					<XAxis
						type="category"
						dataKey={FIRST_GOAL_OUTCOME_CHART.labelKey}
						tick={{ fontSize: 11 }}
						interval={0}
						angle={-20}
						textAnchor="end"
						height={56}
					/>
					<YAxis
						type="number"
						allowDecimals={false}
						domain={[0, yDomainMax(bars)]}
						width={FIRST_GOAL_OUTCOME_CHART.axisWidth}
						tick={{ fontSize: 12 }}
						label={{
							value: GOAL_TIMELINE_LABEL.matchesAxis,
							angle: -90,
							position: "insideLeft",
							fontSize: 11,
						}}
					/>
					<Tooltip content={outcomeTooltipContent} />
					<Bar
						dataKey={FIRST_GOAL_OUTCOME_CHART.matchesKey}
						fill={FIRST_GOAL_OUTCOME_CHART.barFill}
						className="text-pitch-fg"
						radius={[2, 2, 0, 0]}
						isAnimationActive={false}
					/>
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
