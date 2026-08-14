import { createColumnHelper } from "@tanstack/react-table";
import { CalendarDays } from "lucide-react";
import { useMemo } from "react";
import { EmptyState } from "@/components/empty-state";
import { PlayerRatingHistoryChart } from "@/components/molecules/player-rating-history-chart";
import {
	DataTable,
	type DataTableFeatures,
} from "@/components/organisms/data-table";
import { PlayerRating } from "@/components/player-rating";
import { SectionCard } from "@/components/section-card";
import { formatEventStartsAt } from "@/const/championship-event";
import {
	CHAMPIONSHIP_ROLE_LABEL,
	resolveChampionshipRole,
} from "@/const/championship-role";
import { playerVisibleName } from "@/const/player-name";
import {
	formatPlayerProfileDelta,
	PLAYER_PROFILE_HISTORY_ABBR,
	PLAYER_PROFILE_HISTORY_COLUMN,
	PLAYER_PROFILE_HISTORY_COLUMN_LABEL,
	PLAYER_PROFILE_HISTORY_LEGEND,
	PLAYER_PROFILE_LABEL,
	type PlayerProfileHistoryRow,
	playerRatingHistoryChartSeries,
} from "@/const/player-profile";
import {
	formatRosterStat,
	ROSTER_COLUMN_ABBR,
	ROSTER_COLUMN_LABEL,
	ROSTER_STAT_COLUMNS,
	type RosterRow,
} from "@/const/roster-stats";
import { CARD_CLASS, CHIP_CLASS, ERROR_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";

const historyColumnHelper = createColumnHelper<
	DataTableFeatures,
	PlayerProfileHistoryRow
>();

const ROLE_TAG_CLASS =
	"mt-1 inline-flex rounded-full bg-pitch-soft px-2 py-0.5 text-xs font-medium text-pitch-fg";

type ChampionshipPlayerDetailProps = {
	player: ChampionshipPlayer;
	createdBy: string;
	ceiling: number;
	isOwnerViewer: boolean;
	career: RosterRow;
	history: readonly PlayerProfileHistoryRow[];
	historyPending: boolean;
	historyError: string | null;
	onOpenEvent: (eventId: number) => void;
};

function PlayerProfileHeader({
	player,
	createdBy,
	ceiling,
	isOwnerViewer,
}: {
	player: ChampionshipPlayer;
	createdBy: string;
	ceiling: number;
	isOwnerViewer: boolean;
}) {
	const visibleName = playerVisibleName(player);
	const showLegalName = visibleName !== player.display_name;
	const displayRole = resolveChampionshipRole(
		createdBy,
		player.user_id,
		player.role,
	);

	return (
		<div className="flex flex-wrap items-center gap-4">
			{player.avatar_url && (
				<img
					src={player.avatar_url}
					alt=""
					referrerPolicy="no-referrer"
					className="size-16 rounded-full object-cover"
				/>
			)}
			{!player.avatar_url && (
				<span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-pitch-soft text-lg font-medium text-pitch-fg">
					{visibleName.charAt(0).toUpperCase()}
				</span>
			)}
			<div className="min-w-0">
				<p className="truncate text-lg font-semibold text-fg">{visibleName}</p>
				{showLegalName && (
					<p className="truncate text-sm text-fg-muted">
						{player.display_name}
					</p>
				)}
				{!player.user_id && (
					<span className="mt-1 inline-flex rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-fg-muted">
						{PLAYER_PROFILE_LABEL.noAccount}
					</span>
				)}
				{player.user_id && (
					<span className={ROLE_TAG_CLASS}>
						{CHAMPIONSHIP_ROLE_LABEL[displayRole]}
					</span>
				)}
			</div>
			<div className="flex items-center gap-2">
				<PlayerRating rating={player.rating} ceiling={ceiling} />
				{isOwnerViewer && <span className={CHIP_CLASS}>{player.rating}</span>}
			</div>
		</div>
	);
}

function PlayerCareerStats({ career }: { career: RosterRow }) {
	return (
		<div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
			{ROSTER_STAT_COLUMNS.map((column) => (
				<div key={column}>
					<p
						className="text-xs font-medium text-fg-muted"
						title={ROSTER_COLUMN_LABEL[column]}
					>
						{ROSTER_COLUMN_ABBR[column]}
					</p>
					<p className="text-lg font-semibold tabular-nums text-fg">
						{formatRosterStat(column, career[column])}
					</p>
				</div>
			))}
		</div>
	);
}

function PlayerHistoryTable({
	history,
	onOpenEvent,
}: {
	history: readonly PlayerProfileHistoryRow[];
	onOpenEvent: (eventId: number) => void;
}) {
	const columns = useMemo(
		() =>
			historyColumnHelper.columns([
				historyColumnHelper.accessor("startsAt", {
					id: PLAYER_PROFILE_HISTORY_COLUMN.date,
					header: PLAYER_PROFILE_HISTORY_ABBR.date,
					enableHiding: false,
					meta: { title: PLAYER_PROFILE_HISTORY_COLUMN_LABEL.date },
					cell: ({ row }) => {
						const when = formatEventStartsAt(row.original.startsAt);
						return `${when.date} · ${when.time}`;
					},
				}),
				historyColumnHelper.accessor("goals", {
					id: PLAYER_PROFILE_HISTORY_COLUMN.goals,
					header: PLAYER_PROFILE_HISTORY_ABBR.goals,
					enableHiding: false,
					meta: {
						align: "right" as const,
						title: PLAYER_PROFILE_HISTORY_COLUMN_LABEL.goals,
					},
					cell: ({ getValue }) => (
						<span className="tabular-nums">{getValue()}</span>
					),
				}),
				historyColumnHelper.accessor("assists", {
					id: PLAYER_PROFILE_HISTORY_COLUMN.assists,
					header: PLAYER_PROFILE_HISTORY_ABBR.assists,
					enableHiding: false,
					meta: {
						align: "right" as const,
						title: PLAYER_PROFILE_HISTORY_COLUMN_LABEL.assists,
					},
					cell: ({ getValue }) => (
						<span className="tabular-nums">{getValue()}</span>
					),
				}),
				historyColumnHelper.accessor("ownGoals", {
					id: PLAYER_PROFILE_HISTORY_COLUMN.own_goals,
					header: PLAYER_PROFILE_HISTORY_ABBR.own_goals,
					enableHiding: false,
					meta: {
						align: "right" as const,
						title: PLAYER_PROFILE_HISTORY_COLUMN_LABEL.own_goals,
					},
					cell: ({ getValue }) => (
						<span className="tabular-nums">{getValue()}</span>
					),
				}),
				historyColumnHelper.accessor("wins", {
					id: PLAYER_PROFILE_HISTORY_COLUMN.wins,
					header: PLAYER_PROFILE_HISTORY_ABBR.wins,
					enableHiding: false,
					meta: {
						align: "right" as const,
						title: PLAYER_PROFILE_HISTORY_COLUMN_LABEL.wins,
					},
					cell: ({ getValue }) => (
						<span className="tabular-nums">{getValue()}</span>
					),
				}),
				historyColumnHelper.accessor("matches", {
					id: PLAYER_PROFILE_HISTORY_COLUMN.matches,
					header: PLAYER_PROFILE_HISTORY_ABBR.matches,
					enableHiding: false,
					meta: {
						align: "right" as const,
						title: PLAYER_PROFILE_HISTORY_COLUMN_LABEL.matches,
					},
					cell: ({ getValue }) => (
						<span className="tabular-nums">{getValue()}</span>
					),
				}),
				historyColumnHelper.accessor("ratingDelta", {
					id: PLAYER_PROFILE_HISTORY_COLUMN.delta,
					header: PLAYER_PROFILE_HISTORY_ABBR.delta,
					enableHiding: false,
					meta: {
						align: "right" as const,
						title: PLAYER_PROFILE_HISTORY_COLUMN_LABEL.delta,
					},
					cell: ({ getValue }) => (
						<span className="tabular-nums">
							{formatPlayerProfileDelta(getValue())}
						</span>
					),
				}),
			]),
		[],
	);

	return (
		<DataTable
			data={[...history]}
			columns={columns}
			getRowId={(row) => String(row.eventId)}
			legendItems={PLAYER_PROFILE_HISTORY_LEGEND}
			onRowClick={(row) => {
				onOpenEvent(row.eventId);
			}}
		/>
	);
}

export function ChampionshipPlayerDetail({
	player,
	createdBy,
	ceiling,
	isOwnerViewer,
	career,
	history,
	historyPending,
	historyError,
	onOpenEvent,
}: ChampionshipPlayerDetailProps) {
	return (
		<div className="space-y-4">
			<section className={CARD_CLASS}>
				<PlayerProfileHeader
					player={player}
					createdBy={createdBy}
					ceiling={ceiling}
					isOwnerViewer={isOwnerViewer}
				/>
			</section>
			<SectionCard title={PLAYER_PROFILE_LABEL.career}>
				<PlayerCareerStats career={career} />
			</SectionCard>
			<SectionCard title={PLAYER_PROFILE_LABEL.history}>
				{historyPending && (
					<p className="text-sm text-fg-muted">
						{PLAYER_PROFILE_LABEL.eventsLoading}
					</p>
				)}
				{historyError && <p className={ERROR_CLASS}>{historyError}</p>}
				{!historyPending && !historyError && history.length === 0 && (
					<EmptyState
						icon={<CalendarDays className="size-10" />}
						title={PLAYER_PROFILE_LABEL.emptyHistory}
					/>
				)}
				{!historyPending && !historyError && history.length > 0 && (
					<div className="space-y-4">
						<PlayerRatingHistoryChart
							points={playerRatingHistoryChartSeries(
								history,
								player.rating,
								new Date().toISOString(),
							)}
							ceiling={ceiling}
						/>
						<PlayerHistoryTable history={history} onOpenEvent={onOpenEvent} />
					</div>
				)}
			</SectionCard>
		</div>
	);
}
