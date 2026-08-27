import { useMemo, useState } from "react";
import {
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { formatEventStartsAt } from "@/const/championship-event";
import {
	CHAMPIONSHIP_RATING_HISTORY_CHART,
	CHAMPIONSHIP_RATING_HISTORY_LABEL,
	type ChampionshipRatingHistoryChartPoint,
	type ChampionshipRatingHistorySeries,
	championshipRatingHistoryAllSelected,
	championshipRatingHistoryChart,
	championshipRatingHistoryChipClass,
	championshipRatingHistoryEmptyLabel,
	championshipRatingHistoryPlayerIds,
	championshipRatingHistorySelection,
	championshipRatingHistoryTickLabel,
	toggleChampionshipRatingHistoryPlayer,
	visibleChampionshipRatingHistorySeries,
} from "@/const/championship-rating-history";
import { formatEventRating } from "@/const/event-rating-adjustment";
import { championshipRatingCeiling } from "@/const/player-rating";
import type { ChampionshipPlayer } from "@/types/championship";
import type { ChampionshipEvent } from "@/types/championship-event";

type ChampionshipRatingHistoryChartProps = {
	players: readonly ChampionshipPlayer[];
	events: readonly ChampionshipEvent[];
};

type ChartTooltipPayload = {
	payload?: ChampionshipRatingHistoryChartPoint;
};

type ChartSeriesDotProps = {
	cx?: number;
	cy?: number;
	index?: number;
	series?: ChampionshipRatingHistorySeries;
	lastIndex?: number;
};

export function ChampionshipRatingHistoryChart({
	players,
	events,
}: ChampionshipRatingHistoryChartProps) {
	const chart = useMemo(
		() =>
			championshipRatingHistoryChart(players, events, new Date().toISOString()),
		[events, players],
	);
	const playerIds = championshipRatingHistoryPlayerIds(chart.series);
	const [selected, setSelected] = useState<ReadonlySet<number> | null>(null);
	const selectedIds = championshipRatingHistorySelection(selected, playerIds);
	const visible = visibleChampionshipRatingHistorySeries(
		chart.series,
		selectedIds,
	);
	const emptyLabel = championshipRatingHistoryEmptyLabel(chart);
	const ceiling = championshipRatingCeiling(
		players.map((player) => player.rating),
	);
	const lastIndex = chart.rows.length - 1;
	const allSelected = championshipRatingHistoryAllSelected(
		playerIds,
		selectedIds,
	);

	return (
		<div className="mt-8 space-y-3">
			<h3 className="text-sm font-semibold text-fg">
				{CHAMPIONSHIP_RATING_HISTORY_LABEL.title}
			</h3>
			{emptyLabel && <p className="text-sm text-fg-muted">{emptyLabel}</p>}
			{!emptyLabel && (
				<>
					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							className={championshipRatingHistoryChipClass(allSelected)}
							aria-pressed={allSelected}
							onClick={() => {
								setSelected(null);
							}}
						>
							{CHAMPIONSHIP_RATING_HISTORY_LABEL.all}
						</button>
						<button
							type="button"
							className={championshipRatingHistoryChipClass(
								selectedIds.size === 0,
							)}
							aria-pressed={selectedIds.size === 0}
							onClick={() => {
								setSelected(new Set());
							}}
						>
							{CHAMPIONSHIP_RATING_HISTORY_LABEL.none}
						</button>
						{chart.series.map((item) => (
							<button
								key={item.playerId}
								type="button"
								className={championshipRatingHistoryChipClass(
									selectedIds.has(item.playerId),
								)}
								aria-pressed={selectedIds.has(item.playerId)}
								onClick={() => {
									setSelected(
										toggleChampionshipRatingHistoryPlayer(
											selectedIds,
											item.playerId,
										),
									);
								}}
							>
								<ChartPlayerAvatar
									avatarUrl={item.avatarUrl}
									name={item.name}
									className="size-5"
								/>
								<span
									className="size-2 shrink-0 rounded-full"
									style={{ backgroundColor: item.color }}
									aria-hidden
								/>
								{item.name}
							</button>
						))}
					</div>
					<div className="w-full text-pitch-fg">
						<ResponsiveContainer
							width="100%"
							height={CHAMPIONSHIP_RATING_HISTORY_CHART.height}
						>
							<LineChart
								data={[...chart.rows]}
								margin={CHAMPIONSHIP_RATING_HISTORY_CHART.margin}
							>
								<XAxis
									dataKey={CHAMPIONSHIP_RATING_HISTORY_CHART.indexKey}
									tick={{ fontSize: 12 }}
									interval={0}
									tickFormatter={(value) =>
										championshipRatingHistoryTickLabel(
											chart.rows,
											Number(value),
										)
									}
								/>
								<YAxis
									domain={[0, ceiling]}
									tick={{ fontSize: 12 }}
									width={36}
								/>
								<Tooltip
									formatter={(value) => formatEventRating(Number(value))}
									labelFormatter={chartTooltipLabel}
								/>
								{visible.map((item) => (
									<Line
										key={item.playerId}
										type="linear"
										dataKey={item.dataKey}
										name={item.name}
										stroke={item.color}
										strokeWidth={2}
										isAnimationActive={false}
										dot={<ChartSeriesDot series={item} lastIndex={lastIndex} />}
									/>
								))}
							</LineChart>
						</ResponsiveContainer>
					</div>
				</>
			)}
		</div>
	);
}

function chartTooltipLabel(
	_label: unknown,
	payload: readonly ChartTooltipPayload[] | undefined,
): string {
	const startsAt = payload?.[0]?.payload?.startsAt;
	if (!startsAt) {
		return "";
	}

	return formatEventStartsAt(startsAt).date;
}

function ChartPlayerAvatar({
	avatarUrl,
	name,
	className,
}: {
	avatarUrl: string | null;
	name: string;
	className: string;
}) {
	if (avatarUrl) {
		return (
			<img
				src={avatarUrl}
				alt=""
				referrerPolicy="no-referrer"
				className={`${className} rounded-full object-cover`}
			/>
		);
	}

	return (
		<span
			className={`flex shrink-0 items-center justify-center rounded-full bg-pitch-soft text-[10px] font-medium text-pitch-fg ${className}`}
		>
			{name.charAt(0).toUpperCase()}
		</span>
	);
}

function ChartSeriesDot({
	cx,
	cy,
	index,
	series,
	lastIndex,
}: ChartSeriesDotProps) {
	if (cx == null || cy == null || index == null) {
		return null;
	}

	if (!series) {
		return null;
	}

	if (lastIndex == null) {
		return null;
	}

	if (index !== lastIndex) {
		return (
			<circle
				cx={cx}
				cy={cy}
				r={CHAMPIONSHIP_RATING_HISTORY_CHART.dotRadius}
				fill={series.color}
			/>
		);
	}

	return (
		<LastPointAvatar
			cx={cx}
			cy={cy}
			avatarUrl={series.avatarUrl}
			color={series.color}
			name={series.name}
		/>
	);
}

function LastPointAvatar({
	cx,
	cy,
	avatarUrl,
	color,
	name,
}: {
	cx: number;
	cy: number;
	avatarUrl: string | null;
	color: string;
	name: string;
}) {
	const size = CHAMPIONSHIP_RATING_HISTORY_CHART.avatarSize;
	const half = size / 2;
	// ponytail: avatars share the last X ("agora") and can overlap. Offset or top-N if it gets noisy.

	return (
		<g>
			<circle cx={cx} cy={cy} r={half + 1} fill={color} />
			{avatarUrl && (
				<foreignObject x={cx - half} y={cy - half} width={size} height={size}>
					<img
						src={avatarUrl}
						alt=""
						referrerPolicy="no-referrer"
						width={size}
						height={size}
						className="size-full rounded-full object-cover"
					/>
				</foreignObject>
			)}
			{!avatarUrl && (
				<text
					x={cx}
					y={cy}
					textAnchor="middle"
					dominantBaseline="central"
					fill="#ffffff"
					fontSize={CHAMPIONSHIP_RATING_HISTORY_CHART.labelFontSize}
					fontWeight={600}
				>
					{name.charAt(0).toUpperCase()}
				</text>
			)}
		</g>
	);
}
