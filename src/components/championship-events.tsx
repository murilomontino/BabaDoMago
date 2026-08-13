import { Link, useNavigate } from "@tanstack/react-router";
import { Field, Form, Formik } from "formik";
import { CalendarDays, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { FormError } from "@/components/form-error";
import { SectionCard } from "@/components/section-card";
import {
	championshipEventToday,
	EVENT_ACTION,
	EVENT_BUILDER_STEP,
	EVENT_STATUS_LABEL,
	eventStatus,
	formatEventStartsAt,
} from "@/const/championship-event";
import { startEventFormSchema } from "@/const/form-schema";
import { ROUTES } from "@/const/routes";
import {
	BUTTON_VARIANT,
	CHIP_CLASS,
	ERROR_CLASS,
	FIELD_CLASS,
} from "@/const/ui";
import {
	useChampionshipEvents,
	useCreateChampionshipEvent,
} from "@/hooks/championships/use-championship-events";

type ChampionshipEventsProps = {
	championshipId: number;
	eventTime: string;
	canManage: boolean;
};

export function ChampionshipEvents({
	championshipId,
	eventTime,
	canManage,
}: ChampionshipEventsProps) {
	const navigate = useNavigate();
	const eventsQuery = useChampionshipEvents(championshipId);
	const createEvent = useCreateChampionshipEvent(championshipId);
	const [isCreating, setIsCreating] = useState(false);
	const events = eventsQuery.data ?? [];

	async function handleCreate(eventDate: string) {
		const eventId = await createEvent.mutateAsync(eventDate);
		await navigate({
			to: ROUTES.championshipEvent,
			params: {
				championshipId: String(championshipId),
				eventId: String(eventId),
			},
			search: { step: EVENT_BUILDER_STEP.attendance },
		});
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
						{EVENT_ACTION.newEvent}
					</Button>
				)
			}
		>
			{isCreating && (
				<Formik
					initialValues={{ eventDate: championshipEventToday() }}
					validationSchema={startEventFormSchema}
					onSubmit={async (values) => {
						await handleCreate(values.eventDate);
					}}
				>
					<Form className="space-y-4">
						<div className="grid gap-3 sm:grid-cols-2">
							<label
								htmlFor="event-date"
								className="block text-sm font-medium text-fg-muted"
							>
								Data
								<Field
									id="event-date"
									type="date"
									name="eventDate"
									className={`mt-1 ${FIELD_CLASS}`}
								/>
							</label>
							<label
								htmlFor="event-time"
								className="block text-sm font-medium text-fg-muted"
							>
								Hora
								<input
									id="event-time"
									type="time"
									value={eventTime}
									readOnly
									className={`mt-1 ${FIELD_CLASS} cursor-not-allowed opacity-80`}
								/>
							</label>
						</div>
						<FormError name="eventDate" />
						{createEvent.isError && (
							<p className={ERROR_CLASS}>{createEvent.error.message}</p>
						)}
						<div className="flex justify-end gap-2">
							<Button
								variant={BUTTON_VARIANT.secondary}
								onClick={() => {
									createEvent.reset();
									setIsCreating(false);
								}}
								disabled={createEvent.isPending}
							>
								Cancelar
							</Button>
							<Button type="submit" disabled={createEvent.isPending}>
								{EVENT_ACTION.create}
							</Button>
						</div>
					</Form>
				</Formik>
			)}
			{!isCreating && events.length === 0 && (
				<EmptyState
					icon={<CalendarDays className="size-10" />}
					title="Nenhum evento ainda"
					description="Crie um evento para montar os times depois."
					action={
						canManage && (
							<Button onClick={() => setIsCreating(true)}>
								<Plus className="size-4" />
								{EVENT_ACTION.newEvent}
							</Button>
						)
					}
				/>
			)}
			{!isCreating && events.length > 0 && (
				<ul className="space-y-2">
					{events.map((event) => {
						const when = formatEventStartsAt(event.starts_at);
						const status = eventStatus(event.ended_at);

						return (
							<li key={event.id}>
								<Link
									to={ROUTES.championshipEvent}
									params={{
										championshipId: String(championshipId),
										eventId: String(event.id),
									}}
									className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-sm hover:border-pitch/30 hover:bg-pitch-soft/40"
								>
									<div className="min-w-0 flex-1">
										<p className="font-semibold tracking-tight text-fg">
											{when.date} · {when.time}
										</p>
										<span className={`mt-1 inline-flex ${CHIP_CLASS}`}>
											{EVENT_STATUS_LABEL[status]}
										</span>
									</div>
									<span className="inline-flex items-center gap-1 text-sm font-medium text-fg-muted">
										Ver detalhes
										<ChevronRight className="size-4 text-fg-subtle" />
									</span>
								</Link>
							</li>
						);
					})}
				</ul>
			)}
		</SectionCard>
	);
}
