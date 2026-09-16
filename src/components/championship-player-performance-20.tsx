import { CalendarDays } from "lucide-react";
import { lazy, Suspense, useMemo } from "react";
import { Skeleton } from "@/components/atoms/skeleton";
import { EmptyState } from "@/components/empty-state";
import { ChampionshipPlayerPerformanceHeatmap } from "@/components/molecules/championship-player-performance-heatmap";
import { SectionCard } from "@/components/section-card";
import {
	calculatePlayerPerformance20,
	formatPlayerPerformanceAverage,
	formatPlayerPerformanceRate,
	formatPlayerPerformanceRating,
	PLAYER_PERFORMANCE_LABEL,
	PLAYER_PERFORMANCE_TREND_LEGEND,
	playerPerformanceDefenseWindows,
	playerPerformanceEvidenceLabel,
	playerPerformanceHeatmap,
	playerPerformanceMatchSeries,
	playerPerformanceTrendArrows,
	playerPerformanceTrendGlyph,
} from "@/const/player-performance-20";
import type { ChampionshipEvent } from "@/types/championship-event";

const ChampionshipPlayerPerformanceCharts = lazy(() =>
	import("@/components/molecules/championship-player-performance-charts").then(
		(module) => ({
			default: module.ChampionshipPlayerPerformanceCharts,
		}),
	),
);

type ChampionshipPlayerPerformance20Props = {
	playerId: number;
	events: readonly ChampionshipEvent[];
};

function SummaryItem({
	label,
	value,
	glyph,
}: {
	label: string;
	value: string;
	glyph: string;
}) {
	return (
		<div>
			<p className="text-xs font-medium text-fg-muted">{label}</p>
			<p className="text-lg font-semibold tabular-nums text-fg">
				{value}{" "}
				<span className="text-sm font-normal text-fg-muted">{glyph}</span>
			</p>
		</div>
	);
}

