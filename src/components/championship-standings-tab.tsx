import { Link } from "@tanstack/react-router";
import { ChartColumn } from "lucide-react";
import { useMemo } from "react";
import { ChampionshipEventStandings } from "@/components/championship-event-standings";
import { SectionCard } from "@/components/section-card";
import { formatEventStartsAt } from "@/const/championship-event";
import { CHAMPIONSHIP_TAB_LABEL } from "@/const/championship-tab";
import {
	championshipRoundStandings,
	EVENT_TEAM_STANDINGS_LABEL,
} from "@/const/event-team-standings";
import { ROUTES } from "@/const/routes";
import { CHAMPIONSHIP_EVENTS_QUERY_KEY } from "@/hooks/championships/championships-query-keys";
import type { ChampionshipEvent } from "@/types/championship-event";

type ChampionshipStandingsTabProps = {
	events: readonly ChampionshipEvent[];
};

export function ChampionshipStandingsTab({
	events,
}: ChampionshipStandingsTabProps) {
	const rounds = useMemo(() => championshipRoundStandings(events), [events]);

	return (
		<SectionCard
			title={CHAMPIONSHIP_TAB_LABEL.standings}
			icon={<ChartColumn className="size-4 text-pitch-fg" />}
			queryKey={CHAMPIONSHIP_EVENTS_QUERY_KEY}
		>
			{rounds.length === 0 && (
				<p className="text-sm text-fg-muted">
					{EVENT_TEAM_STANDINGS_LABEL.empty}
				</p>
			)}
			{rounds.length > 0 && (
				<ul className="space-y-6">
					{rounds.map((round) => {
						const when = formatEventStartsAt(round.startsAt);

						return (
							<li key={round.eventId}>
								<ChampionshipEventStandings
									teams={round.teams}
									matches={round.matches}
									title={
										<Link
											to={ROUTES.championshipEvent}
											params={{
												championshipId: String(round.championshipId),
												eventId: String(round.eventId),
											}}
											className="text-pitch-fg hover:underline"
										>
											{when.date}
										</Link>
									}
								/>
							</li>
						);
					})}
				</ul>
			)}
		</SectionCard>
	);
}
