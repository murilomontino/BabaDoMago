import {
	CartesianGrid,
	LabelList,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { formatEventStartsAt } from "@/const/championship-event";
import {
	EVENT_HEALTH_CHART,
	type EventHealthChartPoint,
	type EventHealthMetric,
	eventHealthMetricCaption,
	formatEventHealthChartValue,
} from "@/const/championship-event-health";

type ChampionshipEventHealthChartProps = {
	points: readonly EventHealthChartPoint[];
	metric: EventHealthMetric;
};

type ChartTooltipPayload = {
	payload?: EventHealthChartPoint;
};

function healthTooltipContent({
	active,
	payload,
	metric,
}: {
	active?: boolean;
	payload?: readonly ChartTooltipPayload[];
	metric: EventHealthMetric;
}) {
	if (!active) {
		return null;
	}

	const point = payload?.[0]?.payload;
	if (!point) {
		return null;
	}

	return (
		<div className="rounded-md border border-black/10 bg-surface px-2.5 py-2 text-xs shadow-sm">
			<p className="font-medium text-fg">
				{formatEventStartsAt(point.startsAt).date}
			</p>
			<p className="text-fg-muted">
				{eventHealthMetricCaption(metric)}:{" "}
				{formatEventHealthChartValue(metric, point.value)}
			</p>
		</div>
	);
}

export function ChampionshipEventHealthChart({
	points,
	metric,
}: ChampionshipEventHealthChartProps) {
	return (
		<div className="w-full text-fg">
			<ResponsiveContainer width="100%" height={EVENT_HEALTH_CHART.height}>
				<LineChart data={[...points]} margin={EVENT_HEALTH_CHART.margin}>
					<CartesianGrid
						strokeDasharray="3 3"
						stroke="currentColor"
						opacity={0.15}
						className="text-pitch-fg"
					/>
					<XAxis
						dataKey={EVENT_HEALTH_CHART.indexKey}
						tickFormatter={(x: number) => {
							const row = points[x];
							if (!row) {
								return "";
							}

							return formatEventStartsAt(row.startsAt).date;
						}}
						tick={{ fontSize: 12 }}
					/>
					<YAxis
						width={EVENT_HEALTH_CHART.axisWidth}
						tick={{ fontSize: 12 }}
						tickFormatter={(value: number) =>
							formatEventHealthChartValue(metric, value)
						}
					/>
					<Tooltip
						content={(props) =>
							healthTooltipContent({
								active: props.active,
								payload: props.payload as
									| readonly ChartTooltipPayload[]
									| undefined,
								metric,
							})
						}
					/>
					<Line
						type="monotone"
						dataKey={EVENT_HEALTH_CHART.valueKey}
						stroke="#0f766e"
						strokeWidth={2}
						dot={{ r: EVENT_HEALTH_CHART.dotRadius, fill: "#0f766e" }}
						isAnimationActive={false}
					>
						<LabelList
							dataKey={EVENT_HEALTH_CHART.labelKey}
							position="top"
							offset={EVENT_HEALTH_CHART.labelOffset}
							fontSize={EVENT_HEALTH_CHART.labelFontSize}
							fill="currentColor"
							className="tabular-nums text-fg"
						/>
					</Line>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}
