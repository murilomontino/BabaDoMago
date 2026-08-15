import { useEffect, useState } from "react";
import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import { PlayerRating } from "@/components/player-rating";
import {
	EVENT_ACTION,
	EVENT_STATUS,
	eventStatus,
	formatEventStartsAt,
	PLAYER_EVENT_STAT_META,
	PLAYER_EVENT_STATS_LABEL,
	type PlayerEventStatsDraft,
	parseAttendanceStatInput,
	playerEventStatsFromAttendance,
	setPlayerEventStat,
	validatePlayerEventStats,
} from "@/const/championship-event";
import { playerEventRatingAfterSave } from "@/const/event-rating-adjustment";
import { playerVisibleName } from "@/const/player-name";
import {
	BUTTON_VARIANT,
	CHIP_CLASS,
	ERROR_CLASS,
	FIELD_CLASS,
	STAT_FIELD_CLASS,
} from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";
import type { ChampionshipEvent } from "@/types/championship-event";

type EditPlayerEventStatsModalProps = {
	player: ChampionshipPlayer;
	events: readonly ChampionshipEvent[];
	ceiling: number;
	isPending: boolean;
	errorMessage: string | null;
	onCancel: () => void;
	onSave: (eventId: number, stats: PlayerEventStatsDraft) => Promise<void>;
};

function endedEvents(
	events: readonly ChampionshipEvent[],
): ChampionshipEvent[] {
	return events.filter(
		(event) => eventStatus(event.ended_at) === EVENT_STATUS.ended,
	);
}

function eventAttendance(
	events: readonly ChampionshipEvent[],
	eventId: number,
	playerId: number,
) {
	return (
		events
			.find((event) => event.id === eventId)
			?.attendance.find((row) => row.player_id === playerId) ?? null
	);
}

function RatingSnapshot({
	rating,
	ceiling,
}: {
	rating: number;
	ceiling: number;
}) {
	return (
		<div className="flex items-center justify-center gap-2">
			<PlayerRating rating={rating} ceiling={ceiling} />
			<span className={CHIP_CLASS}>{rating}</span>
		</div>
	);
}

export function EditPlayerEventStatsModal({
	player,
	events,
	ceiling,
	isPending,
	errorMessage,
	onCancel,
	onSave,
}: EditPlayerEventStatsModalProps) {
	const closedEvents = endedEvents(events);
	const firstEndedId = closedEvents[0]?.id ?? 0;
	const [eventId, setEventId] = useState(firstEndedId);
	const [draft, setDraft] = useState(() =>
		playerEventStatsFromAttendance(
			eventAttendance(events, firstEndedId, player.id),
		),
	);
	const [localError, setLocalError] = useState<string | null>(null);

	useEffect(() => {
		if (eventId !== 0 || firstEndedId === 0) {
			return;
		}

		setEventId(firstEndedId);
		setDraft(
			playerEventStatsFromAttendance(
				eventAttendance(events, firstEndedId, player.id),
			),
		);
	}, [eventId, events, firstEndedId, player.id]);
	const name = playerVisibleName(player);
	const attendance = eventAttendance(events, eventId, player.id);
	const to = playerEventRatingAfterSave({
		rating: player.rating,
		storedDelta: attendance?.rating_delta ?? 0,
		oldWins: attendance?.wins ?? 0,
		oldDraws: attendance?.draws ?? 0,
		oldMatches: attendance?.matches ?? 0,
		wins: draft.wins,
		draws: draft.draws,
		matches: draft.matches,
		ceiling,
		snapshotRating: attendance?.rating ?? player.rating,
	});

	return (
		<AppDialog onClose={onCancel}>
			<div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl bg-surface p-6 shadow-lg">
				<p className="mb-5 text-sm font-medium tracking-tight text-fg">
					{PLAYER_EVENT_STATS_LABEL.title}
				</p>
				<div className="mb-4 flex flex-col items-center gap-2">
					{player.avatar_url && (
						<img
							src={player.avatar_url}
							alt=""
							referrerPolicy="no-referrer"
							className="h-14 w-14 rounded-full object-cover"
						/>
					)}
					{!player.avatar_url && (
						<span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-pitch-soft text-lg font-medium text-pitch-fg">
							{name.charAt(0).toUpperCase()}
						</span>
					)}
					<p className="text-sm font-medium text-fg">{name}</p>
				</div>
				{closedEvents.length === 0 && (
					<p className="mb-4 text-sm text-fg-muted">
						{PLAYER_EVENT_STATS_LABEL.emptyEvents}
					</p>
				)}
				{closedEvents.length > 0 && (
					<label
						htmlFor="player-event-stats-event"
						className="mb-4 block text-sm text-fg-muted"
					>
						{PLAYER_EVENT_STATS_LABEL.event}
						<select
							id="player-event-stats-event"
							value={eventId}
							className={`mt-1 ${FIELD_CLASS}`}
							onChange={(event) => {
								const nextId = Number(event.target.value);
								setLocalError(null);
								setEventId(nextId);
								setDraft(
									playerEventStatsFromAttendance(
										eventAttendance(events, nextId, player.id),
									),
								);
							}}
						>
							{closedEvents.map((event) => {
								const when = formatEventStartsAt(event.starts_at);

								return (
									<option key={event.id} value={event.id}>
										{when.date} · {when.time}
									</option>
								);
							})}
						</select>
					</label>
				)}
				<div className="grid grid-cols-4 gap-3">
					{PLAYER_EVENT_STAT_META.map((field) => {
						const inputId = `player-event-stat-${player.id}-${field.id}`;

						return (
							<label
								key={field.id}
								htmlFor={inputId}
								className="flex flex-col items-center gap-1.5 text-xs font-medium text-fg-muted"
							>
								<span title={field.label}>{field.abbr}</span>
								<input
									id={inputId}
									type="number"
									min={0}
									step={1}
									inputMode="numeric"
									value={draft[field.id]}
									className={STAT_FIELD_CLASS}
									onChange={(event) => {
										const next = parseAttendanceStatInput(event.target.value);
										if (next === null) {
											return;
										}

										setLocalError(null);
										setDraft((current) =>
											setPlayerEventStat(current, field.id, next),
										);
									}}
								/>
							</label>
						);
					})}
				</div>
				<div className="mt-4 flex flex-wrap items-center justify-center gap-3">
					<RatingSnapshot rating={player.rating} ceiling={ceiling} />
					<span className="text-sm font-bold text-fg">→</span>
					<RatingSnapshot rating={to} ceiling={ceiling} />
				</div>
				<p className="mt-2 text-center text-xs text-fg-muted">
					{PLAYER_EVENT_STATS_LABEL.ratingHint}
				</p>
				{localError && <p className={`mt-2 ${ERROR_CLASS}`}>{localError}</p>}
				{errorMessage && (
					<p className={`mt-2 ${ERROR_CLASS}`}>{errorMessage}</p>
				)}
				<div className="mt-6 flex justify-end gap-2">
					<Button
						variant={BUTTON_VARIANT.secondary}
						onClick={onCancel}
						disabled={isPending}
					>
						Cancelar
					</Button>
					<Button
						onClick={() => {
							void (async () => {
								if (!eventId) {
									setLocalError(PLAYER_EVENT_STATS_LABEL.emptyEvents);
									return;
								}

								const invalid = validatePlayerEventStats(draft);
								if (invalid) {
									setLocalError(invalid);
									return;
								}

								await onSave(eventId, draft);
							})();
						}}
						disabled={isPending || closedEvents.length === 0}
					>
						{EVENT_ACTION.savePlayerEventStats}
					</Button>
				</div>
			</div>
		</AppDialog>
	);
}
