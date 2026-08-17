import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Share2 } from "lucide-react";
import { useMemo } from "react";
import { Skeleton, SkeletonRegion } from "@/components/atoms/skeleton";
import { Button } from "@/components/button";
import { ChampionshipPlayerDetail } from "@/components/championship-player-detail";
import { DataTableSkeleton } from "@/components/molecules/data-table-skeleton";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import {
	CHAMPIONSHIP_ROLE,
	resolveChampionshipRole,
} from "@/const/championship-role";
import { playerGoalkeeperStats } from "@/const/goalkeeper-stats";
import { playerVisibleName } from "@/const/player-name";
import {
	PLAYER_PROFILE_HISTORY_ABBR,
	PLAYER_PROFILE_HISTORY_COLUMNS,
	PLAYER_PROFILE_HISTORY_LEGEND,
	PLAYER_PROFILE_LABEL,
	PLAYER_RATING_HISTORY_CHART,
	playerProfileHistory,
	ratingsForProfileCeiling,
} from "@/const/player-profile";
import { PLAYER_PROFILE_SHARE_LABEL } from "@/const/player-profile-share";
import { championshipRatingCeiling, PLAYER_STARS } from "@/const/player-rating";
import {
	playerSynergyPartners,
	SYNERGY_LABEL,
	SYNERGY_PARTNER_LEGEND,
} from "@/const/player-synergy";
import {
	ROSTER_COLUMN_ABBR,
	ROSTER_STAT_COLUMNS,
	toRosterRow,
} from "@/const/roster-stats";
import { ROUTES } from "@/const/routes";
import { SKELETON_LABEL } from "@/const/skeleton";
import { BUTTON_VARIANT, CARD_CLASS, ERROR_CLASS } from "@/const/ui";
import { useAuth } from "@/contexts/auth";
import { useChampionshipEvents } from "@/hooks/championships/use-championship-events";
import { useChampionship } from "@/hooks/championships/use-championships";
import { prefixedErrorMessage } from "@/lib/error-message";

export function ChampionshipPlayerDetailPage() {
	const { championshipId: championshipIdParam, playerId: playerIdParam } =
		useParams({
			from: "/_authenticated/championships/$championshipId/players/$playerId",
		});
	const championshipId = Number(championshipIdParam);
	const playerId = Number(playerIdParam);
	const navigate = useNavigate();
	const { user } = useAuth();
	const championshipQuery = useChampionship(championshipId);
	const eventsQuery = useChampionshipEvents(championshipId);

	const championship = championshipQuery.data;
	const currentPlayer = championship?.players.find(
		(player) => !player.deleted_at && player.user_id === user?.id,
	);
	const actorRole = resolveChampionshipRole(
		championship?.created_by ?? "",
		user?.id ?? null,
		currentPlayer?.role ?? CHAMPIONSHIP_ROLE.member,
	);
	const player = championship?.players.find((item) => item.id === playerId);
	const history = useMemo(
		() => playerProfileHistory(eventsQuery.data ?? [], playerId),
		[eventsQuery.data, playerId],
	);
	const partners = useMemo(
		() =>
			playerSynergyPartners(
				eventsQuery.data ?? [],
				championshipQuery.data?.players ?? [],
				playerId,
			),
		[eventsQuery.data, championshipQuery.data?.players, playerId],
	);
	const goalkeeper = useMemo(
		() => playerGoalkeeperStats(eventsQuery.data ?? [], playerId),
		[eventsQuery.data, playerId],
	);
	const ceiling = championshipRatingCeiling(
		ratingsForProfileCeiling(championship?.players ?? [], playerId),
	);

	if (championshipQuery.isPending) {
		return (
			<ChampionshipPlayerDetailPageSkeleton championshipId={championshipId} />
		);
	}

	if (championshipQuery.isError) {
		return (
			<p className={ERROR_CLASS}>
				{PLAYER_PROFILE_LABEL.championshipError}:{" "}
				{championshipQuery.error.message}
			</p>
		);
	}

	if (!championship || !player) {
		return (
			<main>
				<PageHeader
					title={PLAYER_PROFILE_LABEL.notFound}
					action={
						<Link
							to={ROUTES.championship}
							params={{ championshipId: String(championshipId) }}
							className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-pitch-fg"
						>
							<ArrowLeft className="size-4" />
							Voltar
						</Link>
					}
				/>
			</main>
		);
	}

	return (
		<main>
			<PageHeader
				title={playerVisibleName(player)}
				action={
					<Link
						to={ROUTES.championship}
						params={{ championshipId: String(championshipId) }}
						className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-pitch-fg"
					>
						<ArrowLeft className="size-4" />
						Voltar
					</Link>
				}
			/>
			<ChampionshipPlayerDetail
				player={player}
				createdBy={championship.created_by}
				championshipName={championship.name}
				ceiling={ceiling}
				isOwnerViewer={actorRole === CHAMPIONSHIP_ROLE.owner}
				career={toRosterRow(player)}
				history={history}
				historyPending={eventsQuery.isPending}
				historyError={prefixedErrorMessage(
					eventsQuery,
					PLAYER_PROFILE_LABEL.eventsError,
				)}
				partners={partners}
				goalkeeper={goalkeeper}
				onOpenEvent={(eventId) => {
					void navigate({
						to: ROUTES.championshipEvent,
						params: {
							championshipId: String(championshipId),
							eventId: String(eventId),
						},
					});
				}}
			/>
		</main>
	);
}

