import { createColumnHelper } from "@tanstack/react-table";
import {
	ArrowDown,
	ArrowRight,
	ArrowUp,
	ChartColumn,
	ChartScatter,
	Goal,
	Grid2x2,
	LineChart as LineChartIcon,
	LoaderCircle,
	Scale,
	Share2,
	Shield,
	TrendingUp,
	Users,
} from "lucide-react";
import { lazy, Suspense, useMemo, useState } from "react";
import { Skeleton, SkeletonRegion } from "@/components/atoms/skeleton";
import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { PlayerNameLink } from "@/components/molecules/player-name-link";
import {
	DataTable,
	type DataTableFeatures,
} from "@/components/organisms/data-table";
import { SectionCard } from "@/components/section-card";
import {
	ATTENDANCE_TREND_LABEL,
	ATTENDANCE_TREND_METRIC_DEFAULT,
	ATTENDANCE_TREND_METRIC_OPTIONS,
	type AttendanceTrendMetric,
	attendanceTrendMetricCaption,
	championshipAttendanceTrend,
	championshipAttendanceTrendChart,
	formatAttendanceTrendChartValue,
	formatAttendanceTrendKpi,
	parseAttendanceTrendMetric,
} from "@/const/championship-attendance-trend";
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
	CONTRIBUTION_CHART,
	CONTRIBUTION_LABEL,
	CONTRIBUTION_METRIC_DEFAULT,
	CONTRIBUTION_METRIC_OPTIONS,
	type ContributionMetric,
	championshipContribution,
	championshipContributionEmptyLabel,
	contributionInsights,
	contributionMetricCaption,
	contributionSubtitle,
	formatContributionCount,
	formatContributionMetricValue,
	formatContributionWinRate,
	type PlayerContributionPoint,
	parseContributionMetric,
} from "@/const/championship-contribution";
import {
	BALANCE_INDEX_CHART,
	BALANCE_INDEX_LABEL,
	calculateChampionshipBalanceIndex,
	championshipBalanceHistoryChart,
	formatBalanceIndexScore,
	goalDifferenceDistribution,
} from "@/const/championship-event-balance-index";
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
	championshipFormHeatmap,
	FORM_HEATMAP_LABEL,
} from "@/const/championship-form-heatmap";
import {
	championshipFirstGoalOutcome,
	championshipGoalMinuteHistogram,
	championshipGoalScoreStateScatter,
	championshipGoalTimeline,
	formatGoalTimelineCoverage,
	formatGoalTimelineFirstGoal,
	formatGoalTimelineLateShare,
	GOAL_TIMELINE_LABEL,
} from "@/const/championship-goal-timeline";
import {
	championshipGoalkeeperRanking,
	formatGoalkeeperAverage,
	formatGoalkeeperCount,
	formatGoalkeeperWinRate,
	GOALKEEPER_RANKING_LABEL,
	type GoalkeeperRankingRow,
	goalkeeperTrendLabel,
} from "@/const/championship-goalkeeper-ranking";
import {
	championshipPerformanceMap,
	championshipPerformanceMapEmptyLabel,
	championshipPerformanceMapVisible,
	formatPerformanceMapCount,
	formatPerformanceMapGap,
	formatPerformanceMapProjectedNext,
	formatPerformanceMapProjectedStable,
	formatPerformanceMapRate,
	formatPerformanceMapRating,
	PERFORMANCE_MAP_CHART,
	PERFORMANCE_MAP_COLOR,
	PERFORMANCE_MAP_COLUMN,
	PERFORMANCE_MAP_LABEL,
	PERFORMANCE_MAP_LEGEND_STATES,
	PERFORMANCE_MAP_STATE,
	PERFORMANCE_MAP_WINDOW_DEFAULT,
	PERFORMANCE_MAP_WINDOW_OPTIONS,
	type PerformanceMapPoint,
	type PerformanceMapWindow,
	parsePerformanceMapWindow,
	performanceMapGapReading,
	performanceMapStateLabel,
	performanceMapWindowCaption,
} from "@/const/championship-performance-map";
import {
	CHAMPIONSHIP_RATING_HISTORY_CHART,
	endedChampionshipHistoryEvents,
} from "@/const/championship-rating-history";
import {
	championshipRatingInflation,
	championshipRatingInflationChart,
	RATING_INFLATION_CHART,
	RATING_INFLATION_LABEL,
} from "@/const/championship-rating-inflation";
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
import {
	championshipRoundGoals,
	championshipRoundGoalsChart,
	formatRoundGoalsChartValue,
	formatRoundGoalsKpi,
	ROUND_GOALS_LABEL,
} from "@/const/championship-round-goals";
import { CHAMPIONSHIP_TAB_LABEL } from "@/const/championship-tab";
import { TREND_LINE_CHART } from "@/const/championship-trend-line-chart";
import { trendsAudiencePlayerScope } from "@/const/championship-trends-player-scope";
import {
	championshipTrendsEvents,
	championshipTrendsHasEnoughEnded,
	parseTrendsAudience,
	parseTrendsWindow,
	TRENDS_AUDIENCE_DEFAULT,
	TRENDS_AUDIENCE_LABEL,
	TRENDS_AUDIENCE_OPTIONS,
	TRENDS_RATING_HISTORY_LABEL,
	TRENDS_WINDOW_DEFAULT,
	TRENDS_WINDOW_LABEL,
	TRENDS_WINDOW_OPTIONS,
	type TrendsAudience,
	type TrendsWindow,
	trendsAudienceCaption,
	trendsAudiencePlayers,
	trendsHasMonthlyPlayers,
	trendsSectionEmptyLabel,
	trendsWindowCaption,
} from "@/const/championship-trends-window";
import {
	EVENT_BALANCE_INDEX_CSV_HEADERS,
	EVENT_BALANCE_INDEX_SHARE_LABEL,
	eventBalanceIndexCsvFileName,
	eventBalanceIndexCsvRows,
	eventBalanceIndexShareCard,
	eventBalanceIndexShareContext,
} from "@/const/event-balance-index-share";
import {
	FORM_HEATMAP_SHARE_LABEL,
	formHeatmapShareCard,
	formHeatmapShareContext,
} from "@/const/form-heatmap-share";
import {
	calculatePlayersRatingAlignment,
	PLAYER_RATING_ALIGNMENT_LABEL,
	RATING_ALIGNMENT_CHART,
	ratingAlignmentChartPoints,
} from "@/const/player-rating-alignment";
import {
	RATING_INFLATION_SHARE_LABEL,
	ratingInflationShareCard,
	ratingInflationShareContext,
} from "@/const/rating-inflation-share";
import { ROSTER_COLUMN } from "@/const/roster-stats";
import { SKELETON_LABEL } from "@/const/skeleton";
import { BUTTON_VARIANT, ERROR_CLASS, FIELD_CLASS } from "@/const/ui";
import { CHAMPIONSHIP_EVENTS_QUERY_KEY } from "@/hooks/championships/championships-query-keys";
import { buildCsv, shareCsvText } from "@/lib/share-csv";
import { shareEventBalanceIndexImage } from "@/lib/share-event-balance-index-image";
import { shareFormHeatmapImage } from "@/lib/share-form-heatmap-image";
import { shareRatingInflationImage } from "@/lib/share-rating-inflation-image";
import type { ChampionshipPlayer } from "@/types/championship";
import type { ChampionshipEvent } from "@/types/championship-event";

