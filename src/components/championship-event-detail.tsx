import { X } from "lucide-react";
import { useRef, useState } from "react";
import { AddEventMatchModal } from "@/components/add-event-match-modal";
import { Button } from "@/components/button";
import { ChampionshipEventBuilder } from "@/components/championship-event-builder";
import { DeleteEventAttendanceModal } from "@/components/delete-event-attendance-modal";
import { DeleteEventMatchModal } from "@/components/delete-event-match-modal";
import { DeleteEventModal } from "@/components/delete-event-modal";
import { EditEventAttendanceModal } from "@/components/edit-event-attendance-modal";
import { EndEventModal } from "@/components/end-event-modal";
import {
	EventTeamColorDot,
	EventTeamPlayerRow,
} from "@/components/event-team-player";
import {
	builderTeamsFromEvent,
	CHAMPIONSHIP_EVENT,
	canAddEventMatch,
	canEditEventTeams,
	canRemoveEventAttendance,
	draftAttendanceForEnd,
	EVENT_ACTION,
	EVENT_STATUS,
	EVENT_STATUS_LABEL,
	EVENT_TEAM_POSITION_LABEL,
	type EventTeamDraft,
	eventStatus,
	eventTeamPlayerIds,
	eventTeamPlayerPosition,
	formatEventStartsAt,
} from "@/const/championship-event";
import { CHAMPIONSHIP_ROLE } from "@/const/championship-role";
import {
	EVENT_TEAM_COLOR,
	EVENT_TEAM_COLOR_LABEL,
	type EventTeamColor,
	eventTeamColorFg,
	eventTeamColorStyle,
} from "@/const/event-team-color";
import { playerVisibleName } from "@/const/player-name";
import { championshipRatingCeiling } from "@/const/player-rating";
import { BUTTON_VARIANT, CHIP_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";
import type {
	ChampionshipEvent,
	ChampionshipEventMatch,
} from "@/types/championship-event";

type ChampionshipEventDetailProps = {
	event: ChampionshipEvent;
	players: ChampionshipPlayer[];
	attendanceCounts: ReadonlyMap<number, number>;
	canManage: boolean;
	canOverrideEnded: boolean;
	onSaveTeams: (values: {
		presentPlayerIds: number[];
		teams: EventTeamDraft[];
	}) => Promise<void>;
	onSaveAttendance: (presentPlayerIds: number[]) => Promise<void>;
	onAddMatch: (values: { teamAId: number; teamBId: number }) => Promise<void>;
	onDeleteMatch: (matchId: number) => Promise<void>;
	onEnd: (presentPlayerIds: number[] | null) => Promise<void>;
	onDelete: () => Promise<void>;
	savingTeams: boolean;
	saveTeamsError: string | null;
	savingAttendance: boolean;
	saveAttendanceError: string | null;
	addingMatch: boolean;
	addMatchError: string | null;
	deletingMatch: boolean;
	deleteMatchError: string | null;
	ending: boolean;
	endError: string | null;
	deleting: boolean;
	deleteError: string | null;
};

function TeamChip({ color }: { color: EventTeamColor }) {
	return (
		<span
			className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
			style={{
				backgroundColor: color,
				color: eventTeamColorFg(color),
			}}
		>
			{EVENT_TEAM_COLOR_LABEL[color] ?? color}
		</span>
	);
}

function fallbackRosterPlayer(
	playerId: number,
	displayName: string,
): ChampionshipPlayer {
	return {
		id: playerId,
		championship_id: 0,
		user_id: null,
		display_name: displayName,
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
}

function resolveRosterPlayer(
	playerId: number,
	displayName: string,
	byId: Map<number, ChampionshipPlayer>,
): ChampionshipPlayer {
	return byId.get(playerId) ?? fallbackRosterPlayer(playerId, displayName);
}

function resolveEventPlayers(
	rows: readonly { player_id: number; display_name: string }[],
	byId: Map<number, ChampionshipPlayer>,
): ChampionshipPlayer[] {
	return rows.map((row) =>
		resolveRosterPlayer(row.player_id, row.display_name, byId),
	);
}

export function ChampionshipEventDetail({
	event,
	players,
	attendanceCounts,
	canManage,
	canOverrideEnded,
	onSaveTeams,
	onSaveAttendance,
	onAddMatch,
	onDeleteMatch,
	onEnd,
	onDelete,
	savingTeams,
	saveTeamsError,
	savingAttendance,
	saveAttendanceError,
	addingMatch,
	addMatchError,
	deletingMatch,
	deleteMatchError,
	ending,
	endError,
	deleting,
	deleteError,
}: ChampionshipEventDetailProps) {
	const when = formatEventStartsAt(event.starts_at);
	const status = eventStatus(event.ended_at);
	const ended = status === EVENT_STATUS.ended;
	const teamById = new Map(event.teams.map((team) => [team.id, team]));
	const rosterById = new Map(players.map((player) => [player.id, player]));
	const presentPlayers = resolveEventPlayers(event.attendance, rosterById);
	const teamPlayerIds = eventTeamPlayerIds(event.teams);
	const ceiling = championshipRatingCeiling(
		players.map((player) => player.rating),
	);
	const teamsEditable = canManage && canEditEventTeams(event);
	const [isEditingTeams, setIsEditingTeams] = useState(
		event.teams.length < CHAMPIONSHIP_EVENT.minTeams,
	);
	const showTeamBuilder =
		teamsEditable &&
		(isEditingTeams || event.teams.length < CHAMPIONSHIP_EVENT.minTeams);
	const showAttendanceActions = canOverrideEnded && !showTeamBuilder;
	const showAddMatch =
		!showTeamBuilder &&
		canAddEventMatch({
			canManage,
			canOverrideEnded,
			ended,
			teamCount: event.teams.length,
		});
	const showMatchDelete = canOverrideEnded && !showTeamBuilder;
	const [isEndOpen, setIsEndOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
	const [isAddMatchOpen, setIsAddMatchOpen] = useState(false);
	const [attendanceToRemove, setAttendanceToRemove] =
		useState<ChampionshipPlayer | null>(null);
	const [matchToRemove, setMatchToRemove] =
		useState<ChampionshipEventMatch | null>(null);
	const draftPresentIdsRef = useRef(
		event.attendance.map((row) => row.player_id),
	);

	return (
		<article className="space-y-6">
			<div className="flex flex-wrap items-center gap-2">
				<p className="text-sm font-semibold tracking-tight text-fg">
					{when.date} · {when.time}
				</p>
				<span className={CHIP_CLASS}>{EVENT_STATUS_LABEL[status]}</span>
				{canManage && (
					<div className="ml-auto flex flex-wrap items-center gap-2">
						{teamsEditable && !showTeamBuilder && (
							<Button
								variant={BUTTON_VARIANT.secondary}
								onClick={() => setIsEditingTeams(true)}
							>
								{EVENT_ACTION.editTeams}
							</Button>
						)}
						{showAttendanceActions && (
							<Button
								variant={BUTTON_VARIANT.secondary}
								onClick={() => setIsAttendanceOpen(true)}
							>
								{EVENT_ACTION.addAttendance}
							</Button>
						)}
						{showAddMatch && (
							<Button
								variant={BUTTON_VARIANT.secondary}
								onClick={() => setIsAddMatchOpen(true)}
							>
								{EVENT_ACTION.addMatch}
							</Button>
						)}
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
			{showTeamBuilder && (
				<ChampionshipEventBuilder
					playersPerTeam={event.players_per_team}
					players={players}
					attendanceCounts={attendanceCounts}
					initialPresentIds={event.attendance.map((row) => row.player_id)}
					initialTeams={builderTeamsFromEvent(
						event.teams,
						event.players_per_team,
						event.attendance.length,
					)}
					isPending={savingTeams}
					errorMessage={saveTeamsError}
					onCancel={
						event.teams.length >= CHAMPIONSHIP_EVENT.minTeams
							? () => setIsEditingTeams(false)
							: undefined
					}
					onPresentIdsChange={(playerIds) => {
						draftPresentIdsRef.current = [...playerIds];
					}}
					onSubmit={async (values) => {
						await onSaveTeams(values);
						setIsEditingTeams(false);
					}}
				/>
			)}
			{!showTeamBuilder && (
				<ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
					{event.teams.map((team) => {
						const cardStyle = eventTeamColorStyle(team.color);

						return (
							<li
								key={team.id}
								className="relative rounded-lg border border-line p-2 text-sm"
								style={cardStyle}
							>
								<EventTeamColorDot color={team.color} />
								<p className="mb-1 text-xs font-medium">
									{EVENT_TEAM_COLOR_LABEL[team.color] ?? team.color}
								</p>
								<ul className="space-y-1">
									{team.players.map((row) => {
										const player = resolveRosterPlayer(
											row.player_id,
											row.display_name,
											rosterById,
										);
										const position = eventTeamPlayerPosition(row.is_goalkeeper);

										return (
											<li
												key={row.id}
												className="flex min-h-7 items-center gap-1.5 rounded-md bg-white px-1.5 py-1"
											>
												<span className={`${CHIP_CLASS} shrink-0`}>
													{EVENT_TEAM_POSITION_LABEL[position]}
												</span>
												<EventTeamPlayerRow
													player={player}
													ceiling={ceiling}
													backgroundColor={EVENT_TEAM_COLOR.white}
												/>
											</li>
										);
									})}
								</ul>
							</li>
						);
					})}
				</ul>
			)}
			{!showTeamBuilder && (
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
										{showMatchDelete && (
											<button
												type="button"
												aria-label={EVENT_ACTION.removeMatch}
												className="ml-auto inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-muted hover:text-danger-fg"
												onClick={() => setMatchToRemove(match)}
											>
												<X className="size-4" />
											</button>
										)}
									</li>
								);
							})}
						</ul>
					)}
				</div>
			)}
			{!showTeamBuilder && (
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
									{showAttendanceActions &&
										canRemoveEventAttendance(
											player.id,
											event.attendance.length,
											teamPlayerIds,
										) && (
											<button
												type="button"
												aria-label={EVENT_ACTION.removeAttendance}
												className="ml-auto inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-muted hover:text-danger-fg"
												onClick={() => setAttendanceToRemove(player)}
											>
												<X className="size-4" />
											</button>
										)}
								</li>
							))}
						</ul>
					)}
				</div>
			)}
			{isAttendanceOpen && (
				<EditEventAttendanceModal
					players={players}
					attendanceCounts={attendanceCounts}
					initialPresentIds={event.attendance.map((row) => row.player_id)}
					teamPlayerIds={teamPlayerIds}
					isPending={savingAttendance}
					errorMessage={saveAttendanceError}
					onCancel={() => {
						if (savingAttendance) {
							return;
						}

						setIsAttendanceOpen(false);
					}}
					onSave={async (presentPlayerIds) => {
						await onSaveAttendance(presentPlayerIds);
						setIsAttendanceOpen(false);
					}}
				/>
			)}
			{isAddMatchOpen && (
				<AddEventMatchModal
					teams={event.teams}
					isPending={addingMatch}
					errorMessage={addMatchError}
					onCancel={() => {
						if (addingMatch) {
							return;
						}

						setIsAddMatchOpen(false);
					}}
					onAdd={async (values) => {
						await onAddMatch(values);
						setIsAddMatchOpen(false);
					}}
				/>
			)}
			{attendanceToRemove && (
				<DeleteEventAttendanceModal
					playerName={playerVisibleName(attendanceToRemove)}
					isPending={savingAttendance}
					errorMessage={saveAttendanceError}
					onCancel={() => {
						if (savingAttendance) {
							return;
						}

						setAttendanceToRemove(null);
					}}
					onConfirm={() => {
						void (async () => {
							try {
								const playerId = attendanceToRemove.id;
								await onSaveAttendance(
									event.attendance
										.map((row) => row.player_id)
										.filter((id) => id !== playerId),
								);
								setAttendanceToRemove(null);
							} catch {
								return;
							}
						})();
					}}
				/>
			)}
			{matchToRemove && (
				<DeleteEventMatchModal
					isPending={deletingMatch}
					errorMessage={deleteMatchError}
					onCancel={() => {
						if (deletingMatch) {
							return;
						}

						setMatchToRemove(null);
					}}
					onConfirm={() => {
						void (async () => {
							try {
								await onDeleteMatch(matchToRemove.id);
								setMatchToRemove(null);
							} catch {
								return;
							}
						})();
					}}
				/>
			)}
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
								const presentPlayerIds = draftAttendanceForEnd(
									showTeamBuilder,
									draftPresentIdsRef.current,
								);
								await onEnd(presentPlayerIds);
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
