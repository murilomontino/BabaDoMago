import { Field, FieldArray, Form, Formik } from "formik";
import { Link2, LoaderCircle, Plus, Share2, Shuffle } from "lucide-react";
import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import { EventAttendanceTable } from "@/components/event-attendance-table";
import { EventTeamDrawLog } from "@/components/event-team-draw-log";
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
	builderTeamsHavePlayers,
	CHAMPIONSHIP_EVENT,
	EVENT_ACTION,
	EVENT_BUILDER_STEP,
	EVENT_BUILDER_TABS,
	EVENT_TEAM_MESSAGE,
	EVENT_TEAM_POSITION_LABEL,
	type EventBuilderStep,
	type EventTeamBuilderTeam,
	type EventTeamDraft,
	emptyTeamSlots,
	eventDrawInputRating,
	eventTeamCount,
	eventTeamHighestSumFlags,
	eventTeamPlayerOptionLabel,
	eventTeamSlotPool,
	eventTeamSlotPosition,
	initialBuilderTeams,
	teamSlotsToPlayerIds,
	validateEventAttendance,
	validateEventTeams,
	validateTeamsInAttendance,
} from "@/const/championship-event";
import { copyDrawLinkLabel } from "@/const/event-draw-reveal";
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
} from "@/const/event-team-share";
import { playerVisibleName } from "@/const/player-name";
import { championshipRatingCeiling } from "@/const/player-rating";
import { ROUTES } from "@/const/routes";
import {
	BUTTON_VARIANT,
	ERROR_CLASS,
	FIELD_CLASS,
	MODAL_CLASS,
} from "@/const/ui";
import { handlerWhenAllowed } from "@/lib/handler-when-allowed";
import { useEventBuilderUi } from "@/hooks/use-event-builder-ui";
import type { ChampionshipPlayer } from "@/types/championship";

