import { createColumnHelper } from "@tanstack/react-table";
import { CalendarDays, Handshake, LoaderCircle, Share2 } from "lucide-react";
import { lazy, Suspense, useMemo, useState } from "react";
import { AppDialog } from "@/components/atoms/app-dialog";
import { Skeleton, SkeletonRegion } from "@/components/atoms/skeleton";
import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { DataTableSkeleton } from "@/components/molecules/data-table-skeleton";
import { PlayerNameLink } from "@/components/molecules/player-name-link";
import {
	DataTable,
	type DataTableFeatures,
} from "@/components/organisms/data-table";
import { PlayerRating } from "@/components/player-rating";
import { PlayerRatingSim } from "@/components/player-rating-sim";
import { SectionCard } from "@/components/section-card";
import { Tabs } from "@/components/tabs";
import { formatEventStartsAt } from "@/const/championship-event";
import {
	CHAMPIONSHIP_ROLE_LABEL,
	resolveChampionshipRole,
} from "@/const/championship-role";
import {
	formatGoalkeeperAverage,
	formatGoalkeeperCount,
	formatGoalkeeperWinRate,
	GOALKEEPER_STATS_LABEL,
	type GoalkeeperStats,
} from "@/const/goalkeeper-stats";
import {
	formatPlayerFormDelta,
	formatPlayerFormStreak,
	formatPlayerFormWinRate,
	PLAYER_FORM_LABEL,
	playerRecentForm,
} from "@/const/player-form";
import { PLAYER_LABEL, playerVisibleName } from "@/const/player-name";
import {
	formatPlayerProfileDelta,
	PLAYER_PROFILE_HISTORY_ABBR,
	PLAYER_PROFILE_HISTORY_COLUMN,
	PLAYER_PROFILE_HISTORY_COLUMN_LABEL,
	PLAYER_PROFILE_HISTORY_COLUMNS,
	PLAYER_PROFILE_HISTORY_LEGEND,
	PLAYER_PROFILE_LABEL,
	PLAYER_RATING_HISTORY_CHART,
	type PlayerProfileHistoryRow,
	playerRatingHistoryChartSeries,
} from "@/const/player-profile";
import {
	PLAYER_PROFILE_SHARE_LABEL,
	playerProfileShareCard,
} from "@/const/player-profile-share";
import {
	PLAYER_PROFILE_TAB,
	PLAYER_PROFILE_TABS,
} from "@/const/player-profile-tab";
import { PLAYER_RATING_SIM_LABEL } from "@/const/player-rating-sim";
import {
	formatSynergyStat,
	SYNERGY_COLUMN,
	SYNERGY_COLUMN_ABBR,
	SYNERGY_LABEL,
	SYNERGY_PARTNER_COLUMN_LABEL,
	SYNERGY_PARTNER_LEGEND,
	SYNERGY_STAT_COLUMN_OPTIONS,
	type SynergyPartnerRow,
} from "@/const/player-synergy";
import {
	formatRosterStat,
	ROSTER_COLUMN_ABBR,
	ROSTER_COLUMN_LABEL,
	ROSTER_DEFAULT_COLUMN_VISIBILITY,
	ROSTER_OPTIONAL_COLUMN_OPTIONS,
	ROSTER_STAT_COLUMNS,
	type RosterRow,
} from "@/const/roster-stats";
import { SKELETON_LABEL } from "@/const/skeleton";
import {
	BUTTON_VARIANT,
	CARD_CLASS,
	CHIP_CLASS,
	ERROR_CLASS,
} from "@/const/ui";
import { usePlayerProfileTab } from "@/hooks/use-player-profile-tab";
import { sharePlayerProfileImage } from "@/lib/share-player-profile-image";
import { enlargeAvatarUrl } from "@/lib/user-profile";
import type { ChampionshipPlayer } from "@/types/championship";

const PlayerRatingHistoryChart = lazy(() =>
	import("@/components/molecules/player-rating-history-chart").then((m) => ({
		default: m.PlayerRatingHistoryChart,
	})),
);

