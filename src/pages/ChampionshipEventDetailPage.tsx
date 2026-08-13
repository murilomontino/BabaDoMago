import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";
import { ChampionshipEventDetail } from "@/components/championship-event-detail";
import { PageHeader } from "@/components/page-header";
import {
	countPlayerAttendance,
	EVENT_STATUS_LABEL,
	eventStatus,
	formatEventStartsAt,
} from "@/const/championship-event";
import {
	CHAMPIONSHIP_ROLE,
	canManageEvent,
	resolveChampionshipRole,
} from "@/const/championship-role";
import { ROUTES } from "@/const/routes";
import { ERROR_CLASS } from "@/const/ui";
import { useAuth } from "@/contexts/auth";
import {
	useAddChampionshipEventMatch,
	useChampionshipEvent,
	useChampionshipEvents,
	useDeleteChampionshipEvent,
	useEndChampionshipEvent,
	useSaveChampionshipEventTeams,
} from "@/hooks/championships/use-championship-events";
import { useChampionship } from "@/hooks/championships/use-championships";

export function ChampionshipEventDetailPage() {
	const { championshipId: championshipIdParam, eventId: eventIdParam } =
		useParams({
			from: "/_authenticated/championships/$championshipId/events/$eventId",
		});
	const championshipId = Number(championshipIdParam);
	const eventId = Number(eventIdParam);
	const navigate = useNavigate();
	const { user } = useAuth();
	const championshipQuery = useChampionship(championshipId);
	const eventQuery = useChampionshipEvent(championshipId, eventId);
	const eventsQuery = useChampionshipEvents(championshipId);
	const saveTeams = useSaveChampionshipEventTeams(championshipId);
	const addMatch = useAddChampionshipEventMatch(championshipId);
	const endEvent = useEndChampionshipEvent(championshipId);
	const deleteEvent = useDeleteChampionshipEvent(championshipId);
	const attendanceCounts = useMemo(
		() => countPlayerAttendance(eventsQuery.data ?? []),
		[eventsQuery.data],
	);

	const championship = championshipQuery.data;
	const currentPlayer = championship?.players.find(
		(player) => !player.deleted_at && player.user_id === user?.id,
	);
	const actorRole = resolveChampionshipRole(
		championship?.created_by ?? "",
		user?.id ?? null,
		currentPlayer?.role ?? CHAMPIONSHIP_ROLE.member,
	);
	const canManage = canManageEvent(actorRole);
	const activePlayers = (championship?.players ?? []).filter(
		(player) => !player.deleted_at,
	);

	if (championshipQuery.isPending || eventQuery.isPending) {
		return <p className="text-fg-muted">Carregando evento...</p>;
	}

	if (championshipQuery.isError) {
		return (
			<p className={ERROR_CLASS}>
				Erro ao carregar campeonato: {championshipQuery.error.message}
			</p>
		);
	}

	if (eventQuery.isError) {
		return (
			<p className={ERROR_CLASS}>
				Erro ao carregar evento: {eventQuery.error.message}
			</p>
		);
	}

	const event = eventQuery.data;
	const when = formatEventStartsAt(event.starts_at);
	const status = eventStatus(event.ended_at);

	return (
		<main>
			<PageHeader
				title={`${when.date} · ${when.time}`}
				description={EVENT_STATUS_LABEL[status]}
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
			<ChampionshipEventDetail
				event={event}
				players={activePlayers}
				attendanceCounts={attendanceCounts}
				canManage={canManage}
				savingTeams={saveTeams.isPending}
				saveTeamsError={saveTeams.isError ? saveTeams.error.message : null}
				addingMatch={addMatch.isPending}
				addMatchError={addMatch.isError ? addMatch.error.message : null}
				ending={endEvent.isPending}
				endError={endEvent.isError ? endEvent.error.message : null}
				deleting={deleteEvent.isPending}
				deleteError={deleteEvent.isError ? deleteEvent.error.message : null}
				onSaveTeams={async ({ presentPlayerIds, teams }) => {
					await saveTeams.mutateAsync({
						eventId: event.id,
						presentPlayerIds,
						teams,
					});
				}}
				onAddMatch={async ({ teamAId, teamBId }) => {
					await addMatch.mutateAsync({
						eventId: event.id,
						teamAId,
						teamBId,
					});
				}}
				onEnd={async (presentPlayerIds) => {
					await endEvent.mutateAsync({
						eventId: event.id,
						presentPlayerIds,
					});
				}}
				onDelete={async () => {
					await deleteEvent.mutateAsync(event.id);
					await navigate({
						to: ROUTES.championship,
						params: { championshipId: String(championshipId) },
					});
				}}
			/>
		</main>
	);
}
