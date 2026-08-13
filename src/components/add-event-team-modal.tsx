import { useState } from "react";
import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import {
	EventTeamColorDot,
	EventTeamPlayerRow,
	EventTeamRatingAverage,
} from "@/components/event-team-player";
import {
	EVENT_ACTION,
	EVENT_TEAM_MESSAGE,
	EVENT_TEAM_POSITION_LABEL,
	emptyTeamSlots,
	eventTeamSlotPosition,
	nextEventTeamColor,
	teamPlayerSlots,
	teamSlotsToPlayerIds,
	validateEventTeam,
} from "@/const/championship-event";
import {
	EVENT_TEAM_COLOR,
	EVENT_TEAM_COLOR_CUSTOM_LABEL,
	EVENT_TEAM_COLOR_LABEL,
	EVENT_TEAM_COLORS,
	type EventTeamColor,
	eventTeamColorStyle,
	isEventTeamColor,
	normalizeEventTeamColor,
} from "@/const/event-team-color";
import { playerVisibleName } from "@/const/player-name";
import { championshipRatingCeiling } from "@/const/player-rating";
import {
	BUTTON_VARIANT,
	CHIP_CLASS,
	ERROR_CLASS,
	FIELD_CLASS,
	MODAL_CLASS,
} from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";

type AddEventTeamModalProps = {
	playersPerTeam: number;
	presentPlayers: ChampionshipPlayer[];
	usedColors: readonly EventTeamColor[];
	takenPlayerIds: readonly number[];
	initialTeam?: {
		color: EventTeamColor;
		players: readonly { player_id: number; is_goalkeeper: boolean }[];
	};
	isPending: boolean;
	errorMessage: string | null;
	onCancel: () => void;
	onAdd: (values: {
		color: EventTeamColor;
		playerIds: number[];
		goalkeeperId: number;
	}) => Promise<void>;
};

