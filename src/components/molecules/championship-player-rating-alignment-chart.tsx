import {
	CartesianGrid,
	LabelList,
	ReferenceLine,
	ResponsiveContainer,
	Scatter,
	ScatterChart,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { formatEventRating } from "@/const/event-rating-adjustment";
import {
	formatRatingAlignmentGap,
	formatRatingAlignmentRating,
	PLAYER_RATING_ALIGNMENT_LABEL,
	RATING_ALIGNMENT_CHART,
	type RatingAlignmentChartPoint,
	ratingAlignmentChartDomain,
} from "@/const/player-rating-alignment";

type ChampionshipPlayerRatingAlignmentChartProps = {
	points: readonly RatingAlignmentChartPoint[];
};

type ScatterTooltipPayload = {
	payload?: RatingAlignmentChartPoint;
};

function scatterTooltipContent({
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
		<div className="rounded-md border border-black/10 bg-surface px-2.5 py-2 text-xs shadow-sm">
			<p className="font-medium text-fg">{point.name}</p>
			<p className="text-fg-muted">
				{PLAYER_RATING_ALIGNMENT_LABEL.current}:{" "}
				{formatRatingAlignmentRating(point.currentRating)}
			</p>
			<p className="text-fg-muted">
				{PLAYER_RATING_ALIGNMENT_LABEL.expected}:{" "}
				{formatRatingAlignmentRating(point.expectedRating)}
			</p>
			<p className="text-fg-muted">
				{PLAYER_RATING_ALIGNMENT_LABEL.gap}:{" "}
				{formatRatingAlignmentGap(point.ratingGap)}
			</p>
		</div>
	);
}

function ScatterDot(props: {
	cx?: number;
	cy?: number;
	payload?: RatingAlignmentChartPoint;
}) {
	const { cx, cy, payload } = props;
	if (cx === undefined || cy === undefined || !payload) {
		return null;
	}

	return (
		<circle
			cx={cx}
			cy={cy}
			r={RATING_ALIGNMENT_CHART.dotRadius}
			fill={payload.color}
			stroke="white"
			strokeWidth={1}
		/>
	);
}

export function ChampionshipPlayerRatingAlignmentChart({
	points,
}: ChampionshipPlayerRatingAlignmentChartProps) {
	if (points.length === 0) {
		return (
			<p className="text-sm text-fg-muted">
				{PLAYER_RATING_ALIGNMENT_LABEL.noEvidence}
			</p>
		);
	}

	const domain = ratingAlignmentChartDomain(points);
	const axisDomain: [number, number] = [domain.min, domain.max];

	return (
		<div className="space-y-2">
			<p className="text-xs text-fg-muted">
				{PLAYER_RATING_ALIGNMENT_LABEL.chartHint}
			</p>
			<div className="w-full text-pitch-fg">
				<ResponsiveContainer
					width="100%"
					height={RATING_ALIGNMENT_CHART.height}
				>
					<ScatterChart margin={RATING_ALIGNMENT_CHART.margin}>
						<CartesianGrid
							strokeDasharray="3 3"
							stroke="currentColor"
							opacity={0.15}
						/>
						<XAxis
							type="number"
							dataKey={RATING_ALIGNMENT_CHART.xKey}
							name={PLAYER_RATING_ALIGNMENT_LABEL.current}
							domain={axisDomain}
							tick={{ fontSize: 12 }}
							tickFormatter={(value) => formatEventRating(Number(value))}
						/>
						<YAxis
							type="number"
							dataKey={RATING_ALIGNMENT_CHART.yKey}
							name={PLAYER_RATING_ALIGNMENT_LABEL.expected}
							domain={axisDomain}
							width={RATING_ALIGNMENT_CHART.axisWidth}
							tick={{ fontSize: 12 }}
							tickFormatter={(value) => formatEventRating(Number(value))}
						/>
						<ReferenceLine
							segment={[
								{ x: domain.min, y: domain.min },
								{ x: domain.max, y: domain.max },
							]}
							stroke="currentColor"
							strokeDasharray="4 4"
							opacity={0.45}
						/>
						<Tooltip
							content={scatterTooltipContent}
							cursor={{ strokeDasharray: "3 3" }}
						/>
						<Scatter data={[...points]} shape={ScatterDot}>
							<LabelList
								dataKey={RATING_ALIGNMENT_CHART.nameKey}
								position="top"
								offset={RATING_ALIGNMENT_CHART.labelOffset}
								fontSize={RATING_ALIGNMENT_CHART.labelFontSize}
								fill="currentColor"
							/>
						</Scatter>
					</ScatterChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}
