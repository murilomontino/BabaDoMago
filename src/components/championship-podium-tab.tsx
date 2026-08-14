import { LoaderCircle, Share2, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/button";
import { ChampionshipPodium } from "@/components/championship-podium";
import { SectionCard } from "@/components/section-card";
import { championshipRatingCeiling } from "@/const/player-rating";
import {
	aggregatePodiumPlayersFromEvents,
	isPodiumAllMonthsSelected,
	isPodiumCurrentMonthSelected,
	PODIUM_DEFAULT_METRIC,
	PODIUM_FILTER_LABEL,
	PODIUM_LABEL,
	PODIUM_METRIC_OPTIONS,
	PODIUM_MONTH_LABEL,
	PODIUM_MONTHS,
	PODIUM_SEASON_YEAR,
	PODIUM_SEMESTER,
	type PodiumMetricId,
	type PodiumMonth,
	type PodiumSemester,
	parsePodiumMetric,
	podiumCurrentMonth,
	selectPodiumAllMonths,
	selectPodiumCurrentMonth,
	togglePodiumMonth,
	togglePodiumSemester,
} from "@/const/podium";
import {
	PODIUM_SHARE_LABEL,
	podiumShareCardsFromPlayers,
	podiumSharePeriodSlug,
} from "@/const/podium-share";
import { shareFileDateStamp } from "@/const/share-file-name";
import { BUTTON_VARIANT, ERROR_CLASS, FIELD_CLASS } from "@/const/ui";
import { sharePodiumImages } from "@/lib/share-podium-image";
import type { ChampionshipPlayer } from "@/types/championship";
import type { ChampionshipEvent } from "@/types/championship-event";

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
	const [isSharing, setIsSharing] = useState<"one" | "all" | null>(null);
	const [shareError, setShareError] = useState<string | null>(null);
	const currentMonth = podiumCurrentMonth();
	const podiumPlayers = useMemo(() => {
		if (!events) {
			return players;
		}

		return aggregatePodiumPlayersFromEvents(
			players,
			events,
			PODIUM_SEASON_YEAR,
			semester,
			months,
		);
	}, [events, months, players, semester]);
	const ceiling = championshipRatingCeiling(
		podiumPlayers.map((player) => player.rating),
	);
	const currentCards = useMemo(
		() => podiumShareCardsFromPlayers(podiumPlayers, [metric]),
		[metric, podiumPlayers],
	);
	const allCards = useMemo(
		() => podiumShareCardsFromPlayers(podiumPlayers),
		[podiumPlayers],
	);

	async function handleShare(cards: typeof currentCards, mode: "one" | "all") {
		setIsSharing(mode);
		setShareError(null);
		try {
			await sharePodiumImages(cards, ceiling, {
				championshipName,
				context: eventStartsAt
					? shareFileDateStamp(eventStartsAt)
					: podiumSharePeriodSlug(semester, months),
				generatedAt: new Date().toISOString(),
			});
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
		>
			{events && (
				<div className="mb-4 space-y-2">
					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							className={FILTER_CHIP_ON}
							onClick={() => {
								setSemester(null);
								setMonths([]);
							}}
						>
							{PODIUM_FILTER_LABEL.season}
						</button>
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
						{PODIUM_METRIC_OPTIONS.map((option) => (
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
									void handleShare(currentCards, "one");
								}}
							>
								{isSharing === "one" && (
									<LoaderCircle className="size-4 animate-spin" aria-hidden />
								)}
								{isSharing !== "one" && <Share2 className="size-4" />}
								{isSharing === "one" && PODIUM_SHARE_LABEL.sharing}
								{isSharing !== "one" && PODIUM_SHARE_LABEL.shareOne}
							</Button>
						)}
						{allCards.length > 0 && (
							<Button
								variant={BUTTON_VARIANT.secondary}
								disabled={isSharing !== null}
								onClick={() => {
									void handleShare(allCards, "all");
								}}
							>
								{isSharing === "all" && (
									<LoaderCircle className="size-4 animate-spin" aria-hidden />
								)}
								{isSharing !== "all" && <Share2 className="size-4" />}
								{isSharing === "all" && PODIUM_SHARE_LABEL.sharing}
								{isSharing !== "all" && PODIUM_SHARE_LABEL.shareAll}
							</Button>
						)}
					</div>
				)}
			</div>
			{shareError && <p className={`mb-4 ${ERROR_CLASS}`}>{shareError}</p>}
			<ChampionshipPodium players={podiumPlayers} metric={metric} />
		</SectionCard>
	);
}
