import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { formatEventStartsAt } from "@/const/championship-event";
import { formatEventRating } from "@/const/event-rating-adjustment";
import {
	PLAYER_PROJECTION_HISTORY_CHART,
	PLAYER_PROJECTION_HISTORY_LABEL,
	type PlayerProjectionHistoryChartPoint,
	playerProjectionHistoryChartTickLabel,
} from "@/const/player-projection-history";

type PlayerProjectionHistoryChartProps = {
	points: readonly PlayerProjectionHistoryChartPoint[];
	ceiling: number;
};

type ChartTooltipPayload = {
	payload?: PlayerProjectionHistoryChartPoint;
};

function chartTooltipLabel(
	_label: unknown,
	payload: readonly ChartTooltipPayload[] | undefined,
): string {
	const startsAt = payload?.[0]?.payload?.startsAt;
	if (!startsAt) {
		return "";
	}

	return formatEventStartsAt(startsAt).date;
}

function chartTooltipValue(value: unknown): string {
	if (value === null || value === undefined) {
		return "—";
	}

	return formatEventRating(Number(value));
}

export function PlayerProjectionHistoryChart({
	points,
	ceiling,
}: PlayerProjectionHistoryChartProps) {
	if (points.length === 0) {
		return null;
	}

	return (
		<div className="w-full text-pitch-fg">
			<ResponsiveContainer
				width="100%"
				height={PLAYER_PROJECTION_HISTORY_CHART.height}
			>
				<LineChart
					data={[...points]}
					margin={{ top: 24, right: 16, bottom: 0, left: 0 }}
				>
					<CartesianGrid strokeDasharray="3 3" opacity={0.3} />
					<XAxis
						dataKey={PLAYER_PROJECTION_HISTORY_CHART.indexKey}
						tick={{ fontSize: 12 }}
						interval={0}
						tickFormatter={(value) =>
							playerProjectionHistoryChartTickLabel(points, Number(value))
						}
					/>
					<YAxis domain={[0, ceiling]} tick={{ fontSize: 12 }} width={36} />
					<Tooltip
						formatter={(value) => chartTooltipValue(value)}
						labelFormatter={chartTooltipLabel}
					/>
					<Legend />
					<Line
						type="linear"
						dataKey={PLAYER_PROJECTION_HISTORY_CHART.actualKey}
						name={PLAYER_PROJECTION_HISTORY_LABEL.actualSeries}
						stroke={PLAYER_PROJECTION_HISTORY_CHART.actualStroke}
						dot
						isAnimationActive={false}
					/>
					<Line
						type="linear"
						dataKey={PLAYER_PROJECTION_HISTORY_CHART.projectedKey}
						name={PLAYER_PROJECTION_HISTORY_LABEL.projectedSeries}
						stroke={PLAYER_PROJECTION_HISTORY_CHART.projectedStroke}
						dot
						connectNulls={false}
						isAnimationActive={false}
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}
