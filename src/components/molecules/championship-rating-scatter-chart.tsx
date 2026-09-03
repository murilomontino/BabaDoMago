import { useMemo, useState } from "react";
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
	CHAMPIONSHIP_RATING_SCATTER_CHART,
	CHAMPIONSHIP_RATING_SCATTER_KIND,
	CHAMPIONSHIP_RATING_SCATTER_LABEL,
	type ChampionshipRatingScatterKind,
	type ChampionshipRatingScatterPoint,
	type ChampionshipRatingScatterSeriesPoint,
	championshipRatingScatterDomain,
	championshipRatingScatterEmptyLabel,
	championshipRatingScatterPoints,
	championshipRatingScatterSeries,
	championshipRatingScatterTitle,
} from "@/const/championship-rating-scatter";
import {
	CHAMPIONSHIP_SCATTER_PERIOD_DEFAULT,
	CHAMPIONSHIP_SCATTER_PERIOD_LABEL,
	CHAMPIONSHIP_SCATTER_PERIOD_OPTIONS,
	type ChampionshipScatterPeriod,
	championshipScatterPeriodCaption,
	championshipScatterPeriodEvents,
	parseChampionshipScatterPeriod,
} from "@/const/championship-scatter-period";
import { formatEventRating } from "@/const/event-rating-adjustment";
import type { PlayerProfileEventInput } from "@/const/player-profile";
import { FIELD_CLASS } from "@/const/ui";

type ChampionshipRatingScatterChartProps = {
	players: readonly {
		id: number;
		display_name: string;
		nickname: string | null;
		avatar_url: string | null;
		rating: number;
	}[];
	events: readonly PlayerProfileEventInput[];
};

type ScatterTooltipPayload = {
	payload?: ChampionshipRatingScatterSeriesPoint;
};

const SCATTER_KINDS = [
	CHAMPIONSHIP_RATING_SCATTER_KIND.initial,
	CHAMPIONSHIP_RATING_SCATTER_KIND.current,
] as const;

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
				{CHAMPIONSHIP_RATING_SCATTER_LABEL.rating}:{" "}
				{formatEventRating(point.rating)}
			</p>
		</div>
	);
}

function ScatterDot(props: {
	cx?: number;
	cy?: number;
	payload?: ChampionshipRatingScatterSeriesPoint;
}) {
	const { cx, cy, payload } = props;
	if (cx === undefined || cy === undefined || !payload) {
		return null;
	}

	return (
		<circle
			cx={cx}
			cy={cy}
			r={CHAMPIONSHIP_RATING_SCATTER_CHART.dotRadius}
			fill={payload.color}
			stroke="white"
			strokeWidth={1}
		/>
	);
}

function RatingScatterPanel({
	kind,
	points,
}: {
	kind: ChampionshipRatingScatterKind;
	points: readonly ChampionshipRatingScatterPoint[];
}) {
	const series = championshipRatingScatterSeries(points, kind);
	const domain = championshipRatingScatterDomain(series);
	const axisDomain: [number, number] = [domain.min, domain.max];

	return (
		<div className="space-y-3">
			<h3 className="text-sm font-semibold text-fg">
				{championshipRatingScatterTitle(kind)}
			</h3>
			<div className="w-full text-pitch-fg">
				<ResponsiveContainer
					width="100%"
					height={CHAMPIONSHIP_RATING_SCATTER_CHART.height}
				>
					<ScatterChart margin={CHAMPIONSHIP_RATING_SCATTER_CHART.margin}>
						<CartesianGrid
							strokeDasharray="3 3"
							stroke="currentColor"
							opacity={0.15}
						/>
						<XAxis
							type="number"
							dataKey={CHAMPIONSHIP_RATING_SCATTER_CHART.xKey}
							tick={false}
							axisLine
						/>
						<YAxis
							type="number"
							dataKey={CHAMPIONSHIP_RATING_SCATTER_CHART.yKey}
							name={CHAMPIONSHIP_RATING_SCATTER_LABEL.rating}
							domain={axisDomain}
							width={CHAMPIONSHIP_RATING_SCATTER_CHART.axisWidth}
							tick={{ fontSize: 12 }}
							tickFormatter={(value) => formatEventRating(Number(value))}
						/>
						<Tooltip
							content={scatterTooltipContent}
							cursor={{ strokeDasharray: "3 3" }}
						/>
						<Scatter
							name={championshipRatingScatterTitle(kind)}
							data={[...series]}
							shape={ScatterDot}
						>
							<LabelList
								dataKey={CHAMPIONSHIP_RATING_SCATTER_CHART.nameKey}
								position="top"
								offset={CHAMPIONSHIP_RATING_SCATTER_CHART.labelOffset}
								fontSize={CHAMPIONSHIP_RATING_SCATTER_CHART.labelFontSize}
								fill="currentColor"
							/>
						</Scatter>
					</ScatterChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}

export function ChampionshipRatingScatterChart({
	players,
	events,
}: ChampionshipRatingScatterChartProps) {
	const [period, setPeriod] = useState<ChampionshipScatterPeriod>(
		CHAMPIONSHIP_SCATTER_PERIOD_DEFAULT,
	);
	const periodEvents = useMemo(
		() => championshipScatterPeriodEvents(events, period),
		[events, period],
	);
	const points = useMemo(
		() => championshipRatingScatterPoints(players, periodEvents),
		[periodEvents, players],
	);
	const emptyLabel = championshipRatingScatterEmptyLabel(points);

	return (
		<div className="mt-8 space-y-8">
			<label className="block text-xs text-fg-muted">
				{CHAMPIONSHIP_SCATTER_PERIOD_LABEL.filter}
				<select
					value={period}
					className={`mt-1 ${FIELD_CLASS}`}
					onChange={(event) => {
						setPeriod(parseChampionshipScatterPeriod(event.target.value));
					}}
				>
					{CHAMPIONSHIP_SCATTER_PERIOD_OPTIONS.map((option) => (
						<option key={option} value={option}>
							{championshipScatterPeriodCaption(option)}
						</option>
					))}
				</select>
			</label>
			{emptyLabel && <p className="text-sm text-fg-muted">{emptyLabel}</p>}
			{!emptyLabel &&
				SCATTER_KINDS.map((kind) => (
					<RatingScatterPanel key={kind} kind={kind} points={points} />
				))}
		</div>
	);
}
