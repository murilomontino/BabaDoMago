import { useState } from "react";
import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import {
	EVENT_TEAM_PLAYER_SLOT_CLASS,
	EVENT_TEAM_POSITION_CHIP_CLASS,
	EventTeamColorDot,
	EventTeamColorNoneButton,
	EventTeamPlayerRow,
	EventTeamRatingAverage,
} from "@/components/event-team-player";
import {
	EVENT_ACTION,
	EVENT_TEAM_MESSAGE,
	EVENT_TEAM_POSITION_LABEL,
	eventTeamPlayerOptionLabel,
	eventTeamSlotPosition,
	initialTeamSlots,
	replaceSlotAt,
	teamSlotsToPlayerIds,
	validateEventTeam,
} from "@/const/championship-event";
import {
	EVENT_TEAM_COLOR,
	EVENT_TEAM_COLOR_CUSTOM_LABEL,
	EVENT_TEAM_COLOR_LABEL,
	EVENT_TEAM_COLOR_NONE,
	EVENT_TEAM_COLORS,
	type EventTeamColor,
	eventTeamColorStyle,
	eventTeamCustomColorPreview,
	isEventTeamColor,
	normalizeEventTeamColor,
} from "@/const/event-team-color";
import { playerVisibleName } from "@/const/player-name";
import { championshipRatingCeiling } from "@/const/player-rating";
import {
	BUTTON_VARIANT,
	ERROR_CLASS,
	FIELD_CLASS,
	MODAL_CLASS,
} from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";

type AddEventTeamModalProps = {
	playersPerTeam: number;
	presentPlayers: ChampionshipPlayer[];
	goalkeeperIds?: readonly number[];
	usedColors: readonly EventTeamColor[];
	initialTeam?: {
		color: EventTeamColor | null;
		players: readonly { player_id: number; is_goalkeeper: boolean }[];
	};
	isPending: boolean;
	errorMessage: string | null;
	onCancel: () => void;
	onAdd: (values: {
		color: EventTeamColor | null;
		playerIds: number[];
		goalkeeperId: number;
	}) => Promise<void>;
};

export function AddEventTeamModal({
	playersPerTeam,
	presentPlayers,
	goalkeeperIds = [],
	usedColors,
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
	const presentRatings = presentPlayers.map((player) => player.rating);
	const [color, setColor] = useState<EventTeamColor | null>(
		() => initialTeam?.color ?? EVENT_TEAM_COLOR_NONE,
	);
	const [slots, setSlots] = useState(() =>
		initialTeamSlots(initialTeam, playersPerTeam),
	);
	const [localError, setLocalError] = useState<string | null>(null);
	const assignedIds = new Set(teamSlotsToPlayerIds(slots));
	const pool = presentPlayers.filter((player) => !assignedIds.has(player.id));
	const isCustom =
		color !== null && !EVENT_TEAM_COLORS.some((item) => item === color);
	const cardStyle = eventTeamColorStyle(color);
	const slotIndexes = Array.from({ length: playersPerTeam }, (_, slot) => slot);
	const presentIds = presentPlayers.map((player) => player.id);

	function handleColorChange(nextValue: string | null) {
		if (nextValue === null) {
			setColor(null);
			setLocalError(null);
			return;
		}

		const next = normalizeEventTeamColor(nextValue);
		if (next === null || !isEventTeamColor(next)) {
			return;
		}

		if (usedColors.includes(next) && color !== next) {
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
						className="relative space-y-2 rounded-lg border border-line bg-surface p-2"
						style={cardStyle}
					>
						<EventTeamColorDot color={color} />
						<div className="flex min-w-0 flex-wrap items-center gap-1">
							<EventTeamColorNoneButton
								selected={color === null}
								onSelect={() => handleColorChange(null)}
							/>
							{EVENT_TEAM_COLORS.map((item) => {
								const takenColor = usedColors.includes(item) && color !== item;
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
									value={color ?? EVENT_TEAM_COLOR.white}
									aria-label={EVENT_TEAM_COLOR_CUSTOM_LABEL}
									onChange={(event) => {
										handleColorChange(event.target.value);
									}}
									className="absolute inset-0 cursor-pointer opacity-0"
								/>
								<span
									aria-hidden
									className={`block size-5 rounded-md border-2 ${isCustom ? "border-current" : "border-black/20"}`}
									style={eventTeamCustomColorPreview(isCustom, color)}
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
										className={EVENT_TEAM_PLAYER_SLOT_CLASS}
									>
										<span
											className={`${EVENT_TEAM_POSITION_CHIP_CLASS} shrink-0`}
										>
											{EVENT_TEAM_POSITION_LABEL[eventTeamSlotPosition(slot)]}
										</span>
										{player && (
											<EventTeamPlayerRow
												player={player}
												ceiling={ceiling}
												isGoalkeeperVolunteer={
													slot !== 0 && goalkeeperIds.includes(player.id)
												}
												onRemove={() => {
													setSlots((current) =>
														replaceSlotAt(current, slot, ""),
													);
													setLocalError(null);
												}}
											/>
										)}
										{!player && (
											<select
												value=""
												disabled={pool.length === 0}
												className={`${FIELD_CLASS} relative z-10 min-w-0 flex-1`}
												onClick={(event) => {
													event.stopPropagation();
												}}
												onMouseDown={(event) => {
													event.stopPropagation();
												}}
												onChange={(event) => {
													const value = event.target.value;
													setSlots((current) =>
														replaceSlotAt(current, slot, value),
													);
													setLocalError(null);
												}}
											>
												<option value="">Adicionar jogador</option>
												{pool.map((item) => (
													<option key={item.id} value={String(item.id)}>
														{eventTeamPlayerOptionLabel(
															playerVisibleName(item),
															goalkeeperIds.includes(item.id),
														)}
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
							presentRatings={presentRatings}
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