const historyColumnHelper = createColumnHelper<
	DataTableFeatures,
	PlayerProfileHistoryRow
>();

const ROLE_TAG_CLASS =
	"mt-1 inline-flex rounded-full bg-pitch-soft px-2 py-0.5 text-xs font-medium text-pitch-fg";

type ChampionshipPlayerDetailProps = {
	player: ChampionshipPlayer;
	createdBy: string;
	championshipName: string;
	ceiling: number;
	isOwnerViewer: boolean;
	career: RosterRow;
	history: readonly PlayerProfileHistoryRow[];
	historyPending: boolean;
	historyError: string | null;
	partners: readonly SynergyPartnerRow[];
	goalkeeper: GoalkeeperStats | null;
	onOpenEvent: (eventId: number) => void;
};

function PlayerProfileHeader({
	player,
	createdBy,
	championshipName,
	ceiling,
	isOwnerViewer,
	career,
	history,
}: {
	player: ChampionshipPlayer;
	createdBy: string;
	championshipName: string;
	ceiling: number;
	isOwnerViewer: boolean;
	career: RosterRow;
	history: readonly PlayerProfileHistoryRow[];
}) {
	const visibleName = playerVisibleName(player);
	const showLegalName = visibleName !== player.display_name;
	const displayRole = resolveChampionshipRole(
		createdBy,
		player.user_id,
		player.role,
	);
	const [isSharing, setIsSharing] = useState(false);
	const [shareError, setShareError] = useState<string | null>(null);
	const [previewOpen, setPreviewOpen] = useState(false);

	async function handleShare() {
		setIsSharing(true);
		setShareError(null);
		try {
			await sharePlayerProfileImage(
				playerProfileShareCard(
					player,
					career,
					createdBy,
					championshipName,
					history,
					new Date().toISOString(),
				),
				ceiling,
			);
		} catch {
			setShareError(PLAYER_PROFILE_SHARE_LABEL.shareFailed);
		} finally {
			setIsSharing(false);
		}
	}

	return (
		<div className="space-y-3">
			<div className="flex flex-wrap items-center gap-4">
				{player.avatar_url && (
					<button
						type="button"
						aria-label={PLAYER_PROFILE_LABEL.viewPhoto}
						className="shrink-0 rounded-full hover:opacity-80"
						onClick={() => {
							setPreviewOpen(true);
						}}
					>
						<img
							src={player.avatar_url}
							alt=""
							referrerPolicy="no-referrer"
							className="size-16 rounded-full object-cover"
						/>
					</button>
				)}
				{previewOpen && player.avatar_url && (
					<AppDialog
						onClose={() => {
							setPreviewOpen(false);
						}}
					>
						<img
							src={enlargeAvatarUrl(player.avatar_url)}
							alt={visibleName}
							referrerPolicy="no-referrer"
							className="size-[min(80vw,20rem)] rounded-full object-cover"
						/>
					</AppDialog>
				)}
				{!player.avatar_url && (
					<span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-pitch-soft text-lg font-medium text-pitch-fg">
						{visibleName.charAt(0).toUpperCase()}
					</span>
				)}
				<div className="min-w-0">
					<p className="truncate text-lg font-semibold text-fg">
						{visibleName}
					</p>
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
					{player.is_goalkeeper && (
						<span className={ROLE_TAG_CLASS}>{PLAYER_LABEL.goalkeeper}</span>
					)}
				</div>
				<div className="ml-auto flex items-center gap-2">
					<div className="flex items-center gap-2">
						<PlayerRating rating={player.rating} ceiling={ceiling} />
						{isOwnerViewer && (
							<span className={CHIP_CLASS}>{player.rating}</span>
						)}
					</div>
					<Button
						variant={BUTTON_VARIANT.secondary}
						disabled={isSharing}
						onClick={() => {
							void handleShare();
						}}
					>
						{isSharing && (
							<LoaderCircle className="size-4 animate-spin" aria-hidden />
						)}
						{!isSharing && <Share2 className="size-4" />}
						{isSharing && PLAYER_PROFILE_SHARE_LABEL.sharing}
						{!isSharing && PLAYER_PROFILE_SHARE_LABEL.share}
					</Button>
				</div>
			</div>
			{shareError && <p className={ERROR_CLASS}>{shareError}</p>}
		</div>
	);
}

