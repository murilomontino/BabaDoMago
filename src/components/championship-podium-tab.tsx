import { LoaderCircle, Share2, Trophy } from "lucide-react";
import { lazy, Suspense, useMemo, useState } from "react";
import { Skeleton, SkeletonRegion } from "@/components/atoms/skeleton";
import { Button } from "@/components/button";
import { SectionCard } from "@/components/section-card";
import { championshipRatingCeiling } from "@/const/player-rating";
import {
	championshipSynergyRanking,
	championshipSynergyWorst,
} from "@/const/player-synergy";
import {
	aggregatePodiumPlayersFromEvents,
	eventMatchesPodiumPeriod,
	isPodiumAllMonthsSelected,
	isPodiumCurrentMonthSelected,
	isPodiumPlayerMetric,
	PODIUM_DEFAULT_METRIC,
	PODIUM_FILTER_LABEL,
	PODIUM_LABEL,
	PODIUM_METRIC,
	PODIUM_MONTH_LABEL,
	PODIUM_MONTHS,
	PODIUM_PLAYER_METRICS,
	PODIUM_SEMESTER,
	type PodiumMetricId,
	type PodiumMonth,
	type PodiumSemester,
	parsePodiumMetric,
	podiumAvailableYears,
	podiumCurrentMonth,
	podiumMetricOptions,
	podiumSeasonLabel,
	resolvePodiumYear,
	selectPodiumAllMonths,
	selectPodiumCurrentMonth,
	togglePodiumMonth,
	togglePodiumSemester,
} from "@/const/podium";
import {
	PODIUM_SHARE_LABEL,
	PODIUM_SHARE_MODE,
	type PodiumShareMode,
	podiumShareCardFromSynergyPairs,
	podiumShareCardsFromPlayers,
	podiumShareContext,
	podiumSharePeriodCaption,
	podiumSharingLabel,
} from "@/const/podium-share";
import { SKELETON_LABEL } from "@/const/skeleton";
import {
	championshipTeamBalance,
	formatTeamBalanceSpread,
	formatTeamBalanceWinRate,
	TEAM_BALANCE_LABEL,
} from "@/const/team-balance-stats";
import { BUTTON_VARIANT, ERROR_CLASS, FIELD_CLASS } from "@/const/ui";
import { CHAMPIONSHIP_EVENTS_QUERY_KEY } from "@/hooks/championships/championships-query-keys";
import { usePodiumYear } from "@/hooks/use-podium-year";
import { includeDefined } from "@/lib/include-when";
import {
	sharePodiumSeparateImages,
	sharePodiumStackedImage,
} from "@/lib/share-podium-image";
import type { ChampionshipPlayer } from "@/types/championship";
import type { ChampionshipEvent } from "@/types/championship-event";