function ChampionshipPlayerDetailPageSkeleton({
	championshipId,
}: {
	championshipId: number;
}) {
	return (
		<SkeletonRegion label={SKELETON_LABEL.player}>
			<main>
				<div className="mb-6 flex items-start justify-between gap-4">
					<Skeleton className="h-8 w-40" />
					<Link
						to={ROUTES.championship}
						params={{ championshipId: String(championshipId) }}
						className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-pitch-fg"
					>
						<ArrowLeft className="size-4" />
						Voltar
					</Link>
				</div>
				<div className="space-y-4">
					<section className={CARD_CLASS}>
						<div className="flex flex-wrap items-center gap-4">
							<Skeleton className="size-16 rounded-full" />
							<div className="min-w-0">
								<Skeleton className="h-5 w-40" />
								<Skeleton className="mt-2 h-5 w-16 rounded-full" />
							</div>
							<div className="ml-auto flex items-center gap-2">
								<div className="flex gap-0.5">
									{PLAYER_STARS.map((star) => (
										<Skeleton key={star.id} className="h-5 w-5" />
									))}
								</div>
								<Button variant={BUTTON_VARIANT.secondary} disabled>
									<Share2 className="size-4" />
									{PLAYER_PROFILE_SHARE_LABEL.share}
								</Button>
							</div>
						</div>
					</section>
					<SectionCard title={PLAYER_PROFILE_LABEL.career}>
						<div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
							{ROSTER_STAT_COLUMNS.map((column) => (
								<div key={column}>
									<p className="text-xs font-medium text-fg-muted">
										{ROSTER_COLUMN_ABBR[column]}
									</p>
									<Skeleton className="mt-1 h-6 w-10" />
								</div>
							))}
						</div>
					</SectionCard>
					<SectionCard title={SYNERGY_LABEL.partners}>
						<DataTableSkeleton
							headers={SYNERGY_PARTNER_LEGEND.map((item) => item.abbr)}
							legendItems={SYNERGY_PARTNER_LEGEND}
							withPlayerColumn={false}
						/>
					</SectionCard>
					<SectionCard title={PLAYER_PROFILE_LABEL.history}>
						<div className="space-y-4">
							<div style={{ height: PLAYER_RATING_HISTORY_CHART.height }}>
								<Skeleton className="h-full w-full" />
							</div>
							<DataTableSkeleton
								headers={PLAYER_PROFILE_HISTORY_COLUMNS.map(
									(id) => PLAYER_PROFILE_HISTORY_ABBR[id],
								)}
								legendItems={PLAYER_PROFILE_HISTORY_LEGEND}
								withPlayerColumn={false}
							/>
						</div>
					</SectionCard>
				</div>
			</main>
		</SkeletonRegion>
	);
}
