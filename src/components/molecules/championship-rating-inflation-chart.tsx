import {
	CartesianGrid,
	LabelList,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { formatEventStartsAt } from "@/const/championship-event";
import {
	formatRatingInflationValue,
	RATING_INFLATION_CHART,
	RATING_INFLATION_LABEL,
	type RatingInflationChartPoint,
} from "@/const/championship-rating-inflation";

type ChampionshipRatingInflationChartProps = {
	points: readonly RatingInflationChartPoint[];
};

type ChartTooltipPayload = {
	payload?: RatingInflationChartPoint;
};

function inflationTooltipContent({
	active,
	payload,
}: {
	active?: boolean;
	payload?: readonly ChartTooltipPayload[];
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
				{RATING_INFLATION_LABEL.average}:{" "}
				{formatRatingInflationValue(point.averageRating)}
			</p>
			<p className="text-fg-muted">
				{RATING_INFLATION_LABEL.ceiling}:{" "}
				{formatRatingInflationValue(point.ceiling)}
			</p>
			<p className="text-fg-muted">
				{RATING_INFLATION_LABEL.floor}:{" "}
				{formatRatingInflationValue(point.floor)}
			</p>
		</div>
	);
}

export function ChampionshipRatingInflationChart({
	points,
}: ChampionshipRatingInflationChartProps) {
	return (
		<div className="w-full text-fg">
			<ResponsiveContainer width="100%" height={RATING_INFLATION_CHART.height}>
				<LineChart data={[...points]} margin={RATING_INFLATION_CHART.margin}>
					<CartesianGrid
						strokeDasharray="3 3"
						stroke="currentColor"
						opacity={0.15}
						className="text-pitch-fg"
					/>
					<XAxis
						dataKey={RATING_INFLATION_CHART.indexKey}
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
						width={RATING_INFLATION_CHART.axisWidth}
						tick={{ fontSize: 12 }}
						tickFormatter={formatRatingInflationValue}
					/>
					<Tooltip
						content={(props) =>
							inflationTooltipContent({
								active: props.active,
								payload: props.payload as
									| readonly ChartTooltipPayload[]
									| undefined,
							})
						}
					/>
					<Legend />
					<Line
						type="monotone"
						name={RATING_INFLATION_LABEL.average}
						dataKey={RATING_INFLATION_CHART.averageKey}
						stroke={RATING_INFLATION_CHART.averageStroke}
						strokeWidth={2}
						dot={{
							r: RATING_INFLATION_CHART.dotRadius,
							fill: RATING_INFLATION_CHART.averageStroke,
						}}
						isAnimationActive={false}
					>
						<LabelList
							dataKey={RATING_INFLATION_CHART.averageLabelKey}
							position="top"
							offset={RATING_INFLATION_CHART.labelOffset}
							fontSize={RATING_INFLATION_CHART.labelFontSize}
							fill="currentColor"
							className="tabular-nums text-fg"
						/>
					</Line>
					<Line
						type="monotone"
						name={RATING_INFLATION_LABEL.floor}
						dataKey={RATING_INFLATION_CHART.floorKey}
						stroke={RATING_INFLATION_CHART.floorStroke}
						strokeWidth={2}
						strokeDasharray="6 4"
						dot={{
							r: RATING_INFLATION_CHART.dotRadius,
							fill: RATING_INFLATION_CHART.floorStroke,
						}}
						isAnimationActive={false}
					>
						<LabelList
							dataKey={RATING_INFLATION_CHART.floorLabelKey}
							position="bottom"
							offset={RATING_INFLATION_CHART.labelOffset}
							fontSize={RATING_INFLATION_CHART.labelFontSize}
							fill="currentColor"
							className="tabular-nums text-fg"
						/>
					</Line>
					<Line
						type="monotone"
						name={RATING_INFLATION_LABEL.ceiling}
						dataKey={RATING_INFLATION_CHART.ceilingKey}
						stroke={RATING_INFLATION_CHART.ceilingStroke}
						strokeWidth={2}
						strokeDasharray="6 4"
						dot={{
							r: RATING_INFLATION_CHART.dotRadius,
							fill: RATING_INFLATION_CHART.ceilingStroke,
						}}
						isAnimationActive={false}
					>
						<LabelList
							dataKey={RATING_INFLATION_CHART.ceilingLabelKey}
							position="bottom"
							offset={RATING_INFLATION_CHART.labelOffset}
							fontSize={RATING_INFLATION_CHART.labelFontSize}
							fill="currentColor"
							className="tabular-nums text-fg"
						/>
					</Line>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}
