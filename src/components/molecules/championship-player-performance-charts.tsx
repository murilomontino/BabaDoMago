import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	formatPlayerPerformanceAverage,
	formatPlayerPerformanceRate,
	formatPlayerPerformanceRating,
	PLAYER_PERFORMANCE_CHART,
	PLAYER_PERFORMANCE_LABEL,
	type PlayerPerformanceDefenseWindows,
	type PlayerPerformanceMatchPoint,
} from "@/const/player-performance-20";

type ChampionshipPlayerPerformanceChartsProps = {
	points: readonly PlayerPerformanceMatchPoint[];
	defense: PlayerPerformanceDefenseWindows;
};

type TooltipPayloadItem = {
	name?: string;
	value?: number | string | null;
	color?: string;
	dataKey?: string | number;
};

type PerformanceTooltipProps = {
	active?: boolean;
	label?: string | number;
	payload?: readonly TooltipPayloadItem[];
	formatValue: (value: number | string | null | undefined) => string;
};

function ratePercent(value: number | null | undefined): number | null {
	if (value === null || value === undefined) {
		return null;
	}
	return Math.round(value * 1000) / 10;
}

function formatPercentTooltip(
	value: number | string | null | undefined,
): string {
	if (value === null || value === undefined) {
		return "—";
	}
	return `${value}%`;
}

function formatRatingTooltip(
	value: number | string | null | undefined,
): string {
	if (value === null || value === undefined) {
		return "—";
	}
	return formatPlayerPerformanceRating(Number(value));
}

function formatCountTooltip(value: number | string | null | undefined): string {
	if (value === null || value === undefined) {
		return "—";
	}
	return String(value);
}

function PerformanceChartTooltip({
	active,
	label,
	payload,
	formatValue,
}: PerformanceTooltipProps) {
	if (!active) {
		return null;
	}

	const rows = (payload ?? []).flatMap((item) => {
		if (item.value === null || item.value === undefined) {
			return [];
		}
		return [
			{
				name: item.name ?? String(item.dataKey ?? ""),
				value: formatValue(item.value),
				color: item.color,
			},
		];
	});

	if (rows.length === 0) {
		return null;
	}

	return (
		<div className="rounded-md border border-black/10 bg-surface px-2.5 py-2 text-xs shadow-sm">
			{label !== undefined && label !== null && (
				<p className="mb-1 font-medium tabular-nums text-fg">
					{PLAYER_PERFORMANCE_LABEL.games} {label}
				</p>
			)}
			{rows.map((row) => (
				<p key={row.name} className="text-fg-muted">
					{row.color && (
						<span
							className="mr-1.5 inline-block size-2 rounded-full align-middle"
							style={{ backgroundColor: row.color }}
						/>
					)}
					{row.name}: <span className="tabular-nums text-fg">{row.value}</span>
				</p>
			))}
		</div>
	);
}