function PlayerStatGrid({
	items,
}: {
	items: readonly { id: string; label: string; value: string }[];
}) {
	return (
		<div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
			{items.map((item) => (
				<div key={item.id}>
					<p className="text-xs font-medium text-fg-muted" title={item.label}>
						{item.label}
					</p>
					<p className="text-lg font-semibold tabular-nums text-fg">
						{item.value}
					</p>
				</div>
			))}
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
				historyColumnHelper.accessor("assistedGoals", {
					id: PLAYER_PROFILE_HISTORY_COLUMN.assisted_goals,
					header: PLAYER_PROFILE_HISTORY_ABBR.assisted_goals,
					meta: {
						align: "right" as const,
						title: PLAYER_PROFILE_HISTORY_COLUMN_LABEL.assisted_goals,
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
				historyColumnHelper.accessor("losses", {
					id: PLAYER_PROFILE_HISTORY_COLUMN.losses,
					header: PLAYER_PROFILE_HISTORY_ABBR.losses,
					meta: {
						align: "right" as const,
						title: PLAYER_PROFILE_HISTORY_COLUMN_LABEL.losses,
					},
					cell: ({ getValue }) => (
						<span className="tabular-nums">{getValue()}</span>
					),
				}),
				historyColumnHelper.accessor("draws", {
					id: PLAYER_PROFILE_HISTORY_COLUMN.draws,
					header: PLAYER_PROFILE_HISTORY_ABBR.draws,
					meta: {
						align: "right" as const,
						title: PLAYER_PROFILE_HISTORY_COLUMN_LABEL.draws,
					},
					cell: ({ getValue }) => (
						<span className="tabular-nums">{getValue()}</span>
					),
				}),
				historyColumnHelper.accessor("mvps", {
					id: PLAYER_PROFILE_HISTORY_COLUMN.mvps,
					header: PLAYER_PROFILE_HISTORY_ABBR.mvps,
					enableHiding: false,
					meta: {
						align: "right" as const,
						title: PLAYER_PROFILE_HISTORY_COLUMN_LABEL.mvps,
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
			hideableColumns={ROSTER_OPTIONAL_COLUMN_OPTIONS}
			initialColumnVisibility={ROSTER_DEFAULT_COLUMN_VISIBILITY}
			legendItems={PLAYER_PROFILE_HISTORY_LEGEND}
			onRowClick={(row) => {
				onOpenEvent(row.eventId);
			}}
		/>
	);
}

const partnerColumnHelper = createColumnHelper<
	DataTableFeatures,
	SynergyPartnerRow
>();

function PlayerPartnersTable({
	partners,
}: {
	partners: readonly SynergyPartnerRow[];
}) {
	const columns = useMemo(
		() =>
			partnerColumnHelper.columns([
				partnerColumnHelper.accessor((row) => playerVisibleName(row.partner), {
					id: SYNERGY_COLUMN.player,
					header: SYNERGY_PARTNER_COLUMN_LABEL.player,
					enableHiding: false,
					meta: { title: SYNERGY_PARTNER_COLUMN_LABEL.player },
					cell: ({ row }) => <PlayerNameLink player={row.original.partner} />,
				}),
				partnerColumnHelper.accessor("wins", {
					id: SYNERGY_COLUMN.wins,
					header: SYNERGY_COLUMN_ABBR.wins,
					meta: {
						align: "right" as const,
						title: SYNERGY_PARTNER_COLUMN_LABEL.wins,
					},
					cell: ({ getValue }) => (
						<span className="tabular-nums">
							{formatSynergyStat(SYNERGY_COLUMN.wins, getValue())}
						</span>
					),
				}),
				partnerColumnHelper.accessor("matches", {
					id: SYNERGY_COLUMN.matches,
					header: SYNERGY_COLUMN_ABBR.matches,
					meta: {
						align: "right" as const,
						title: SYNERGY_PARTNER_COLUMN_LABEL.matches,
					},
					cell: ({ getValue }) => (
						<span className="tabular-nums">
							{formatSynergyStat(SYNERGY_COLUMN.matches, getValue())}
						</span>
					),
				}),
				partnerColumnHelper.accessor("winRate", {
					id: SYNERGY_COLUMN.winRate,
					header: SYNERGY_COLUMN_ABBR.winRate,
					meta: {
						align: "right" as const,
						title: SYNERGY_PARTNER_COLUMN_LABEL.winRate,
					},
					cell: ({ getValue }) => (
						<span className="tabular-nums">
							{formatSynergyStat(SYNERGY_COLUMN.winRate, getValue())}
						</span>
					),
				}),
			]),
		[],
	);

	return (
		<DataTable
			data={[...partners]}
			columns={columns}
			getRowId={(row) => String(row.partner.id)}
			hideableColumns={SYNERGY_STAT_COLUMN_OPTIONS}
			legendItems={SYNERGY_PARTNER_LEGEND}
		/>
	);
}

export function ChampionshipPlayerDetail({
	player,
	createdBy,
	championshipName,
	ceiling,
	isOwnerViewer,
	career,
	history,
	historyPending,
	historyError,
	partners,
	goalkeeper,
	onOpenEvent,
}: ChampionshipPlayerDetailProps) {
	const [tab, setTab] = usePlayerProfileTab();
	const selectedTab = tab ?? PLAYER_PROFILE_TAB.profile;
	const form = playerRecentForm(history);

	return (
		<div className="space-y-4">
			<section className={CARD_CLASS}>
				<PlayerProfileHeader
					player={player}
					createdBy={createdBy}
					championshipName={championshipName}
					ceiling={ceiling}
					isOwnerViewer={isOwnerViewer}
					career={career}
					history={history}
				/>
			</section>
			<Tabs
				value={selectedTab}
				items={PLAYER_PROFILE_TABS}
				onChange={(id) => {
					if (id === PLAYER_PROFILE_TAB.profile) {
						void setTab(null);
						return;
					}

					void setTab(id);
				}}
			/>
			{selectedTab === PLAYER_PROFILE_TAB.sim && (
				<SectionCard title={PLAYER_RATING_SIM_LABEL.title}>
					<PlayerRatingSim rating={player.rating} ceiling={ceiling} />
				</SectionCard>
			)}
			{selectedTab === PLAYER_PROFILE_TAB.profile && (
				<>
					<SectionCard title={PLAYER_PROFILE_LABEL.career}>
						<PlayerCareerStats career={career} />
					</SectionCard>
					<SectionCard title={PLAYER_FORM_LABEL.title}>
						{!form && (
							<EmptyState
								icon={<CalendarDays className="size-10" />}
								title={PLAYER_FORM_LABEL.empty}
							/>
						)}
						{form && (
							<PlayerStatGrid
								items={[
									{
										id: "events",
										label: PLAYER_FORM_LABEL.events,
										value: String(form.events),
									},
									{
										id: "winRate",
										label: PLAYER_FORM_LABEL.winRate,
										value: formatPlayerFormWinRate(form.winRate),
									},
									{
										id: "goals",
										label: PLAYER_FORM_LABEL.goals,
										value: String(form.goals),
									},
									{
										id: "assists",
										label: PLAYER_FORM_LABEL.assists,
										value: String(form.assists),
									},
									{
										id: "delta",
										label: PLAYER_FORM_LABEL.delta,
										value: formatPlayerFormDelta(form.ratingDelta),
									},
									{
										id: "streak",
										label: PLAYER_FORM_LABEL.streak,
										value: formatPlayerFormStreak(form),
									},
								]}
							/>
						)}
					</SectionCard>
					<SectionCard title={GOALKEEPER_STATS_LABEL.title}>
						{!goalkeeper && (
							<EmptyState
								icon={<CalendarDays className="size-10" />}
								title={GOALKEEPER_STATS_LABEL.empty}
							/>
						)}
						{goalkeeper && (
							<>
								<PlayerStatGrid
									items={[
										{
											id: "matches",
											label: GOALKEEPER_STATS_LABEL.matches,
											value: formatGoalkeeperCount(goalkeeper.matches),
										},
										{
											id: "wins",
											label: GOALKEEPER_STATS_LABEL.wins,
											value: formatGoalkeeperCount(goalkeeper.wins),
										},
										{
											id: "winRate",
											label: GOALKEEPER_STATS_LABEL.winRate,
											value: formatGoalkeeperWinRate(goalkeeper.winRate),
										},
										{
											id: "conceded",
											label: GOALKEEPER_STATS_LABEL.goalsConceded,
											value: formatGoalkeeperCount(goalkeeper.goalsConceded),
										},
										{
											id: "concededAvg",
											label: GOALKEEPER_STATS_LABEL.goalsConcededAverage,
											value: formatGoalkeeperAverage(
												goalkeeper.goalsConcededAverage,
											),
										},
									]}
								/>
								<p className="mt-3 text-xs text-fg-muted">
									{GOALKEEPER_STATS_LABEL.hint}
								</p>
							</>
						)}
					</SectionCard>
					<SectionCard title={SYNERGY_LABEL.partners}>
						{historyPending && (
							<DataTableSkeleton
								headers={SYNERGY_PARTNER_LEGEND.map((item) => item.abbr)}
								legendItems={SYNERGY_PARTNER_LEGEND}
								withPlayerColumn={false}
							/>
						)}
						{historyError && <p className={ERROR_CLASS}>{historyError}</p>}
						{!historyPending && !historyError && partners.length === 0 && (
							<EmptyState
								icon={<Handshake className="size-10" />}
								title={SYNERGY_LABEL.emptyPartners}
							/>
						)}
						{!historyPending && !historyError && partners.length > 0 && (
							<PlayerPartnersTable partners={partners} />
						)}
					</SectionCard>
					<SectionCard title={PLAYER_PROFILE_LABEL.history}>
						{historyPending && <PlayerHistorySkeleton />}
						{historyError && <p className={ERROR_CLASS}>{historyError}</p>}
						{!historyPending && !historyError && history.length === 0 && (
							<EmptyState
								icon={<CalendarDays className="size-10" />}
								title={PLAYER_PROFILE_LABEL.emptyHistory}
							/>
						)}
						{!historyPending && !historyError && history.length > 0 && (
							<div className="space-y-4">
								<Suspense fallback={<PlayerHistoryChartSkeleton />}>
									<PlayerRatingHistoryChart
										points={playerRatingHistoryChartSeries(
											history,
											player.rating,
											new Date().toISOString(),
										)}
										ceiling={ceiling}
									/>
								</Suspense>
								<PlayerHistoryTable
									history={history}
									onOpenEvent={onOpenEvent}
								/>
							</div>
						)}
					</SectionCard>
				</>
			)}
		</div>
	);
}

function PlayerHistoryChartRect() {
	return (
		<div style={{ height: PLAYER_RATING_HISTORY_CHART.height }}>
			<Skeleton className="h-full w-full" />
		</div>
	);
}

function PlayerHistoryChartSkeleton() {
	return (
		<SkeletonRegion label={SKELETON_LABEL.chart}>
			<PlayerHistoryChartRect />
		</SkeletonRegion>
	);
}

function PlayerHistorySkeleton() {
	return (
		<SkeletonRegion label={SKELETON_LABEL.events}>
			<div className="space-y-4">
				<PlayerHistoryChartRect />
				<DataTableSkeleton
					headers={PLAYER_PROFILE_HISTORY_COLUMNS.map(
						(id) => PLAYER_PROFILE_HISTORY_ABBR[id],
					)}
					legendItems={PLAYER_PROFILE_HISTORY_LEGEND}
					withPlayerColumn={false}
				/>
			</div>
		</SkeletonRegion>
	);
}
