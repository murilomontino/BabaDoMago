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
	TREND_LINE_CHART,
	type TrendLineChartPoint,
} from "@/const/championship-trend-line-chart";

type ChampionshipTrendLineChartProps = {
	points: readonly TrendLineChartPoint[];
	caption: string;
	formatValue: (value: number) => string;
};

type ChartTooltipPayload = {
	payload?: TrendLineChartPoint;
};

function trendTooltipContent({
	active,
	payload,
	caption,
	formatValue,
}: {
	active?: boolean;
	payload?: readonly ChartTooltipPayload[];
	caption: string;
	formatValue: (value: number) => string;
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
				{caption}: {formatValue(point.value)}
			</p>
		</div>
	);
}

export function ChampionshipTrendLineChart({
	points,
	caption,
	formatValue,
}: ChampionshipTrendLineChartProps) {
	return (
		<div className="w-full text-fg">
			<ResponsiveContainer width="100%" height={TREND_LINE_CHART.height}>
				<LineChart data={[...points]} margin={TREND_LINE_CHART.margin}>
					<CartesianGrid
						strokeDasharray="3 3"
						stroke="currentColor"
						opacity={0.15}
						className="text-pitch-fg"
					/>
					<XAxis
						dataKey={TREND_LINE_CHART.indexKey}
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
						width={TREND_LINE_CHART.axisWidth}
						tick={{ fontSize: 12 }}
						tickFormatter={formatValue}
					/>
					<Tooltip
						content={(props) =>
							trendTooltipContent({
								active: props.active,
								payload: props.payload as
									| readonly ChartTooltipPayload[]
									| undefined,
								caption,
								formatValue,
							})
						}
					/>
					<Line
						type="monotone"
						dataKey={TREND_LINE_CHART.valueKey}
						stroke={TREND_LINE_CHART.stroke}
						strokeWidth={2}
						dot={{ r: TREND_LINE_CHART.dotRadius, fill: TREND_LINE_CHART.stroke }}
						isAnimationActive={false}
					>
						<LabelList
							dataKey={TREND_LINE_CHART.labelKey}
							position="top"
							offset={TREND_LINE_CHART.labelOffset}
							fontSize={TREND_LINE_CHART.labelFontSize}
							fill="currentColor"
							className="tabular-nums text-fg"
						/>
					</Line>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}