const ChampionshipPodium = lazy(() =>
	import("@/components/championship-podium").then((m) => ({
		default: m.ChampionshipPodium,
	})),
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

type ChampionshipPodiumTabProps = {
	players: ChampionshipPlayer[];
	championshipName: string;
	events?: readonly ChampionshipEvent[];
	eventStartsAt?: string;
};

export function ChampionshipPodiumTab({
	players,
	championshipName,
	events,
	eventStartsAt,
}: ChampionshipPodiumTabProps) {
	const [metric, setMetric] = useState<PodiumMetricId>(PODIUM_DEFAULT_METRIC);
	const [semester, setSemester] = useState<PodiumSemester | null>(null);
	const [months, setMonths] = useState<PodiumMonth[]>([]);
	const [yearParam, setYearParam] = usePodiumYear();
	const [isSharing, setIsSharing] = useState<PodiumShareMode | null>(null);
	const [shareError, setShareError] = useState<string | null>(null);
	const currentMonth = podiumCurrentMonth();
	const includeSynergy = !eventStartsAt;
	const metricOptions = podiumMetricOptions(includeSynergy);
	const showPeriodFilters = Boolean(events) && includeSynergy;
	const availableYears = useMemo(
		() => podiumAvailableYears(events ?? []),
		[events],
	);
	const year = resolvePodiumYear(events ?? [], yearParam);
	const periodEvents = useMemo(() => {
		if (!events) {
			return [];
		}

		if (eventStartsAt) {
			return [...events];
		}

		return events.filter((event) =>
			eventMatchesPodiumPeriod(event.starts_at, year, semester, months),
		);
	}, [eventStartsAt, events, months, semester, year]);
	const podiumPlayers = useMemo(() => {
		if (!events || eventStartsAt) {
			return players;
		}

		return aggregatePodiumPlayersFromEvents(
			players,
			events,
			year,
			semester,
			months,
		);
	}, [eventStartsAt, events, months, players, semester, year]);
	const synergyPairs = useMemo(() => {
		if (!includeSynergy) {
			return [];
		}

		return championshipSynergyRanking(periodEvents, players);
	}, [includeSynergy, periodEvents, players]);
	const worstPairs = useMemo(() => {
		if (!includeSynergy) {
			return [];
		}

		return championshipSynergyWorst(periodEvents, players);
	}, [includeSynergy, periodEvents, players]);
	const teamBalance = useMemo(() => {
		if (!includeSynergy) {
			return null;
		}

		return championshipTeamBalance(periodEvents);
	}, [includeSynergy, periodEvents]);
	const ceiling = championshipRatingCeiling(
		podiumPlayers.map((player) => player.rating),
	);
	const synergyCard = useMemo(
		() => podiumShareCardFromSynergyPairs(synergyPairs),
		[synergyPairs],
	);
	const currentCards = useMemo(() => {
		if (metric === PODIUM_METRIC.synergy) {
			return includeDefined(synergyCard);
		}

		if (!isPodiumPlayerMetric(metric)) {
			return [];
		}

		return podiumShareCardsFromPlayers(podiumPlayers, [metric]);
	}, [metric, podiumPlayers, synergyCard]);
	const allCards = useMemo(() => {
		const playerCards = podiumShareCardsFromPlayers(
			podiumPlayers,
			PODIUM_PLAYER_METRICS,
		);
		if (!synergyCard) {
			return playerCards;
		}

		return [...playerCards, synergyCard];
	}, [podiumPlayers, synergyCard]);

	async function handleShare(
		cards: typeof currentCards,
		mode: PodiumShareMode,
	) {
		setIsSharing(mode);
		setShareError(null);
		const parts = {
			championshipName,
			context: podiumShareContext(eventStartsAt, year, semester, months),
			periodLabel: podiumSharePeriodCaption(
				eventStartsAt,
				year,
				semester,
				months,
			),
			generatedAt: new Date().toISOString(),
		};
		try {
			switch (mode) {
				case PODIUM_SHARE_MODE.all:
					await sharePodiumStackedImage(cards, ceiling, parts);
					return;
				case PODIUM_SHARE_MODE.one:
				case PODIUM_SHARE_MODE.separate:
					await sharePodiumSeparateImages(cards, ceiling, parts);
					return;
				default: {
					const _exhaustive: never = mode;
					return _exhaustive;
				}
			}
		} catch {
			setShareError(PODIUM_SHARE_LABEL.shareFailed);
		} finally {
			setIsSharing(null);
		}
	}

	return (
		<SectionCard
			title={PODIUM_LABEL.tab}
			icon={<Trophy className="size-4 text-pitch-fg" />}
			queryKey={CHAMPIONSHIP_EVENTS_QUERY_KEY}
		>
			{showPeriodFilters && (
				<div className="mb-4 space-y-2">
					<div className="flex flex-wrap gap-2">
						{availableYears.map((availableYear) => (
							<button
								key={availableYear}
								type="button"
								className={filterChipClass(availableYear === year)}
								onClick={() => {
									void setYearParam(availableYear);
									if (availableYear === year) {
										setSemester(null);
										setMonths([]);
									}
								}}
							>
								{podiumSeasonLabel(availableYear)}
							</button>
						))}
						{availableYears.length === 0 && (
							<button
								type="button"
								className={FILTER_CHIP_ON}
								onClick={() => {
									setSemester(null);
									setMonths([]);
								}}
							>
								{podiumSeasonLabel(year)}
							</button>
						)}
						<button
							type="button"
							className={filterChipClass(semester === PODIUM_SEMESTER.first)}
							onClick={() => {
								setMonths([]);
								setSemester(
									togglePodiumSemester(semester, PODIUM_SEMESTER.first)
										.semester,
								);
							}}
						>
							{PODIUM_FILTER_LABEL[PODIUM_SEMESTER.first]}
						</button>
						<button
							type="button"
							className={filterChipClass(semester === PODIUM_SEMESTER.second)}
							onClick={() => {
								setMonths([]);
								setSemester(
									togglePodiumSemester(semester, PODIUM_SEMESTER.second)
										.semester,
								);
							}}
						>
							{PODIUM_FILTER_LABEL[PODIUM_SEMESTER.second]}
						</button>
					</div>
					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							className={filterChipClass(isPodiumAllMonthsSelected(months))}
							onClick={() => {
								setSemester(null);
								setMonths(selectPodiumAllMonths());
							}}
						>
							{PODIUM_FILTER_LABEL.allMonths}
						</button>
						<button
							type="button"
							className={filterChipClass(
								isPodiumCurrentMonthSelected(months, currentMonth),
							)}
							onClick={() => {
								setSemester(null);
								setMonths(selectPodiumCurrentMonth(currentMonth));
							}}
						>
							{PODIUM_FILTER_LABEL.currentMonth}
						</button>
						{PODIUM_MONTHS.map((month) => (
							<button
								key={month}
								type="button"
								className={filterChipClass(months.includes(month))}
								onClick={() => {
									setSemester(null);
									setMonths(togglePodiumMonth(months, month));
								}}
							>
								{PODIUM_MONTH_LABEL[month]}
							</button>
						))}
					</div>
				</div>
			)}
			<div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<label className="block max-w-xs text-sm text-fg-muted">
					{PODIUM_LABEL.metric}
					<select
						value={metric}
						className={`mt-1 ${FIELD_CLASS}`}
						onChange={(event) => {
							setMetric(parsePodiumMetric(event.target.value));
						}}
					>
						{metricOptions.map((option) => (
							<option key={option.id} value={option.id}>
								{option.label}
							</option>
						))}
					</select>
				</label>
				{(currentCards.length > 0 || allCards.length > 0) && (
					<div className="flex flex-wrap gap-2">
						{currentCards.length > 0 && (
							<Button
								variant={BUTTON_VARIANT.secondary}
								disabled={isSharing !== null}
								onClick={() => {
									void handleShare(currentCards, PODIUM_SHARE_MODE.one);
								}}
							>
								{isSharing === PODIUM_SHARE_MODE.one && (
									<LoaderCircle className="size-4 animate-spin" aria-hidden />
								)}
								{isSharing !== PODIUM_SHARE_MODE.one && (
									<Share2 className="size-4" />
								)}
								{isSharing === PODIUM_SHARE_MODE.one &&
									podiumSharingLabel(PODIUM_SHARE_MODE.one)}
								{isSharing !== PODIUM_SHARE_MODE.one &&
									PODIUM_SHARE_LABEL.shareOne}
							</Button>
						)}
						{allCards.length > 0 && (
							<Button
								variant={BUTTON_VARIANT.secondary}
								disabled={isSharing !== null}
								onClick={() => {
									void handleShare(allCards, PODIUM_SHARE_MODE.all);
								}}
							>
								{isSharing === PODIUM_SHARE_MODE.all && (
									<LoaderCircle className="size-4 animate-spin" aria-hidden />
								)}
								{isSharing !== PODIUM_SHARE_MODE.all && (
									<Share2 className="size-4" />
								)}
								{isSharing === PODIUM_SHARE_MODE.all &&
									podiumSharingLabel(PODIUM_SHARE_MODE.all)}
								{isSharing !== PODIUM_SHARE_MODE.all &&
									PODIUM_SHARE_LABEL.shareAll}
							</Button>
						)}
						{allCards.length > 1 && (
							<Button
								variant={BUTTON_VARIANT.secondary}
								disabled={isSharing !== null}
								onClick={() => {
									void handleShare(allCards, PODIUM_SHARE_MODE.separate);
								}}
							>
								{isSharing === PODIUM_SHARE_MODE.separate && (
									<LoaderCircle className="size-4 animate-spin" aria-hidden />
								)}
								{isSharing !== PODIUM_SHARE_MODE.separate && (
									<Share2 className="size-4" />
								)}
								{isSharing === PODIUM_SHARE_MODE.separate &&
									podiumSharingLabel(PODIUM_SHARE_MODE.separate)}
								{isSharing !== PODIUM_SHARE_MODE.separate &&
									PODIUM_SHARE_LABEL.shareAllSeparate}
							</Button>
						)}
					</div>
				)}
			</div>
			{shareError && <p className={`mb-4 ${ERROR_CLASS}`}>{shareError}</p>}
			<Suspense fallback={<PodiumStageSkeleton />}>
				<ChampionshipPodium
					players={podiumPlayers}
					metric={metric}
					synergyPairs={synergyPairs}
					worstPairs={worstPairs}
				/>
			</Suspense>
			{teamBalance && teamBalance.events > 0 && (
				<div className="mt-8 space-y-3">
					<h3 className="text-sm font-semibold text-fg">
						{TEAM_BALANCE_LABEL.title}
					</h3>
					<p className="text-sm text-fg-muted">{TEAM_BALANCE_LABEL.hint}</p>
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
						<div>
							<p className="text-xs font-medium text-fg-muted">
								{TEAM_BALANCE_LABEL.spread}
							</p>
							<p className="text-lg font-semibold tabular-nums text-fg">
								{formatTeamBalanceSpread(teamBalance.averageSpread)}
							</p>
						</div>
						<div>
							<p className="text-xs font-medium text-fg-muted">
								{TEAM_BALANCE_LABEL.favorite}
							</p>
							<p className="text-lg font-semibold tabular-nums text-fg">
								{formatTeamBalanceWinRate(teamBalance.favoriteWinRate)}
							</p>
						</div>
					</div>
				</div>
			)}
		</SectionCard>
	);
}

function PodiumStageSkeleton() {
	return (
		<SkeletonRegion label={SKELETON_LABEL.podium}>
			<Skeleton className="h-48 w-full" />
		</SkeletonRegion>
	);
}