const ChampionshipFormHeatmap = lazy(() =>
	import("@/components/molecules/championship-form-heatmap").then((m) => ({
		default: m.ChampionshipFormHeatmap,
	})),
);

const ChampionshipMetricHistoryChart = lazy(() =>
	import("@/components/molecules/championship-rating-history-chart").then(
		(m) => ({
			default: m.ChampionshipMetricHistoryChart,
		}),
	),
);

const ChampionshipRatingInflationChart = lazy(() =>
	import("@/components/molecules/championship-rating-inflation-chart").then(
		(m) => ({ default: m.ChampionshipRatingInflationChart }),
	),
);

const ChampionshipPlayerRatingAlignmentChart = lazy(() =>
	import(
		"@/components/molecules/championship-player-rating-alignment-chart"
	).then((m) => ({ default: m.ChampionshipPlayerRatingAlignmentChart })),
);

const ChampionshipTrendLineChart = lazy(() =>
	import("@/components/molecules/championship-trend-line-chart").then((m) => ({
		default: m.ChampionshipTrendLineChart,
	})),
);

const ChampionshipConsistencyScatterChart = lazy(() =>
	import("@/components/molecules/championship-consistency-scatter-chart").then(
		(m) => ({ default: m.ChampionshipConsistencyScatterChart }),
	),
);

const ChampionshipContributionScatterChart = lazy(() =>
	import("@/components/molecules/championship-contribution-scatter-chart").then(
		(m) => ({ default: m.ChampionshipContributionScatterChart }),
	),
);

const ChampionshipPerformanceMapChart = lazy(() =>
	import("@/components/molecules/championship-performance-map-chart").then(
		(m) => ({ default: m.ChampionshipPerformanceMapChart }),
	),
);

const ChampionshipGoalMinuteHistogramChart = lazy(() =>
	import(
		"@/components/molecules/championship-goal-minute-histogram-chart"
	).then((m) => ({ default: m.ChampionshipGoalMinuteHistogramChart })),
);

const ChampionshipFirstGoalOutcomeChart = lazy(() =>
	import("@/components/molecules/championship-first-goal-outcome-chart").then(
		(m) => ({ default: m.ChampionshipFirstGoalOutcomeChart }),
	),
);

const ChampionshipGoalScoreStateChart = lazy(() =>
	import("@/components/molecules/championship-goal-score-state-chart").then(
		(m) => ({ default: m.ChampionshipGoalScoreStateChart }),
	),
);

const ChampionshipEventHealthChart = lazy(() =>
	import("@/components/molecules/championship-event-health-chart").then(
		(m) => ({ default: m.ChampionshipEventHealthChart }),
	),
);

const ChampionshipEventBalanceIndex = lazy(() =>
	import("@/components/molecules/championship-event-balance-index").then(
		(m) => ({ default: m.ChampionshipEventBalanceIndex }),
	),
);

const ChampionshipBalanceHistory = lazy(() =>
	import("@/components/molecules/championship-balance-history").then((m) => ({
		default: m.ChampionshipBalanceHistory,
	})),
);

const ChampionshipGoalDifferenceDistribution = lazy(() =>
	import(
		"@/components/molecules/championship-goal-difference-distribution"
	).then((m) => ({ default: m.ChampionshipGoalDifferenceDistribution })),
);

const ChampionshipBalancePredictedVsRealized = lazy(() =>
	import(
		"@/components/molecules/championship-balance-predicted-vs-realized"
	).then((m) => ({ default: m.ChampionshipBalancePredictedVsRealized })),
);

