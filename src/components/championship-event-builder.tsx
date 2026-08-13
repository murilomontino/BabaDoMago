import { Field, Form, Formik } from "formik";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/button";
import { EventAttendanceTable } from "@/components/event-attendance-table";
import { FormError } from "@/components/form-error";
import {
	applyVisibleAttendance,
	CHAMPIONSHIP_EVENT,
	championshipEventToday,
	EVENT_BUILDER_STEP,
	type EventBuilderStep,
	type EventTeamDraft,
	unusedEventTeamColor,
	validateEventAttendance,
	validateEventTeams,
	validateTeamsInAttendance,
} from "@/const/championship-event";
import {
	EVENT_TEAM_COLOR_CLASS,
	EVENT_TEAM_COLOR_LABEL,
	EVENT_TEAM_COLORS,
	type EventTeamColor,
	isEventTeamColor,
} from "@/const/event-team-color";
import { startEventFormSchema } from "@/const/form-schema";
import { playerVisibleName } from "@/const/player-name";
import { BUTTON_VARIANT, ERROR_CLASS, FIELD_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";

type BuilderTeam = EventTeamDraft & { key: string };

type ChampionshipEventBuilderProps = {
	eventTime: string;
	playersPerTeam: number;
	players: ChampionshipPlayer[];
	attendanceCounts: ReadonlyMap<number, number>;
	isPending: boolean;
	errorMessage: string | null;
	onCancel: () => void;
	onSubmit: (values: {
		eventDate: string;
		presentPlayerIds: number[];
		teams: EventTeamDraft[];
	}) => Promise<void>;
};

function initialTeams(): BuilderTeam[] {
	return [
		{ key: "team-0", color: EVENT_TEAM_COLORS[0], playerIds: [] },
		{ key: "team-1", color: EVENT_TEAM_COLORS[1], playerIds: [] },
	];
}

export function ChampionshipEventBuilder({
	eventTime,
	playersPerTeam,
	players,
	attendanceCounts,
	isPending,
	errorMessage,
	onCancel,
	onSubmit,
}: ChampionshipEventBuilderProps) {
	const [step, setStep] = useState<EventBuilderStep>(
		EVENT_BUILDER_STEP.attendance,
	);
	const [presentIds, setPresentIds] = useState<number[]>([]);
	const [attendanceError, setAttendanceError] = useState<string | null>(null);
	const [teams, setTeams] = useState<BuilderTeam[]>(initialTeams);
	const [teamsError, setTeamsError] = useState<string | null>(null);
	const [nextKey, setNextKey] = useState(2);
	const rosterIds = players.map((player) => player.id);
	const usedColors = teams.map((team) => team.color);
	const nextColor = unusedEventTeamColor(usedColors);
	const assignedIds = new Set(teams.flatMap((team) => team.playerIds));
	const presentPlayers = players.filter((player) =>
		presentIds.includes(player.id),
	);
	const pool = presentPlayers.filter((player) => !assignedIds.has(player.id));

	function handleSetPresent(playerIds: readonly number[], present: boolean) {
		setPresentIds((current) =>
			applyVisibleAttendance(current, playerIds, present),
		);
		setAttendanceError(null);
	}

	function handleContinueToTeams() {
		const invalid = validateEventAttendance(presentIds, rosterIds);
		if (invalid) {
			setAttendanceError(invalid);
			return;
		}

		const present = new Set(presentIds);
		setTeams((current) =>
			current.map((team) => ({
				...team,
				playerIds: team.playerIds.filter((id) => present.has(id)),
			})),
		);
		setTeamsError(null);
		setStep(EVENT_BUILDER_STEP.teams);
	}

	function handleBackToAttendance() {
		setStep(EVENT_BUILDER_STEP.attendance);
	}

	function handleAddTeam() {
		if (!nextColor) {
			return;
		}

		setTeams((current) => [
			...current,
			{ key: `team-${nextKey}`, color: nextColor, playerIds: [] },
		]);
		setNextKey((value) => value + 1);
		setTeamsError(null);
	}

	function handleRemoveTeam(key: string) {
		if (teams.length <= CHAMPIONSHIP_EVENT.minTeams) {
			return;
		}

		setTeams((current) => current.filter((team) => team.key !== key));
		setTeamsError(null);
	}

	function handleColorChange(key: string, color: EventTeamColor) {
		setTeams((current) =>
			current.map((team) => (team.key === key ? { ...team, color } : team)),
		);
		setTeamsError(null);
	}

	function handleAddPlayer(key: string, playerId: number) {
		if (!Number.isFinite(playerId)) {
			return;
		}

		setTeams((current) =>
			current.map((team) => {
				if (team.key !== key) {
					return team;
				}

				if (team.playerIds.length >= playersPerTeam) {
					return team;
				}

				if (team.playerIds.includes(playerId)) {
					return team;
				}

				return { ...team, playerIds: [...team.playerIds, playerId] };
			}),
		);
		setTeamsError(null);
	}

	function handleRemovePlayer(key: string, playerId: number) {
		setTeams((current) =>
			current.map((team) =>
				team.key === key
					? {
							...team,
							playerIds: team.playerIds.filter((id) => id !== playerId),
						}
					: team,
			),
		);
		setTeamsError(null);
	}

	return (
		<Formik
			initialValues={{ eventDate: championshipEventToday() }}
			validationSchema={startEventFormSchema}
			onSubmit={async (values) => {
				if (step === EVENT_BUILDER_STEP.attendance) {
					handleContinueToTeams();
					return;
				}

				const drafts = teams.map(({ color, playerIds }) => ({
					color,
					playerIds,
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
					eventDate: values.eventDate,
					presentPlayerIds: presentIds,
					teams: drafts,
				});
			}}
		>
			<Form className="space-y-4">
				{step === EVENT_BUILDER_STEP.attendance && (
					<>
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
							<Button
								variant={BUTTON_VARIANT.secondary}
								onClick={onCancel}
								disabled={isPending}
							>
								Cancelar
							</Button>
							<Button type="button" onClick={handleContinueToTeams}>
								Continuar
							</Button>
						</div>
					</>
				)}
				{step === EVENT_BUILDER_STEP.teams && (
					<>
						<p className="text-sm text-fg-muted">
							Até {playersPerTeam} jogadores por time. Só quem está presente.
						</p>
						<div className="grid gap-3 md:grid-cols-2">
							{teams.map((team) => (
								<article
									key={team.key}
									className="space-y-3 rounded-lg border border-line p-3"
								>
									<div className="flex items-center gap-2">
										<span
											className={`inline-block size-3 rounded-full ${EVENT_TEAM_COLOR_CLASS[team.color]}`}
										/>
										<select
											value={team.color}
											onChange={(event) => {
												const color = event.target.value;
												if (!isEventTeamColor(color)) {
													return;
												}

												handleColorChange(team.key, color);
											}}
											className={`min-w-0 flex-1 ${FIELD_CLASS}`}
										>
											{EVENT_TEAM_COLORS.filter(
												(color) =>
													color === team.color || !usedColors.includes(color),
											).map((color) => (
												<option key={color} value={color}>
													{EVENT_TEAM_COLOR_LABEL[color]}
												</option>
											))}
										</select>
										{teams.length > CHAMPIONSHIP_EVENT.minTeams && (
											<Button
												variant={BUTTON_VARIANT.ghost}
												aria-label="Remover time"
												className="px-2"
												onClick={() => handleRemoveTeam(team.key)}
											>
												<X className="size-4" />
											</Button>
										)}
									</div>
									<ul className="space-y-1">
										{team.playerIds.map((playerId) => {
											const player = presentPlayers.find(
												(item) => item.id === playerId,
											);
											if (!player) {
												return null;
											}

											return (
												<li
													key={playerId}
													className="flex items-center justify-between gap-2 text-sm text-fg"
												>
													{playerVisibleName(player)}
													<Button
														variant={BUTTON_VARIANT.ghost}
														aria-label={`Remover ${playerVisibleName(player)}`}
														className="px-2"
														onClick={() =>
															handleRemovePlayer(team.key, playerId)
														}
													>
														<X className="size-3.5" />
													</Button>
												</li>
											);
										})}
									</ul>
									{team.playerIds.length < playersPerTeam &&
										pool.length > 0 && (
											<select
												value=""
												onChange={(event) => {
													handleAddPlayer(team.key, Number(event.target.value));
													event.target.value = "";
												}}
												className={FIELD_CLASS}
											>
												<option value="">Adicionar jogador</option>
												{pool.map((player) => (
													<option key={player.id} value={player.id}>
														{playerVisibleName(player)}
													</option>
												))}
											</select>
										)}
									<p className="text-xs text-fg-muted">
										{team.playerIds.length}/{playersPerTeam}
									</p>
								</article>
							))}
						</div>
						{nextColor && (
							<Button
								variant={BUTTON_VARIANT.secondary}
								onClick={handleAddTeam}
							>
								<Plus className="size-4" />
								Adicionar time
							</Button>
						)}
						{teamsError && <p className={ERROR_CLASS}>{teamsError}</p>}
						{errorMessage && <p className={ERROR_CLASS}>{errorMessage}</p>}
						<div className="flex justify-end gap-2">
							<Button
								variant={BUTTON_VARIANT.secondary}
								onClick={handleBackToAttendance}
								disabled={isPending}
							>
								Voltar
							</Button>
							<Button type="submit" disabled={isPending}>
								Iniciar evento
							</Button>
						</div>
					</>
				)}
			</Form>
		</Formik>
	);
}
