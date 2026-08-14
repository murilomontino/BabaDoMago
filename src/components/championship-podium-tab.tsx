import { Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { ChampionshipPodium } from "@/components/championship-podium";
import { SectionCard } from "@/components/section-card";
import {
	aggregatePodiumPlayersFromEvents,
	PODIUM_DEFAULT_METRIC,
	PODIUM_FILTER_LABEL,
	PODIUM_LABEL,
	PODIUM_METRIC_OPTIONS,
	PODIUM_SEASON_YEAR,
	PODIUM_SEMESTER,
	type PodiumMetricId,
	type PodiumSemester,
	parsePodiumMetric,
	togglePodiumSemester,
} from "@/const/podium";
import { FIELD_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";
import type { ChampionshipEvent } from "@/types/championship-event";

const FILTER_CHIP =
	"inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition";
const FILTER_CHIP_ON = `${FILTER_CHIP} bg-pitch text-white hover:bg-pitch-dark`;
const FILTER_CHIP_OFF = `${FILTER_CHIP} bg-surface-muted text-fg-muted hover:bg-black/10 hover:text-fg`;

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
	const podiumPlayers = useMemo(() => {
		if (!events) {
			return players;
		}

		return aggregatePodiumPlayersFromEvents(
			players,
			events,
			PODIUM_SEASON_YEAR,
			semester,
		);
	}, [events, players, semester]);

	return (
		<SectionCard
			title={PODIUM_LABEL.tab}
			icon={<Trophy className="size-4 text-pitch-fg" />}
		>
			{events && (
				<div className="mb-4 flex flex-wrap gap-2">
					<button
						type="button"
						className={FILTER_CHIP_ON}
						onClick={() => setSemester(null)}
					>
						{PODIUM_FILTER_LABEL.season}
					</button>
					<button
						type="button"
						className={
							semester === PODIUM_SEMESTER.first
								? FILTER_CHIP_ON
								: FILTER_CHIP_OFF
						}
						onClick={() => {
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
						className={
							semester === PODIUM_SEMESTER.second
								? FILTER_CHIP_ON
								: FILTER_CHIP_OFF
						}
						onClick={() => {
							setSemester(
								togglePodiumSemester(semester, PODIUM_SEMESTER.second)
									.semester,
							);
						}}
					>
						{PODIUM_FILTER_LABEL[PODIUM_SEMESTER.second]}
					</button>
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
