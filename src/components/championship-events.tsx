import { Link, useNavigate } from "@tanstack/react-router";
import { Field, Form, Formik } from "formik";
import { CalendarDays, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { SkeletonRegion } from "@/components/atoms/skeleton";
import { Button } from "@/components/button";
import { ConfirmOpenEventsModal } from "@/components/confirm-open-events-modal";
import { EmptyState } from "@/components/empty-state";
import { FormError } from "@/components/form-error";
import { ListRowSkeleton } from "@/components/molecules/list-row-skeleton";
import { SectionCard } from "@/components/section-card";
import {
	championshipEventToday,
	EVENT_ACTION,
	EVENT_BUILDER_STEP,
	EVENT_STATUS_LABEL,
	eventStatus,
	formatEventStartsAt,
	openChampionshipEvents,
	parseEventTime,
} from "@/const/championship-event";
import { CHAMPIONSHIP_TAB_LABEL } from "@/const/championship-tab";
import { startEventFormSchema } from "@/const/form-schema";
import { ROUTES } from "@/const/routes";
import {
	LIST_ROW_SKELETON_VARIANT,
	SKELETON_LABEL,
	SKELETON_LIST_ROWS,
} from "@/const/skeleton";
import {
	BUTTON_VARIANT,
	CHIP_CLASS,
	ERROR_CLASS,
	FIELD_CLASS,
} from "@/const/ui";
import {
	useChampionshipEvents,
	useCreateChampionshipEvent,
	useEndChampionshipEvent,
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
	const endEvent = useEndChampionshipEvent(championshipId);
	const [isCreating, setIsCreating] = useState(false);
	const [pendingCreate, setPendingCreate] = useState<{
		eventDate: string;
		eventTime: string;
	} | null>(null);
	const events = eventsQuery.data ?? [];
	const openEvents = openChampionshipEvents(events);
	const isPending = createEvent.isPending || endEvent.isPending;

	async function handleCreate(eventDate: string, eventTime: string) {
		const eventId = await createEvent.mutateAsync({
			eventDate,
			eventTime: parseEventTime(eventTime),
		});
		setPendingCreate(null);
		await navigate({
			to: ROUTES.championshipEvent,
			params: {
				championshipId: String(championshipId),
				eventId: String(eventId),
			},
			search: { step: EVENT_BUILDER_STEP.attendance },
		});
	}

	async function handleCloseAndCreate(eventDate: string, eventTime: string) {
		await openEvents.reduce(
			(chain, event) =>
				chain.then(() =>
					endEvent.mutateAsync({
						eventId: event.id,
						presentPlayerIds: null,
						mvpPlayerIds: null,
					}),
				),
			Promise.resolve(),
		);
		await handleCreate(eventDate, eventTime);
	}

	if (eventsQuery.isPending) {
		return <ChampionshipEventsSkeleton />;
	}

	if (eventsQuery.isError) {
		return (
			<p className={ERROR_CLASS}>
				Erro ao carregar rodadas: {eventsQuery.error.message}
			</p>
		);
	}

	return (
		<SectionCard
			title={CHAMPIONSHIP_TAB_LABEL.events}
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
					initialValues={{
						eventDate: championshipEventToday(),
						eventTime,
					}}
					validationSchema={startEventFormSchema}
					onSubmit={async (values) => {
						if (openEvents.length > 0) {
							createEvent.reset();
							endEvent.reset();
							setPendingCreate({
								eventDate: values.eventDate,
								eventTime: values.eventTime,
							});
							return;
						}

						await handleCreate(values.eventDate, values.eventTime);
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
								<Field
									id="event-time"
									name="eventTime"
									type="time"
									className={`mt-1 ${FIELD_CLASS}`}
								/>
							</label>
						</div>
						<FormError name="eventDate" />
						<FormError name="eventTime" />
						{createEvent.isError && (
							<p className={ERROR_CLASS}>{createEvent.error.message}</p>
						)}
						<div className="flex justify-end gap-2">
							<Button
								variant={BUTTON_VARIANT.secondary}
								onClick={() => {
									createEvent.reset();
									endEvent.reset();
									setPendingCreate(null);
									setIsCreating(false);
								}}
								disabled={isPending}
							>
								Cancelar
							</Button>
							<Button type="submit" disabled={isPending}>
								{EVENT_ACTION.create}
							</Button>
						</div>
					</Form>
				</Formik>
			)}
			{!isCreating && events.length === 0 && (
				<EmptyState
					icon={<CalendarDays className="size-10" />}
					title="Nenhuma rodada ainda"
					description="Crie uma rodada para montar os times depois."
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
			{pendingCreate && (
				<ConfirmOpenEventsModal
					isPending={isPending}
					errorMessage={
						endEvent.error?.message ?? createEvent.error?.message ?? null
					}
					onCancel={() => {
						createEvent.reset();
						endEvent.reset();
						setPendingCreate(null);
					}}
					onCreateOnly={() => {
						void handleCreate(pendingCreate.eventDate, pendingCreate.eventTime);
					}}
					onCloseAndCreate={() => {
						void handleCloseAndCreate(
							pendingCreate.eventDate,
							pendingCreate.eventTime,
						);
					}}
				/>
			)}
		</SectionCard>
	);
}

function ChampionshipEventsSkeleton() {
	return (
		<SkeletonRegion label={SKELETON_LABEL.events}>
			<SectionCard
				title={CHAMPIONSHIP_TAB_LABEL.events}
				icon={<CalendarDays className="size-4 text-pitch-fg" />}
			>
				<ul className="space-y-2">
					{SKELETON_LIST_ROWS.map((row) => (
						<ListRowSkeleton
							key={row}
							variant={LIST_ROW_SKELETON_VARIANT.event}
						/>
					))}
				</ul>
			</SectionCard>
		</SkeletonRegion>
	);
}
