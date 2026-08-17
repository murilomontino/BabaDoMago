import { useNavigate } from "@tanstack/react-router";
import { Field, Form, Formik } from "formik";
import { CalendarDays, ChevronRight, MapPin, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { SkeletonRegion } from "@/components/atoms/skeleton";
import { Button } from "@/components/button";
import { ConfirmOpenEventsModal } from "@/components/confirm-open-events-modal";
import { DeleteEventModal } from "@/components/delete-event-modal";
import { EmptyState } from "@/components/empty-state";
import { EndEventModal } from "@/components/end-event-modal";
import { EventListActionsModal } from "@/components/event-list-actions-modal";
import { FormError } from "@/components/form-error";
import { ListRowSkeleton } from "@/components/molecules/list-row-skeleton";
import { SectionCard } from "@/components/section-card";
import { SetEventMvpModal } from "@/components/set-event-mvp-modal";
import {
	championshipEventToday,
	clearAttendanceDraft,
	EVENT_ACTION,
	EVENT_BUILDER_STEP,
	EVENT_CARD_LONG_PRESS,
	EVENT_STATUS_LABEL,
	type EventWeekday,
	eventListActionFlags,
	eventStatus,
	formatChampionshipSchedule,
	formatEventStartsAt,
	formatNextPeladaShortcut,
	hasEventListActions,
	matchPlayerIdsMissingFromAttendance,
	mergePresentIdsForEnd,
	nextEventDate,
	openChampionshipEvents,
	parseEventTime,
	parseEventWeekday,
} from "@/const/championship-event";
import {
	EVENT_MATCH_LABEL,
	matchPlayUrl,
	openEventMatch,
} from "@/const/championship-event-match";
import { CHAMPIONSHIP_TAB_LABEL } from "@/const/championship-tab";
import { eventMvpCandidates, toggleEventMvpPlayerId } from "@/const/event-mvp";
import { eventRatingPreview } from "@/const/event-rating-adjustment";
import { startEventFormSchema } from "@/const/form-schema";
import { playerVisibleName } from "@/const/player-name";
import { championshipRatingCeiling } from "@/const/player-rating";
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
	useDeleteChampionshipEvent,
	useEndChampionshipEvent,
	useSetChampionshipEventMvps,
} from "@/hooks/championships/use-championship-events";
import type { ChampionshipPlayer } from "@/types/championship";
import type { ChampionshipEvent } from "@/types/championship-event";

type ChampionshipEventsProps = {
	championshipId: number;
	eventTime: string;
	eventWeekday: number | null;
	location: string | null;
	players: ChampionshipPlayer[];
	canManage: boolean;
	canSetMvp: boolean;
};

type EventListFlow = "actions" | "delete" | "end" | "mvp";

function eventEndIds(event: ChampionshipEvent) {
	const attendanceIds = event.attendance.map((row) => row.player_id);
	const missingMatchPlayerIds = matchPlayerIdsMissingFromAttendance(
		event.matches,
		attendanceIds,
	);
	const presentPlayerIds = mergePresentIdsForEnd(
		null,
		attendanceIds,
		missingMatchPlayerIds,
	);
	const mvpCandidateIds = eventMvpCandidates(event.attendance)
		.map((row) => row.playerId)
		.filter(
			(playerId) =>
				presentPlayerIds === null || presentPlayerIds.includes(playerId),
		);

	return { missingMatchPlayerIds, presentPlayerIds, mvpCandidateIds };
}