export function ChampionshipPlayerPerformance20({
	playerId,
	events,
}: ChampionshipPlayerPerformance20Props) {
	const performance = useMemo(
		() => calculatePlayerPerformance20(events, playerId),
		[events, playerId],
	);
	const points = useMemo(
		() => playerPerformanceMatchSeries(events, playerId),
		[events, playerId],
	);
	const defense = useMemo(
		() => playerPerformanceDefenseWindows(events, playerId),
		[events, playerId],
	);
	const trends = useMemo(
		() => playerPerformanceTrendArrows(events, playerId),
		[events, playerId],
	);
	const heatmap = useMemo(
		() => playerPerformanceHeatmap(events, playerId),
		[events, playerId],
	);

	if (performance.games === 0) {
		return (
			<SectionCard title={PLAYER_PERFORMANCE_LABEL.title}>
				<EmptyState
					icon={<CalendarDays className="size-10" />}
					title={PLAYER_PERFORMANCE_LABEL.empty}
				/>
			</SectionCard>
		);
	}

	return (
		<SectionCard title={PLAYER_PERFORMANCE_LABEL.title}>
			<p className="mb-3 text-sm text-fg-muted">
				{PLAYER_PERFORMANCE_LABEL.hint}
			</p>

			<div className="mb-4 flex flex-wrap gap-3 text-xs text-fg-muted">
				<span>
					{PLAYER_PERFORMANCE_LABEL.games}: {performance.games}
				</span>
				<span>
					{PLAYER_PERFORMANCE_LABEL.evidence}:{" "}
					{playerPerformanceEvidenceLabel(performance.evidence)}
				</span>
			</div>

			<div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
				<SummaryItem
					label={PLAYER_PERFORMANCE_LABEL.winRate}
					value={formatPlayerPerformanceRate(performance.winRate)}
					glyph={playerPerformanceTrendGlyph(trends.winRate)}
				/>
				<SummaryItem
					label={PLAYER_PERFORMANCE_LABEL.pointsRate}
					value={formatPlayerPerformanceRate(performance.pointsRate)}
					glyph={playerPerformanceTrendGlyph(trends.pointsRate)}
				/>
				<SummaryItem
					label={PLAYER_PERFORMANCE_LABEL.goalParticipation}
					value={formatPlayerPerformanceRate(performance.goalParticipation)}
					glyph={playerPerformanceTrendGlyph(trends.goalParticipation)}
				/>
				<SummaryItem
					label={PLAYER_PERFORMANCE_LABEL.goalsPerGame}
					value={formatPlayerPerformanceAverage(performance.goalsPerGame)}
					glyph={playerPerformanceTrendGlyph(trends.goalsPerGame)}
				/>
				<SummaryItem
					label={PLAYER_PERFORMANCE_LABEL.assistsPerGame}
					value={formatPlayerPerformanceAverage(performance.assistsPerGame)}
					glyph={playerPerformanceTrendGlyph(trends.assistsPerGame)}
				/>
				<SummaryItem
					label={PLAYER_PERFORMANCE_LABEL.cleanSheets}
					value={formatPlayerPerformanceRate(performance.cleanSheetRate)}
					glyph={playerPerformanceTrendGlyph(trends.cleanSheetRate)}
				/>
				<SummaryItem
					label={PLAYER_PERFORMANCE_LABEL.rating}
					value={formatPlayerPerformanceRating(performance.rating)}
					glyph={playerPerformanceTrendGlyph(trends.rating)}
				/>
				<SummaryItem
					label={PLAYER_PERFORMANCE_LABEL.goalsConcededPerGame}
					value={formatPlayerPerformanceAverage(
						performance.goalsConcededPerGame,
					)}
					glyph="→"
				/>
			</div>

			<div className="mb-6 rounded-lg border border-black/10 p-3">
				<p className="mb-2 text-xs font-medium text-fg-muted">
					{PLAYER_PERFORMANCE_LABEL.trendLegend}
				</p>
				<div className="flex flex-wrap gap-x-4 gap-y-1.5">
					{PLAYER_PERFORMANCE_TREND_LEGEND.map((item) => (
						<span
							key={item.trend}
							className="inline-flex items-center gap-1.5 text-xs text-fg-muted"
						>
							<span className="font-semibold text-fg">{item.glyph}</span>
							{item.caption}
						</span>
					))}
				</div>
			</div>

			{performance.goalkeeperMetrics && (
				<div className="mb-6 rounded-lg border border-black/10 p-3">
					<p className="mb-2 text-xs font-medium text-fg-muted">
						{PLAYER_PERFORMANCE_LABEL.goalkeeperTitle}
					</p>
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
						<div>
							<p className="text-xs text-fg-muted">
								{PLAYER_PERFORMANCE_LABEL.games}
							</p>
							<p className="font-semibold tabular-nums text-fg">
								{performance.goalkeeperMetrics.matches}
							</p>
						</div>
						<div>
							<p className="text-xs text-fg-muted">
								{PLAYER_PERFORMANCE_LABEL.winRate}
							</p>
							<p className="font-semibold tabular-nums text-fg">
								{formatPlayerPerformanceRate(
									performance.goalkeeperMetrics.winRate,
								)}
							</p>
						</div>
						<div>
							<p className="text-xs text-fg-muted">
								{PLAYER_PERFORMANCE_LABEL.cleanSheets}
							</p>
							<p className="font-semibold tabular-nums text-fg">
								{formatPlayerPerformanceRate(
									performance.goalkeeperMetrics.cleanSheetRate,
								)}
							</p>
						</div>
						<div>
							<p className="text-xs text-fg-muted">
								{PLAYER_PERFORMANCE_LABEL.goalsConcededPerGame}
							</p>
							<p className="font-semibold tabular-nums text-fg">
								{formatPlayerPerformanceAverage(
									performance.goalkeeperMetrics.goalsConcededPerGame,
								)}
							</p>
						</div>
					</div>
				</div>
			)}

			<div className="mb-6">
				<ChampionshipPlayerPerformanceHeatmap heatmap={heatmap} />
			</div>

			<Suspense fallback={<Skeleton className="h-56 w-full rounded-lg" />}>
				<ChampionshipPlayerPerformanceCharts
					points={points}
					defense={defense}
				/>
			</Suspense>
		</SectionCard>
	);
}
