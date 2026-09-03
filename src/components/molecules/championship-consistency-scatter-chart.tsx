import {
	CartesianGrid,
	LabelList,
	ResponsiveContainer,
	Scatter,
	ScatterChart,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	CONSISTENCY_CHART,
	CONSISTENCY_LABEL,
	type ConsistencyMetric,
	type ConsistencyPoint,
	consistencyDomain,
	consistencyMetricCaption,
} from "@/const/championship-consistency";

type ChampionshipConsistencyScatterChartProps = {
	points: readonly ConsistencyPoint[];
	metric: ConsistencyMetric;
};

type ScatterTooltipPayload = {
	payload?: ConsistencyPoint;
};

function scatterTooltipForMetric(metric: ConsistencyMetric) {
	return function scatterTooltipContent({
		active,
		payload,
	}: {
		active?: boolean;
		payload?: readonly ScatterTooltipPayload[];
	}) {
		if (!active) {
			return null;
		}

		const point = payload?.[0]?.payload;
		if (!point) {
			return null;
		}

		return (
			<div className="max-w-56 rounded-md border border-black/10 bg-surface px-2.5 py-2 text-xs shadow-sm">
				<p className="font-medium text-fg">{point.name}</p>
				<p className="text-fg-muted">
					{CONSISTENCY_LABEL.filter}: {consistencyMetricCaption(metric)}
				</p>
				<p className="text-fg-muted">
					{CONSISTENCY_LABEL.volume}: {point.volume}
				</p>
				<p className="text-fg-muted">
					{CONSISTENCY_LABEL.deviation}: {point.deviation.toFixed(2)}
				</p>
				<p className="text-fg-muted">
					{CONSISTENCY_LABEL.mean}: {point.mean.toFixed(2)}
				</p>
				<p className="text-fg-muted">
					{CONSISTENCY_LABEL.presences}: {point.presences}
				</p>
			</div>
		);
	};
}

function ScatterDot(props: {
	cx?: number;
	cy?: number;
	payload?: ConsistencyPoint;
}) {
	const { cx, cy, payload } = props;
	if (cx === undefined || cy === undefined || !payload) {
		return null;
	}

	return (
		<circle
			cx={cx}
			cy={cy}
			r={CONSISTENCY_CHART.dotRadius}
			fill={payload.color}
			stroke="white"
			strokeWidth={1}
		/>
	);
}

export function ChampionshipConsistencyScatterChart({
	points,
	metric,
}: ChampionshipConsistencyScatterChartProps) {
	const xDomain = consistencyDomain(points, "volume");
	const yDomain = consistencyDomain(points, "deviation");

	return (
		<div className="w-full text-pitch-fg">
			<ResponsiveContainer width="100%" height={CONSISTENCY_CHART.height}>
				<ScatterChart margin={CONSISTENCY_CHART.margin}>
					<CartesianGrid
						strokeDasharray="3 3"
						stroke="currentColor"
						opacity={0.15}
					/>
					<XAxis
						type="number"
						dataKey={CONSISTENCY_CHART.volumeKey}
						name={CONSISTENCY_LABEL.volume}
						domain={[xDomain.min, xDomain.max]}
						allowDecimals={false}
						tick={{ fontSize: 12 }}
						label={{
							value: CONSISTENCY_LABEL.volume,
							position: "insideBottom",
							offset: -4,
							fontSize: 11,
						}}
					/>
					<YAxis
						type="number"
						dataKey={CONSISTENCY_CHART.deviationKey}
						name={CONSISTENCY_LABEL.deviation}
						domain={[yDomain.min, yDomain.max]}
						width={CONSISTENCY_CHART.axisWidth}
						tick={{ fontSize: 12 }}
						label={{
							value: CONSISTENCY_LABEL.deviation,
							angle: -90,
							position: "insideLeft",
							fontSize: 11,
						}}
					/>
					<Tooltip content={scatterTooltipForMetric(metric)} />
					<Scatter data={[...points]} shape={ScatterDot}>
						<LabelList
							dataKey={CONSISTENCY_CHART.nameKey}
							position="top"
							offset={CONSISTENCY_CHART.labelOffset}
							fontSize={CONSISTENCY_CHART.labelFontSize}
						/>
					</Scatter>
				</ScatterChart>
			</ResponsiveContainer>
		</div>
	);
}
