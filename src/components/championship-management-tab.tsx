import { Link } from "@tanstack/react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { AlertTriangle, ClipboardList, Users } from "lucide-react";
import { useMemo } from "react";
import { ChampionshipAuditLog } from "@/components/championship-audit-log";
import { EmptyState } from "@/components/empty-state";
import { PlayerNameLink } from "@/components/molecules/player-name-link";
import {
	DataTable,
	type DataTableFeatures,
} from "@/components/organisms/data-table";
import { SectionCard } from "@/components/section-card";
import {
	formatManagementStat,
	formatManagementSummary,
	MANAGEMENT_COLUMN,
	MANAGEMENT_COLUMN_ABBR,
	MANAGEMENT_COLUMN_LABEL,
	MANAGEMENT_LABEL,
	MANAGEMENT_LEGEND,
	MANAGEMENT_STAT_COLUMN_OPTIONS,
	MANAGEMENT_SUMMARY,
	MANAGEMENT_SUMMARY_LABEL,
	type ManagementFrequencyRow,
	type ManagementSummaryId,
	managementAlerts,
	managementFrequencyRows,
	managementSummary,
	rankManagementFrequencyRows,
} from "@/const/championship-management";
import { playerVisibleName } from "@/const/player-name";
import { ROUTES } from "@/const/routes";
import { ERROR_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";
import type { ChampionshipEvent } from "@/types/championship-event";

const frequencyColumnHelper = createColumnHelper<
	DataTableFeatures,
	ManagementFrequencyRow
>();

const SUMMARY_IDS = [
	MANAGEMENT_SUMMARY.endedEvents,
	MANAGEMENT_SUMMARY.averageAttendance,
	MANAGEMENT_SUMMARY.openEvents,
	MANAGEMENT_SUMMARY.openMatches,
] as const satisfies readonly ManagementSummaryId[];

type ChampionshipManagementTabProps = {
	championshipId: number;
	players: ChampionshipPlayer[];
	events: readonly ChampionshipEvent[];
	eventsPending: boolean;
	eventsError: string | null;
};

function FrequencyTable({ rows }: { rows: ManagementFrequencyRow[] }) {
	const columns = useMemo(
		() =>
			frequencyColumnHelper.columns([
				frequencyColumnHelper.accessor((row) => playerVisibleName(row.player), {
					id: MANAGEMENT_COLUMN.player,
					header: MANAGEMENT_COLUMN_LABEL.player,
					enableHiding: false,
					meta: { title: MANAGEMENT_COLUMN_LABEL.player },
					cell: ({ row }) => <PlayerNameLink player={row.original.player} />,
				}),
				frequencyColumnHelper.accessor("present", {
					id: MANAGEMENT_COLUMN.present,
					header: MANAGEMENT_COLUMN_ABBR.present,
					meta: {
						align: "right" as const,
						title: MANAGEMENT_COLUMN_LABEL.present,
					},
					cell: ({ row }) => (
						<span className="tabular-nums">
							{formatManagementStat(MANAGEMENT_COLUMN.present, row.original)}
						</span>
					),
				}),
				frequencyColumnHelper.accessor("events", {
					id: MANAGEMENT_COLUMN.events,
					header: MANAGEMENT_COLUMN_ABBR.events,
					meta: {
						align: "right" as const,
						title: MANAGEMENT_COLUMN_LABEL.events,
					},
					cell: ({ row }) => (
						<span className="tabular-nums">
							{formatManagementStat(MANAGEMENT_COLUMN.events, row.original)}
						</span>
					),
				}),
				frequencyColumnHelper.accessor("rate", {
					id: MANAGEMENT_COLUMN.rate,
					header: MANAGEMENT_COLUMN_ABBR.rate,
					meta: {
						align: "right" as const,
						title: MANAGEMENT_COLUMN_LABEL.rate,
					},
					cell: ({ row }) => (
						<span className="tabular-nums">
							{formatManagementStat(MANAGEMENT_COLUMN.rate, row.original)}
						</span>
					),
				}),
				frequencyColumnHelper.accessor("streak", {
					id: MANAGEMENT_COLUMN.streak,
					header: MANAGEMENT_COLUMN_ABBR.streak,
					meta: {
						align: "right" as const,
						title: MANAGEMENT_COLUMN_LABEL.streak,
					},
					cell: ({ row }) => (
						<span className="tabular-nums">
							{formatManagementStat(MANAGEMENT_COLUMN.streak, row.original)}
						</span>
					),
				}),
				frequencyColumnHelper.accessor("lastPlayedAt", {
					id: MANAGEMENT_COLUMN.lastPlayed,
					header: MANAGEMENT_COLUMN_ABBR.lastPlayed,
					meta: { title: MANAGEMENT_COLUMN_LABEL.lastPlayed },
					cell: ({ row }) =>
						formatManagementStat(MANAGEMENT_COLUMN.lastPlayed, row.original),
				}),
			]),
		[],
	);

	return (
		<DataTable
			data={rows}
			columns={columns}
			getRowId={(row) => String(row.player.id)}
			hideableColumns={MANAGEMENT_STAT_COLUMN_OPTIONS}
			legendItems={MANAGEMENT_LEGEND}
		/>
	);
}

export function ChampionshipManagementTab({
	championshipId,
	players,
	events,
	eventsPending,
	eventsError,
}: ChampionshipManagementTabProps) {
	const summary = managementSummary(events);
	const frequency = rankManagementFrequencyRows(
		managementFrequencyRows(players, events),
	);
	const alerts = managementAlerts(events);

	return (
		<div className="space-y-6">
			<SectionCard
				title={MANAGEMENT_LABEL.summary}
				icon={<ClipboardList className="size-4 text-pitch-fg" />}
			>
				{eventsError && <p className={ERROR_CLASS}>{eventsError}</p>}
				{!eventsError && events.length === 0 && !eventsPending && (
					<EmptyState
						icon={<ClipboardList className="size-10" />}
						title={MANAGEMENT_LABEL.empty}
					/>
				)}
				{!eventsError && (events.length > 0 || eventsPending) && (
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
						{SUMMARY_IDS.map((id) => (
							<div key={id}>
								<p className="text-xs font-medium text-fg-muted">
									{MANAGEMENT_SUMMARY_LABEL[id]}
								</p>
								<p className="text-lg font-semibold tabular-nums text-fg">
									{formatManagementSummary(id, summary[id])}
								</p>
							</div>
						))}
					</div>
				)}
			</SectionCard>
			<SectionCard
				title={MANAGEMENT_LABEL.alerts}
				icon={<AlertTriangle className="size-4 text-pitch-fg" />}
			>
				{alerts.length === 0 && (
					<p className="text-sm text-fg-muted">{MANAGEMENT_LABEL.noAlerts}</p>
				)}
				{alerts.length > 0 && (
					<ul className="space-y-2">
						{alerts.map((alert) => (
							<li key={alert.id}>
								<Link
									to={ROUTES.championshipEvent}
									params={{
										championshipId: String(championshipId),
										eventId: String(alert.eventId),
									}}
									className="block rounded-xl border border-line bg-surface px-4 py-3 text-sm font-medium text-fg hover:border-pitch/30 hover:bg-pitch-soft/40"
								>
									{alert.label}
								</Link>
							</li>
						))}
					</ul>
				)}
			</SectionCard>
			<SectionCard
				title={MANAGEMENT_LABEL.frequency}
				icon={<Users className="size-4 text-pitch-fg" />}
			>
				{frequency.length === 0 && (
					<EmptyState
						icon={<Users className="size-10" />}
						title={MANAGEMENT_LABEL.emptyFrequency}
					/>
				)}
				{frequency.length > 0 && <FrequencyTable rows={frequency} />}
			</SectionCard>
			<ChampionshipAuditLog championshipId={championshipId} />
		</div>
	);
}