type EventBuilderValues = {
	teams: EventTeamBuilderTeam[];
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
	championshipId: number;
	eventId: number;
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
	onSaveAttendance: (
		presentPlayerIds: number[],
		goalkeeperPlayerIds: number[],
	) => Promise<void>;
	onSubmit: (
		values: {
			presentPlayerIds: number[];
			goalkeeperPlayerIds: number[];
			teams: EventTeamDraft[];
			isDraw?: boolean;
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
	championshipId,
	eventId,
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
	onSaveAttendance,
	onSubmit,
}: ChampionshipEventBuilderProps) {
	const ui = useEventBuilderUi({
		playersPerTeam,
		players,
		seedEvents,
		startsAt,
		championshipName,
		championshipId,
		eventId,
		initialPresentIds,
		initialGoalkeeperIds,
		isPending,
		onStepChange,
		onPresentIdsChange,
		onAddPlayer,
		onSaveAttendance,
		onSubmit,
	});
	const rosterIds = players.map((player) => player.id);
	const ceiling = championshipRatingCeiling(
		players.flatMap((player) => [player.rating, player.goalkeeper_rating]),
	);
	const presentRatings = ui.presentPlayers.map((player) =>
		eventDrawInputRating(player, ui.goalkeeperIds.includes(player.id)),
	);
	const teamsStart =
		initialTeams ??
		initialBuilderTeams(
			playersPerTeam,
			eventTeamCount(initialPresentIds.length, playersPerTeam),
		);

	function handleSetPresent(playerIds: readonly number[], present: boolean) {
		ui.handleSetPresent(playerIds, present);
	}

	function handleSeedAttendance(mode: AttendanceSeedMode) {
		ui.handleSeedAttendance(mode);
	}

	function handleSetGoalkeeper(
		playerIds: readonly number[],
		asGoalkeeper: boolean,
	) {
		ui.handleSetGoalkeeper(playerIds, asGoalkeeper);
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
		ui.handleSetPresent(createdIds, true);
		if (values.isGoalkeeper) {
			ui.handleSetGoalkeeper(createdIds, true);
		}
		return created;
	}

	function handleBackToAttendance() {
		onStepChange(EVENT_BUILDER_STEP.attendance);
	}

	async function handleShareTeams(teams: EventTeamBuilderTeam[]) {
		await ui.handleShareTeams(teams);
	}

	async function handleCopyDrawLink() {
		await ui.handleCopyDrawLink();
	}

	function requestDrawTeams(
		teams: EventTeamBuilderTeam[],
		setTeams: (teams: EventTeamBuilderTeam[]) => void,
	) {
		ui.requestDrawTeams(teams, setTeams);
	}

	function confirmDrawTeams() {
		ui.confirmDrawTeams();
	}

	function cancelDrawTeams() {
		ui.cancelDrawTeams();
	}

	return (
		<>
			{ui.isDrawing && (
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
			{ui.drawConfirmOpen && (
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
						ui.tryGoToTeams(values.teams, (teams) => {
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
						ui.presentIds,
						rosterIds,
					);
					if (attendanceInvalid) {
						ui.setAttendanceError(attendanceInvalid);
						onStepChange(EVENT_BUILDER_STEP.attendance);
						return;
					}

					const teamsInvalid =
						validateEventTeams(drafts, playersPerTeam) ??
						validateTeamsInAttendance(drafts, ui.presentIds);
					if (teamsInvalid) {
						ui.setTeamsError(teamsInvalid);
						return;
					}

					await onSubmit({
						presentPlayerIds: ui.presentIds,
						goalkeeperPlayerIds: ui.presentGoalkeeperIds,
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
							ui.presentPlayers,
							values.teams,
							teamIndex,
							slot,
						);
					}

					function handleColorChange(teamIndex: number, color: string | null) {
						if (color === null) {
							setFieldValue(`teams.${teamIndex}.color`, null);
							ui.clearTeamsError();
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
						ui.clearTeamsError();
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
								ui.tryGoToTeams(values.teams, (teams) => {
									setFieldValue("teams", teams);
								});
								return;
							default: {
								const _never: never = next;
								return _never;
							}
						}
					}

					function openCeremony() {
						void ui.openDrawCeremony(ROUTES.championshipEventDraw);
					}

					function openPotCeremony() {
						void ui.openDrawCeremony(ROUTES.championshipEventPotDraw);
					}

					return (
						<Form className="space-y-4">
							<Tabs
								value={step}
								items={EVENT_BUILDER_TABS}
								onChange={handleTabChange}
							/>
							{step === EVENT_BUILDER_STEP.attendance && (
								<div className="space-y-4 pb-36 md:pb-0">
									<p className="text-sm font-medium text-fg">Presentes</p>
									<EventAttendanceTable
										players={players}
										attendanceCounts={attendanceCounts}
										presentIds={ui.presentIds}
										goalkeeperIds={ui.goalkeeperIds}
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
									{ui.attendanceError && (
										<p className={ERROR_CLASS}>{ui.attendanceError}</p>
									)}
									{ui.teamsError && <p className={ERROR_CLASS}>{ui.teamsError}</p>}
									<div className="flex justify-end gap-2">
										{onCancel && (
											<Button
												variant={BUTTON_VARIANT.secondary}
												onClick={onCancel}
												disabled={ui.busy}
											>
												Cancelar
											</Button>
										)}
										<span className="hidden md:inline-flex">
											<Button type="submit" disabled={ui.busy}>
												{EVENT_ACTION.continue}
											</Button>
										</span>
										<span className="hidden md:inline-flex">
											<Button disabled={ui.busy} onClick={openCeremony}>
												{EVENT_ACTION.openDraw}
											</Button>
										</span>
										<span className="hidden md:inline-flex">
											<Button
												variant={BUTTON_VARIANT.secondary}
												disabled={ui.busy}
												onClick={openPotCeremony}
											>
												{EVENT_ACTION.openPotDraw}
											</Button>
										</span>
									</div>
									<AttendanceFloatingSave
										selected={ui.presentIds.length}
										total={players.length}
										disabled={ui.busy}
										type="button"
										onClick={openCeremony}
										secondary={
											<>
												<Button
													type="submit"
													variant={BUTTON_VARIANT.secondary}
													disabled={ui.busy}
													className="shadow-md"
												>
													{EVENT_ACTION.continue}
												</Button>
												<Button
													type="button"
													variant={BUTTON_VARIANT.secondary}
												disabled={ui.busy}
													className="shadow-md"
													onClick={openPotCeremony}
												>
													{EVENT_ACTION.openPotDraw}
												</Button>
											</>
										}
									>
										{EVENT_ACTION.openDraw}
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
													const teamRatingsLists = values.teams.map((item) =>
														teamSlotsToPlayerIds(item.slots).flatMap(
															(playerId) => {
																const player = ui.presentPlayers.find(
																	(entry) => entry.id === playerId,
																);
																if (!player) {
																	return [];
																}

																return [
																	eventDrawInputRating(
																		player,
																		ui.goalkeeperIds.includes(playerId),
																	),
																];
															},
														),
													);
													const highestSumFlags = eventTeamHighestSumFlags(
														teamRatingsLists,
														presentRatings,
													);
													const ratings = teamRatingsLists[teamIndex] ?? [];

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
																			ui.clearTeamsError();
																		}}
																	/>
																)}
															</div>
															<ul className="space-y-1">
																{slotIndexes.map((slot) => {
																	const slotValue = team.slots[slot] ?? "";
																	const player = ui.presentPlayers.find(
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
																				isGoalkeeperVolunteer={ui.goalkeeperIds.includes(
																						player.id,
																					)}
																					onRemove={() => {
																						setFieldValue(
																							`teams.${teamIndex}.slots.${slot}`,
																							"",
																						);
																						ui.clearTeamsError();
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
																								ui.goalkeeperIds.includes(item.id),
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
																ratings={ratings}
																presentRatings={presentRatings}
																isHighestSum={
																	highestSumFlags[teamIndex] === true
																}
															/>
														</article>
													);
												})}
											</div>
											<div className="flex flex-wrap gap-2">
												{values.teams.length < ui.presentPlayers.length && (
													<Button
														variant={BUTTON_VARIANT.secondary}
														onClick={() => {
															push({
																key: `team-${Date.now()}`,
																color: EVENT_TEAM_COLOR_NONE,
																slots: emptyTeamSlots(playersPerTeam),
																isActive: true,
															});
															ui.clearTeamsError();
														}}
													>
														<Plus className="size-4" />
														Adicionar time
													</Button>
												)}
												<Button
													variant={BUTTON_VARIANT.secondary}
													disabled={ui.busy || ui.isSharing}
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
														disabled={ui.busy || ui.isSharing}
														onClick={() => {
															void handleShareTeams(values.teams);
														}}
													>
														{ui.isSharing && (
															<LoaderCircle
																className="size-4 animate-spin"
																aria-hidden
															/>
														)}
														{!ui.isSharing && <Share2 className="size-4" />}
														{ui.isSharing && EVENT_TEAM_SHARE_LABEL.sharing}
														{!ui.isSharing && EVENT_TEAM_SHARE_LABEL.shareTeams}
													</Button>
												)}
												{builderTeamsHavePlayers(values.teams) && (
													<Button
														variant={BUTTON_VARIANT.secondary}
														disabled={ui.busy}
														onClick={() => {
															void handleCopyDrawLink();
														}}
													>
														<Link2 className="size-4" />
														{copyDrawLinkLabel(ui.copiedDrawLink)}
													</Button>
												)}
											</div>
											<EventTeamDrawLog
												championshipId={championshipId}
												eventId={eventId}
											/>
											{ui.teamsError && (
												<p className={ERROR_CLASS}>{ui.teamsError}</p>
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