const ChampionshipPredictedVsRealized = lazy(() =>
	import("@/components/championship/championship-predicted-vs-realized").then(
		(m) => ({ default: m.ChampionshipPredictedVsRealized }),
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

const performanceMapColumnHelper = createColumnHelper<
	DataTableFeatures,
	PerformanceMapPoint
>();

const goalkeeperColumnHelper = createColumnHelper<
	DataTableFeatures,
	GoalkeeperRankingRow
>();

const contributionColumnHelper = createColumnHelper<
	DataTableFeatures,
	PlayerContributionPoint
>();

type ChampionshipTrendsTabProps = {
	championshipId: number;
	championshipName: string;
	players: ChampionshipPlayer[];
	events: readonly ChampionshipEvent[];
};

function RecentFormTrendIcon({ trend }: { trend: RecentFormRow["trend"] }) {
	switch (trend) {
		case RECENT_FORM_TREND.up:
			return <ArrowUp className="size-3.5 text-pitch-fg" aria-hidden />;
		case RECENT_FORM_TREND.down:
			return <ArrowDown className="size-3.5 text-danger-fg" aria-hidden />;
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

function PerformanceMapStateIcon({
	state,
}: {
	state: PerformanceMapPoint["state"];
}) {
	switch (state) {
		case PERFORMANCE_MAP_STATE.rising:
			return <ArrowUp className="size-3.5 text-pitch-fg" aria-hidden />;
		case PERFORMANCE_MAP_STATE.onLevel:
			return <ArrowUp className="size-3.5 text-amber-500" aria-hidden />;
		case PERFORMANCE_MAP_STATE.elite:
			return <ArrowUp className="size-3.5 text-amber-700" aria-hidden />;
		case PERFORMANCE_MAP_STATE.falling:
			return <ArrowDown className="size-3.5 text-danger-fg" aria-hidden />;
		case PERFORMANCE_MAP_STATE.low:
			return <ArrowDown className="size-3.5 text-fg-muted" aria-hidden />;
		case PERFORMANCE_MAP_STATE.neutral:
			return <ArrowRight className="size-3.5 text-fg-muted" aria-hidden />;
		case PERFORMANCE_MAP_STATE.few_matches:
			return <ArrowRight className="size-3.5 text-fg-muted" aria-hidden />;
		case PERFORMANCE_MAP_STATE.unrated:
			return <ArrowRight className="size-3.5 text-fg-muted" aria-hidden />;
		default: {
			const _never: never = state;
			return _never;
		}
	}
}

function PerformanceMapTable({
	points,
	players,
}: {
	points: PerformanceMapPoint[];
	players: readonly ChampionshipPlayer[];
}) {
	const playersById = useMemo(() => {
		const map = new Map<number, ChampionshipPlayer>();
		for (const player of players) {
			map.set(player.id, player);
		}
		return map;
	}, [players]);

	const columns = useMemo(
		() =>
			performanceMapColumnHelper.columns([
				performanceMapColumnHelper.accessor("name", {
					id: PERFORMANCE_MAP_COLUMN.player,
					header: "Jog",
					enableHiding: false,
					meta: { title: PERFORMANCE_MAP_LABEL.player },
					cell: ({ row }) => {
						const player = playersById.get(row.original.playerId);
						if (!player) {
							return row.original.name;
						}

						return <PlayerNameLink player={player} />;
					},
				}),
				performanceMapColumnHelper.accessor("rating", {
					id: PERFORMANCE_MAP_COLUMN.rating,
					header: PERFORMANCE_MAP_LABEL.rating,
					meta: {
						align: "right" as const,
						title: PERFORMANCE_MAP_LABEL.rating,
					},
					cell: ({ row }) => (
						<span className="tabular-nums">
							{formatPerformanceMapRating(row.original.rating)}
						</span>
					),
				}),
				performanceMapColumnHelper.accessor("projectedNext", {
					id: PERFORMANCE_MAP_COLUMN.projectedNext,
					header: PERFORMANCE_MAP_LABEL.projectedNext,
					meta: {
						align: "right" as const,
						title: PERFORMANCE_MAP_LABEL.projectedNextHint,
					},
					cell: ({ row }) => (
						<span
							className="tabular-nums"
							title={formatPerformanceMapProjectedNext(row.original)}
						>
							{formatPerformanceMapRating(row.original.projectedNext)}
						</span>
					),
				}),
				performanceMapColumnHelper.accessor("projectedStable", {
					id: PERFORMANCE_MAP_COLUMN.projectedStable,
					header: PERFORMANCE_MAP_LABEL.projectedStable,
					meta: {
						align: "right" as const,
						title: PERFORMANCE_MAP_LABEL.projectedStableHint,
					},
					cell: ({ row }) => (
						<span
							className="tabular-nums"
							title={formatPerformanceMapProjectedStable(row.original)}
						>
							{formatPerformanceMapRating(row.original.projectedStable)}
							{row.original.projectedRounds > 0 && (
								<span className="text-fg-muted">
									{" "}
									({formatPerformanceMapCount(row.original.projectedRounds)})
								</span>
							)}
						</span>
					),
				}),
				performanceMapColumnHelper.accessor("rate", {
					id: PERFORMANCE_MAP_COLUMN.rate,
					header: "Apr",
					meta: {
						align: "right" as const,
						title: PERFORMANCE_MAP_LABEL.rate,
					},
					cell: ({ row }) => (
						<span className="tabular-nums">
							{formatPerformanceMapRate(row.original.rate)}
						</span>
					),
				}),
				performanceMapColumnHelper.accessor("matches", {
					id: PERFORMANCE_MAP_COLUMN.matches,
					header: PERFORMANCE_MAP_LABEL.matches,
					meta: {
						align: "right" as const,
						title: PERFORMANCE_MAP_LABEL.matches,
					},
					cell: ({ row }) => (
						<span className="tabular-nums">
							{formatPerformanceMapCount(row.original.matches)}
						</span>
					),
				}),
				performanceMapColumnHelper.accessor("gap", {
					id: PERFORMANCE_MAP_COLUMN.gap,
					header: PERFORMANCE_MAP_LABEL.gap,
					meta: {
						align: "right" as const,
						title: PERFORMANCE_MAP_LABEL.gapHint,
					},
					cell: ({ row }) => (
						<span
							className="tabular-nums"
							title={performanceMapGapReading(row.original)}
						>
							{formatPerformanceMapGap(row.original.gap)}
						</span>
					),
				}),
				performanceMapColumnHelper.accessor("state", {
					id: PERFORMANCE_MAP_COLUMN.state,
					header: PERFORMANCE_MAP_LABEL.state,
					meta: { title: PERFORMANCE_MAP_LABEL.state },
					cell: ({ row }) => (
						<span className="inline-flex items-center gap-1 text-xs font-medium text-fg">
							<span
								className="inline-block size-2 rounded-full"
								style={{ backgroundColor: row.original.color }}
								aria-hidden
							/>
							<PerformanceMapStateIcon state={row.original.state} />
							{performanceMapStateLabel(row.original.state)}
						</span>
					),
				}),
			]),
		[playersById],
	);

	return (
		<DataTable
			data={points}
			columns={columns}
			getRowId={(row) => String(row.playerId)}
		/>
	);
}

function ContributionTable({
	points,
	metric,
}: {
	points: PlayerContributionPoint[];
	metric: ContributionMetric;
}) {
	const columns = useMemo(
		() =>
			contributionColumnHelper.columns([
				contributionColumnHelper.accessor("name", {
					id: "player",
					header: "Jog",
					enableHiding: false,
					meta: { title: "Jogador" },
					cell: ({ row }) => <PlayerNameLink player={row.original.player} />,
				}),
				contributionColumnHelper.accessor("winRate", {
					id: "winRate",
					header: CONTRIBUTION_LABEL.winRate,
					meta: {
						align: "right" as const,
						title: CONTRIBUTION_LABEL.winRate,
					},
					cell: ({ row }) => (
						<span className="tabular-nums">
							{formatContributionWinRate(row.original.winRate)}
						</span>
					),
				}),
				contributionColumnHelper.accessor("selectedMetric", {
					id: "metric",
					header: contributionMetricCaption(metric),
					meta: {
						align: "right" as const,
						title: contributionMetricCaption(metric),
					},
					cell: ({ row }) => (
						<span className="tabular-nums">
							{formatContributionMetricValue(
								metric,
								row.original.selectedMetric,
							)}
						</span>
					),
				}),
				contributionColumnHelper.accessor("games", {
					id: "games",
					header: CONTRIBUTION_LABEL.games,
					meta: {
						align: "right" as const,
						title: CONTRIBUTION_LABEL.games,
					},
					cell: ({ row }) => (
						<span className="tabular-nums">
							{formatContributionCount(row.original.games)}
						</span>
					),
				}),
				contributionColumnHelper.accessor("goals", {
					id: "goals",
					header: "G",
					meta: {
						align: "right" as const,
						title: CONTRIBUTION_LABEL.goals,
					},
					cell: ({ row }) => (
						<span className="tabular-nums">
							{formatContributionCount(row.original.goals)}
						</span>
					),
				}),
				contributionColumnHelper.accessor("assists", {
					id: "assists",
					header: "A",
					meta: {
						align: "right" as const,
						title: CONTRIBUTION_LABEL.assists,
					},
					cell: ({ row }) => (
						<span className="tabular-nums">
							{formatContributionCount(row.original.assists)}
						</span>
					),
				}),
				contributionColumnHelper.accessor("mvps", {
					id: "mvps",
					header: CONTRIBUTION_LABEL.mvps,
					meta: {
						align: "right" as const,
						title: CONTRIBUTION_LABEL.mvps,
					},
					cell: ({ row }) => (
						<span className="tabular-nums">
							{formatContributionCount(row.original.mvps)}
						</span>
					),
				}),
			]),
		[metric],
	);

	return (
		<DataTable
			data={points}
			columns={columns}
			getRowId={(row) => String(row.playerId)}
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
				goalkeeperColumnHelper.accessor("cleanSheets", {
					id: "cleanSheets",
					header: "CS",
					meta: {
						align: "right" as const,
						title: GOALKEEPER_RANKING_LABEL.cleanSheets,
					},
					cell: ({ row }) => (
						<span className="tabular-nums">
							{formatGoalkeeperCount(row.original.cleanSheets)}
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
				goalkeeperColumnHelper.accessor("trend", {
					id: "trend",
					header: GOALKEEPER_RANKING_LABEL.trend,
					meta: { title: GOALKEEPER_RANKING_LABEL.trend },
					cell: ({ row }) => (
						<span className="text-xs text-fg-muted">
							{goalkeeperTrendLabel(row.original.trend)}
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

export function ChampionshipTrendsTab({
	championshipId,
	championshipName,
	players,
	events,
}: ChampionshipTrendsTabProps) {
	const [window, setWindow] = useState<TrendsWindow>(TRENDS_WINDOW_DEFAULT);
	const [audience, setAudience] = useState<TrendsAudience>(
		TRENDS_AUDIENCE_DEFAULT,
	);
	const [attendanceMetric, setAttendanceMetric] =
		useState<AttendanceTrendMetric>(ATTENDANCE_TREND_METRIC_DEFAULT);
	const [consistencyMetric, setConsistencyMetric] = useState<ConsistencyMetric>(
		CONSISTENCY_METRIC_DEFAULT,
	);
	const [performanceWindow, setPerformanceWindow] =
		useState<PerformanceMapWindow>(PERFORMANCE_MAP_WINDOW_DEFAULT);
	const [showFewMatches, setShowFewMatches] = useState(false);
	const [showPerformanceNames, setShowPerformanceNames] = useState(false);
	const [contributionMetric, setContributionMetric] =
		useState<ContributionMetric>(CONTRIBUTION_METRIC_DEFAULT);
	const [showContributionBelowMin, setShowContributionBelowMin] =
		useState(false);
	const [showContributionTable, setShowContributionTable] = useState(true);
	const [healthMetric, setHealthMetric] = useState<EventHealthMetric>(
		EVENT_HEALTH_METRIC_DEFAULT,
	);
	const [isSharingHeatmap, setIsSharingHeatmap] = useState(false);
	const [heatmapShareError, setHeatmapShareError] = useState<string | null>(
		null,
	);
	const [isSharingInflation, setIsSharingInflation] = useState(false);
	const [inflationShareError, setInflationShareError] = useState<string | null>(
		null,
	);
	const [isSharingBalance, setIsSharingBalance] = useState(false);
	const [isSharingBalanceCsv, setIsSharingBalanceCsv] = useState(false);
	const [balanceShareError, setBalanceShareError] = useState<string | null>(
		null,
	);

	const hasEnough = championshipTrendsHasEnoughEnded(events);
	const hasMonthlyPlayers = useMemo(
		() => trendsHasMonthlyPlayers(players),
		[players],
	);
	const scopedPlayers = useMemo(
		() => trendsAudiencePlayers(players, audience),
		[players, audience],
	);
	const scopedPlayerIds = useMemo(
		() => trendsAudiencePlayerScope(players, audience),
		[players, audience],
	);
	const windowEvents = useMemo(
		() => championshipTrendsEvents(events, window),
		[events, window],
	);
	const allEndedEvents = useMemo(
		() => endedChampionshipHistoryEvents(events),
		[events],
	);
	const attendance = useMemo(
		() => championshipAttendanceTrend(allEndedEvents, players, scopedPlayerIds),
		[allEndedEvents, players, scopedPlayerIds],
	);
	const attendanceChart = useMemo(
		() => championshipAttendanceTrendChart(attendance, attendanceMetric),
		[attendance, attendanceMetric],
	);
	const inflation = useMemo(
		() => championshipRatingInflation(players, allEndedEvents, scopedPlayerIds),
		[players, allEndedEvents, scopedPlayerIds],
	);
	const inflationChart = useMemo(
		() => championshipRatingInflationChart(inflation),
		[inflation],
	);
	const formRows = useMemo(
		() => championshipRecentForm(scopedPlayers, windowEvents),
		[scopedPlayers, windowEvents],
	);
	const performanceMap = useMemo(
		() => championshipPerformanceMap(scopedPlayers, events, performanceWindow),
		[scopedPlayers, events, performanceWindow],
	);
	const performancePoints = useMemo(
		() => championshipPerformanceMapVisible(performanceMap, showFewMatches),
		[performanceMap, showFewMatches],
	);
	const performanceEmpty =
		championshipPerformanceMapEmptyLabel(performancePoints);
	const contributionPoints = useMemo(
		() =>
			championshipContribution({
				players,
				events,
				window,
				audience,
				metric: contributionMetric,
				includeBelowMin: showContributionBelowMin,
			}),
		[
			players,
			events,
			window,
			audience,
			contributionMetric,
			showContributionBelowMin,
		],
	);
	const contributionEmpty = championshipContributionEmptyLabel(
		contributionPoints,
		contributionMetric,
		showContributionBelowMin,
	);
	const contributionInsightRows = useMemo(
		() => contributionInsights(contributionPoints),
		[contributionPoints],
	);
	const goalkeeperRows = useMemo(
		() => championshipGoalkeeperRanking(scopedPlayers, windowEvents),
		[scopedPlayers, windowEvents],
	);
	const consistencyPoints = useMemo(
		() =>
			championshipConsistencyPoints(scopedPlayers, events, consistencyMetric),
		[scopedPlayers, events, consistencyMetric],
	);
	const consistencyEmpty = championshipConsistencyEmptyLabel(consistencyPoints);
	const alignmentChartPoints = useMemo(() => {
		const rows = calculatePlayersRatingAlignment(scopedPlayers, allEndedEvents);
		return ratingAlignmentChartPoints(rows, scopedPlayers);
	}, [scopedPlayers, allEndedEvents]);
	const formHeatmap = useMemo(
		() => championshipFormHeatmap(scopedPlayers, windowEvents),
		[scopedPlayers, windowEvents],
	);
	const roundGoals = useMemo(
		() => championshipRoundGoals(windowEvents, scopedPlayerIds),
		[windowEvents, scopedPlayerIds],
	);
	const roundGoalsChart = useMemo(
		() => championshipRoundGoalsChart(roundGoals),
		[roundGoals],
	);
	const goalTimeline = useMemo(
		() => championshipGoalTimeline(windowEvents, scopedPlayerIds),
		[windowEvents, scopedPlayerIds],
	);
	const goalMinuteHistogram = useMemo(
		() => championshipGoalMinuteHistogram(windowEvents, scopedPlayerIds),
		[windowEvents, scopedPlayerIds],
	);
	const firstGoalOutcome = useMemo(
		() => championshipFirstGoalOutcome(windowEvents, scopedPlayerIds),
		[windowEvents, scopedPlayerIds],
	);
	const goalScoreStateScatter = useMemo(
		() => championshipGoalScoreStateScatter(windowEvents, scopedPlayerIds),
		[windowEvents, scopedPlayerIds],
	);
	const health = useMemo(
		() => championshipEventHealth(windowEvents, scopedPlayerIds),
		[windowEvents, scopedPlayerIds],
	);
	const healthChart = useMemo(
		() => championshipEventHealthChart(health, healthMetric),
		[health, healthMetric],
	);
	const balanceIndex = useMemo(
		() => calculateChampionshipBalanceIndex(windowEvents),
		[windowEvents],
	);
	const balanceHistoryChart = useMemo(
		() => championshipBalanceHistoryChart(balanceIndex.history),
		[balanceIndex.history],
	);
	const balanceGoalDiff = useMemo(
		() => goalDifferenceDistribution(windowEvents),
		[windowEvents],
	);

	async function handleShareHeatmap() {
		setIsSharingHeatmap(true);
		setHeatmapShareError(null);
		const context = formHeatmapShareContext([
			trendsWindowCaption(window),
			audience === TRENDS_AUDIENCE_DEFAULT
				? null
				: trendsAudienceCaption(audience),
		]);
		try {
			await shareFormHeatmapImage(
				formHeatmapShareCard(formHeatmap, championshipName, context),
			);
		} catch {
			setHeatmapShareError(FORM_HEATMAP_SHARE_LABEL.shareFailed);
		} finally {
			setIsSharingHeatmap(false);
		}
	}

	async function handleShareInflation() {
		setIsSharingInflation(true);
		setInflationShareError(null);
		const context = ratingInflationShareContext([
			TRENDS_WINDOW_LABEL.allEndedCaption,
			audience === TRENDS_AUDIENCE_DEFAULT
				? null
				: trendsAudienceCaption(audience),
		]);
		try {
			await shareRatingInflationImage(
				ratingInflationShareCard(inflation, championshipName, context),
			);
		} catch {
			setInflationShareError(RATING_INFLATION_SHARE_LABEL.shareFailed);
		} finally {
			setIsSharingInflation(false);
		}
	}

	async function handleShareBalance() {
		const current = balanceIndex.current;
		if (!current) {
			return;
		}

		setIsSharingBalance(true);
		setBalanceShareError(null);
		const context = eventBalanceIndexShareContext([
			trendsWindowCaption(window),
		]);
		try {
			await shareEventBalanceIndexImage(
				eventBalanceIndexShareCard(current, championshipName, context),
			);
		} catch {
			setBalanceShareError(EVENT_BALANCE_INDEX_SHARE_LABEL.shareFailed);
		} finally {
			setIsSharingBalance(false);
		}
	}

	async function handleShareBalanceCsv() {
		if (balanceIndex.history.length === 0) {
			return;
		}

		setIsSharingBalanceCsv(true);
		setBalanceShareError(null);
		try {
			await shareCsvText(
				eventBalanceIndexCsvFileName({
					championshipName,
					generatedAt: new Date().toISOString(),
				}),
				buildCsv(
					EVENT_BALANCE_INDEX_CSV_HEADERS,
					eventBalanceIndexCsvRows(balanceIndex),
				),
				EVENT_BALANCE_INDEX_SHARE_LABEL.shareCsv,
			);
		} catch {
			setBalanceShareError(EVENT_BALANCE_INDEX_SHARE_LABEL.shareFailed);
		} finally {
			setIsSharingBalanceCsv(false);
		}
	}

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
				{hasMonthlyPlayers && (
					<>
						<p className="text-xs font-medium text-fg-muted">
							{TRENDS_AUDIENCE_LABEL.filter}
						</p>
						<div className="flex flex-wrap gap-2">
							{TRENDS_AUDIENCE_OPTIONS.map((option) => (
								<button
									key={option}
									type="button"
									className={filterChipClass(option === audience)}
									onClick={() => {
										setAudience(parseTrendsAudience(option));
									}}
								>
									{trendsAudienceCaption(option)}
								</button>
							))}
						</div>
					</>
				)}
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
						<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
							<div className="space-y-1">
								<div className="flex items-center gap-2">
									<Users className="size-4 text-pitch-fg" />
									<h3 className="text-sm font-semibold text-fg">
										{ATTENDANCE_TREND_LABEL.title}
									</h3>
								</div>
								<p className="text-sm text-fg-muted">
									{ATTENDANCE_TREND_LABEL.hint}
								</p>
								<p className="text-xs text-fg-muted">
									{TRENDS_WINDOW_LABEL.allEndedCaption}
								</p>
							</div>
							<label className="block max-w-xs text-xs text-fg-muted">
								{ATTENDANCE_TREND_LABEL.filter}
								<select
									value={attendanceMetric}
									className={`mt-1 ${FIELD_CLASS}`}
									onChange={(event) => {
										setAttendanceMetric(
											parseAttendanceTrendMetric(event.target.value),
										);
									}}
								>
									{ATTENDANCE_TREND_METRIC_OPTIONS.map((option) => (
										<option key={option} value={option}>
											{attendanceTrendMetricCaption(option)}
										</option>
									))}
								</select>
							</label>
						</div>
						{attendance.events === 0 && (
							<p className="text-sm text-fg-muted">
								{trendsSectionEmptyLabel(
									audience,
									ATTENDANCE_TREND_LABEL.empty,
								)}
							</p>
						)}
						{attendance.events > 0 && (
							<>
								<div>
									<p className="text-xs font-medium text-fg-muted">
										{attendanceMetric === ATTENDANCE_TREND_METRIC_DEFAULT
											? ATTENDANCE_TREND_LABEL.avgPresent
											: ATTENDANCE_TREND_LABEL.avgShare}
									</p>
									<p className="text-lg font-semibold tabular-nums text-fg">
										{formatAttendanceTrendKpi(attendanceMetric, attendance)}
									</p>
								</div>
								<Suspense
									fallback={
										<SkeletonRegion label={SKELETON_LABEL.chart}>
											<div style={{ height: TREND_LINE_CHART.height }}>
												<Skeleton className="h-full w-full" />
											</div>
										</SkeletonRegion>
									}
								>
									<ChampionshipTrendLineChart
										points={attendanceChart}
										caption={attendanceTrendMetricCaption(attendanceMetric)}
										formatValue={(value) =>
											formatAttendanceTrendChartValue(attendanceMetric, value)
										}
									/>
								</Suspense>
							</>
						)}
					</section>

					<section className="space-y-3">
						<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
							<div className="space-y-1">
								<div className="flex items-center gap-2">
									<Scale className="size-4 text-pitch-fg" />
									<h3 className="text-sm font-semibold text-fg">
										{RATING_INFLATION_LABEL.title}
									</h3>
								</div>
								<p className="text-sm text-fg-muted">
									{RATING_INFLATION_LABEL.hint}
								</p>
								<p className="text-xs text-fg-muted">
									{TRENDS_WINDOW_LABEL.allEndedCaption}
								</p>
							</div>
							{inflation.events > 0 && (
								<Button
									variant={BUTTON_VARIANT.secondary}
									className="w-full sm:w-auto"
									disabled={isSharingInflation}
									onClick={() => {
										void handleShareInflation();
									}}
								>
									{isSharingInflation && (
										<LoaderCircle className="size-4 animate-spin" aria-hidden />
									)}
									{!isSharingInflation && <Share2 className="size-4" />}
									{isSharingInflation && RATING_INFLATION_SHARE_LABEL.sharing}
									{!isSharingInflation && RATING_INFLATION_SHARE_LABEL.share}
								</Button>
							)}
						</div>
						{inflationShareError && (
							<p className={ERROR_CLASS}>{inflationShareError}</p>
						)}
						{inflation.events === 0 && (
							<p className="text-sm text-fg-muted">
								{trendsSectionEmptyLabel(
									audience,
									RATING_INFLATION_LABEL.empty,
								)}
							</p>
						)}
						{inflation.events > 0 && (
							<Suspense
								fallback={
									<SkeletonRegion label={SKELETON_LABEL.chart}>
										<div style={{ height: RATING_INFLATION_CHART.height }}>
											<Skeleton className="h-full w-full" />
										</div>
									</SkeletonRegion>
								}
							>
								<ChampionshipRatingInflationChart points={inflationChart} />
							</Suspense>
						)}
					</section>

					<section className="space-y-3">
						<div className="space-y-1">
							<div className="flex items-center gap-2">
								<ChartScatter className="size-4 text-pitch-fg" />
								<h3 className="text-sm font-semibold text-fg">
									{PLAYER_RATING_ALIGNMENT_LABEL.chartTitle}
								</h3>
							</div>
							<p className="text-sm text-fg-muted">
								{PLAYER_RATING_ALIGNMENT_LABEL.hint}
							</p>
						</div>
						<Suspense
							fallback={
								<SkeletonRegion label={SKELETON_LABEL.chart}>
									<div style={{ height: RATING_ALIGNMENT_CHART.height }}>
										<Skeleton className="h-full w-full" />
									</div>
								</SkeletonRegion>
							}
						>
							<ChampionshipPlayerRatingAlignmentChart
								points={alignmentChartPoints}
							/>
						</Suspense>
					</section>

					<section className="space-y-3">
						<div className="space-y-1">
							<div className="flex items-center gap-2">
								<LineChartIcon className="size-4 text-pitch-fg" />
								<h3 className="text-sm font-semibold text-fg">
									{TRENDS_RATING_HISTORY_LABEL.title}
								</h3>
							</div>
							<p className="text-sm text-fg-muted">
								{TRENDS_RATING_HISTORY_LABEL.hint}
							</p>
						</div>
						<Suspense
							fallback={
								<SkeletonRegion label={SKELETON_LABEL.chart}>
									<div
										style={{ height: CHAMPIONSHIP_RATING_HISTORY_CHART.height }}
									>
										<Skeleton className="h-full w-full" />
									</div>
								</SkeletonRegion>
							}
						>
							<ChampionshipMetricHistoryChart
								metric={ROSTER_COLUMN.rating}
								players={scopedPlayers}
								events={windowEvents}
								championshipName={championshipName}
								nowIso={null}
							/>
						</Suspense>
					</section>

					<section className="space-y-3">
						<div className="flex items-center gap-2">
							<ChartColumn className="size-4 text-pitch-fg" />
							<h3 className="text-sm font-semibold text-fg">
								{RECENT_FORM_LABEL.title}
							</h3>
						</div>
						<p className="text-sm text-fg-muted">{RECENT_FORM_LABEL.hint}</p>
						{formRows.length === 0 && (
							<p className="text-sm text-fg-muted">
								{trendsSectionEmptyLabel(audience, RECENT_FORM_LABEL.empty)}
							</p>
						)}
						{formRows.length > 0 && <RecentFormTable rows={formRows} />}
					</section>

					<section className="space-y-3">
						<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
							<div className="space-y-1">
								<div className="flex items-center gap-2">
									<ChartScatter className="size-4 text-pitch-fg" />
									<h3 className="text-sm font-semibold text-fg">
										{PERFORMANCE_MAP_LABEL.title}
									</h3>
								</div>
								<p className="text-sm text-fg-muted">
									{PERFORMANCE_MAP_LABEL.subtitle}
								</p>
								<p className="text-sm text-fg-muted">
									{PERFORMANCE_MAP_LABEL.hint}
								</p>
							</div>
							<div className="flex flex-col gap-2 sm:items-end">
								<label className="block text-xs text-fg-muted">
									{PERFORMANCE_MAP_LABEL.filter}
									<select
										value={performanceWindow}
										className={`mt-1 ${FIELD_CLASS}`}
										onChange={(event) => {
											setPerformanceWindow(
												parsePerformanceMapWindow(event.target.value),
											);
										}}
									>
										{PERFORMANCE_MAP_WINDOW_OPTIONS.map((option) => (
											<option key={option} value={option}>
												{performanceMapWindowCaption(option)}
											</option>
										))}
									</select>
								</label>
								<label className="inline-flex items-center gap-2 text-xs text-fg-muted">
									<input
										type="checkbox"
										checked={showFewMatches}
										onChange={(event) => {
											setShowFewMatches(event.target.checked);
										}}
									/>
									{PERFORMANCE_MAP_LABEL.showFewMatches}
								</label>
								<label className="inline-flex items-center gap-2 text-xs text-fg-muted">
									<input
										type="checkbox"
										checked={showPerformanceNames}
										onChange={(event) => {
											setShowPerformanceNames(event.target.checked);
										}}
									/>
									{PERFORMANCE_MAP_LABEL.showNames}
								</label>
							</div>
						</div>
						{performanceEmpty && (
							<p className="text-sm text-fg-muted">
								{trendsSectionEmptyLabel(audience, performanceEmpty)}
							</p>
						)}
						{!performanceEmpty && (
							<>
								<Suspense
									fallback={
										<SkeletonRegion label={SKELETON_LABEL.chart}>
											<div style={{ height: PERFORMANCE_MAP_CHART.height }}>
												<Skeleton className="h-full w-full" />
											</div>
										</SkeletonRegion>
									}
								>
									<ChampionshipPerformanceMapChart
										points={performancePoints}
										median={performanceMap.median}
										showNames={showPerformanceNames}
									/>
								</Suspense>
								<p className="text-xs text-fg-muted">
									{PERFORMANCE_MAP_LABEL.medianLegend}
								</p>
								<p className="text-xs text-fg-muted">
									{PERFORMANCE_MAP_LABEL.gapExplain}
								</p>
								<p className="text-xs text-fg-muted">
									{PERFORMANCE_MAP_LABEL.projectExplain}
								</p>
								<div className="space-y-1">
									<p className="text-xs font-medium text-fg-muted">
										{PERFORMANCE_MAP_LABEL.colorLegend}
									</p>
									<ul className="flex flex-wrap gap-x-3 gap-y-1.5">
										{PERFORMANCE_MAP_LEGEND_STATES.map((state) => (
											<li
												key={state}
												className="inline-flex items-center gap-1.5 text-xs text-fg-muted"
											>
												<span
													className="inline-block size-2.5 shrink-0 rounded-full"
													style={{
														backgroundColor: PERFORMANCE_MAP_COLOR[state],
													}}
													aria-hidden
												/>
												{performanceMapStateLabel(state)}
											</li>
										))}
									</ul>
								</div>
								<PerformanceMapTable
									points={performancePoints}
									players={scopedPlayers}
								/>
							</>
						)}
					</section>

					<section className="space-y-3">
						<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
							<div className="space-y-1">
								<div className="flex items-center gap-2">
									<TrendingUp className="size-4 text-pitch-fg" />
									<h3 className="text-sm font-semibold text-fg">
										{CONTRIBUTION_LABEL.title}
									</h3>
								</div>
								<p className="text-sm font-medium text-fg">
									{contributionSubtitle(contributionMetric)}
								</p>
								<p className="text-sm text-fg-muted">
									{CONTRIBUTION_LABEL.hint}
								</p>
							</div>
							<div className="flex flex-col gap-2 sm:items-end">
								<label className="block text-xs text-fg-muted">
									{CONTRIBUTION_LABEL.filter}
									<select
										value={contributionMetric}
										className={`mt-1 ${FIELD_CLASS}`}
										onChange={(event) => {
											setContributionMetric(
												parseContributionMetric(event.target.value),
											);
										}}
									>
										{CONTRIBUTION_METRIC_OPTIONS.map((option) => (
											<option key={option} value={option}>
												{contributionMetricCaption(option)}
											</option>
										))}
									</select>
								</label>
								<label className="inline-flex items-center gap-2 text-xs text-fg-muted">
									<input
										type="checkbox"
										checked={showContributionBelowMin}
										onChange={(event) => {
											setShowContributionBelowMin(event.target.checked);
										}}
									/>
									{CONTRIBUTION_LABEL.showBelowMin}
								</label>
								<label className="inline-flex items-center gap-2 text-xs text-fg-muted">
									<input
										type="checkbox"
										checked={showContributionTable}
										onChange={(event) => {
											setShowContributionTable(event.target.checked);
										}}
									/>
									{showContributionTable && CONTRIBUTION_LABEL.hideTable}
									{!showContributionTable && CONTRIBUTION_LABEL.showTable}
								</label>
							</div>
						</div>
						{contributionEmpty && (
							<p className="text-sm text-fg-muted">
								{trendsSectionEmptyLabel(audience, contributionEmpty)}
							</p>
						)}
						{!contributionEmpty && (
							<>
								{contributionInsightRows.length > 0 && (
									<ul className="space-y-1 text-sm text-fg-muted">
										{contributionInsightRows.map((insight) => (
											<li key={insight.kind}>
												<span className="font-medium text-fg">
													{insight.label}
												</span>
												{" → "}
												{insight.name} — {insight.detail}
											</li>
										))}
									</ul>
								)}
								<Suspense
									fallback={
										<SkeletonRegion label={SKELETON_LABEL.chart}>
											<div style={{ height: CONTRIBUTION_CHART.height }}>
												<Skeleton className="h-full w-full" />
											</div>
										</SkeletonRegion>
									}
								>
									<ChampionshipContributionScatterChart
										points={contributionPoints}
										metric={contributionMetric}
									/>
								</Suspense>
								{showContributionTable && (
									<ContributionTable
										points={[...contributionPoints]}
										metric={contributionMetric}
									/>
								)}
							</>
						)}
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
								{trendsSectionEmptyLabel(
									audience,
									GOALKEEPER_RANKING_LABEL.empty,
								)}
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
							<p className="text-sm text-fg-muted">
								{trendsSectionEmptyLabel(audience, consistencyEmpty)}
							</p>
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
								{trendsSectionEmptyLabel(audience, EVENT_HEALTH_LABEL.empty)}
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

					<section className="space-y-3">
						<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
							<div className="space-y-1">
								<div className="flex items-center gap-2">
									<Scale className="size-4 text-pitch-fg" />
									<h3 className="text-sm font-semibold text-fg">
										{BALANCE_INDEX_LABEL.title}
									</h3>
								</div>
								<p className="text-sm text-fg-muted">
									{BALANCE_INDEX_LABEL.hint}
								</p>
							</div>
							{balanceIndex.history.length > 0 && (
								<div className="flex flex-col gap-2 sm:flex-row">
									<Button
										variant={BUTTON_VARIANT.secondary}
										className="w-full sm:w-auto"
										disabled={isSharingBalance || !balanceIndex.current}
										onClick={() => {
											void handleShareBalance();
										}}
									>
										{isSharingBalance && (
											<LoaderCircle
												className="size-4 animate-spin"
												aria-hidden
											/>
										)}
										{!isSharingBalance && <Share2 className="size-4" />}
										{isSharingBalance &&
											EVENT_BALANCE_INDEX_SHARE_LABEL.sharing}
										{!isSharingBalance && EVENT_BALANCE_INDEX_SHARE_LABEL.share}
									</Button>
									<Button
										variant={BUTTON_VARIANT.secondary}
										className="w-full sm:w-auto"
										disabled={isSharingBalanceCsv}
										onClick={() => {
											void handleShareBalanceCsv();
										}}
									>
										{isSharingBalanceCsv && (
											<LoaderCircle
												className="size-4 animate-spin"
												aria-hidden
											/>
										)}
										{!isSharingBalanceCsv &&
											EVENT_BALANCE_INDEX_SHARE_LABEL.shareCsv}
										{isSharingBalanceCsv &&
											EVENT_BALANCE_INDEX_SHARE_LABEL.sharing}
									</Button>
								</div>
							)}
						</div>
						{balanceShareError && (
							<p className={ERROR_CLASS}>{balanceShareError}</p>
						)}
						{balanceIndex.history.length === 0 && (
							<p className="text-sm text-fg-muted">
								{BALANCE_INDEX_LABEL.empty}
							</p>
						)}
						{balanceIndex.history.length > 0 && (
							<>
								{balanceIndex.overall && (
									<div>
										<p className="text-xs font-medium text-fg-muted">
											{BALANCE_INDEX_LABEL.overall}
										</p>
										<p className="text-lg font-semibold tabular-nums text-fg">
											{formatBalanceIndexScore(
												balanceIndex.overall.balanceIndex,
											)}
											/100
										</p>
									</div>
								)}
								<Suspense
									fallback={
										<SkeletonRegion label={SKELETON_LABEL.chart}>
											<div className="h-48 w-full">
												<Skeleton className="h-full w-full" />
											</div>
										</SkeletonRegion>
									}
								>
									<ChampionshipEventBalanceIndex
										row={balanceIndex.current}
										emptyLabel={BALANCE_INDEX_LABEL.emptyEvent}
									/>
								</Suspense>
								{balanceIndex.current && (
									<Suspense
										fallback={
											<SkeletonRegion label={SKELETON_LABEL.chart}>
												<div className="h-28 w-full">
													<Skeleton className="h-full w-full" />
												</div>
											</SkeletonRegion>
										}
									>
										<ChampionshipBalancePredictedVsRealized
											row={balanceIndex.current}
										/>
									</Suspense>
								)}
								<div className="space-y-1">
									<p className="text-sm font-semibold text-fg">
										{BALANCE_INDEX_LABEL.history}
									</p>
									<Suspense
										fallback={
											<SkeletonRegion label={SKELETON_LABEL.chart}>
												<div style={{ height: BALANCE_INDEX_CHART.height }}>
													<Skeleton className="h-full w-full" />
												</div>
											</SkeletonRegion>
										}
									>
										<ChampionshipBalanceHistory
											history={balanceIndex.history}
											points={balanceHistoryChart}
										/>
									</Suspense>
								</div>
								<div className="space-y-1">
									<p className="text-sm font-semibold text-fg">
										{BALANCE_INDEX_LABEL.distribution}
									</p>
									<Suspense
										fallback={
											<SkeletonRegion label={SKELETON_LABEL.chart}>
												<div className="h-56 w-full">
													<Skeleton className="h-full w-full" />
												</div>
											</SkeletonRegion>
										}
									>
										<ChampionshipGoalDifferenceDistribution
											rows={balanceGoalDiff}
										/>
									</Suspense>
								</div>
							</>
						)}
					</section>

					<Suspense
						fallback={
							<SkeletonRegion label={SKELETON_LABEL.chart}>
								<div className="h-80 w-full">
									<Skeleton className="h-full w-full" />
								</div>
							</SkeletonRegion>
						}
					>
						<ChampionshipPredictedVsRealized
							championshipId={championshipId}
							championshipName={championshipName}
							players={players}
							events={events}
							audience={audience}
						/>
					</Suspense>

					<section className="space-y-3">
						<div className="space-y-1">
							<div className="flex items-center gap-2">
								<Goal className="size-4 text-pitch-fg" />
								<h3 className="text-sm font-semibold text-fg">
									{ROUND_GOALS_LABEL.title}
								</h3>
							</div>
							<p className="text-sm text-fg-muted">{ROUND_GOALS_LABEL.hint}</p>
						</div>
						{roundGoals.events === 0 && (
							<p className="text-sm text-fg-muted">
								{trendsSectionEmptyLabel(audience, ROUND_GOALS_LABEL.empty)}
							</p>
						)}
						{roundGoals.events > 0 && (
							<>
								<div>
									<p className="text-xs font-medium text-fg-muted">
										{ROUND_GOALS_LABEL.avgTotal}
									</p>
									<p className="text-lg font-semibold tabular-nums text-fg">
										{formatRoundGoalsKpi(roundGoals)}
									</p>
								</div>
								<Suspense
									fallback={
										<SkeletonRegion label={SKELETON_LABEL.chart}>
											<div style={{ height: TREND_LINE_CHART.height }}>
												<Skeleton className="h-full w-full" />
											</div>
										</SkeletonRegion>
									}
								>
									<ChampionshipTrendLineChart
										points={roundGoalsChart}
										caption={ROUND_GOALS_LABEL.title}
										formatValue={formatRoundGoalsChartValue}
									/>
								</Suspense>
							</>
						)}
					</section>

					<section className="space-y-3">
						<div className="space-y-1">
							<div className="flex items-center gap-2">
								<Goal className="size-4 text-pitch-fg" />
								<h3 className="text-sm font-semibold text-fg">
									{GOAL_TIMELINE_LABEL.title}
								</h3>
							</div>
							<p className="text-sm text-fg-muted">
								{GOAL_TIMELINE_LABEL.hint}
							</p>
						</div>
						{!goalTimeline.enoughCoverage && (
							<p className="text-sm text-fg-muted">
								{trendsSectionEmptyLabel(audience, GOAL_TIMELINE_LABEL.empty)}
							</p>
						)}
						{goalTimeline.enoughCoverage && (
							<>
								<div className="grid grid-cols-3 gap-3">
									<div>
										<p className="text-xs font-medium text-fg-muted">
											{GOAL_TIMELINE_LABEL.coverage}
										</p>
										<p className="text-lg font-semibold tabular-nums text-fg">
											{formatGoalTimelineCoverage(goalTimeline)}
										</p>
									</div>
									<div>
										<p className="text-xs font-medium text-fg-muted">
											{GOAL_TIMELINE_LABEL.avgFirstGoal}
										</p>
										<p className="text-lg font-semibold tabular-nums text-fg">
											{formatGoalTimelineFirstGoal(goalTimeline)}
										</p>
									</div>
									<div>
										<p className="text-xs font-medium text-fg-muted">
											{GOAL_TIMELINE_LABEL.lateShare}
										</p>
										<p className="text-lg font-semibold tabular-nums text-fg">
											{formatGoalTimelineLateShare(goalTimeline)}
										</p>
									</div>
								</div>
								<p className="text-sm text-fg-muted">
									{GOAL_TIMELINE_LABEL.histogramHint}
								</p>
								<Suspense
									fallback={
										<SkeletonRegion label={SKELETON_LABEL.chart}>
											<div style={{ height: TREND_LINE_CHART.height }}>
												<Skeleton className="h-full w-full" />
											</div>
										</SkeletonRegion>
									}
								>
									<ChampionshipGoalMinuteHistogramChart
										histogram={goalMinuteHistogram}
									/>
								</Suspense>
								<div className="space-y-1 pt-2">
									<h4 className="text-sm font-semibold text-fg">
										{GOAL_TIMELINE_LABEL.firstGoalTitle}
									</h4>
									<p className="text-sm text-fg-muted">
										{GOAL_TIMELINE_LABEL.firstGoalHint}
									</p>
								</div>
								{firstGoalOutcome.matches === 0 && (
									<p className="text-sm text-fg-muted">
										{trendsSectionEmptyLabel(
											audience,
											GOAL_TIMELINE_LABEL.empty,
										)}
									</p>
								)}
								{firstGoalOutcome.matches > 0 && (
									<Suspense
										fallback={
											<SkeletonRegion label={SKELETON_LABEL.chart}>
												<div style={{ height: TREND_LINE_CHART.height }}>
													<Skeleton className="h-full w-full" />
												</div>
											</SkeletonRegion>
										}
									>
										<ChampionshipFirstGoalOutcomeChart
											bars={firstGoalOutcome.bars}
										/>
									</Suspense>
								)}
								<div className="space-y-1 pt-2">
									<h4 className="text-sm font-semibold text-fg">
										{GOAL_TIMELINE_LABEL.scoreStateTitle}
									</h4>
									<p className="text-sm text-fg-muted">
										{GOAL_TIMELINE_LABEL.scoreStateHint}
									</p>
								</div>
								<Suspense
									fallback={
										<SkeletonRegion label={SKELETON_LABEL.chart}>
											<div style={{ height: TREND_LINE_CHART.height }}>
												<Skeleton className="h-full w-full" />
											</div>
										</SkeletonRegion>
									}
								>
									<ChampionshipGoalScoreStateChart
										scatter={goalScoreStateScatter}
									/>
								</Suspense>
							</>
						)}
					</section>

					<section className="space-y-3">
						<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
							<div className="space-y-1">
								<div className="flex items-center gap-2">
									<Grid2x2 className="size-4 text-pitch-fg" />
									<h3 className="text-sm font-semibold text-fg">
										{FORM_HEATMAP_LABEL.title}
									</h3>
								</div>
								<p className="text-sm text-fg-muted">
									{FORM_HEATMAP_LABEL.hint}
								</p>
								{formHeatmap.truncated && (
									<p className="text-xs text-fg-muted">
										{FORM_HEATMAP_LABEL.limitNote}
									</p>
								)}
							</div>
							{formHeatmap.rows.length > 0 && (
								<Button
									variant={BUTTON_VARIANT.secondary}
									className="w-full sm:w-auto"
									disabled={isSharingHeatmap}
									onClick={() => {
										void handleShareHeatmap();
									}}
								>
									{isSharingHeatmap && (
										<LoaderCircle className="size-4 animate-spin" aria-hidden />
									)}
									{!isSharingHeatmap && <Share2 className="size-4" />}
									{isSharingHeatmap && FORM_HEATMAP_SHARE_LABEL.sharing}
									{!isSharingHeatmap && FORM_HEATMAP_SHARE_LABEL.share}
								</Button>
							)}
						</div>
						{heatmapShareError && (
							<p className={ERROR_CLASS}>{heatmapShareError}</p>
						)}
						{formHeatmap.rows.length === 0 && (
							<p className="text-sm text-fg-muted">
								{trendsSectionEmptyLabel(audience, FORM_HEATMAP_LABEL.empty)}
							</p>
						)}
						{formHeatmap.rows.length > 0 && (
							<Suspense fallback={<Skeleton className="h-48 w-full" />}>
								<ChampionshipFormHeatmap grid={formHeatmap} />
							</Suspense>
						)}
					</section>
				</div>
			)}
		</SectionCard>
	);
}
