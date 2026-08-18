import { Field, FieldArray, Form, Formik } from "formik";
import { LoaderCircle, Plus, Share2, Shuffle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import { EventAttendanceTable } from "@/components/event-attendance-table";
import {
	EVENT_TEAM_PLAYER_SLOT_CLASS,
	EVENT_TEAM_POSITION_CHIP_CLASS,
	EventTeamColorDot,
	EventTeamColorNoneButton,
	EventTeamPlayerRow,
	EventTeamRatingAverage,
	EventTeamRemoveButton,
} from "@/components/event-team-player";
import { AttendanceFloatingSave } from "@/components/molecules/attendance-floating-save";
import { Tabs } from "@/components/tabs";
import {
	type AttendanceSeedMode,
	applyVisibleAttendance,
	builderTeamsFromDrafts,
	builderTeamsHavePlayers,
	CHAMPIONSHIP_EVENT,
	defaultGoalkeeperIds,
	EVENT_ACTION,
	EVENT_BUILDER_STEP,
	EVENT_BUILDER_TABS,
	EVENT_TEAM_MESSAGE,
	EVENT_TEAM_POSITION_LABEL,
	type EventBuilderStep,
	type EventTeamBuilderTeam,
	type EventTeamDraft,
	type EventWeekday,
	emptyTeamSlots,
	eventGoalkeeperIds,
	eventIsoWeekday,
	eventTeamCount,
	eventTeamPlayerOptionLabel,
	eventTeamSlotPool,
	eventTeamSlotPosition,
	initialBuilderTeams,
	keepGoalkeepersPresent,
	resizeBuilderTeams,
	seedPresentIdsFromHistory,
	setGoalkeeperSelection,
	teamSlotsToPlayerIds,
	validateEventAttendance,
	validateEventTeams,
	validateTeamsInAttendance,
} from "@/const/championship-event";
import {
	EVENT_TEAM_COLOR,
	EVENT_TEAM_COLOR_CUSTOM_LABEL,
	EVENT_TEAM_COLOR_LABEL,
	EVENT_TEAM_COLOR_NONE,
	EVENT_TEAM_COLORS,
	eventTeamColorStyle,
	eventTeamCustomColorPreview,
	isEventTeamColor,
	normalizeEventTeamColor,
	usedEventTeamColors,
} from "@/const/event-team-color";
import {
	EVENT_TEAM_SHARE_LABEL,
	eventTeamsShareCards,
} from "@/const/event-team-share";
import { playerVisibleName } from "@/const/player-name";
import { championshipRatingCeiling } from "@/const/player-rating";
import {
	BUTTON_VARIANT,
	ERROR_CLASS,
	FIELD_CLASS,
	MODAL_CLASS,
} from "@/const/ui";
import { handlerWhenAllowed } from "@/lib/handler-when-allowed";
import { shareEventTeamsImage } from "@/lib/share-event-teams-image";
import type { ChampionshipPlayer } from "@/types/championship";

type EventBuilderValues = {
	teams: EventTeamBuilderTeam[];
};

type EventTeamDrawResponse = {
	teams: EventTeamDraft[] | null;
	error: string | null;
};

type ChampionshipEventBuilderProps = {
	playersPerTeam: number;
	players: ChampionshipPlayer[];
	attendanceCounts: ReadonlyMap<number, number>;
	seedEvents?: readonly {
		id: number;
		ended_at: string | null;
		starts_at: string;
		attendance: readonly { player_id: number }[];
	}[];
	step: EventBuilderStep;
	startsAt: string;
	championshipName: string;
	initialPresentIds?: readonly number[];
	initialGoalkeeperIds?: readonly number[];
	initialTeams?: EventTeamBuilderTeam[];
	isPending: boolean;
	errorMessage: string | null;
	onStepChange: (step: EventBuilderStep) => void;
	onCancel?: () => void;
	onPresentIdsChange?: (playerIds: readonly number[]) => void;
	onAddPlayer?: (values: {
		displayNames: string[];
		rating: number;
		isGoalkeeper: boolean;
	}) => Promise<ChampionshipPlayer[]>;
	isAddingPlayer?: boolean;
	addPlayerError?: string | null;
	onSubmit: (
		values: {
			presentPlayerIds: number[];
			goalkeeperPlayerIds: number[];
			teams: EventTeamDraft[];
		},
		keepOpen?: boolean,
	) => Promise<void>;
};

export function ChampionshipEventBuilder({
	playersPerTeam,
	players,
	attendanceCounts,
	seedEvents = [],
	step,
	startsAt,
	championshipName,
	initialPresentIds = [],
	initialGoalkeeperIds = [],
	initialTeams,
	isPending,
	errorMessage,
	onStepChange,
	onCancel,
	onPresentIdsChange,
	onAddPlayer,
	isAddingPlayer = false,
	addPlayerError = null,
	onSubmit,
}: ChampionshipEventBuilderProps) {
	const [presentIds, setPresentIds] = useState<number[]>([
		...initialPresentIds,
	]);
	const [goalkeeperIds, setGoalkeeperIds] = useState<number[]>(() =>
		eventGoalkeeperIds(defaultGoalkeeperIds(players), initialGoalkeeperIds),
	);
	const [attendanceError, setAttendanceError] = useState<string | null>(null);
	const [teamsError, setTeamsError] = useState<string | null>(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const [isSharing, setIsSharing] = useState(false);
	const [drawConfirmOpen, setDrawConfirmOpen] = useState(false);
	const drawSetTeamsRef = useRef<
		((teams: EventTeamBuilderTeam[]) => void) | null
	>(null);
	const drawWorkerRef = useRef<Worker | null>(null);
	const rosterIds = players.map((player) => player.id);
	const seedWeekday: EventWeekday = eventIsoWeekday(startsAt);
	const ceiling = championshipRatingCeiling(
		players.map((player) => player.rating),
	);
	const presentPlayers = players.filter((player) =>
		presentIds.includes(player.id),
	);
	const presentGoalkeeperIds = keepGoalkeepersPresent(
		goalkeeperIds,
		presentIds,
	);
	const presentRatings = presentPlayers.map((player) => player.rating);
	const teamsStart =
		initialTeams ??
		initialBuilderTeams(
			playersPerTeam,
			eventTeamCount(initialPresentIds.length, playersPerTeam),
		);

	useEffect(
		() => () => {
			drawWorkerRef.current?.terminate();
		},
		[],
	);

	function handleSetPresent(playerIds: readonly number[], present: boolean) {
		const nextPresent = applyVisibleAttendance(presentIds, playerIds, present);
		setPresentIds(nextPresent);
		onPresentIdsChange?.(nextPresent);
		setAttendanceError(null);
	}

	function handleSeedAttendance(mode: AttendanceSeedMode) {
		const nextPresent = seedPresentIdsFromHistory(mode, seedEvents, rosterIds, {
			weekday: seedWeekday,
		});
		setPresentIds(nextPresent);
		onPresentIdsChange?.(nextPresent);
		setAttendanceError(null);
	}

	function handleSetGoalkeeper(
		playerIds: readonly number[],
		asGoalkeeper: boolean,
	) {
		setGoalkeeperIds((current) =>
			setGoalkeeperSelection(current, playerIds, asGoalkeeper),
		);
		setAttendanceError(null);
	}

	async function handleAddPlayer(values: {
		displayNames: string[];
		rating: number;
		isGoalkeeper: boolean;
	}): Promise<ChampionshipPlayer[]> {
		if (!onAddPlayer) {
			return [];
		}

		const created = await onAddPlayer(values);
		if (created.length === 0) {
			return created;
		}

		const createdIds = created.map((player) => player.id);
		handleSetPresent(createdIds, true);
		if (values.isGoalkeeper) {
			handleSetGoalkeeper(createdIds, true);
		}
		return created;
	}

	function handleBackToAttendance() {
		onStepChange(EVENT_BUILDER_STEP.attendance);
	}

	function tryGoToTeams(
		teams: EventTeamBuilderTeam[],
		setTeams: (teams: EventTeamBuilderTeam[]) => void,
	): boolean {
		const invalid = validateEventAttendance(presentIds, rosterIds);
		if (invalid) {
			setAttendanceError(invalid);
			return false;
		}

		setTeams(
			resizeBuilderTeams(
				teams,
				eventTeamCount(presentIds.length, playersPerTeam),
				playersPerTeam,
				new Set(presentIds),
			),
		);
		setTeamsError(null);
		onStepChange(EVENT_BUILDER_STEP.teams);
		return true;
	}

	async function handleDrawTeams(
		setTeams: (teams: EventTeamBuilderTeam[]) => void,
	) {
		const attendanceInvalid = validateEventAttendance(presentIds, rosterIds);
		if (attendanceInvalid) {
			setAttendanceError(attendanceInvalid);
			onStepChange(EVENT_BUILDER_STEP.attendance);
			return;
		}

		setIsDrawing(true);
		try {
			const worker = new Worker(
				new URL("../workers/event-team-draw.worker.ts", import.meta.url),
				{ type: "module" },
			);
			drawWorkerRef.current = worker;
			const drafts = await new Promise<EventTeamDraft[]>((resolve, reject) => {
				worker.onmessage = ({ data }: MessageEvent<EventTeamDrawResponse>) => {
					if (!data.teams || data.error) {
						reject(new Error(data.error ?? "team draw failed"));
						return;
					}

					resolve(data.teams);
				};
				worker.onerror = () => reject(new Error("team draw failed"));
				worker.postMessage({
					players: presentPlayers.map(({ id, rating }) => ({ id, rating })),
					playersPerTeam,
					volunteerIds: presentGoalkeeperIds,
				});
			});
			const teamsInvalid =
				validateEventTeams(drafts, playersPerTeam) ??
				validateTeamsInAttendance(drafts, presentIds);
			if (teamsInvalid) {
				setTeamsError(teamsInvalid);
				return;
			}

			await onSubmit(
				{
					presentPlayerIds: presentIds,
					goalkeeperPlayerIds: presentGoalkeeperIds,
					teams: drafts,
				},
				true,
			);
			setTeams(builderTeamsFromDrafts(drafts, playersPerTeam));
			setTeamsError(null);
		} catch {
			setTeamsError(EVENT_TEAM_MESSAGE.drawFailed);
		} finally {
			drawWorkerRef.current?.terminate();
			drawWorkerRef.current = null;
			setIsDrawing(false);
		}
	}

	async function handleShareTeams(teams: EventTeamBuilderTeam[]) {
		setIsSharing(true);
		setTeamsError(null);
		try {
			await shareEventTeamsImage(
				eventTeamsShareCards(teams, presentPlayers),
				ceiling,
				{ championshipName, startsAt },
			);
		} catch {
			setTeamsError(EVENT_TEAM_SHARE_LABEL.shareFailed);
		} finally {
			setIsSharing(false);
		}
	}

	function requestDrawTeams(
		teams: EventTeamBuilderTeam[],
		setTeams: (teams: EventTeamBuilderTeam[]) => void,
	) {
		if (!builderTeamsHavePlayers(teams)) {
			void handleDrawTeams(setTeams);
			return;
		}

		drawSetTeamsRef.current = setTeams;
		setDrawConfirmOpen(true);
	}

	function confirmDrawTeams() {
		const setTeams = drawSetTeamsRef.current;
		drawSetTeamsRef.current = null;
		setDrawConfirmOpen(false);
		if (!setTeams) {
			return;
		}

		void handleDrawTeams(setTeams);
	}

	function cancelDrawTeams() {
		drawSetTeamsRef.current = null;
		setDrawConfirmOpen(false);
	}

	return (
		<>
			{isDrawing && (
				<AppDialog onClose={() => undefined}>
					<div
						className={`${MODAL_CLASS} max-w-sm text-center`}
						role="status"
						aria-live="polite"
					>
						<LoaderCircle
							className="mx-auto size-8 animate-spin text-pitch"
							aria-hidden
						/>
						<p className="mt-3 text-sm font-medium text-fg">
							{EVENT_TEAM_MESSAGE.drawing}
						</p>
					</div>
				</AppDialog>
			)}
			{drawConfirmOpen && (
				<AppDialog onClose={cancelDrawTeams}>
					<div className={MODAL_CLASS}>
						<p className="mb-1 text-sm font-medium tracking-tight text-fg">
							{EVENT_TEAM_MESSAGE.drawReplaceTitle}
						</p>
						<p className="mb-3 text-sm text-fg-muted">
							{EVENT_TEAM_MESSAGE.drawReplaceHint}
						</p>
						<div className="mt-4 flex justify-end gap-2">
							<Button
								variant={BUTTON_VARIANT.secondary}
								onClick={cancelDrawTeams}
							>
								{EVENT_TEAM_MESSAGE.drawReplaceCancel}
							</Button>
							<Button onClick={confirmDrawTeams}>
								{EVENT_ACTION.drawTeams}
							</Button>
						</div>
					</div>
				</AppDialog>
			)}
			<Formik<EventBuilderValues>
				initialValues={{ teams: teamsStart }}
				onSubmit={async (values, helpers) => {
					if (step === EVENT_BUILDER_STEP.attendance) {
						tryGoToTeams(values.teams, (teams) => {
							helpers.setFieldValue("teams", teams);
						});
						return;
					}

					const drafts = values.teams
						.map((team) => ({
							color: team.color,
							playerIds: teamSlotsToPlayerIds(team.slots),
							goalkeeperId: Number(team.slots[0]),
							isActive: true,
						}))
						.filter((team) => team.playerIds.length > 0);
					const attendanceInvalid = validateEventAttendance(
						presentIds,
						rosterIds,
					);
					if (attendanceInvalid) {
						setAttendanceError(attendanceInvalid);
						onStepChange(EVENT_BUILDER_STEP.attendance);
						return;
					}

					const teamsInvalid =
						validateEventTeams(drafts, playersPerTeam) ??
						validateTeamsInAttendance(drafts, presentIds);
					if (teamsInvalid) {
						setTeamsError(teamsInvalid);
						return;
					}

					await onSubmit({
						presentPlayerIds: presentIds,
						goalkeeperPlayerIds: presentGoalkeeperIds,
						teams: drafts,
					});
				}}
			>
				{({ values, setFieldValue }) => {
					const usedColors = values.teams.flatMap((team) =>
						usedEventTeamColors(team.color),
					);
					function slotPool(teamIndex: number, slot: number) {
						return eventTeamSlotPool(
							presentPlayers,
							values.teams,
							teamIndex,
							slot,
						);
					}

					function handleColorChange(teamIndex: number, color: string | null) {
						if (color === null) {
							setFieldValue(`teams.${teamIndex}.color`, null);
							setTeamsError(null);
							return;
						}

						const next = normalizeEventTeamColor(color);
						if (next === null || !isEventTeamColor(next)) {
							return;
						}

						const taken = usedColors.includes(next);
						if (taken && values.teams[teamIndex]?.color !== next) {
							return;
						}

						setFieldValue(`teams.${teamIndex}.color`, next);
						setTeamsError(null);
					}

					function handleTabChange(next: EventBuilderStep) {
						if (next === step) {
							return;
						}

						switch (next) {
							case EVENT_BUILDER_STEP.attendance:
								onStepChange(next);
								return;
							case EVENT_BUILDER_STEP.teams:
								tryGoToTeams(values.teams, (teams) => {
									setFieldValue("teams", teams);
								});
								return;
							default: {
								const _never: never = next;
								return _never;
							}
						}
					}

					return (
						<Form className="space-y-4">
							<Tabs
								value={step}
								items={EVENT_BUILDER_TABS}
								onChange={handleTabChange}
							/>
							{step === EVENT_BUILDER_STEP.attendance && (
								<div className="space-y-4 pb-24 md:pb-0">
									<p className="text-sm font-medium text-fg">Presentes</p>
									<EventAttendanceTable
										players={players}
										attendanceCounts={attendanceCounts}
										presentIds={presentIds}
										goalkeeperIds={goalkeeperIds}
										onSetPresent={handleSetPresent}
										onSetGoalkeeper={handleSetGoalkeeper}
										onSeedAttendance={handlerWhenAllowed(
											seedEvents.length > 0,
											handleSeedAttendance,
										)}
										isAddingPlayer={isAddingPlayer}
										addPlayerError={addPlayerError}
										onAddPlayer={handlerWhenAllowed(
											onAddPlayer,
											handleAddPlayer,
										)}
									/>
									{attendanceError && (
										<p className={ERROR_CLASS}>{attendanceError}</p>
									)}
									<div className="flex justify-end gap-2">
										{onCancel && (
											<Button
												variant={BUTTON_VARIANT.secondary}
												onClick={onCancel}
												disabled={isPending}
											>
												Cancelar
											</Button>
										)}
										<Button type="submit" className="hidden md:inline-flex">
											{EVENT_ACTION.continue}
										</Button>
									</div>
									<AttendanceFloatingSave
										selected={presentIds.length}
										total={players.length}
										disabled={isPending}
										type="submit"
									>
										{EVENT_ACTION.continue}
									</AttendanceFloatingSave>
								</div>
							)}
							{step === EVENT_BUILDER_STEP.teams && (
								<FieldArray name="teams">
									{({ push, remove }) => (
										<>
											<p className="text-sm text-fg-muted">
												Até {playersPerTeam} jogadores por time. Só quem está
												presente.
											</p>
											<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
												{values.teams.map((team, teamIndex) => {
													const isCustom =
														team.color !== null &&
														!EVENT_TEAM_COLORS.some(
															(color) => color === team.color,
														);
													const cardStyle = eventTeamColorStyle(team.color);
													const slotIndexes = Array.from(
														{ length: playersPerTeam },
														(_, slot) => slot,
													);

													return (
														<article
															key={team.key}
															className="relative min-w-0 space-y-2 rounded-lg border border-line bg-surface p-2"
															style={cardStyle}
														>
															<EventTeamColorDot color={team.color} />
															<div className="flex min-w-0 items-center gap-2">
																<div className="min-w-0 flex-1 space-y-1">
																	<div className="flex min-w-0 flex-wrap items-center gap-1">
																		<EventTeamColorNoneButton
																			selected={team.color === null}
																			onSelect={() =>
																				handleColorChange(teamIndex, null)
																			}
																		/>
																		{EVENT_TEAM_COLORS.map((color) => {
																			const taken =
																				usedColors.includes(color) &&
																				color !== team.color;
																			const selected = team.color === color;

																			return (
																				<button
																					key={color}
																					type="button"
																					disabled={taken}
																					aria-label={
																						EVENT_TEAM_COLOR_LABEL[color] ??
																						color
																					}
																					aria-pressed={selected}
																					onClick={() =>
																						handleColorChange(teamIndex, color)
																					}
																					className={`size-5 rounded-md border-2 disabled:opacity-30 ${selected ? "border-current" : "border-black/20"}`}
																					style={{ backgroundColor: color }}
																				/>
																			);
																		})}
																		<label className="relative size-5 shrink-0">
																			<input
																				type="color"
																				value={
																					team.color ?? EVENT_TEAM_COLOR.white
																				}
																				aria-label={
																					EVENT_TEAM_COLOR_CUSTOM_LABEL
																				}
																				onChange={(event) => {
																					handleColorChange(
																						teamIndex,
																						event.target.value,
																					);
																				}}
																				className="absolute inset-0 cursor-pointer opacity-0"
																			/>
																			<span
																				aria-hidden
																				className={`block size-5 rounded-md border-2 ${isCustom ? "border-current" : "border-black/20"}`}
																				style={eventTeamCustomColorPreview(
																					isCustom,
																					team.color,
																				)}
																			/>
																		</label>
																	</div>
																</div>
																{values.teams.length >
																	CHAMPIONSHIP_EVENT.minTeams && (
																	<EventTeamRemoveButton
																		label="Remover time"
																		color={cardStyle.color ?? "currentColor"}
																		iconClassName="size-4"
																		onClick={() => {
																			remove(teamIndex);
																			setTeamsError(null);
																		}}
																	/>
																)}
															</div>
															<ul className="space-y-1">
																{slotIndexes.map((slot) => {
																	const slotValue = team.slots[slot] ?? "";
																	const player = presentPlayers.find(
																		(item) => String(item.id) === slotValue,
																	);

																	const available = slotPool(teamIndex, slot);

																	return (
																		<li
																			key={`${team.key}-slot-${slot}`}
																			className={EVENT_TEAM_PLAYER_SLOT_CLASS}
																		>
																			<span
																				className={`${EVENT_TEAM_POSITION_CHIP_CLASS} shrink-0`}
																			>
																				{
																					EVENT_TEAM_POSITION_LABEL[
																						eventTeamSlotPosition(slot)
																					]
																				}
																			</span>
																			{player && (
																				<EventTeamPlayerRow
																					player={player}
																					ceiling={ceiling}
																					isGoalkeeperVolunteer={
																						slot !== 0 &&
																						goalkeeperIds.includes(player.id)
																					}
																					onRemove={() => {
																						setFieldValue(
																							`teams.${teamIndex}.slots.${slot}`,
																							"",
																						);
																						setTeamsError(null);
																					}}
																				/>
																			)}
																			{!player && (
																				<Field
																					as="select"
																					name={`teams.${teamIndex}.slots.${slot}`}
																					disabled={available.length === 0}
																					className={`${FIELD_CLASS} relative z-10 min-w-0 flex-1`}
																				>
																					<option value="">
																						Adicionar jogador
																					</option>
																					{available.map((item) => (
																						<option
																							key={item.id}
																							value={String(item.id)}
																						>
																							{eventTeamPlayerOptionLabel(
																								playerVisibleName(item),
																								goalkeeperIds.includes(item.id),
																							)}
																						</option>
																					))}
																				</Field>
																			)}
																		</li>
																	);
																})}
															</ul>
															<EventTeamRatingAverage
																ratings={teamSlotsToPlayerIds(
																	team.slots,
																).flatMap((playerId) => {
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
													);
												})}
											</div>
											<div className="flex flex-wrap gap-2">
												{values.teams.length < presentPlayers.length && (
													<Button
														variant={BUTTON_VARIANT.secondary}
														onClick={() => {
															push({
																key: `team-${Date.now()}`,
																color: EVENT_TEAM_COLOR_NONE,
																slots: emptyTeamSlots(playersPerTeam),
																isActive: true,
															});
															setTeamsError(null);
														}}
													>
														<Plus className="size-4" />
														Adicionar time
													</Button>
												)}
												<Button
													variant={BUTTON_VARIANT.secondary}
													disabled={isPending || isDrawing || isSharing}
													onClick={() => {
														requestDrawTeams(values.teams, (teams) => {
															setFieldValue("teams", teams);
														});
													}}
												>
													<Shuffle className="size-4" />
													{EVENT_ACTION.drawTeams}
												</Button>
												{builderTeamsHavePlayers(values.teams) && (
													<Button
														variant={BUTTON_VARIANT.secondary}
														disabled={isPending || isDrawing || isSharing}
														onClick={() => {
															void handleShareTeams(values.teams);
														}}
													>
														{isSharing && (
															<LoaderCircle
																className="size-4 animate-spin"
																aria-hidden
															/>
														)}
														{!isSharing && <Share2 className="size-4" />}
														{isSharing && EVENT_TEAM_SHARE_LABEL.sharing}
														{!isSharing && EVENT_TEAM_SHARE_LABEL.shareTeams}
													</Button>
												)}
											</div>
											{teamsError && (
												<p className={ERROR_CLASS}>{teamsError}</p>
											)}
											{errorMessage && (
												<p className={ERROR_CLASS}>{errorMessage}</p>
											)}
											<div className="flex justify-end gap-2">
												<Button
													variant={BUTTON_VARIANT.secondary}
													onClick={handleBackToAttendance}
													disabled={isPending}
												>
													Voltar
												</Button>
												<Button type="submit" disabled={isPending}>
													{EVENT_ACTION.saveTeams}
												</Button>
											</div>
										</>
									)}
								</FieldArray>
							)}
						</Form>
					);
				}}
			</Formik>
		</>
	);
}
