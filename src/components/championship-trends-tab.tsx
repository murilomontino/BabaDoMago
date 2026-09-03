import { createColumnHelper } from "@tanstack/react-table";
import {
	ArrowDown,
	ArrowRight,
	ArrowUp,
	ChartColumn,
	Goal,
	LineChart as LineChartIcon,
	Shield,
	TrendingUp,
} from "lucide-react";
import { lazy, Suspense, useMemo, useState } from "react";
import { Skeleton, SkeletonRegion } from "@/components/atoms/skeleton";
import { EmptyState } from "@/components/empty-state";
import { PlayerNameLink } from "@/components/molecules/player-name-link";
import {
	DataTable,
	type DataTableFeatures,
} from "@/components/organisms/data-table";
import { SectionCard } from "@/components/section-card";
import {
	CONSISTENCY_CHART,
	CONSISTENCY_LABEL,
	CONSISTENCY_METRIC_DEFAULT,
	CONSISTENCY_METRIC_OPTIONS,
	type ConsistencyMetric,
	championshipConsistencyEmptyLabel,
	championshipConsistencyPoints,
	consistencyMetricCaption,
	parseConsistencyMetric,
} from "@/const/championship-consistency";
import {
	championshipEventHealth,
	championshipEventHealthChart,
	EVENT_HEALTH_CHART,
	EVENT_HEALTH_LABEL,
	EVENT_HEALTH_METRIC_DEFAULT,
	EVENT_HEALTH_METRIC_OPTIONS,
	type EventHealthMetric,
	eventHealthMetricCaption,
	eventHealthMetricHint,
	formatEventHealthKpi,
	parseEventHealthMetric,
} from "@/const/championship-event-health";
import {
	championshipGoalkeeperRanking,
	formatGoalkeeperAverage,
	formatGoalkeeperCount,
	formatGoalkeeperWinRate,
	GOALKEEPER_RANKING_LABEL,
	GOALKEEPER_TREND,
	type GoalkeeperRankingRow,
	goalkeeperTrendLabel,
} from "@/const/championship-goalkeeper-ranking";
import {
	championshipRecentForm,
	formatRecentFormDelta,
	formatRecentFormRate,
	formatRecentFormStat,
	RECENT_FORM_COLUMN,
	RECENT_FORM_LABEL,
	RECENT_FORM_TREND,
	type RecentFormRow,
	recentFormTrendLabel,
} from "@/const/championship-recent-form";
import { CHAMPIONSHIP_TAB_LABEL } from "@/const/championship-tab";
import {
	championshipTrendsEvents,
	championshipTrendsHasEnoughEnded,
	parseTrendsWindow,
	TRENDS_WINDOW_DEFAULT,
	TRENDS_WINDOW_LABEL,
	TRENDS_WINDOW_OPTIONS,
	type TrendsWindow,
	trendsWindowCaption,
} from "@/const/championship-trends-window";
import { SKELETON_LABEL } from "@/const/skeleton";
import { FIELD_CLASS } from "@/const/ui";
import { CHAMPIONSHIP_EVENTS_QUERY_KEY } from "@/hooks/championships/championships-query-keys";
import type { ChampionshipPlayer } from "@/types/championship";
import type { ChampionshipEvent } from "@/types/championship-event";

const ChampionshipConsistencyScatterChart = lazy(() =>
	import("@/components/molecules/championship-consistency-scatter-chart").then(
		(m) => ({ default: m.ChampionshipConsistencyScatterChart }),
	),
);

const ChampionshipEventHealthChart = lazy(() =>
	import("@/components/molecules/championship-event-health-chart").then(
		(m) => ({ default: m.ChampionshipEventHealthChart }),
	),
);

const ChampionshipGoalkeeperSparkline = lazy(() =>
	import("@/components/molecules/championship-goalkeeper-sparkline").then(
		(m) => ({ default: m.ChampionshipGoalkeeperSparkline }),
	),
);

const FILTER_CHIP =
	"inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition";
const FILTER_CHIP_ON = `${FILTER_CHIP} bg-pitch text-white hover:bg-pitch-dark`;
const FILTER_CHIP_OFF = `${FILTER_CHIP} bg-surface-muted text-fg-muted hover:bg-black/10 hover:text-fg`;

function filterChipClass(on: boolean): string {
	if (on) {
		return FILTER_CHIP_ON;
	}

	return FILTER_CHIP_OFF;
}

const recentFormColumnHelper = createColumnHelper<
	DataTableFeatures,
	RecentFormRow
