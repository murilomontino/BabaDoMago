import { Field, Form, Formik } from "formik";
import { useState } from "react";
import { Button } from "@/components/button";
import { DeleteEventModal } from "@/components/delete-event-modal";
import { EndEventModal } from "@/components/end-event-modal";
import { FormError } from "@/components/form-error";
import {
	EVENT_STATUS,
	EVENT_STATUS_LABEL,
	eventStatus,
	formatEventStartsAt,
} from "@/const/championship-event";
import { CHAMPIONSHIP_ROLE } from "@/const/championship-role";
import {
	EVENT_TEAM_COLOR_LABEL,
	type EventTeamColor,
	eventTeamColorStyle,
} from "@/const/event-team-color";
import { addMatchFormSchema } from "@/const/form-schema";
import { playerVisibleName } from "@/const/player-name";
import {
	BUTTON_VARIANT,
	CHIP_CLASS,
	ERROR_CLASS,
	FIELD_CLASS,
} from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";
import type { ChampionshipEvent } from "@/types/championship-event";

type ChampionshipEventDetailProps = {
	event: ChampionshipEvent;
	players: ChampionshipPlayer[];
	canManage: boolean;
	onAddMatch: (values: { teamAId: number; teamBId: number }) => Promise<void>;
	onEnd: () => Promise<void>;
	onDelete: () => Promise<void>;
	addingMatch: boolean;
	addMatchError: string | null;
	ending: boolean;
	endError: string | null;
	deleting: boolean;
	deleteError: string | null;
};

function TeamChip({ color }: { color: EventTeamColor }) {
	return (
		<span
			className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
			style={eventTeamColorStyle(color)}
		>
			{EVENT_TEAM_COLOR_LABEL[color] ?? color}
		</span>
	);
}

function attendancePlayers(
	attendance: ChampionshipEvent["attendance"],
	roster: ChampionshipPlayer[],
): ChampionshipPlayer[] {
	const byId = new Map(roster.map((player) => [player.id, player]));

	return attendance.map((row) => {
		const player = byId.get(row.player_id);
		if (player) {
			return player;
		}

		return {
			id: row.player_id,
			championship_id: 0,
			user_id: null,
			display_name: row.display_name,
			nickname: null,
			avatar_url: null,
			rating: 0,
			role: CHAMPIONSHIP_ROLE.member,
			deleted_at: null,
			goals: 0,
			assists: 0,
			wins: 0,
			matches: 0,
		};
	});
}

