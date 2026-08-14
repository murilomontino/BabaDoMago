import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";
import { ChampionshipPlayerDetail } from "@/components/championship-player-detail";
import { PageHeader } from "@/components/page-header";
import {
	CHAMPIONSHIP_ROLE,
	resolveChampionshipRole,
} from "@/const/championship-role";
import { playerVisibleName } from "@/const/player-name";
import {
	PLAYER_PROFILE_LABEL,
	playerProfileHistory,
} from "@/const/player-profile";
import { championshipRatingCeiling } from "@/const/player-rating";
import { toRosterRow } from "@/const/roster-stats";
import { ROUTES } from "@/const/routes";
import { ERROR_CLASS } from "@/const/ui";
import { useAuth } from "@/contexts/auth";
import { useChampionshipEvents } from "@/hooks/championships/use-championship-events";
import { useChampionship } from "@/hooks/championships/use-championships";

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
	const ceiling = championshipRatingCeiling(
		(championship?.players ?? []).flatMap((item) =>
			!item.deleted_at || item.id === playerId ? [item.rating] : [],
		),
	);

	if (championshipQuery.isPending) {
		return <p className="text-fg-muted">{PLAYER_PROFILE_LABEL.loading}</p>;
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
				ceiling={ceiling}
				isOwnerViewer={actorRole === CHAMPIONSHIP_ROLE.owner}
				career={toRosterRow(player)}
				history={history}
				historyPending={eventsQuery.isPending}
				historyError={
					eventsQuery.isError
						? `${PLAYER_PROFILE_LABEL.eventsError}: ${eventsQuery.error.message}`
						: null
				}
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