>();

const goalkeeperColumnHelper = createColumnHelper<
	DataTableFeatures,
	GoalkeeperRankingRow
>();

type ChampionshipTrendsTabProps = {
	players: ChampionshipPlayer[];
	events: readonly ChampionshipEvent[];
};

function RecentFormTrendIcon({ trend }: { trend: RecentFormRow["trend"] }) {
	switch (trend) {
		case RECENT_FORM_TREND.up:
			return <ArrowUp className="size-3.5 text-pitch-fg" aria-hidden />;
		case RECENT_FORM_TREND.down:
			return <ArrowDown className="size-3.5 text-red-600" aria-hidden />;
		case RECENT_FORM_TREND.deadZone:
			return <ArrowRight className="size-3.5 text-fg-muted" aria-hidden />;
		case RECENT_FORM_TREND.seed:
			return <ArrowUp className="size-3.5 text-amber-600" aria-hidden />;
		case RECENT_FORM_TREND.insufficient:
			return <ArrowRight className="size-3.5 text-fg-muted" aria-hidden />;
		default: {
			const _never: never = trend;
			return _never;
		}
	}
}

function GoalkeeperTrendIcon({
	trend,
}: {
	trend: GoalkeeperRankingRow["trend"];
}) {
	switch (trend) {
		case GOALKEEPER_TREND.up:
			return <ArrowDown className="size-3.5 text-pitch-fg" aria-hidden />;
		case GOALKEEPER_TREND.down:
			return <ArrowUp className="size-3.5 text-red-600" aria-hidden />;
		case GOALKEEPER_TREND.flat:
			return <ArrowRight className="size-3.5 text-fg-muted" aria-hidden />;
		case GOALKEEPER_TREND.none:
			return null;
		default: {
			const _never: never = trend;
			return _never;
		}
	}
}

function RecentFormTable({ rows }: { rows: RecentFormRow[] }) {
	const columns = useMemo(
		() =>
			recentFormColumnHelper.columns([
				recentFormColumnHelper.accessor((row) => row.player.display_name, {
					id: RECENT_FORM_COLUMN.player,
					header: "Jog",
					enableHiding: false,
					meta: { title: "Jogador" },
					cell: ({ row }) => <PlayerNameLink player={row.original.player} />,
				}),
				recentFormColumnHelper.accessor("matches", {
					id: RECENT_FORM_COLUMN.matches,
					header: RECENT_FORM_LABEL.matches,
					meta: {
						align: "right" as const,
						title: RECENT_FORM_LABEL.matches,
					},
					cell: ({ row }) => (
						<span className="tabular-nums">
							{formatRecentFormStat(RECENT_FORM_COLUMN.matches, row.original)}
						</span>
					),
				}),
				recentFormColumnHelper.accessor("wins", {
					id: RECENT_FORM_COLUMN.wins,
					header: RECENT_FORM_LABEL.wins,
					meta: { align: "right" as const, title: "Vitórias" },
					cell: ({ row }) => (
						<span className="tabular-nums">
							{formatRecentFormStat(RECENT_FORM_COLUMN.wins, row.original)}
						</span>
					),
				}),
				recentFormColumnHelper.accessor("draws", {
					id: RECENT_FORM_COLUMN.draws,
					header: RECENT_FORM_LABEL.draws,
					meta: { align: "right" as const, title: "Empates" },
					cell: ({ row }) => (
						<span className="tabular-nums">
							{formatRecentFormStat(RECENT_FORM_COLUMN.draws, row.original)}
						</span>
					),
				}),
				recentFormColumnHelper.accessor("losses", {
					id: RECENT_FORM_COLUMN.losses,
					header: RECENT_FORM_LABEL.losses,
					meta: { align: "right" as const, title: "Derrotas" },
					cell: ({ row }) => (
						<span className="tabular-nums">
							{formatRecentFormStat(RECENT_FORM_COLUMN.losses, row.original)}
						</span>
					),
				}),
				recentFormColumnHelper.accessor("rate", {
					id: RECENT_FORM_COLUMN.rate,
					header: "Apr",
					meta: {
						align: "right" as const,
						title: RECENT_FORM_LABEL.rate,
					},
					cell: ({ row }) => (
						<span className="tabular-nums">
							{formatRecentFormRate(row.original.rate)}
						</span>
					),
				}),
				recentFormColumnHelper.accessor("ratingDeltaSum", {
					id: RECENT_FORM_COLUMN.ratingDelta,
					header: "Δ",
					meta: {
						align: "right" as const,
						title: RECENT_FORM_LABEL.ratingDelta,
					},
					cell: ({ row }) => (
						<span className="tabular-nums">
							{formatRecentFormDelta(row.original.ratingDeltaSum)}
						</span>
					),
				}),
				recentFormColumnHelper.accessor("voteDeltaSum", {
					id: RECENT_FORM_COLUMN.voteDelta,
					header: "Voto",
					meta: {
						align: "right" as const,
						title: RECENT_FORM_LABEL.voteDelta,
					},
					cell: ({ row }) => (
						<span className="tabular-nums">
							{formatRecentFormDelta(row.original.voteDeltaSum)}
						</span>
					),
				}),
				recentFormColumnHelper.accessor("trend", {
					id: RECENT_FORM_COLUMN.trend,
					header: RECENT_FORM_LABEL.trend,
					meta: { title: RECENT_FORM_LABEL.trend },
					cell: ({ row }) => (
						<span className="inline-flex items-center gap-1 text-xs font-medium text-fg">
							<RecentFormTrendIcon trend={row.original.trend} />
							{recentFormTrendLabel(row.original.trend)}
						</span>
					),
				}),
			]),
		[],
	);

	return (
		<DataTable
			data={rows}
			columns={columns}
			getRowId={(row) => String(row.player.id)}
		/>
	);
}

