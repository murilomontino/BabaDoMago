import { Field, FieldArray, Form, Formik } from "formik";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/button";
import { EventAttendanceTable } from "@/components/event-attendance-table";
import {
	EventTeamColorDot,
	EventTeamPlayerRow,
	EventTeamRemoveButton,
} from "@/components/event-team-player";
import {
	applyVisibleAttendance,
	CHAMPIONSHIP_EVENT,
	EVENT_ACTION,
	EVENT_BUILDER_STEP,
	EVENT_TEAM_POSITION_LABEL,
	type EventBuilderStep,
	type EventTeamBuilderTeam,
	type EventTeamDraft,
	emptyTeamSlots,
	eventTeamCount,
	eventTeamSlotPosition,
	initialBuilderTeams,
	resizeBuilderTeams,
	teamSlotsToPlayerIds,
	unusedEventTeamColor,
	validateEventAttendance,
	validateEventTeams,
	validateTeamsInAttendance,
} from "@/const/championship-event";
import {
	EVENT_TEAM_COLOR,
	EVENT_TEAM_COLOR_CUSTOM_LABEL,
	EVENT_TEAM_COLOR_LABEL,
	EVENT_TEAM_COLORS,
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
} from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";

type EventBuilderValues = {
	teams: EventTeamBuilderTeam[];
};

type ChampionshipEventBuilderProps = {
	playersPerTeam: number;
	players: ChampionshipPlayer[];
	attendanceCounts: ReadonlyMap<number, number>;
	initialPresentIds?: readonly number[];
	initialTeams?: EventTeamBuilderTeam[];
	isPending: boolean;
	errorMessage: string | null;
	onCancel?: () => void;
	onPresentIdsChange?: (playerIds: readonly number[]) => void;
	onSubmit: (values: {
		presentPlayerIds: number[];
		teams: EventTeamDraft[];
	}) => Promise<void>;
};

