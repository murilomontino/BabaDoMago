import { Trophy } from "lucide-react";
import { useState } from "react";
import { ChampionshipPodium } from "@/components/championship-podium";
import { SectionCard } from "@/components/section-card";
import {
	PODIUM_DEFAULT_METRIC,
	PODIUM_LABEL,
	parsePodiumMetric,
} from "@/const/podium";
import {
	ROSTER_STAT_COLUMN_OPTIONS,
	type RosterStatColumnId,
} from "@/const/roster-stats";
import { FIELD_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";

type ChampionshipPodiumTabProps = {
	players: ChampionshipPlayer[];
};

export function ChampionshipPodiumTab({ players }: ChampionshipPodiumTabProps) {
	const [metric, setMetric] = useState<RosterStatColumnId>(
		PODIUM_DEFAULT_METRIC,
	);

	return (
		<SectionCard
			title={PODIUM_LABEL.tab}
			icon={<Trophy className="size-4 text-pitch-fg" />}
		>
			<label className="mb-6 block max-w-xs text-sm text-fg-muted">
				{PODIUM_LABEL.metric}
				<select
					value={metric}
					className={`mt-1 ${FIELD_CLASS}`}
					onChange={(event) => {
						setMetric(parsePodiumMetric(event.target.value));
					}}
				>
					{ROSTER_STAT_COLUMN_OPTIONS.map((option) => (
						<option key={option.id} value={option.id}>
							{option.label}
						</option>
					))}
				</select>
			</label>
			<ChampionshipPodium players={players} metric={metric} />
		</SectionCard>
	);
}
