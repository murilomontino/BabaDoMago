import { Link, useNavigate } from "@tanstack/react-router";
import { CalendarDays, ChevronRight, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/button";
import { ChampionshipEventBuilder } from "@/components/championship-event-builder";
import { EmptyState } from "@/components/empty-state";
import { SectionCard } from "@/components/section-card";
import {
	countPlayerAttendance,
	EVENT_STATUS_LABEL,
	type EventTeamDraft,
	eventStatus,
	formatEventStartsAt,
} from "@/const/championship-event";
import { ROUTES } from "@/const/routes";
import { CHIP_CLASS, ERROR_CLASS } from "@/const/ui";
import {
	useChampionshipEvents,
	useStartChampionshipEvent,
} from "@/hooks/championships/use-championship-events";
import type { ChampionshipPlayer } from "@/types/championship";

type ChampionshipEventsProps = {
	championshipId: number;
	eventTime: string;
	playersPerTeam: number;
	players: ChampionshipPlayer[];
	canManage: boolean;
};

export function ChampionshipEvents({
	championshipId,
	eventTime,
	playersPerTeam,
	players,
	canManage,
}: ChampionshipEventsProps) {
	const navigate = useNavigate();
	const eventsQuery = useChampionshipEvents(championshipId);
	const startEvent = useStartChampionshipEvent(championshipId);
	const [isCreating, setIsCreating] = useState(false);
	const events = eventsQuery.data ?? [];
	const attendanceCounts = useMemo(
		() => countPlayerAttendance(events),
		[events],
	);

	async function handleStart(values: {
		eventDate: string;
		presentPlayerIds: number[];
		teams: EventTeamDraft[];
	}) {
		const eventId = await startEvent.mutateAsync(values);
		await navigate({
			to: ROUTES.championshipEvent,
			params: {
				championshipId: String(championshipId),
				eventId: String(eventId),
			},
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
					attendanceCounts={attendanceCounts}
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
