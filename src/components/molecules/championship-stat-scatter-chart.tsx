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
import { Button } from "@/components/button";
import {
	CHAMPIONSHIP_SCATTER_PERIOD_DEFAULT,
	CHAMPIONSHIP_SCATTER_PERIOD_LABEL,
	CHAMPIONSHIP_SCATTER_PERIOD_OPTIONS,
	type ChampionshipScatterPeriod,
	championshipScatterPeriodCaption,
	championshipScatterPeriodEvents,
	parseChampionshipScatterPeriod,
} from "@/const/championship-scatter-period";
import {
	CHAMPIONSHIP_STAT_SCATTER_AXIS,
	CHAMPIONSHIP_STAT_SCATTER_CHART,
	CHAMPIONSHIP_STAT_SCATTER_LABEL,
	type ChampionshipStatScatterAxis,
	type ChampionshipStatScatterPoint,
	championshipStatScatterAxisKeys,
	championshipStatScatterDomain,
	championshipStatScatterEmptyLabel,
	championshipStatScatterPoints,
	toggleChampionshipStatScatterAxis,
} from "@/const/championship-stat-scatter";
import type { PlayerProfileEventInput } from "@/const/player-profile";
import { BUTTON_VARIANT, FIELD_CLASS } from "@/const/ui";

type ChampionshipStatScatterChartProps = {
	players: readonly {
		id: number;
		display_name: string;
		nickname: string | null;
		avatar_url: string | null;
	}[];
	events: readonly PlayerProfileEventInput[];
};

type ScatterTooltipPayload = {
	payload?: ChampionshipStatScatterPoint;
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
				{CHAMPIONSHIP_STAT_SCATTER_LABEL.goals}: {point.goals}
			</p>
			<p className="text-fg-muted">
				{CHAMPIONSHIP_STAT_SCATTER_LABEL.assists}: {point.assists}
			</p>
		</div>
	);
}

function ScatterDot(props: {
	cx?: number;
	cy?: number;
	payload?: ChampionshipStatScatterPoint;
}) {
	const { cx, cy, payload } = props;
	if (cx === undefined || cy === undefined || !payload) {
		return null;
	}

	return (
		<circle
			cx={cx}
			cy={cy}
			r={CHAMPIONSHIP_STAT_SCATTER_CHART.dotRadius}
			fill={payload.color}
			stroke="white"
			strokeWidth={1}
		/>
	);
}

export function ChampionshipStatScatterChart({
	players,
	events,
}: ChampionshipStatScatterChartProps) {
	const [axisMode, setAxisMode] = useState<ChampionshipStatScatterAxis>(
		CHAMPIONSHIP_STAT_SCATTER_AXIS.goalsAssists,
	);
	const [period, setPeriod] = useState<ChampionshipScatterPeriod>(
		CHAMPIONSHIP_SCATTER_PERIOD_DEFAULT,
	);
	const periodEvents = useMemo(
		() => championshipScatterPeriodEvents(events, period),
		[events, period],
	);
	const points = useMemo(
		() => championshipStatScatterPoints(players, periodEvents),
		[periodEvents, players],
	);
	const emptyLabel = championshipStatScatterEmptyLabel(points);
	const axis = championshipStatScatterAxisKeys(axisMode);
	const xDomain = championshipStatScatterDomain(points, axis.xKey);
	const yDomain = championshipStatScatterDomain(points, axis.yKey);

	return (
		<div className="mt-8 space-y-3">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
				<h3 className="text-sm font-semibold text-fg">
					{CHAMPIONSHIP_STAT_SCATTER_LABEL.title}
				</h3>
				<div className="flex flex-col gap-2 sm:flex-row sm:items-end">
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
					{!emptyLabel && (
						<Button
							variant={BUTTON_VARIANT.secondary}
							onClick={() => {
								setAxisMode(toggleChampionshipStatScatterAxis);
							}}
						>
							{CHAMPIONSHIP_STAT_SCATTER_LABEL.invert}
						</Button>
					)}
				</div>
			</div>
			{emptyLabel && <p className="text-sm text-fg-muted">{emptyLabel}</p>}
			{!emptyLabel && (
				<div className="w-full text-pitch-fg">
					<ResponsiveContainer
						width="100%"
						height={CHAMPIONSHIP_STAT_SCATTER_CHART.height}
					>
						<ScatterChart margin={CHAMPIONSHIP_STAT_SCATTER_CHART.margin}>
							<CartesianGrid
								strokeDasharray="3 3"
								stroke="currentColor"
								opacity={0.15}
							/>
							<XAxis
								type="number"
								dataKey={axis.xKey}
								name={axis.xLabel}
								domain={[xDomain.min, xDomain.max]}
								allowDecimals={false}
								tick={{ fontSize: 12 }}
								label={{
									value: axis.xLabel,
									position: "insideBottom",
									offset: -2,
									fontSize: 12,
								}}
							/>
							<YAxis
								type="number"
								dataKey={axis.yKey}
								name={axis.yLabel}
								domain={[yDomain.min, yDomain.max]}
								allowDecimals={false}
								width={CHAMPIONSHIP_STAT_SCATTER_CHART.axisWidth}
								tick={{ fontSize: 12 }}
							/>
							<Tooltip
								content={scatterTooltipContent}
								cursor={{ strokeDasharray: "3 3" }}
							/>
							<Scatter
								name={CHAMPIONSHIP_STAT_SCATTER_LABEL.title}
								data={[...points]}
								shape={ScatterDot}
							>
								<LabelList
									dataKey={CHAMPIONSHIP_STAT_SCATTER_CHART.nameKey}
									position="top"
									offset={CHAMPIONSHIP_STAT_SCATTER_CHART.labelOffset}
									fontSize={CHAMPIONSHIP_STAT_SCATTER_CHART.labelFontSize}
									fill="currentColor"
								/>
							</Scatter>
						</ScatterChart>
					</ResponsiveContainer>
				</div>
			)}
		</div>
	);
}
