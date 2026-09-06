import {
	CartesianGrid,
	LabelList,
	ReferenceArea,
	ReferenceLine,
	ResponsiveContainer,
	Scatter,
	ScatterChart,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	formatPerformanceMapCount,
	formatPerformanceMapDelta,
	formatPerformanceMapGap,
	formatPerformanceMapRate,
	formatPerformanceMapRating,
	PERFORMANCE_MAP_CHART,
	PERFORMANCE_MAP_LABEL,
	type PerformanceMapPoint,
	performanceMapDomainX,
	performanceMapDotRadius,
	performanceMapStateLabel,
} from "@/const/championship-performance-map";
import { EVENT_RATING_ADJUSTMENT } from "@/const/event-rating-adjustment";

type ChampionshipPerformanceMapChartProps = {
	points: readonly PerformanceMapPoint[];
	median: number | null;
	showNames: boolean;
};

type ScatterTooltipPayload = {
	payload?: PerformanceMapPoint;
};

function PerformanceMapTooltip({
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
				{PERFORMANCE_MAP_LABEL.rating}:{" "}
				{formatPerformanceMapRating(point.rating)}
			</p>
			<p className="text-fg-muted">
				{PERFORMANCE_MAP_LABEL.rate}: {formatPerformanceMapRate(point.rate)}
			</p>
			<p className="text-fg-muted">
				{PERFORMANCE_MAP_LABEL.matches}:{" "}
				{formatPerformanceMapCount(point.matches)}
			</p>
			<p className="text-fg-muted">
				{PERFORMANCE_MAP_LABEL.wins}/{PERFORMANCE_MAP_LABEL.draws}/
				{PERFORMANCE_MAP_LABEL.losses}: {formatPerformanceMapCount(point.wins)}/
				{formatPerformanceMapCount(point.draws)}/
				{formatPerformanceMapCount(point.losses)}
			</p>
			<p className="text-fg-muted">
				{PERFORMANCE_MAP_LABEL.deltaRating}:{" "}
				{formatPerformanceMapDelta(point.deltaRating)}
			</p>
			<p className="text-fg-muted">
				{PERFORMANCE_MAP_LABEL.gapHint}: {formatPerformanceMapGap(point.gap)}
			</p>
			<p className="text-fg-muted">
				{PERFORMANCE_MAP_LABEL.state}: {performanceMapStateLabel(point.state)}
			</p>
		</div>
	);
}

function ScatterDot(props: {
	cx?: number;
	cy?: number;
	payload?: PerformanceMapPoint;
}) {
	const { cx, cy, payload } = props;
	if (cx === undefined || cy === undefined || !payload) {
		return null;
	}

	return (
		<circle
			cx={cx}
			cy={cy}
			r={performanceMapDotRadius(payload.matches)}
			fill={payload.color}
			stroke="white"
			strokeWidth={1}
			opacity={0.9}
		/>
	);
}

export function ChampionshipPerformanceMapChart({
	points,
	median,
	showNames,
}: ChampionshipPerformanceMapChartProps) {
	const xDomain = performanceMapDomainX(points, median);

	return (
		<div className="w-full text-pitch-fg">
			<ResponsiveContainer width="100%" height={PERFORMANCE_MAP_CHART.height}>
				<ScatterChart margin={PERFORMANCE_MAP_CHART.margin}>
					<CartesianGrid
						strokeDasharray="3 3"
						stroke="currentColor"
						opacity={0.15}
					/>
					<ReferenceArea
						y1={EVENT_RATING_ADJUSTMENT.downThreshold}
						y2={EVENT_RATING_ADJUSTMENT.upThreshold}
						fill="currentColor"
						fillOpacity={PERFORMANCE_MAP_CHART.deadZoneFillOpacity}
						ifOverflow="extendDomain"
					/>
					<ReferenceLine
						y={EVENT_RATING_ADJUSTMENT.upThreshold}
						stroke="currentColor"
						strokeOpacity={0.35}
						strokeDasharray="4 4"
					/>
					<ReferenceLine
						y={EVENT_RATING_ADJUSTMENT.downThreshold}
						stroke="currentColor"
						strokeOpacity={0.35}
						strokeDasharray="4 4"
					/>
					{median !== null && (
						<ReferenceLine
							x={median}
							stroke="currentColor"
							strokeOpacity={0.45}
							label={{
								value: PERFORMANCE_MAP_LABEL.medianLegend,
								position: "insideTopRight",
								fontSize: 10,
								fill: "currentColor",
							}}
						/>
					)}
					<XAxis
						type="number"
						dataKey={PERFORMANCE_MAP_CHART.ratingKey}
						name={PERFORMANCE_MAP_LABEL.rating}
						domain={[xDomain.min, xDomain.max]}
						tick={{ fontSize: 12 }}
						label={{
							value: PERFORMANCE_MAP_LABEL.rating,
							position: "insideBottom",
							offset: -4,
							fontSize: 11,
						}}
					/>
					<YAxis
						type="number"
						dataKey={PERFORMANCE_MAP_CHART.rateKey}
						name={PERFORMANCE_MAP_LABEL.rate}
						domain={[PERFORMANCE_MAP_CHART.yMin, PERFORMANCE_MAP_CHART.yMax]}
						width={PERFORMANCE_MAP_CHART.axisWidth}
						tick={{ fontSize: 12 }}
						tickFormatter={(value: number) => formatPerformanceMapRate(value)}
						label={{
							value: PERFORMANCE_MAP_LABEL.rate,
							angle: -90,
							position: "insideLeft",
							fontSize: 11,
						}}
					/>
					<Tooltip content={PerformanceMapTooltip} />
					<Scatter data={[...points]} shape={ScatterDot}>
						{showNames && (
							<LabelList
								dataKey={PERFORMANCE_MAP_CHART.nameKey}
								position="top"
								offset={PERFORMANCE_MAP_CHART.labelOffset}
								fontSize={PERFORMANCE_MAP_CHART.labelFontSize}
							/>
						)}
					</Scatter>
				</ScatterChart>
			</ResponsiveContainer>
		</div>
	);
}
