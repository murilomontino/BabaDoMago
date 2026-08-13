import { Field, Form, Formik } from "formik";
import { CalendarDays, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/button";
import { ChampionshipEventBuilder } from "@/components/championship-event-builder";
import { EmptyState } from "@/components/empty-state";
import { EndEventModal } from "@/components/end-event-modal";
import { FormError } from "@/components/form-error";
import { SectionCard } from "@/components/section-card";
import {
	EVENT_STATUS,
	EVENT_STATUS_LABEL,
	type EventTeamDraft,
	eventStatus,
	formatEventStartsAt,
} from "@/const/championship-event";
import {
	EVENT_TEAM_COLOR_CLASS,
	EVENT_TEAM_COLOR_LABEL,
	type EventTeamColor,
} from "@/const/event-team-color";
import { addMatchFormSchema } from "@/const/form-schema";
import {
	BUTTON_VARIANT,
	CHIP_CLASS,
	ERROR_CLASS,
	FIELD_CLASS,
} from "@/const/ui";
import {
	useAddChampionshipEventMatch,
	useChampionshipEvents,
	useEndChampionshipEvent,
	useStartChampionshipEvent,
} from "@/hooks/championships/use-championship-events";
import type { ChampionshipPlayer } from "@/types/championship";
import type { ChampionshipEvent } from "@/types/championship-event";

type ChampionshipEventsProps = {
	championshipId: number;
	eventTime: string;
	playersPerTeam: number;
	players: ChampionshipPlayer[];
	canManage: boolean;
};

function TeamChip({ color }: { color: EventTeamColor }) {
	return (
		<span
			className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${EVENT_TEAM_COLOR_CLASS[color]}`}
		>
			{EVENT_TEAM_COLOR_LABEL[color]}
		</span>
	);
}

function EventCard({
	event,
	canManage,
	onAddMatch,
	onEnd,
	addingMatch,
	addMatchError,
}: {
	event: ChampionshipEvent;
	canManage: boolean;
	onAddMatch: (values: { teamAId: number; teamBId: number }) => Promise<void>;
	onEnd: () => void;
	addingMatch: boolean;
	addMatchError: string | null;
}) {
	const when = formatEventStartsAt(event.starts_at);
	const status = eventStatus(event.ended_at);
	const teamById = new Map(event.teams.map((team) => [team.id, team]));

	return (
		<article className="space-y-3 rounded-lg border border-line p-4">
			<div className="flex flex-wrap items-center gap-2">
				<p className="text-sm font-semibold tracking-tight text-fg">
					{when.date} · {when.time}
				</p>
				<span className={CHIP_CLASS}>{EVENT_STATUS_LABEL[status]}</span>
				{canManage && status === EVENT_STATUS.open && (
					<Button
						variant={BUTTON_VARIANT.ghost}
						className="ml-auto"
						onClick={onEnd}
					>
						Encerrar
					</Button>
				)}
			</div>
			<ul className="space-y-2">
				{event.teams.map((team) => (
					<li key={team.id} className="text-sm text-fg">
						<div className="mb-1">
							<TeamChip color={team.color} />
						</div>
						<p className="text-fg-muted">
							{team.players.map((player) => player.display_name).join(", ")}
						</p>
					</li>
				))}
			</ul>
			<div>
				<p className="mb-1 text-xs font-medium uppercase tracking-wide text-fg-muted">
					Partidas
				</p>
				{event.matches.length === 0 && (
					<p className="text-sm text-fg-muted">Nenhuma partida ainda.</p>
				)}
				{event.matches.length > 0 && (
					<ul className="space-y-1">
						{event.matches.map((match) => {
							const teamA = teamById.get(match.team_a_id);
							const teamB = teamById.get(match.team_b_id);
							if (!teamA || !teamB) {
								return null;
							}

							return (
								<li
									key={match.id}
									className="flex items-center gap-2 text-sm text-fg"
								>
									<TeamChip color={teamA.color} />
									<span className="text-fg-muted">x</span>
									<TeamChip color={teamB.color} />
								</li>
							);
						})}
					</ul>
				)}
			</div>
			{canManage && (
				<Formik
					initialValues={{ teamAId: "", teamBId: "" }}
					validationSchema={addMatchFormSchema}
					validateOnMount
					onSubmit={async (values, helpers) => {
						await onAddMatch({
							teamAId: Number(values.teamAId),
							teamBId: Number(values.teamBId),
						});
						helpers.resetForm();
					}}
				>
					{({ isValid }) => (
						<Form className="space-y-2">
							<div className="flex flex-wrap items-end gap-2">
								<label
									htmlFor={`match-team-a-${event.id}`}
									className="min-w-0 flex-1 text-sm text-fg-muted"
								>
									Time A
									<Field
										as="select"
										id={`match-team-a-${event.id}`}
										name="teamAId"
										className={`mt-1 ${FIELD_CLASS}`}
									>
										<option value="">Selecionar</option>
										{event.teams.map((team) => (
											<option key={team.id} value={team.id}>
												{EVENT_TEAM_COLOR_LABEL[team.color]}
											</option>
										))}
									</Field>
								</label>
								<label
									htmlFor={`match-team-b-${event.id}`}
									className="min-w-0 flex-1 text-sm text-fg-muted"
								>
									Time B
									<Field
										as="select"
										id={`match-team-b-${event.id}`}
										name="teamBId"
										className={`mt-1 ${FIELD_CLASS}`}
									>
										<option value="">Selecionar</option>
										{event.teams.map((team) => (
											<option key={team.id} value={team.id}>
												{EVENT_TEAM_COLOR_LABEL[team.color]}
											</option>
										))}
									</Field>
								</label>
								<Button
									type="submit"
									variant={BUTTON_VARIANT.secondary}
									disabled={addingMatch || !isValid}
									className="h-9 shrink-0"
								>
									Nova partida
								</Button>
							</div>
							<FormError name="teamAId" />
							<FormError name="teamBId" />
						</Form>
					)}
				</Formik>
			)}
			{addMatchError && <p className={ERROR_CLASS}>{addMatchError}</p>}
		</article>
	);
}

export function ChampionshipEvents({
	championshipId,
	eventTime,
	playersPerTeam,
	players,
	canManage,
}: ChampionshipEventsProps) {
	const eventsQuery = useChampionshipEvents(championshipId);
	const startEvent = useStartChampionshipEvent(championshipId);
	const addMatch = useAddChampionshipEventMatch(championshipId);
	const endEvent = useEndChampionshipEvent(championshipId);
	const [isCreating, setIsCreating] = useState(false);
	const [endingEventId, setEndingEventId] = useState<number | null>(null);
	const events = eventsQuery.data ?? [];

	async function handleStart(values: {
		eventDate: string;
		teams: EventTeamDraft[];
	}) {
		await startEvent.mutateAsync(values);
		setIsCreating(false);
	}

	if (eventsQuery.isPending) {
		return <p className="text-fg-muted">Carregando eventos...</p>;
	}

	if (eventsQuery.isError) {
		return (
			<p className={ERROR_CLASS}>
				Erro ao carregar eventos: {eventsQuery.error.message}
			</p>
		);
	}

	return (
		<SectionCard
			title="Eventos"
			icon={<CalendarDays className="size-4 text-pitch-fg" />}
			action={
				canManage &&
				!isCreating && (
					<Button onClick={() => setIsCreating(true)}>
						<Plus className="size-4" />
						Novo evento
					</Button>
				)
			}
		>
			{isCreating && (
				<ChampionshipEventBuilder
					eventTime={eventTime}
					playersPerTeam={playersPerTeam}
					players={players}
					isPending={startEvent.isPending}
					errorMessage={startEvent.isError ? startEvent.error.message : null}
					onCancel={() => {
						startEvent.reset();
						setIsCreating(false);
					}}
					onSubmit={handleStart}
				/>
			)}
			{!isCreating && events.length === 0 && (
				<EmptyState
					icon={<CalendarDays className="size-10" />}
					title="Nenhum evento ainda"
					description="Inicie um evento para montar os times da pelada."
					action={
						canManage && (
							<Button onClick={() => setIsCreating(true)}>
								<Plus className="size-4" />
								Novo evento
							</Button>
						)
					}
				/>
			)}
			{!isCreating && events.length > 0 && (
				<ul className="space-y-3">
					{events.map((event) => (
						<li key={event.id}>
							<EventCard
								event={event}
								canManage={canManage}
								addingMatch={
									addMatch.isPending && addMatch.variables?.eventId === event.id
								}
								addMatchError={
									addMatch.isError && addMatch.variables?.eventId === event.id
										? addMatch.error.message
										: null
								}
								onAddMatch={async ({ teamAId, teamBId }) => {
									await addMatch.mutateAsync({
										eventId: event.id,
										teamAId,
										teamBId,
									});
								}}
								onEnd={() => setEndingEventId(event.id)}
							/>
						</li>
					))}
				</ul>
			)}
			{endingEventId !== null && (
				<EndEventModal
					isPending={endEvent.isPending}
					errorMessage={endEvent.isError ? endEvent.error.message : null}
					onCancel={() => {
						if (endEvent.isPending) {
							return;
						}

						endEvent.reset();
						setEndingEventId(null);
					}}
					onConfirm={() => {
						endEvent.mutate(endingEventId, {
							onSuccess: () => setEndingEventId(null),
						});
					}}
				/>
			)}
		</SectionCard>
	);
}