export function ChampionshipEvents({
	championshipId,
	eventTime,
	eventWeekday,
	location,
	players,
	canManage,
	canSetMvp,
}: ChampionshipEventsProps) {
	const navigate = useNavigate();
	const eventsQuery = useChampionshipEvents(championshipId);
	const createEvent = useCreateChampionshipEvent(championshipId);
	const endEvent = useEndChampionshipEvent(championshipId);
	const deleteEvent = useDeleteChampionshipEvent(championshipId);
	const setMvps = useSetChampionshipEventMvps(championshipId);
	const [isCreating, setIsCreating] = useState(false);
	const [pendingCreate, setPendingCreate] = useState<{
		eventDate: string;
		eventTime: string;
	} | null>(null);
	const [flowEvent, setFlowEvent] = useState<ChampionshipEvent | null>(null);
	const [flow, setFlow] = useState<EventListFlow | null>(null);
	const [copied, setCopied] = useState(false);
	const [endMvpPlayerIds, setEndMvpPlayerIds] = useState<number[] | null>(null);
	const events = eventsQuery.data ?? [];
	const openEvents = openChampionshipEvents(events);
	const isPending =
		createEvent.isPending ||
		endEvent.isPending ||
		deleteEvent.isPending ||
		setMvps.isPending;
	const weekday = parseEventWeekday(eventWeekday);
	const scheduleLine = formatChampionshipSchedule({
		weekday,
		eventTime,
		location,
	});
	const shortcutLabel =
		weekday &&
		formatNextPeladaShortcut({
			weekday,
			eventTime,
		});
	const endIds = flowEvent ? eventEndIds(flowEvent) : null;
	const mvpPlayerIds = endMvpPlayerIds ?? endIds?.mvpCandidateIds ?? [];
	const ratingPreview =
		flowEvent &&
		eventRatingPreview({
			attendance: flowEvent.attendance,
			players,
			presentPlayerIds: endIds?.presentPlayerIds ?? null,
			mvpPlayerIds,
		});
	const previewCeiling = championshipRatingCeiling([
		...players.map((player) => player.rating),
		...(ratingPreview ? ratingPreview.map((row) => row.to) : []),
	]);
	const actionsFlags =
		flowEvent &&
		eventListActionFlags({
			canManage,
			canSetMvp,
			ended: Boolean(flowEvent.ended_at),
			teamCount: flowEvent.teams.length,
			attendanceCount: flowEvent.attendance.length,
		});
	const actionsWhen = flowEvent && formatEventStartsAt(flowEvent.starts_at);
	const copyMatchLinkLabel = copied
		? EVENT_MATCH_LABEL.copied
		: EVENT_ACTION.copyMatchLink;

	async function handleCreate(eventDate: string, eventTimeValue: string) {
		const eventId = await createEvent.mutateAsync({
			eventDate,
			eventTime: parseEventTime(eventTimeValue),
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

	async function handleCloseAndCreate(
		eventDate: string,
		eventTimeValue: string,
	) {
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
		await handleCreate(eventDate, eventTimeValue);
	}

	function requestCreate(eventDate: string, eventTimeValue: string) {
		if (openEvents.length > 0) {
			createEvent.reset();
			endEvent.reset();
			setPendingCreate({
				eventDate,
				eventTime: eventTimeValue,
			});
			return;
		}

		void handleCreate(eventDate, eventTimeValue);
	}

	function handleShortcut(weekdayValue: EventWeekday) {
		requestCreate(
			nextEventDate(weekdayValue, championshipEventToday()),
			parseEventTime(eventTime),
		);
	}

	function resetFlow() {
		setFlow(null);
		setFlowEvent(null);
		setEndMvpPlayerIds(null);
		setCopied(false);
	}

	function closeFlow() {
		if (isPending) {
			return;
		}

		resetFlow();
	}

	function openFlow(event: ChampionshipEvent, next: EventListFlow) {
		setCopied(false);
		setEndMvpPlayerIds(null);
		setFlowEvent(event);
		setFlow(next);
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
					<div className="flex flex-wrap items-center justify-end gap-2">
						{weekday && shortcutLabel && (
							<Button
								variant={BUTTON_VARIANT.secondary}
								onClick={() => handleShortcut(weekday)}
								disabled={isPending}
							>
								{shortcutLabel}
							</Button>
						)}
						<Button onClick={() => setIsCreating(true)}>
							<Plus className="size-4" />
							{EVENT_ACTION.newEvent}
						</Button>
					</div>
				)
			}
		>
			{scheduleLine && (
				<p className="mb-3 flex items-start gap-1.5 text-sm text-fg-muted">
					{location && <MapPin className="mt-0.5 size-3.5 shrink-0" />}
					<span>{scheduleLine}</span>
				</p>
			)}
			{isCreating && (
				<Formik
					initialValues={{
						eventDate: weekday
							? nextEventDate(weekday, championshipEventToday())
							: championshipEventToday(),
						eventTime,
					}}
					validationSchema={startEventFormSchema}
					onSubmit={async (values) => {
						requestCreate(values.eventDate, values.eventTime);
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
							<div className="flex flex-wrap items-center justify-center gap-2">
								{weekday && shortcutLabel && (
									<Button
										variant={BUTTON_VARIANT.secondary}
										onClick={() => handleShortcut(weekday)}
										disabled={isPending}
									>
										{shortcutLabel}
									</Button>
								)}
								<Button onClick={() => setIsCreating(true)}>
									<Plus className="size-4" />
									{EVENT_ACTION.newEvent}
								</Button>
							</div>
						)
					}
				/>
			)}
			{!isCreating && events.length > 0 && (
				<ul className="space-y-2">
					{events.map((event) => (
						<EventListRow
							key={event.id}
							event={event}
							hasActions={hasEventListActions(
								eventListActionFlags({
									canManage,
									canSetMvp,
									ended: Boolean(event.ended_at),
									teamCount: event.teams.length,
									attendanceCount: event.attendance.length,
								}),
							)}
							onOpen={() => {
								void navigate({
									to: ROUTES.championshipEvent,
									params: {
										championshipId: String(championshipId),
										eventId: String(event.id),
									},
								});
							}}
							onActions={() => openFlow(event, "actions")}
						/>
					))}
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
			{flow === "actions" && flowEvent && actionsFlags && actionsWhen && (
				<EventListActionsModal
					title={`${actionsWhen.date} · ${actionsWhen.time}`}
					copyMatchLinkLabel={copyMatchLinkLabel}
					continueMatch={openEventMatch(flowEvent.matches) !== null}
					showStartMatch={actionsFlags.showStartMatch}
					canEnd={actionsFlags.canEnd}
					canSetMvp={actionsFlags.canSetMvp}
					canDelete={actionsFlags.canDelete}
					onCopyLink={() => {
						const url = matchPlayUrl(
							window.location.origin,
							flowEvent.championship_id,
							flowEvent.id,
							ROUTES.championshipEventPlay,
						);
						void navigator.clipboard.writeText(url).then(() => {
							setCopied(true);
						});
					}}
					onOpenPlay={() => {
						void navigate({
							to: ROUTES.championshipEventPlay,
							params: {
								championshipId: String(championshipId),
								eventId: String(flowEvent.id),
							},
						});
					}}
					onEnd={() => openFlow(flowEvent, "end")}
					onSetMvp={() => openFlow(flowEvent, "mvp")}
					onDelete={() => openFlow(flowEvent, "delete")}
					onClose={closeFlow}
				/>
			)}
			{flow === "delete" && flowEvent && (
				<DeleteEventModal
					isPending={deleteEvent.isPending}
					errorMessage={deleteEvent.isError ? deleteEvent.error.message : null}
					onCancel={closeFlow}
					onConfirm={() => {
						void (async () => {
							try {
								await deleteEvent.mutateAsync(flowEvent.id);
								resetFlow();
							} catch {
								return;
							}
						})();
					}}
				/>
			)}
			{flow === "end" && flowEvent && endIds && ratingPreview && (
				<EndEventModal
					rows={ratingPreview}
					ceiling={previewCeiling}
					canSetMvp={canSetMvp}
					mvpCandidateIds={endIds.mvpCandidateIds}
					missingAttendanceNames={endIds.missingMatchPlayerIds.map(
						(playerId) => {
							const player = players.find((item) => item.id === playerId);
							if (player) {
								return playerVisibleName(player);
							}

							const matchPlayer = flowEvent.matches
								.flatMap((match) => match.players)
								.find((row) => row.player_id === playerId);
							return matchPlayer?.display_name ?? String(playerId);
						},
					)}
					isPending={endEvent.isPending}
					errorMessage={endEvent.isError ? endEvent.error.message : null}
					onToggleMvp={(playerId) => {
						setEndMvpPlayerIds((current) =>
							toggleEventMvpPlayerId(
								current ?? endIds.mvpCandidateIds,
								playerId,
							),
						);
					}}
					onCancel={closeFlow}
					onConfirm={() => {
						void (async () => {
							try {
								await endEvent.mutateAsync({
									eventId: flowEvent.id,
									presentPlayerIds: endIds.presentPlayerIds,
									mvpPlayerIds: canSetMvp ? mvpPlayerIds : null,
								});
								clearAttendanceDraft(flowEvent.id);
								resetFlow();
							} catch {
								return;
							}
						})();
					}}
				/>
			)}
			{flow === "mvp" && flowEvent && (
				<SetEventMvpModal
					players={flowEvent.attendance.map((row) => ({
						id: row.player_id,
						name: row.display_name,
						goals: row.goals,
						assists: row.assists,
						wins: row.wins,
						matches: row.matches,
					}))}
					initialPlayerIds={flowEvent.attendance.flatMap((row) =>
						row.is_mvp ? [row.player_id] : [],
					)}
					isPending={setMvps.isPending}
					errorMessage={setMvps.isError ? setMvps.error.message : null}
					onCancel={closeFlow}
					onSave={async (playerIds) => {
						await setMvps.mutateAsync({
							eventId: flowEvent.id,
							playerIds,
						});
						resetFlow();
					}}
				/>
			)}
		</SectionCard>
	);
}

function EventListRow({
	event,
	hasActions,
	onOpen,
	onActions,
}: {
	event: ChampionshipEvent;
	hasActions: boolean;
	onOpen: () => void;
	onActions: () => void;
}) {
	const timerRef = useRef<number | null>(null);
	const originRef = useRef<{ x: number; y: number } | null>(null);
	const skipClickRef = useRef(false);
	const openedRef = useRef(false);
	const when = formatEventStartsAt(event.starts_at);
	const status = eventStatus(event.ended_at);

	function clearTimer() {
		if (timerRef.current === null) {
			return;
		}

		window.clearTimeout(timerRef.current);
		timerRef.current = null;
	}

	function openActions() {
		if (!hasActions || openedRef.current) {
			return;
		}

		openedRef.current = true;
		skipClickRef.current = true;
		clearTimer();
		onActions();
	}

	return (
		<li>
			<button
				type="button"
				className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-left shadow-sm select-none touch-manipulation hover:border-pitch/30 hover:bg-pitch-soft/40"
				onClick={() => {
					if (skipClickRef.current) {
						skipClickRef.current = false;
						return;
					}

					onOpen();
				}}
				onPointerDown={(pointerEvent) => {
					if (!hasActions || pointerEvent.button !== 0) {
						return;
					}

					openedRef.current = false;
					skipClickRef.current = false;
					originRef.current = {
						x: pointerEvent.clientX,
						y: pointerEvent.clientY,
					};
					clearTimer();
					timerRef.current = window.setTimeout(() => {
						openActions();
					}, EVENT_CARD_LONG_PRESS.ms);
				}}
				onPointerMove={(pointerEvent) => {
					const origin = originRef.current;
					if (!origin || timerRef.current === null) {
						return;
					}

					const movedX = Math.abs(pointerEvent.clientX - origin.x);
					const movedY = Math.abs(pointerEvent.clientY - origin.y);
					if (
						movedX < EVENT_CARD_LONG_PRESS.movePx &&
						movedY < EVENT_CARD_LONG_PRESS.movePx
					) {
						return;
					}

					clearTimer();
				}}
				onPointerUp={clearTimer}
				onPointerCancel={clearTimer}
				onContextMenu={(pointerEvent) => {
					if (!hasActions) {
						return;
					}

					pointerEvent.preventDefault();
					openActions();
				}}
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
			</button>
		</li>
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