function GoalkeeperTable({ rows }: { rows: GoalkeeperRankingRow[] }) {
	const columns = useMemo(
		() =>
			goalkeeperColumnHelper.columns([
				goalkeeperColumnHelper.accessor((row) => row.player.display_name, {
					id: "player",
					header: "Jog",
					enableHiding: false,
					meta: { title: "Jogador" },
					cell: ({ row }) => <PlayerNameLink player={row.original.player} />,
				}),
				goalkeeperColumnHelper.accessor("matches", {
					id: "matches",
					header: GOALKEEPER_RANKING_LABEL.matches,
					meta: {
						align: "right" as const,
						title: GOALKEEPER_RANKING_LABEL.matches,
					},
					cell: ({ row }) => (
						<span className="tabular-nums">
							{formatGoalkeeperCount(row.original.matches)}
						</span>
					),
				}),
				goalkeeperColumnHelper.accessor("wins", {
					id: "wins",
					header: GOALKEEPER_RANKING_LABEL.wins,
					meta: { align: "right" as const, title: "Vitórias" },
					cell: ({ row }) => (
						<span className="tabular-nums">
							{formatGoalkeeperCount(row.original.wins)}
						</span>
					),
				}),
				goalkeeperColumnHelper.accessor("draws", {
					id: "draws",
					header: GOALKEEPER_RANKING_LABEL.draws,
					meta: { align: "right" as const, title: "Empates" },
					cell: ({ row }) => (
						<span className="tabular-nums">
							{formatGoalkeeperCount(row.original.draws)}
						</span>
					),
				}),
				goalkeeperColumnHelper.accessor("losses", {
					id: "losses",
					header: GOALKEEPER_RANKING_LABEL.losses,
					meta: { align: "right" as const, title: "Derrotas" },
					cell: ({ row }) => (
						<span className="tabular-nums">
							{formatGoalkeeperCount(row.original.losses)}
						</span>
					),
				}),
				goalkeeperColumnHelper.accessor("goalsConceded", {
					id: "goalsConceded",
					header: "GS",
					meta: {
						align: "right" as const,
						title: GOALKEEPER_RANKING_LABEL.goalsConceded,
					},
					cell: ({ row }) => (
						<span className="tabular-nums">
							{formatGoalkeeperCount(row.original.goalsConceded)}
						</span>
					),
				}),
				goalkeeperColumnHelper.accessor("goalsConcededAverage", {
					id: "goalsConcededAverage",
					header: "Méd",
					meta: {
						align: "right" as const,
						title: GOALKEEPER_RANKING_LABEL.goalsConcededAverage,
					},
					cell: ({ row }) => (
						<span className="tabular-nums">
							{formatGoalkeeperAverage(row.original.goalsConcededAverage)}
						</span>
					),
				}),
				goalkeeperColumnHelper.accessor("winRate", {
					id: "winRate",
					header: "WR",
					meta: {
						align: "right" as const,
						title: GOALKEEPER_RANKING_LABEL.winRate,
					},
					cell: ({ row }) => (
						<span className="tabular-nums">
							{formatGoalkeeperWinRate(row.original.winRate)}
						</span>
					),
				}),
				goalkeeperColumnHelper.display({
					id: "spark",
					header: GOALKEEPER_RANKING_LABEL.trend,
					cell: ({ row }) => (
						<div className="flex items-center gap-2">
							<Suspense fallback={<Skeleton className="h-8 w-16" />}>
								<ChampionshipGoalkeeperSparkline
									averages={row.original.eventAverages}
								/>
							</Suspense>
							<span className="inline-flex items-center gap-1 text-xs text-fg-muted">
								<GoalkeeperTrendIcon trend={row.original.trend} />
								{goalkeeperTrendLabel(row.original.trend)}
							</span>
						</div>
					),
				}),
			]),
		[],
	);

	return (
		<DataTable
			data={rows}
			columns={columns}
			getRowId={(row) => String(row.player.id)}
		/>
	);
}

