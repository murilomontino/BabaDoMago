import { Field, Form, Formik } from "formik";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/button";
import { FormError } from "@/components/form-error";
import {
	CHAMPIONSHIP_EVENT,
	championshipEventToday,
	type EventTeamDraft,
	unusedEventTeamColor,
	validateEventTeams,
} from "@/const/championship-event";
import {
	EVENT_TEAM_COLOR_CLASS,
	EVENT_TEAM_COLOR_LABEL,
	EVENT_TEAM_COLORS,
	type EventTeamColor,
	isEventTeamColor,
} from "@/const/event-team-color";
import { startEventFormSchema } from "@/const/form-schema";
import { BUTTON_VARIANT, ERROR_CLASS, FIELD_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";

type BuilderTeam = EventTeamDraft & { key: string };

type ChampionshipEventBuilderProps = {
	eventTime: string;
	playersPerTeam: number;
	players: ChampionshipPlayer[];
	isPending: boolean;
	errorMessage: string | null;
	onCancel: () => void;
	onSubmit: (values: {
		eventDate: string;
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
	isPending,
	errorMessage,
	onCancel,
	onSubmit,
}: ChampionshipEventBuilderProps) {
	const [teams, setTeams] = useState<BuilderTeam[]>(initialTeams);
	const [teamsError, setTeamsError] = useState<string | null>(null);
	const [nextKey, setNextKey] = useState(2);
	const usedColors = teams.map((team) => team.color);
	const nextColor = unusedEventTeamColor(usedColors);
	const assignedIds = new Set(teams.flatMap((team) => team.playerIds));
	const pool = players.filter((player) => !assignedIds.has(player.id));

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
				const drafts = teams.map(({ color, playerIds }) => ({
					color,
					playerIds,
				}));
				const invalid = validateEventTeams(drafts, playersPerTeam);
				if (invalid) {
					setTeamsError(invalid);
					return;
				}

				await onSubmit({ eventDate: values.eventDate, teams: drafts });
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
				<p className="text-sm text-fg-muted">
					Até {playersPerTeam} jogadores por time.
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
									const player = players.find((item) => item.id === playerId);
									if (!player) {
										return null;
									}

									return (
										<li
											key={playerId}
											className="flex items-center justify-between gap-2 text-sm text-fg"
										>
											{player.display_name}
											<Button
												variant={BUTTON_VARIANT.ghost}
												aria-label={`Remover ${player.display_name}`}
												className="px-2"
												onClick={() => handleRemovePlayer(team.key, playerId)}
											>
												<X className="size-3.5" />
											</Button>
										</li>
									);
								})}
							</ul>
							{team.playerIds.length < playersPerTeam && pool.length > 0 && (
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
											{player.display_name}
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
					<Button variant={BUTTON_VARIANT.secondary} onClick={handleAddTeam}>
						<Plus className="size-4" />
						Adicionar time
					</Button>
				)}
				{teamsError && <p className={ERROR_CLASS}>{teamsError}</p>}
				{errorMessage && <p className={ERROR_CLASS}>{errorMessage}</p>}
				<div className="flex justify-end gap-2">
					<Button
						variant={BUTTON_VARIANT.secondary}
						onClick={onCancel}
						disabled={isPending}
					>
						Cancelar
					</Button>
					<Button type="submit" disabled={isPending}>
						Iniciar evento
					</Button>
				</div>
			</Form>
		</Formik>
	);
}