export function ChampionshipPlayerPerformanceCharts({
	points,
	defense,
}: ChampionshipPlayerPerformanceChartsProps) {
	if (points.length === 0) {
		return null;
	}

	const chartData = points.map((point) => ({
		...point,
		pointsRatePct: ratePercent(point.pointsRateCumulative),
		pointsRateMa5Pct: ratePercent(point.pointsRateMa5),
		winRatePct: ratePercent(point.winRateCumulative),
		winRateMa5Pct: ratePercent(point.winRateMa5),
		participationPct: ratePercent(point.goalParticipation),
		participationMa5Pct: ratePercent(point.goalParticipationMa5),
	}));

	return (
		<div className="space-y-6">
			<div className="rounded-lg border border-black/10 p-3 text-xs text-fg-muted">
				<p className="mb-1.5 font-medium text-fg">
					{PLAYER_PERFORMANCE_LABEL.chartSeriesHintTitle}
				</p>
				<p>{PLAYER_PERFORMANCE_LABEL.cumulativeHint}</p>
				<p className="mt-1">{PLAYER_PERFORMANCE_LABEL.movingAverageHint}</p>
			</div>

			<div>
				<p className="mb-2 text-xs font-medium text-fg-muted">
					{PLAYER_PERFORMANCE_LABEL.chartRating}
				</p>
				<div style={{ height: PLAYER_PERFORMANCE_CHART.height }}>
					<ResponsiveContainer width="100%" height="100%">
						<LineChart
							data={chartData}
							margin={PLAYER_PERFORMANCE_CHART.margin}
						>
							<CartesianGrid
								strokeDasharray="3 3"
								className="stroke-black/10"
							/>
							<XAxis
								dataKey={PLAYER_PERFORMANCE_CHART.indexKey}
								tick={{ fontSize: 11 }}
							/>
							<YAxis domain={[0, "auto"]} width={32} tick={{ fontSize: 11 }} />
							<Tooltip
								content={(props) => (
									<PerformanceChartTooltip
										active={props.active}
										label={props.label}
										payload={
											props.payload as readonly TooltipPayloadItem[] | undefined
										}
										formatValue={formatRatingTooltip}
									/>
								)}
							/>
							<Line
								type="linear"
								dataKey="ratingSnapshot"
								name={PLAYER_PERFORMANCE_LABEL.rating}
								stroke="currentColor"
								dot
								connectNulls
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>
			</div>

			<div>
				<p className="mb-2 text-xs font-medium text-fg-muted">
					{PLAYER_PERFORMANCE_LABEL.chartForm}
				</p>
				<div style={{ height: PLAYER_PERFORMANCE_CHART.height }}>
					<ResponsiveContainer width="100%" height="100%">
						<LineChart
							data={chartData}
							margin={PLAYER_PERFORMANCE_CHART.margin}
						>
							<CartesianGrid
								strokeDasharray="3 3"
								className="stroke-black/10"
							/>
							<XAxis
								dataKey={PLAYER_PERFORMANCE_CHART.indexKey}
								tick={{ fontSize: 11 }}
							/>
							<YAxis domain={[0, 100]} width={32} tick={{ fontSize: 11 }} />
							<Tooltip
								content={(props) => (
									<PerformanceChartTooltip
										active={props.active}
										label={props.label}
										payload={
											props.payload as readonly TooltipPayloadItem[] | undefined
										}
										formatValue={formatPercentTooltip}
									/>
								)}
							/>
							<Legend />
							<Line
								type="monotone"
								dataKey="pointsRatePct"
								name={PLAYER_PERFORMANCE_LABEL.cumulative}
								stroke="currentColor"
								dot={false}
							/>
							<Line
								type="monotone"
								dataKey="pointsRateMa5Pct"
								name={PLAYER_PERFORMANCE_LABEL.movingAverage}
								stroke="var(--color-pitch, #0f766e)"
								strokeDasharray="4 4"
								dot={false}
								connectNulls
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>
			</div>

			<div>
				<p className="mb-2 text-xs font-medium text-fg-muted">
					{PLAYER_PERFORMANCE_LABEL.chartWinRate}
				</p>
				<div style={{ height: PLAYER_PERFORMANCE_CHART.height }}>
					<ResponsiveContainer width="100%" height="100%">
						<LineChart
							data={chartData}
							margin={PLAYER_PERFORMANCE_CHART.margin}
						>
							<CartesianGrid
								strokeDasharray="3 3"
								className="stroke-black/10"
							/>
							<XAxis
								dataKey={PLAYER_PERFORMANCE_CHART.indexKey}
								tick={{ fontSize: 11 }}
							/>
							<YAxis domain={[0, 100]} width={32} tick={{ fontSize: 11 }} />
							<Tooltip
								content={(props) => (
									<PerformanceChartTooltip
										active={props.active}
										label={props.label}
										payload={
											props.payload as readonly TooltipPayloadItem[] | undefined
										}
										formatValue={formatPercentTooltip}
									/>
								)}
							/>
							<Legend />
							<Line
								type="monotone"
								dataKey="winRatePct"
								name={PLAYER_PERFORMANCE_LABEL.cumulative}
								stroke="currentColor"
								dot={false}
							/>
							<Line
								type="monotone"
								dataKey="winRateMa5Pct"
								name={PLAYER_PERFORMANCE_LABEL.movingAverage}
								stroke="var(--color-pitch, #0f766e)"
								strokeDasharray="4 4"
								dot={false}
								connectNulls
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>
			</div>

			<div>
				<p className="mb-2 text-xs font-medium text-fg-muted">
					{PLAYER_PERFORMANCE_LABEL.chartParticipation}
				</p>
				<div style={{ height: PLAYER_PERFORMANCE_CHART.height }}>
					<ResponsiveContainer width="100%" height="100%">
						<LineChart
							data={chartData}
							margin={PLAYER_PERFORMANCE_CHART.margin}
						>
							<CartesianGrid
								strokeDasharray="3 3"
								className="stroke-black/10"
							/>
							<XAxis
								dataKey={PLAYER_PERFORMANCE_CHART.indexKey}
								tick={{ fontSize: 11 }}
							/>
							<YAxis domain={[0, 100]} width={32} tick={{ fontSize: 11 }} />
							<Tooltip
								content={(props) => (
									<PerformanceChartTooltip
										active={props.active}
										label={props.label}
										payload={
											props.payload as readonly TooltipPayloadItem[] | undefined
										}
										formatValue={formatPercentTooltip}
									/>
								)}
							/>
							<Legend />
							<Line
								type="monotone"
								dataKey="participationPct"
								name={PLAYER_PERFORMANCE_LABEL.goalParticipation}
								stroke="currentColor"
								dot
								connectNulls
							/>
							<Line
								type="monotone"
								dataKey="participationMa5Pct"
								name={PLAYER_PERFORMANCE_LABEL.movingAverage}
								stroke="var(--color-pitch, #0f766e)"
								strokeDasharray="4 4"
								dot={false}
								connectNulls
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>
			</div>

			<div>
				<p className="mb-2 text-xs font-medium text-fg-muted">
					{PLAYER_PERFORMANCE_LABEL.chartGoalsAssists}
				</p>
				<div style={{ height: PLAYER_PERFORMANCE_CHART.height }}>
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={chartData} margin={PLAYER_PERFORMANCE_CHART.margin}>
							<CartesianGrid
								strokeDasharray="3 3"
								className="stroke-black/10"
							/>
							<XAxis
								dataKey={PLAYER_PERFORMANCE_CHART.indexKey}
								tick={{ fontSize: 11 }}
							/>
							<YAxis allowDecimals={false} width={28} tick={{ fontSize: 11 }} />
							<Tooltip
								content={(props) => (
									<PerformanceChartTooltip
										active={props.active}
										label={props.label}
										payload={
											props.payload as readonly TooltipPayloadItem[] | undefined
										}
										formatValue={formatCountTooltip}
									/>
								)}
							/>
							<Legend />
							<Bar
								dataKey="goals"
								name={PLAYER_PERFORMANCE_LABEL.goals}
								fill="currentColor"
							/>
							<Bar
								dataKey="assists"
								name={PLAYER_PERFORMANCE_LABEL.assists}
								fill="var(--color-pitch, #0f766e)"
							/>
						</BarChart>
					</ResponsiveContainer>
				</div>
			</div>

			<div className="rounded-lg border border-black/10 p-3">
				<p className="mb-2 text-xs font-medium text-fg-muted">
					{PLAYER_PERFORMANCE_LABEL.defenseTitle}
				</p>
				<div className="grid grid-cols-2 gap-3 text-sm">
					<div>
						<p className="text-xs text-fg-muted">
							{PLAYER_PERFORMANCE_LABEL.cleanSheets}
						</p>
						<p className="font-semibold tabular-nums text-fg">
							{formatPlayerPerformanceRate(defense.cleanSheetRate20)}
						</p>
					</div>
					<div>
						<p className="text-xs text-fg-muted">
							{PLAYER_PERFORMANCE_LABEL.goalsConcededPerGame}
						</p>
						<p className="font-semibold tabular-nums text-fg">
							{formatPlayerPerformanceAverage(defense.goalsConcededPerGame20)}
						</p>
					</div>
				</div>
				<div className="mt-3 space-y-1 text-xs text-fg-muted">
					<p>
						{PLAYER_PERFORMANCE_LABEL.last5}:{" "}
						{formatPlayerPerformanceRate(defense.cleanSheetRate5)}
					</p>
					<p>
						{PLAYER_PERFORMANCE_LABEL.last10}:{" "}
						{formatPlayerPerformanceRate(defense.cleanSheetRate10)}
					</p>
					<p>
						{PLAYER_PERFORMANCE_LABEL.last20}:{" "}
						{formatPlayerPerformanceRate(defense.cleanSheetRate20)}
					</p>
				</div>
				<p className="mt-2 text-xs text-fg-muted">
					{PLAYER_PERFORMANCE_LABEL.defenseHint}
				</p>
			</div>
		</div>
	);
}
