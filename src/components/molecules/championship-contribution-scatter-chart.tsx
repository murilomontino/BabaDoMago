import { useNavigate } from "@tanstack/react-router";
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
	CONTRIBUTION_CHART,
	CONTRIBUTION_LABEL,
	CONTRIBUTION_METRIC,
	type ContributionMetric,
	contributionBubbleRadius,
	contributionMetricCaption,
	contributionMetricDomain,
	contributionWinRateDomain,
	formatContributionCount,
	formatContributionDelta,
	formatContributionMetricValue,
	formatContributionPercent,
	formatContributionPerGame,
	formatContributionWinRate,
	type PlayerContributionPoint,
} from "@/const/championship-contribution";
import { formatEventRating } from "@/const/event-rating-adjustment";
import { ROUTES } from "@/const/routes";

type ChampionshipContributionScatterChartProps = {
	points: readonly PlayerContributionPoint[];
	metric: ContributionMetric;
};

type ScatterTooltipPayload = {
	payload?: PlayerContributionPoint;
};

function MetricTooltipRow({
	label,
	value,
	emphasized,
}: {
	label: string;
	value: string;
	emphasized?: boolean;
}) {
	if (emphasized) {
		return (
			<p className="font-medium text-fg">
				{label} {value}
			</p>
		);
	}

	return (
		<p className="text-fg-muted">
			{label} {value}
		</p>
	);
}

function scatterTooltipForMetric(metric: ContributionMetric) {
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
				<MetricTooltipRow
					label={CONTRIBUTION_LABEL.winRate}
					value={formatContributionWinRate(point.winRate)}
					emphasized={false}
				/>
				<MetricTooltipRow
					label={contributionMetricCaption(metric)}
					value={formatContributionMetricValue(metric, point.selectedMetric)}
					emphasized
				/>
				{metric !== CONTRIBUTION_METRIC.goalsPerGame && (
					<MetricTooltipRow
						label={CONTRIBUTION_LABEL.goalsPerGame}
						value={formatContributionPerGame(point.goalsPerGame)}
					/>
				)}
				{metric !== CONTRIBUTION_METRIC.assistsPerGame && (
					<MetricTooltipRow
						label={CONTRIBUTION_LABEL.assistsPerGame}
						value={formatContributionPerGame(point.assistsPerGame)}
					/>
				)}
				{metric !== CONTRIBUTION_METRIC.mvpRate && (
					<MetricTooltipRow
						label={CONTRIBUTION_LABEL.mvpRate}
						value={formatContributionPercent(point.mvpRate)}
					/>
				)}
				{metric !== CONTRIBUTION_METRIC.goalShare &&
					point.goalShare !== null && (
						<MetricTooltipRow
							label={CONTRIBUTION_LABEL.goalShare}
							value={formatContributionPercent(point.goalShare)}
						/>
					)}
				{metric !== CONTRIBUTION_METRIC.ratingDelta && (
					<MetricTooltipRow
						label={CONTRIBUTION_LABEL.ratingDelta}
						value={formatContributionDelta(point.ratingDelta)}
					/>
				)}
				<MetricTooltipRow
					label={CONTRIBUTION_LABEL.games}
					value={formatContributionCount(point.games)}
				/>
				<MetricTooltipRow
					label={CONTRIBUTION_LABEL.rating}
					value={formatEventRating(point.rating)}
				/>
			</div>
		);
	};
}

function ContributionDot(props: {
	cx?: number;
	cy?: number;
	payload?: PlayerContributionPoint;
}) {
	const { cx, cy, payload } = props;
	if (cx === undefined || cy === undefined || !payload) {
		return null;
	}

	const radius = contributionBubbleRadius(payload.games);
	if (payload.belowMinSample) {
		return (
			<circle
				cx={cx}
				cy={cy}
				r={radius}
				fill={payload.color}
				fillOpacity={0.35}
				stroke={payload.color}
				strokeWidth={1.5}
				strokeDasharray="3 2"
			/>
		);
	}

	return (
		<circle
			cx={cx}
			cy={cy}
			r={radius}
			fill={payload.color}
			stroke="white"
			strokeWidth={1}
		/>
	);
}

function formatAxisPercent(value: number): string {
	return `${Math.round(value * 100)}%`;
}

function formatAxisMetric(metric: ContributionMetric, value: number): string {
	if (
		metric === CONTRIBUTION_METRIC.goalShare ||
		metric === CONTRIBUTION_METRIC.mvpRate
	) {
		return formatAxisPercent(value);
	}

	if (metric === CONTRIBUTION_METRIC.ratingDelta) {
		return formatContributionDelta(value);
	}

	return formatContributionPerGame(value);
}

export function ChampionshipContributionScatterChart({
	points,
	metric,
}: ChampionshipContributionScatterChartProps) {
	const navigate = useNavigate();
	const xDomain = contributionWinRateDomain();
	const yDomain = contributionMetricDomain(points, metric);

	return (
		<div className="w-full text-pitch-fg">
			<ResponsiveContainer width="100%" height={CONTRIBUTION_CHART.height}>
				<ScatterChart margin={CONTRIBUTION_CHART.margin}>
					<CartesianGrid
						strokeDasharray="3 3"
						stroke="currentColor"
						opacity={0.15}
					/>
					<XAxis
						type="number"
						dataKey={CONTRIBUTION_CHART.winRateKey}
						name={CONTRIBUTION_LABEL.winRate}
						domain={[xDomain.min, xDomain.max]}
						tickFormatter={formatAxisPercent}
						tick={{ fontSize: 12 }}
						label={{
							value: CONTRIBUTION_LABEL.winRate,
							position: "insideBottom",
							offset: -4,
							fontSize: 11,
						}}
					/>
					<YAxis
						type="number"
						dataKey={CONTRIBUTION_CHART.metricKey}
						name={contributionMetricCaption(metric)}
						domain={[yDomain.min, yDomain.max]}
						width={CONTRIBUTION_CHART.axisWidth}
						tickFormatter={(value: number) => formatAxisMetric(metric, value)}
						tick={{ fontSize: 12 }}
						label={{
							value: contributionMetricCaption(metric),
							angle: -90,
							position: "insideLeft",
							fontSize: 11,
						}}
					/>
					<Tooltip content={scatterTooltipForMetric(metric)} />
					<Scatter
						data={[...points]}
						shape={ContributionDot}
						onClick={(data: { payload?: PlayerContributionPoint }) => {
							const point = data.payload;
							if (!point?.player) {
								return;
							}

							void navigate({
								to: ROUTES.championshipPlayer,
								params: {
									championshipId: String(point.player.championship_id),
									playerId: String(point.playerId),
								},
							});
						}}
						cursor="pointer"
					>
						<LabelList
							dataKey={CONTRIBUTION_CHART.nameKey}
							position="top"
							offset={8}
							fontSize={11}
						/>
					</Scatter>
				</ScatterChart>
			</ResponsiveContainer>
		</div>
	);
}