export function ChampionshipEventBuilder({
	playersPerTeam,
	players,
	attendanceCounts,
	initialPresentIds = [],
	initialTeams,
	isPending,
	errorMessage,
	onCancel,
	onPresentIdsChange,
	onSubmit,
}: ChampionshipEventBuilderProps) {
	const [step, setStep] = useState<EventBuilderStep>(
		EVENT_BUILDER_STEP.attendance,
	);
	const [presentIds, setPresentIds] = useState<number[]>([
		...initialPresentIds,
	]);
	const [attendanceError, setAttendanceError] = useState<string | null>(null);
	const [teamsError, setTeamsError] = useState<string | null>(null);
	const rosterIds = players.map((player) => player.id);
	const ceiling = championshipRatingCeiling(
		players.map((player) => player.rating),
	);
	const presentPlayers = players.filter((player) =>
		presentIds.includes(player.id),
	);
	const teamsStart =
		initialTeams ??
		initialBuilderTeams(
			playersPerTeam,
			eventTeamCount(initialPresentIds.length, playersPerTeam),
		);

	function handleSetPresent(playerIds: readonly number[], present: boolean) {
		setPresentIds((current) => {
			const next = applyVisibleAttendance(current, playerIds, present);
			onPresentIdsChange?.(next);
			return next;
		});
		setAttendanceError(null);
	}

	function handleBackToAttendance() {
		setStep(EVENT_BUILDER_STEP.attendance);
	}

	return (
		<Formik<EventBuilderValues>
			initialValues={{ teams: teamsStart }}
			onSubmit={async (values, helpers) => {
				if (step === EVENT_BUILDER_STEP.attendance) {
					const invalid = validateEventAttendance(presentIds, rosterIds);
					if (invalid) {
						setAttendanceError(invalid);
						return;
					}

					const present = new Set(presentIds);
					helpers.setFieldValue(
						"teams",
						resizeBuilderTeams(
							values.teams,
							eventTeamCount(presentIds.length, playersPerTeam),
							playersPerTeam,
							present,
						),
					);
					setTeamsError(null);
					setStep(EVENT_BUILDER_STEP.teams);
					return;
				}

				const drafts = values.teams.map((team) => ({
					color: team.color,
					playerIds: teamSlotsToPlayerIds(team.slots),
					goalkeeperId: Number(team.slots[0]),
				}));
				const attendanceInvalid = validateEventAttendance(
					presentIds,
					rosterIds,
				);
				if (attendanceInvalid) {
					setAttendanceError(attendanceInvalid);
					setStep(EVENT_BUILDER_STEP.attendance);
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
					teams: drafts,
				});
			}}
		>
			{({ values, setFieldValue }) => {
				const usedColors = values.teams.map((team) => team.color);
				const nextColor = unusedEventTeamColor(usedColors);
				const assignedIds = new Set(
					values.teams.flatMap((team) => teamSlotsToPlayerIds(team.slots)),
				);
				const pool = presentPlayers.filter(
					(player) => !assignedIds.has(player.id),
				);

				function handleColorChange(teamIndex: number, color: string) {
					const next = normalizeEventTeamColor(color);
					if (!isEventTeamColor(next)) {
						return;
					}

					const taken = values.teams.some(
						(team, index) => index !== teamIndex && team.color === next,
					);
					if (taken) {
						return;
					}

					setFieldValue(`teams.${teamIndex}.color`, next);
					setTeamsError(null);
				}

				return (
					<Form className="space-y-4">
						{step === EVENT_BUILDER_STEP.attendance && (
							<>
								<p className="text-sm font-medium text-fg">Presentes</p>
								<EventAttendanceTable
									players={players}
									attendanceCounts={attendanceCounts}
									presentIds={presentIds}
									onSetPresent={handleSetPresent}
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
									<Button type="submit">Continuar</Button>
								</div>
							</>
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
												const isDefault = EVENT_TEAM_COLORS.some(
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
														className="relative space-y-2 rounded-lg border border-line p-2"
														style={cardStyle}
													>
														<EventTeamColorDot color={team.color} />
														<div className="flex items-center gap-2">
															<div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
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
																				EVENT_TEAM_COLOR_LABEL[color] ?? color
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
																		value={team.color}
																		aria-label={EVENT_TEAM_COLOR_CUSTOM_LABEL}
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
																		className={`block size-5 rounded-md border-2 ${isDefault ? "border-black/20" : "border-current"}`}
																		style={{
																			backgroundColor: isDefault
																				? "transparent"
																				: team.color,
																			backgroundImage: isDefault
																				? "conic-gradient(#dc2626, #facc15, #166534, #2563eb, #ec4899, #dc2626)"
																				: undefined,
																		}}
																	/>
																</label>
															</div>
															{values.teams.length >
																CHAMPIONSHIP_EVENT.minTeams && (
																<EventTeamRemoveButton
																	label="Remover time"
																	color={cardStyle.color}
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

																return (
																	<li
																		key={`${team.key}-slot-${slot}`}
																		className="flex min-h-7 items-center gap-1.5 rounded-md bg-white px-1.5 py-1"
																	>
																		<span className={`${CHIP_CLASS} shrink-0`}>
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
																				backgroundColor={EVENT_TEAM_COLOR.white}
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
																				disabled={pool.length === 0}
																				className={FIELD_CLASS}
																			>
																				<option value="">
																					Adicionar jogador
																				</option>
																				{pool.map((item) => (
																					<option
																						key={item.id}
																						value={String(item.id)}
																					>
																						{playerVisibleName(item)}
																					</option>
																				))}
																			</Field>
																		)}
																	</li>
																);
															})}
														</ul>
													</article>
												);
											})}
										</div>
										{values.teams.length < EVENT_TEAM_COLORS.length &&
											nextColor && (
												<Button
													variant={BUTTON_VARIANT.secondary}
													onClick={() => {
														push({
															key: `team-${Date.now()}`,
															color: nextColor,
															slots: emptyTeamSlots(playersPerTeam),
														});
														setTeamsError(null);
													}}
												>
													<Plus className="size-4" />
													Adicionar time
												</Button>
											)}
										{teamsError && <p className={ERROR_CLASS}>{teamsError}</p>}
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
	);
}
