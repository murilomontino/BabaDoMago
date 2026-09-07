import {
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	PERFORMANCE_MAP_LABEL,
	PERFORMANCE_MAP_PATH_CHART,
	type PerformanceMapProjectPathStep,
} from "@/const/championship-performance-map";
import { formatEventRating } from "@/const/event-rating-adjustment";

type PlayerProjectionStablePathChartProps = {
	steps: readonly PerformanceMapProjectPathStep[];
	ceiling: number;
};

export function PlayerProjectionStablePathChart({
	steps,
	ceiling,
}: PlayerProjectionStablePathChartProps) {
	if (steps.length === 0) {
		return null;
	}

	return (
		<div className="w-full text-pitch-fg">
			<ResponsiveContainer
				width="100%"
				height={PERFORMANCE_MAP_PATH_CHART.height}
			>
				<LineChart
					data={[...steps]}
					margin={{ top: 16, right: 16, bottom: 0, left: 0 }}
				>
					<XAxis
						dataKey={PERFORMANCE_MAP_PATH_CHART.indexKey}
						tick={{ fontSize: 12 }}
						interval={0}
						tickFormatter={(value) => String(value)}
					/>
					<YAxis domain={[0, ceiling]} tick={{ fontSize: 12 }} width={36} />
					<Tooltip
						formatter={(value) => formatEventRating(Number(value))}
						labelFormatter={(label) =>
							`${PERFORMANCE_MAP_LABEL.pathRound} ${String(label)}`
						}
					/>
					<Line
						type="linear"
						dataKey={PERFORMANCE_MAP_PATH_CHART.ratingKey}
						name={PERFORMANCE_MAP_LABEL.pathRating}
						stroke={PERFORMANCE_MAP_PATH_CHART.stroke}
						dot
						isAnimationActive={false}
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}