export function ChampionshipEventDetail({
	event,
	players,
	canManage,
	onAddMatch,
	onEnd,
	onDelete,
	addingMatch,
	addMatchError,
	ending,
	endError,
	deleting,
	deleteError,
}: ChampionshipEventDetailProps) {
	const when = formatEventStartsAt(event.starts_at);
	const status = eventStatus(event.ended_at);
	const teamById = new Map(event.teams.map((team) => [team.id, team]));
	const presentPlayers = attendancePlayers(event.attendance, players);
	const [isEndOpen, setIsEndOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);

	return (
		<article className="space-y-6">
			<div className="flex flex-wrap items-center gap-2">
				<p className="text-sm font-semibold tracking-tight text-fg">
					{when.date} · {when.time}
				</p>
				<span className={CHIP_CLASS}>{EVENT_STATUS_LABEL[status]}</span>
				{canManage && (
					<div className="ml-auto flex items-center gap-2">
						{status === EVENT_STATUS.open && (
							<Button
								variant={BUTTON_VARIANT.ghost}
								onClick={() => setIsEndOpen(true)}
							>
								Encerrar
							</Button>
						)}
						<Button
							variant={BUTTON_VARIANT.danger}
							onClick={() => setIsDeleteOpen(true)}
						>
							Excluir
						</Button>
					</div>
				)}
			</div>
			<div>
				<p className="mb-1 text-xs font-medium uppercase tracking-wide text-fg-muted">
					Presentes
				</p>
				{event.attendance.length === 0 && (
					<p className="text-sm text-fg-muted">Ninguém marcado.</p>
				)}
				{event.attendance.length > 0 && (
					<ul className="divide-y divide-line">
						{presentPlayers.map((player) => (
							<li
								key={player.id}
								className="flex items-center gap-3 py-2 first:pt-0 last:pb-0"
							>
								{player.avatar_url && (
									<img
										src={player.avatar_url}
										alt=""
										referrerPolicy="no-referrer"
										className="h-8 w-8 rounded-full object-cover"
									/>
								)}
								{!player.avatar_url && (
									<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pitch-soft text-xs font-medium text-pitch-fg">
										{playerVisibleName(player).charAt(0).toUpperCase()}
									</span>
								)}
								<p className="min-w-0 truncate text-sm font-medium text-fg">
									{playerVisibleName(player)}
								</p>
							</li>
						))}
					</ul>
				)}
			</div>
			<ul className="space-y-2">
				{event.teams.map((team) => (
					<li
						key={team.id}
						className="rounded-lg border border-line p-3 text-sm"
						style={eventTeamColorStyle(team.color)}
					>
						<p className="mb-1 text-xs font-medium">
							{EVENT_TEAM_COLOR_LABEL[team.color] ?? team.color}
						</p>
						<p className="opacity-80">
							{team.players.map((player) => player.display_name).join(", ")}
						</p>
					</li>
				))}
			</ul>
			<div>
				<p className="mb-1 text-xs font-medium uppercase tracking-wide text-fg-muted">
					Partidas
				</p>
				{event.matches.length === 0 && (
					<p className="text-sm text-fg-muted">Nenhuma partida ainda.</p>
				)}
				{event.matches.length > 0 && (
					<ul className="space-y-1">
						{event.matches.map((match) => {
							const teamA = teamById.get(match.team_a_id);
							const teamB = teamById.get(match.team_b_id);
							if (!teamA || !teamB) {
								return null;
							}

							return (
								<li
									key={match.id}
									className="flex items-center gap-2 text-sm text-fg"
								>
									<TeamChip color={teamA.color} />
									<span className="text-fg-muted">x</span>
									<TeamChip color={teamB.color} />
								</li>
							);
						})}
					</ul>
				)}
			</div>
			{canManage && (
				<Formik
					initialValues={{ teamAId: "", teamBId: "" }}
					validationSchema={addMatchFormSchema}
					validateOnMount
					onSubmit={async (values, helpers) => {
						await onAddMatch({
							teamAId: Number(values.teamAId),
							teamBId: Number(values.teamBId),
						});
						helpers.resetForm();
					}}
				>
					{({ isValid }) => (
						<Form className="space-y-2">
							<div className="flex flex-wrap items-end gap-2">
								<label
									htmlFor={`match-team-a-${event.id}`}
									className="min-w-0 flex-1 text-sm text-fg-muted"
								>
									Time A
									<Field
										as="select"
										id={`match-team-a-${event.id}`}
										name="teamAId"
										className={`mt-1 ${FIELD_CLASS}`}
									>
										<option value="">Selecionar</option>
										{event.teams.map((team) => (
											<option key={team.id} value={team.id}>
												{EVENT_TEAM_COLOR_LABEL[team.color] ?? team.color}
											</option>
										))}
									</Field>
								</label>
								<label
									htmlFor={`match-team-b-${event.id}`}
									className="min-w-0 flex-1 text-sm text-fg-muted"
								>
									Time B
									<Field
										as="select"
										id={`match-team-b-${event.id}`}
										name="teamBId"
										className={`mt-1 ${FIELD_CLASS}`}
									>
										<option value="">Selecionar</option>
										{event.teams.map((team) => (
											<option key={team.id} value={team.id}>
												{EVENT_TEAM_COLOR_LABEL[team.color] ?? team.color}
											</option>
										))}
									</Field>
								</label>
								<Button
									type="submit"
									variant={BUTTON_VARIANT.secondary}
									disabled={addingMatch || !isValid}
									className="h-9 shrink-0"
								>
									Nova partida
								</Button>
							</div>
							<FormError name="teamAId" />
							<FormError name="teamBId" />
						</Form>
					)}
				</Formik>
			)}
			{addMatchError && <p className={ERROR_CLASS}>{addMatchError}</p>}
			{isEndOpen && (
				<EndEventModal
					isPending={ending}
					errorMessage={endError}
					onCancel={() => {
						if (ending) {
							return;
						}

						setIsEndOpen(false);
					}}
					onConfirm={() => {
						void (async () => {
							try {
								await onEnd();
								setIsEndOpen(false);
							} catch {
								return;
							}
						})();
					}}
				/>
			)}
			{isDeleteOpen && (
				<DeleteEventModal
					isPending={deleting}
					errorMessage={deleteError}
					onCancel={() => {
						if (deleting) {
							return;
						}

						setIsDeleteOpen(false);
					}}
					onConfirm={() => {
						void (async () => {
							try {
								await onDelete();
							} catch {
								return;
							}
						})();
					}}
				/>
			)}
		</article>
	);
}
