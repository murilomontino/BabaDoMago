import { Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { ChampionshipPodium } from "@/components/championship-podium";
import { SectionCard } from "@/components/section-card";
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
import { FIELD_CLASS } from "@/const/ui";
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
	events?: readonly ChampionshipEvent[];
};

export function ChampionshipPodiumTab({
	players,
	events,
}: ChampionshipPodiumTabProps) {
	const [metric, setMetric] = useState<PodiumMetricId>(PODIUM_DEFAULT_METRIC);
	const [semester, setSemester] = useState<PodiumSemester | null>(null);
	const [months, setMonths] = useState<PodiumMonth[]>([]);
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
			<label className="mb-6 block max-w-xs text-sm text-fg-muted">
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
			<ChampionshipPodium players={podiumPlayers} metric={metric} />
		</SectionCard>
	);
}