export function AddEventTeamModal({
	playersPerTeam,
	presentPlayers,
	usedColors,
	takenPlayerIds,
	initialTeam,
	isPending,
	errorMessage,
	onCancel,
	onAdd,
}: AddEventTeamModalProps) {
	const isEdit = Boolean(initialTeam);
	const ceiling = championshipRatingCeiling(
		presentPlayers.map((player) => player.rating),
	);
	const [color, setColor] = useState<EventTeamColor>(
		() => initialTeam?.color ?? nextEventTeamColor(usedColors),
	);
	const [slots, setSlots] = useState(() =>
		initialTeam
			? teamPlayerSlots(initialTeam.players, playersPerTeam)
			: emptyTeamSlots(playersPerTeam),
	);
	const [localError, setLocalError] = useState<string | null>(null);
	const assignedIds = new Set(teamSlotsToPlayerIds(slots));
	const taken = new Set(takenPlayerIds);
	const pool = presentPlayers.filter(
		(player) => !assignedIds.has(player.id) && !taken.has(player.id),
	);
	const isDefault = EVENT_TEAM_COLORS.some((item) => item === color);
	const cardStyle = eventTeamColorStyle(color);
	const slotIndexes = Array.from({ length: playersPerTeam }, (_, slot) => slot);
	const presentIds = presentPlayers.map((player) => player.id);

	function handleColorChange(nextValue: string) {
		const next = normalizeEventTeamColor(nextValue);
		if (!isEventTeamColor(next)) {
			return;
		}

		if (usedColors.includes(next)) {
			return;
		}

		setColor(next);
		setLocalError(null);
	}

	return (
		<AppDialog onClose={onCancel}>
			<div className={`${MODAL_CLASS} max-h-[90dvh] overflow-y-auto`}>
				<p className="mb-3 text-sm font-medium tracking-tight text-fg">
					{isEdit ? EVENT_ACTION.editTeam : EVENT_ACTION.addTeam}
				</p>
				{presentPlayers.length === 0 && (
					<p className="mb-3 text-sm text-fg-muted">
						{EVENT_TEAM_MESSAGE.needAttendance}
					</p>
				)}
				{presentPlayers.length > 0 && (
					<article
						className="relative space-y-2 rounded-lg border border-line p-2"
						style={cardStyle}
					>
						<EventTeamColorDot color={color} />
						<div className="flex min-w-0 flex-wrap items-center gap-1">
							{EVENT_TEAM_COLORS.map((item) => {
								const takenColor = usedColors.includes(item);
								const selected = color === item;

								return (
									<button
										key={item}
										type="button"
										disabled={takenColor}
										aria-label={EVENT_TEAM_COLOR_LABEL[item] ?? item}
										aria-pressed={selected}
										onClick={() => handleColorChange(item)}
										className={`size-5 rounded-md border-2 disabled:opacity-30 ${selected ? "border-current" : "border-black/20"}`}
										style={{ backgroundColor: item }}
									/>
								);
							})}
							<label className="relative size-5 shrink-0">
								<input
									type="color"
									value={color}
									aria-label={EVENT_TEAM_COLOR_CUSTOM_LABEL}
									onChange={(event) => {
										handleColorChange(event.target.value);
									}}
									className="absolute inset-0 cursor-pointer opacity-0"
								/>
								<span
									aria-hidden
									className={`block size-5 rounded-md border-2 ${isDefault ? "border-black/20" : "border-current"}`}
									style={{
										backgroundColor: isDefault ? "transparent" : color,
										backgroundImage: isDefault
											? "conic-gradient(#dc2626, #facc15, #166534, #2563eb, #ec4899, #dc2626)"
											: undefined,
									}}
								/>
							</label>
						</div>
						<ul className="space-y-1">
							{slotIndexes.map((slot) => {
								const slotValue = slots[slot] ?? "";
								const player = presentPlayers.find(
									(item) => String(item.id) === slotValue,
								);

								return (
									<li
										key={`slot-${slot}`}
										className="flex min-h-7 items-center gap-1.5 rounded-md bg-white px-1.5 py-1"
									>
										<span className={`${CHIP_CLASS} shrink-0`}>
											{EVENT_TEAM_POSITION_LABEL[eventTeamSlotPosition(slot)]}
										</span>
										{player && (
											<EventTeamPlayerRow
												player={player}
												ceiling={ceiling}
												backgroundColor={EVENT_TEAM_COLOR.white}
												onRemove={() => {
													setSlots((current) =>
														current.map((value, index) =>
															index === slot ? "" : value,
														),
													);
													setLocalError(null);
												}}
											/>
										)}
										{!player && (
											<select
												value=""
												disabled={pool.length === 0}
												className={FIELD_CLASS}
												onChange={(event) => {
													const value = event.target.value;
													setSlots((current) =>
														current.map((item, index) =>
															index === slot ? value : item,
														),
													);
													setLocalError(null);
												}}
											>
												<option value="">Adicionar jogador</option>
												{pool.map((item) => (
													<option key={item.id} value={String(item.id)}>
														{playerVisibleName(item)}
													</option>
												))}
											</select>
										)}
									</li>
								);
							})}
						</ul>
						<EventTeamRatingAverage
							ratings={teamSlotsToPlayerIds(slots).flatMap((playerId) => {
								const player = presentPlayers.find(
									(item) => item.id === playerId,
								);
								if (!player) {
									return [];
								}

								return [player.rating];
							})}
						/>
					</article>
				)}
				{localError && <p className={`mt-2 ${ERROR_CLASS}`}>{localError}</p>}
				{errorMessage && (
					<p className={`mt-2 ${ERROR_CLASS}`}>{errorMessage}</p>
				)}
				<div className="mt-4 flex justify-end gap-2">
					<Button
						variant={BUTTON_VARIANT.secondary}
						onClick={onCancel}
						disabled={isPending}
					>
						Cancelar
					</Button>
					<Button
						disabled={isPending || presentPlayers.length === 0}
						onClick={() => {
							void (async () => {
								const playerIds = teamSlotsToPlayerIds(slots);
								const draft = {
									color,
									playerIds,
									goalkeeperId: Number(slots[0]),
								};
								const invalid = validateEventTeam(
									draft,
									playersPerTeam,
									usedColors,
									takenPlayerIds,
									presentIds,
								);
								if (invalid) {
									setLocalError(invalid);
									return;
								}

								await onAdd(draft);
							})();
						}}
					>
						{isEdit ? EVENT_ACTION.saveTeam : EVENT_ACTION.addTeam}
					</Button>
				</div>
			</div>
		</AppDialog>
	);
}
