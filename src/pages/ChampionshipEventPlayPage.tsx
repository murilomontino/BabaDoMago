import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ChampionshipEventPlay } from "@/components/championship-event-play";
import { PageHeader } from "@/components/page-header";
import { canStartEventMatch, EVENT_ACTION } from "@/const/championship-event";
import {
	EVENT_MATCH_LABEL,
	openEventMatch,
} from "@/const/championship-event-match";
import { ROUTES } from "@/const/routes";
import { ERROR_CLASS } from "@/const/ui";
import {
	useAddChampionshipEventGoal,
	useChampionshipEvent,
	useEndChampionshipEventMatch,
	useSetChampionshipEventMatchPlayer,
	useStartChampionshipEventMatch,
} from "@/hooks/championships/use-championship-events";
import { useChampionship } from "@/hooks/championships/use-championships";

export function ChampionshipEventPlayPage() {
	const { championshipId: championshipIdParam, eventId: eventIdParam } =
		useParams({
			from: "/_authenticated/championships/$championshipId/events/$eventId/play",
		});
	const championshipId = Number(championshipIdParam);
	const eventId = Number(eventIdParam);
	const navigate = useNavigate();
	const championshipQuery = useChampionship(championshipId);
	const eventQuery = useChampionshipEvent(championshipId, eventId);
	const startMatch = useStartChampionshipEventMatch(championshipId);
	const setPlayer = useSetChampionshipEventMatchPlayer(championshipId);
	const addGoal = useAddChampionshipEventGoal(championshipId);
	const endMatch = useEndChampionshipEventMatch(championshipId);

	if (championshipQuery.isPending || eventQuery.isPending) {
		return <p className="text-fg-muted">Carregando partida...</p>;
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
	const openMatch = openEventMatch(event.matches);
	const canStart = canStartEventMatch({
		ended: event.ended_at !== null,
		teamCount: event.teams.length,
	});
	const activePlayers = (championshipQuery.data?.players ?? []).filter(
		(player) => !player.deleted_at,
	);

	async function goToEvent() {
		await navigate({
			to: ROUTES.championshipEvent,
			params: {
				championshipId: String(championshipId),
				eventId: String(eventId),
			},
		});
	}

	return (
		<main>
			<PageHeader
				title={openMatch ? EVENT_MATCH_LABEL.open : EVENT_MATCH_LABEL.selectTeams}
				action={
					<Link
						to={ROUTES.championshipEvent}
						params={{
							championshipId: String(championshipId),
							eventId: String(eventId),
						}}
						className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-pitch-fg"
					>
						<ArrowLeft className="size-4" />
						Voltar
					</Link>
				}
			/>
			{!canStart && !openMatch && (
				<p className="text-sm text-fg-muted">
					{EVENT_ACTION.startMatch} indisponível.
				</p>
			)}
			{(canStart || openMatch) && (
				<ChampionshipEventPlay
					event={event}
					match={openMatch}
					players={activePlayers}
					starting={startMatch.isPending}
					startError={startMatch.isError ? startMatch.error.message : null}
					savingPlayer={setPlayer.isPending}
					playerError={setPlayer.isError ? setPlayer.error.message : null}
					savingGoal={addGoal.isPending}
					goalError={addGoal.isError ? addGoal.error.message : null}
					ending={endMatch.isPending}
					endError={endMatch.isError ? endMatch.error.message : null}
					onStart={async (teamAId, teamBId) => {
						await startMatch.mutateAsync({
							eventId: event.id,
							teamAId,
							teamBId,
						});
					}}
					onSetPlayer={async (teamId, slot, playerId) => {
						if (!openMatch) {
							return;
						}

						await setPlayer.mutateAsync({
							matchId: openMatch.id,
							teamId,
							slot,
							playerId,
						});
					}}
					onAddGoal={async (values) => {
						if (!openMatch) {
							return;
						}

						await addGoal.mutateAsync({
							matchId: openMatch.id,
							...values,
						});
					}}
					onEnd={async () => {
						if (!openMatch) {
							return;
						}

						await endMatch.mutateAsync(openMatch.id);
						await goToEvent();
					}}
					onNext={async () => {
						if (!openMatch) {
							return;
						}

						await endMatch.mutateAsync(openMatch.id);
					}}
				/>
			)}
		</main>
	);
}
