import { EventTeamChip } from "@/components/event-team-player";
import {
	EVENT_TEAM_STANDINGS_ABBR,
	EVENT_TEAM_STANDINGS_LABEL,
	eventTeamStandings,
	formatStandingGoalDifference,
} from "@/const/event-team-standings";
import type {
	ChampionshipEventMatch,
	ChampionshipEventTeam,
} from "@/types/championship-event";

type ChampionshipEventStandingsProps = {
	teams: readonly ChampionshipEventTeam[];
	matches: readonly ChampionshipEventMatch[];
};

const STAT_HEADER_CLASS =
	"px-2 py-1.5 text-right text-xs font-medium text-fg-muted";
const STAT_CELL_CLASS = "px-2 py-1.5 text-right tabular-nums text-fg";

export function ChampionshipEventStandings({
	teams,
	matches,
}: ChampionshipEventStandingsProps) {
	const rows = eventTeamStandings(teams, matches);
	const hasEndedMatches = matches.some((match) => match.ended_at !== null);

	return (
		<div>
			<p className="mb-1 text-xs font-medium uppercase tracking-wide text-fg-muted">
				{EVENT_TEAM_STANDINGS_LABEL.title}
			</p>
			{!hasEndedMatches && (
				<p className="text-sm text-fg-muted">
					{EVENT_TEAM_STANDINGS_LABEL.empty}
				</p>
			)}
			{hasEndedMatches && (
				<div className="overflow-x-auto rounded-lg border border-line">
					<table className="w-full min-w-xl border-collapse text-sm">
						<thead>
							<tr className="border-b border-line bg-surface-muted">
								<th
									scope="col"
									className="px-2 py-1.5 text-left text-xs font-medium text-fg-muted"
								>
									{EVENT_TEAM_STANDINGS_LABEL.team}
								</th>
								<th
									scope="col"
									className={STAT_HEADER_CLASS}
									title={EVENT_TEAM_STANDINGS_LABEL.matches}
								>
									{EVENT_TEAM_STANDINGS_ABBR.matches}
								</th>
								<th
									scope="col"
									className={STAT_HEADER_CLASS}
									title={EVENT_TEAM_STANDINGS_LABEL.wins}
								>
									{EVENT_TEAM_STANDINGS_ABBR.wins}
								</th>
								<th
									scope="col"
									className={STAT_HEADER_CLASS}
									title={EVENT_TEAM_STANDINGS_LABEL.draws}
								>
									{EVENT_TEAM_STANDINGS_ABBR.draws}
								</th>
								<th
									scope="col"
									className={STAT_HEADER_CLASS}
									title={EVENT_TEAM_STANDINGS_LABEL.losses}
								>
									{EVENT_TEAM_STANDINGS_ABBR.losses}
								</th>
								<th
									scope="col"
									className={STAT_HEADER_CLASS}
									title={EVENT_TEAM_STANDINGS_LABEL.goalsFor}
								>
									{EVENT_TEAM_STANDINGS_ABBR.goalsFor}
								</th>
								<th
									scope="col"
									className={STAT_HEADER_CLASS}
									title={EVENT_TEAM_STANDINGS_LABEL.goalsAgainst}
								>
									{EVENT_TEAM_STANDINGS_ABBR.goalsAgainst}
								</th>
								<th
									scope="col"
									className={STAT_HEADER_CLASS}
									title={EVENT_TEAM_STANDINGS_LABEL.goalDifference}
								>
									{EVENT_TEAM_STANDINGS_ABBR.goalDifference}
								</th>
								<th
									scope="col"
									className={STAT_HEADER_CLASS}
									title={EVENT_TEAM_STANDINGS_LABEL.points}
								>
									{EVENT_TEAM_STANDINGS_ABBR.points}
								</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((row) => (
								<tr
									key={row.teamId}
									className="border-b border-line last:border-b-0 even:bg-surface-muted"
								>
									<td className="px-2 py-1.5">
										<EventTeamChip
											color={row.color}
											sortOrder={row.sortOrder}
										/>
									</td>
									<td className={STAT_CELL_CLASS}>{row.matches}</td>
									<td className={STAT_CELL_CLASS}>{row.wins}</td>
									<td className={STAT_CELL_CLASS}>{row.draws}</td>
									<td className={STAT_CELL_CLASS}>{row.losses}</td>
									<td className={STAT_CELL_CLASS}>{row.goalsFor}</td>
									<td className={STAT_CELL_CLASS}>{row.goalsAgainst}</td>
									<td className={STAT_CELL_CLASS}>
										{formatStandingGoalDifference(row.goalDifference)}
									</td>
									<td className={`${STAT_CELL_CLASS} font-semibold`}>
										{row.points}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
