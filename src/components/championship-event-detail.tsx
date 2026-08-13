import { Field, Form, Formik } from "formik";
import { useState } from "react";
import { Button } from "@/components/button";
import { EndEventModal } from "@/components/end-event-modal";
import { EventAttendanceTable } from "@/components/event-attendance-table";
import { FormError } from "@/components/form-error";
import {
	EVENT_STATUS,
	EVENT_STATUS_LABEL,
	eventStatus,
	formatEventStartsAt,
} from "@/const/championship-event";
import { CHAMPIONSHIP_ROLE } from "@/const/championship-role";
import {
	EVENT_TEAM_COLOR_CLASS,
	EVENT_TEAM_COLOR_LABEL,
	type EventTeamColor,
} from "@/const/event-team-color";
import { addMatchFormSchema } from "@/const/form-schema";
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
	attendanceCounts: ReadonlyMap<number, number>;
	canManage: boolean;
	onAddMatch: (values: { teamAId: number; teamBId: number }) => Promise<void>;
	onEnd: () => Promise<void>;
	addingMatch: boolean;
	addMatchError: string | null;
	ending: boolean;
	endError: string | null;
};

function TeamChip({ color }: { color: EventTeamColor }) {
	return (
		<span
			className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${EVENT_TEAM_COLOR_CLASS[color]}`}
		>
			{EVENT_TEAM_COLOR_LABEL[color]}
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
	attendanceCounts,
	canManage,
	onAddMatch,
	onEnd,
	addingMatch,
	addMatchError,
	ending,
	endError,
}: ChampionshipEventDetailProps) {
	const when = formatEventStartsAt(event.starts_at);
	const status = eventStatus(event.ended_at);
	const teamById = new Map(event.teams.map((team) => [team.id, team]));
	const presentPlayers = attendancePlayers(event.attendance, players);
	const [isEndOpen, setIsEndOpen] = useState(false);

	return (
		<article className="space-y-6">
			<div className="flex flex-wrap items-center gap-2">
				<p className="text-sm font-semibold tracking-tight text-fg">
					{when.date} · {when.time}
				</p>
				<span className={CHIP_CLASS}>{EVENT_STATUS_LABEL[status]}</span>
				{canManage && status === EVENT_STATUS.open && (
					<Button
						variant={BUTTON_VARIANT.ghost}
						className="ml-auto"
						onClick={() => setIsEndOpen(true)}
					>
						Encerrar
					</Button>
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
					<EventAttendanceTable
						players={presentPlayers}
						attendanceCounts={attendanceCounts}
					/>
				)}
			</div>
			<ul className="space-y-2">
				{event.teams.map((team) => (
					<li key={team.id} className="text-sm text-fg">
						<div className="mb-1">
							<TeamChip color={team.color} />
						</div>
						<p className="text-fg-muted">
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
												{EVENT_TEAM_COLOR_LABEL[team.color]}
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
												{EVENT_TEAM_COLOR_LABEL[team.color]}
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
		</article>
	);
}