export function ChampionshipTrendsTab({
	players,
	events,
}: ChampionshipTrendsTabProps) {
	const [window, setWindow] = useState<TrendsWindow>(TRENDS_WINDOW_DEFAULT);
	const [consistencyMetric, setConsistencyMetric] = useState<ConsistencyMetric>(
		CONSISTENCY_METRIC_DEFAULT,
	);
	const [healthMetric, setHealthMetric] = useState<EventHealthMetric>(
		EVENT_HEALTH_METRIC_DEFAULT,
	);

	const hasEnough = championshipTrendsHasEnoughEnded(events);
	const windowEvents = useMemo(
		() => championshipTrendsEvents(events, window),
		[events, window],
	);
	const formRows = useMemo(
		() => championshipRecentForm(players, windowEvents),
		[players, windowEvents],
	);
	const goalkeeperRows = useMemo(
		() => championshipGoalkeeperRanking(players, windowEvents),
		[players, windowEvents],
	);
	const consistencyPoints = useMemo(
		() => championshipConsistencyPoints(players, events, consistencyMetric),
		[players, events, consistencyMetric],
	);
	const consistencyEmpty = championshipConsistencyEmptyLabel(consistencyPoints);
	const health = useMemo(
		() => championshipEventHealth(windowEvents),
		[windowEvents],
	);
	const healthChart = useMemo(
		() => championshipEventHealthChart(health, healthMetric),
		[health, healthMetric],
	);

	return (
		<SectionCard
			title={CHAMPIONSHIP_TAB_LABEL.trends}
			icon={<TrendingUp className="size-4 text-pitch-fg" />}
			queryKey={CHAMPIONSHIP_EVENTS_QUERY_KEY}
		>
			<div className="mb-4 space-y-2">
				<p className="text-xs font-medium text-fg-muted">
					{TRENDS_WINDOW_LABEL.filter}
				</p>
				<div className="flex flex-wrap gap-2">
					{TRENDS_WINDOW_OPTIONS.map((option) => (
						<button
							key={option}
							type="button"
							className={filterChipClass(option === window)}
							onClick={() => {
								setWindow(parseTrendsWindow(option));
							}}
						>
							{trendsWindowCaption(option)}
						</button>
					))}
				</div>
				<p className="text-xs text-fg-muted">
					{TRENDS_WINDOW_LABEL.windowCaption}
				</p>
			</div>

			{!hasEnough && (
				<EmptyState
					icon={<TrendingUp className="size-10" />}
					title={TRENDS_WINDOW_LABEL.empty}
				/>
			)}

			{hasEnough && (
				<div className="space-y-10">
					<section className="space-y-3">
						<div className="flex items-center gap-2">
							<ChartColumn className="size-4 text-pitch-fg" />
							<h3 className="text-sm font-semibold text-fg">
								{RECENT_FORM_LABEL.title}
							</h3>
						</div>
						<p className="text-sm text-fg-muted">{RECENT_FORM_LABEL.hint}</p>
						{formRows.length === 0 && (
							<p className="text-sm text-fg-muted">{RECENT_FORM_LABEL.empty}</p>
						)}
						{formRows.length > 0 && <RecentFormTable rows={formRows} />}
					</section>

					<section className="space-y-3">
						<div className="flex items-center gap-2">
							<Shield className="size-4 text-pitch-fg" />
							<h3 className="text-sm font-semibold text-fg">
								{GOALKEEPER_RANKING_LABEL.title}
							</h3>
						</div>
						<p className="text-sm text-fg-muted">
							{GOALKEEPER_RANKING_LABEL.hint}
						</p>
						<p className="text-xs text-fg-muted">
							{GOALKEEPER_RANKING_LABEL.winRateHint}
						</p>
						{goalkeeperRows.length === 0 && (
							<p className="text-sm text-fg-muted">
								{GOALKEEPER_RANKING_LABEL.empty}
							</p>
						)}
						{goalkeeperRows.length > 0 && (
							<GoalkeeperTable rows={goalkeeperRows} />
						)}
					</section>

					<section className="space-y-3">
						<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
							<div className="space-y-1">
								<div className="flex items-center gap-2">
									<Goal className="size-4 text-pitch-fg" />
									<h3 className="text-sm font-semibold text-fg">
										{CONSISTENCY_LABEL.title}
									</h3>
								</div>
								<p className="text-sm text-fg-muted">
									{CONSISTENCY_LABEL.hint}
								</p>
								<p className="text-xs text-fg-muted">
									{TRENDS_WINDOW_LABEL.allEndedCaption}
								</p>
							</div>
							<label className="block text-xs text-fg-muted">
								{CONSISTENCY_LABEL.filter}
								<select
									value={consistencyMetric}
									className={`mt-1 ${FIELD_CLASS}`}
									onChange={(event) => {
										setConsistencyMetric(
											parseConsistencyMetric(event.target.value),
										);
									}}
								>
									{CONSISTENCY_METRIC_OPTIONS.map((option) => (
										<option key={option} value={option}>
											{consistencyMetricCaption(option)}
										</option>
									))}
								</select>
							</label>
						</div>
						{consistencyEmpty && (
							<p className="text-sm text-fg-muted">{consistencyEmpty}</p>
						)}
						{!consistencyEmpty && (
							<Suspense
								fallback={
									<SkeletonRegion label={SKELETON_LABEL.chart}>
										<div style={{ height: CONSISTENCY_CHART.height }}>
											<Skeleton className="h-full w-full" />
										</div>
									</SkeletonRegion>
								}
							>
								<ChampionshipConsistencyScatterChart
									points={consistencyPoints}
									metric={consistencyMetric}
								/>
							</Suspense>
						)}
					</section>

					<section className="space-y-3">
						<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
							<div className="space-y-1">
								<div className="flex items-center gap-2">
									<LineChartIcon className="size-4 text-pitch-fg" />
									<h3 className="text-sm font-semibold text-fg">
										{EVENT_HEALTH_LABEL.title}
									</h3>
								</div>
								<p className="text-sm font-medium text-fg">
									{eventHealthMetricCaption(healthMetric)}
								</p>
								<p className="text-sm text-fg-muted">
									{eventHealthMetricHint(healthMetric)}
								</p>
							</div>
							<label className="block max-w-xs text-xs text-fg-muted">
								{EVENT_HEALTH_LABEL.filter}
								<select
									value={healthMetric}
									className={`mt-1 ${FIELD_CLASS}`}
									onChange={(event) => {
										setHealthMetric(parseEventHealthMetric(event.target.value));
									}}
								>
									{EVENT_HEALTH_METRIC_OPTIONS.map((option) => (
										<option key={option} value={option}>
											{eventHealthMetricCaption(option)}
										</option>
									))}
								</select>
							</label>
						</div>
						{health.events === 0 && (
							<p className="text-sm text-fg-muted">
								{EVENT_HEALTH_LABEL.empty}
							</p>
						)}
						{health.events > 0 && (
							<>
								<div className="grid grid-cols-2 gap-3">
									<div>
										<p className="text-xs font-medium text-fg-muted">
											{EVENT_HEALTH_LABEL.avgMatches}
										</p>
										<p className="text-lg font-semibold tabular-nums text-fg">
											{formatEventHealthKpi("matches", health)}
										</p>
									</div>
									<div>
										<p className="text-xs font-medium text-fg-muted">
											{EVENT_HEALTH_LABEL.avgSpread}
										</p>
										<p className="text-lg font-semibold tabular-nums text-fg">
											{formatEventHealthKpi("spread", health)}
										</p>
									</div>
								</div>
								<Suspense
									fallback={
										<SkeletonRegion label={SKELETON_LABEL.chart}>
											<div style={{ height: EVENT_HEALTH_CHART.height }}>
												<Skeleton className="h-full w-full" />
											</div>
										</SkeletonRegion>
									}
								>
									<ChampionshipEventHealthChart
										points={healthChart}
										metric={healthMetric}
									/>
								</Suspense>
							</>
						)}
					</section>
				</div>
			)}
		</SectionCard>
	);
}
