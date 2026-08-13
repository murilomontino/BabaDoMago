import { useState } from "react";
import { Button } from "@/components/button";
import { ChampionshipEventBenchModal } from "@/components/championship-event-bench-modal";
import { ChampionshipEventGoalModal } from "@/components/championship-event-goal-modal";
import {
	EventTeamColorDot,
	EventTeamPlayerRow,
	EventTeamRatingAverage,
} from "@/components/event-team-player";
import {
	EVENT_ACTION,
	EVENT_TEAM_POSITION_LABEL,
	eventTeamPlayerPosition,
	eventTeamSlotPosition,
} from "@/const/championship-event";
import {
	canConfirmMatchTeams,
	EVENT_MATCH_LABEL,
	formatMatchScore,
	matchAssistCandidates,
	matchBenchPlayerIds,
	matchGoalPayload,
	matchScore,
	matchTeamSlots,
	toggleMatchTeamSelection,
} from "@/const/championship-event-match";
import { CHAMPIONSHIP_ROLE } from "@/const/championship-role";
import {
	EVENT_TEAM_COLOR,
	type EventTeamColor,
	eventTeamColorStyle,
	eventTeamName,
} from "@/const/event-team-color";
import { playerVisibleName } from "@/const/player-name";
import { championshipRatingCeiling } from "@/const/player-rating";
import { BUTTON_VARIANT, CHIP_CLASS, ERROR_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";
import type {
	ChampionshipEvent,
	ChampionshipEventMatch,
	ChampionshipEventMatchPlayer,
	ChampionshipEventTeam,
} from "@/types/championship-event";

type SlotTarget = {
	teamId: number;
	slot: number;
};

type GoalTarget = {
	teamId: number;
	player: ChampionshipEventMatchPlayer;
};

function fallbackPlayer(
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

function resolvePlayer(
	playerId: number,
	displayName: string,
	byId: Map<number, ChampionshipPlayer>,
): ChampionshipPlayer {
	return byId.get(playerId) ?? fallbackPlayer(playerId, displayName);
}

type ChampionshipEventPlayProps = {
	event: ChampionshipEvent;
	match: ChampionshipEventMatch | null;
	players: readonly ChampionshipPlayer[];
	starting: boolean;
	startError: string | null;
	savingPlayer: boolean;
	playerError: string | null;
	savingGoal: boolean;
	goalError: string | null;
	ending: boolean;
	endError: string | null;
	onStart: (teamAId: number, teamBId: number) => Promise<void>;
	onSetPlayer: (
		teamId: number,
		slot: number,
		playerId: number | null,
	) => Promise<void>;
	onAddGoal: (values: {
		scorerPlayerId: number;
		assistPlayerId: number | null;
		isOwnGoal: boolean;
	}) => Promise<void>;
	onEnd: () => Promise<void>;
	onNext: () => Promise<void>;
};

function TeamPick({
	team,
	selected,
	pickOrder,
	rosterById,
	ceiling,
	onSelect,
}: {
	team: ChampionshipEventTeam;
	selected: boolean;
	pickOrder: number | null;
	rosterById: Map<number, ChampionshipPlayer>;
	ceiling: number;
	onSelect: () => void;
}) {
	const style = eventTeamColorStyle(team.color);
	const teamRoster = team.players.map((row) => ({
		row,
		player: resolvePlayer(row.player_id, row.display_name, rosterById),
	}));

	return (
		<article
			className={`relative rounded-lg border bg-surface p-2 text-sm ${
				selected ? "border-pitch ring-2 ring-pitch" : "border-line"
			}`}
			style={style}
		>
			<EventTeamColorDot color={team.color} />
			<div className="mb-1 flex items-center gap-1 pr-5">
				<p className="min-w-0 flex-1 text-xs font-medium">
					{eventTeamName(team.color, team.sort_order)}
				</p>
				<Button
					variant={selected ? BUTTON_VARIANT.primary : BUTTON_VARIANT.secondary}
					className="h-7 shrink-0 px-2 text-xs"
					onClick={onSelect}
				>
					{pickOrder !== null
						? `${EVENT_MATCH_LABEL.picked} ${pickOrder}`
						: EVENT_MATCH_LABEL.select}
				</Button>
			</div>
			<ul className="space-y-1">
				{teamRoster.map(({ row, player }) => {
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
			<EventTeamRatingAverage
				ratings={teamRoster.map(({ player }) => player.rating)}
			/>
		</article>
	);
}

function MatchTeamBlock({
	color,
	sortOrder,
	slots,
	rosterById,
	onMarkGoal,
	onEditSlot,
}: {
	color: EventTeamColor | null;
	sortOrder: number;
	slots: readonly (ChampionshipEventMatchPlayer | null)[];
	rosterById: Map<number, ChampionshipPlayer>;
	onMarkGoal: (player: ChampionshipEventMatchPlayer) => void;
	onEditSlot: (slot: number) => void;
}) {
	const style = eventTeamColorStyle(color);

	return (
		<section
			className="relative rounded-lg border border-line bg-surface p-2"
			style={style}
		>
			<EventTeamColorDot color={color} />
			<p className="mb-2 pr-5 text-sm font-medium">
				{eventTeamName(color, sortOrder)}
			</p>
			<ul className="space-y-1">
				{Array.from({ length: slots.length }, (_, index) => index).map(
					(slot) => {
						const row = slots[slot] ?? null;
						const occupied = row !== null;
						const player = occupied
							? resolvePlayer(row.player_id, row.display_name, rosterById)
							: null;
						const position = eventTeamSlotPosition(slot);

						return (
							<li
								key={`slot-${slot}`}
								className="flex items-center gap-1 rounded-md bg-white/80 px-1.5 py-1"
							>
								<span className={`${CHIP_CLASS} shrink-0`}>
									{EVENT_TEAM_POSITION_LABEL[position]}
								</span>
								{player && (
									<p className="min-w-0 flex-1 truncate text-xs font-medium text-fg">
										{playerVisibleName(player)}
									</p>
								)}
								{!player && (
									<p className="min-w-0 flex-1 truncate text-xs text-fg-muted">
										{EVENT_MATCH_LABEL.emptySlot}
									</p>
								)}
								{row && (
									<Button
										variant={BUTTON_VARIANT.secondary}
										className="h-7 px-2 text-xs"
										onClick={() => onMarkGoal(row)}
									>
										{EVENT_ACTION.markGoal}
									</Button>
								)}
								<Button
									variant={BUTTON_VARIANT.ghost}
									className="h-7 px-2 text-xs"
									onClick={() => onEditSlot(slot)}
								>
									{occupied ? EVENT_ACTION.swapPlayer : EVENT_ACTION.fillSlot}
								</Button>
							</li>
						);
					},
				)}
			</ul>
		</section>
	);
}

export function ChampionshipEventPlay({
	event,
	match,
	players,
	starting,
	startError,
	savingPlayer,
	playerError,
	savingGoal,
	goalError,
	ending,
	endError,
	onStart,
	onSetPlayer,
	onAddGoal,
	onEnd,
	onNext,
}: ChampionshipEventPlayProps) {
	const rosterById = new Map(players.map((player) => [player.id, player]));
	const teamById = new Map(event.teams.map((team) => [team.id, team]));
	const ceiling = championshipRatingCeiling(
		players.map((player) => player.rating),
	);
	const [selected, setSelected] = useState<number[]>([]);
	const [slotTarget, setSlotTarget] = useState<SlotTarget | null>(null);
	const [goalTarget, setGoalTarget] = useState<GoalTarget | null>(null);
	const busy = starting || savingPlayer || savingGoal || ending;
	const canStartSelected = canConfirmMatchTeams(selected);

	if (!match) {
		return (
			<div className="space-y-4">
				<ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
					{event.teams.map((team) => {
						const pickIndex = selected.indexOf(team.id);
						const pickOrder = pickIndex >= 0 ? pickIndex + 1 : null;

						return (
							<li key={team.id}>
								<TeamPick
									team={team}
									selected={pickOrder !== null}
									pickOrder={pickOrder}
									rosterById={rosterById}
									ceiling={ceiling}
									onSelect={() => {
										if (starting) {
											return;
										}

										setSelected(toggleMatchTeamSelection(selected, team.id));
									}}
								/>
							</li>
						);
					})}
				</ul>
				{startError && <p className={ERROR_CLASS}>{startError}</p>}
				<Button
					disabled={starting || !canStartSelected}
					onClick={() => {
						const teamAId = selected[0];
						const teamBId = selected[1];
						if (teamAId === undefined || teamBId === undefined) {
							return;
						}

						void onStart(teamAId, teamBId);
					}}
				>
					{EVENT_ACTION.startMatch}
				</Button>
			</div>
		);
	}

	const teamA = teamById.get(match.team_a_id);
	const teamB = teamById.get(match.team_b_id);
	if (!teamA || !teamB) {
		return <p className={ERROR_CLASS}>Time da partida não encontrado.</p>;
	}

	const teamAIds = new Set(
		match.players
			.filter((player) => player.team_id === match.team_a_id)
			.map((player) => player.player_id),
	);
	const score = matchScore(match.goals, teamAIds);
	const benchIds = matchBenchPlayerIds(
		event.attendance.map((row) => row.player_id),
		match.players,
	);
	const benchPlayers = benchIds.map((playerId) => {
		const present = event.attendance.find((row) => row.player_id === playerId);
		return resolvePlayer(playerId, present?.display_name ?? "", rosterById);
	});
	const slotTitle = slotTarget
		? matchTeamSlots(match.players, slotTarget.teamId, event.players_per_team)[
				slotTarget.slot
			]
			? EVENT_ACTION.swapPlayer
			: EVENT_ACTION.fillSlot
		: EVENT_ACTION.fillSlot;

	return (
		<div className="flex flex-col gap-3">
			<MatchTeamBlock
				color={teamA.color}
				sortOrder={teamA.sort_order}
				slots={matchTeamSlots(
					match.players,
					match.team_a_id,
					event.players_per_team,
				)}
				rosterById={rosterById}
				onMarkGoal={(player) => {
					if (busy) {
						return;
					}

					setGoalTarget({ teamId: match.team_a_id, player });
				}}
				onEditSlot={(slot) => {
					if (busy) {
						return;
					}

					setSlotTarget({ teamId: match.team_a_id, slot });
				}}
			/>
			<p className="text-center text-2xl font-semibold tabular-nums text-fg">
				{formatMatchScore(score.teamA, score.teamB)}
			</p>
			<MatchTeamBlock
				color={teamB.color}
				sortOrder={teamB.sort_order}
				slots={matchTeamSlots(
					match.players,
					match.team_b_id,
					event.players_per_team,
				)}
				rosterById={rosterById}
				onMarkGoal={(player) => {
					if (busy) {
						return;
					}

					setGoalTarget({ teamId: match.team_b_id, player });
				}}
				onEditSlot={(slot) => {
					if (busy) {
						return;
					}

					setSlotTarget({ teamId: match.team_b_id, slot });
				}}
			/>
			{(playerError || goalError || endError) && (
				<p className={ERROR_CLASS}>{playerError || goalError || endError}</p>
			)}
			<div className="mt-auto grid grid-cols-2 gap-2">
				<Button
					variant={BUTTON_VARIANT.ghost}
					disabled={busy}
					onClick={() => {
						void onEnd();
					}}
				>
					{EVENT_ACTION.endMatch}
				</Button>
				<Button
					disabled={busy}
					onClick={() => {
						void onNext();
					}}
				>
					{EVENT_ACTION.nextMatch}
				</Button>
			</div>
			{goalTarget && (
				<ChampionshipEventGoalModal
					scorerName={playerVisibleName(
						resolvePlayer(
							goalTarget.player.player_id,
							goalTarget.player.display_name,
							rosterById,
						),
					)}
					candidates={matchAssistCandidates(
						match.players,
						goalTarget.teamId,
						goalTarget.player.player_id,
					).map((row) => ({
						playerId: row.player_id,
						name: playerVisibleName(
							resolvePlayer(row.player_id, row.display_name, rosterById),
						),
					}))}
					isPending={savingGoal}
					errorMessage={goalError}
					onCancel={() => {
						if (savingGoal) {
							return;
						}

						setGoalTarget(null);
					}}
					onConfirm={async (values) => {
						const payload = matchGoalPayload({
							scorerPlayerId: goalTarget.player.player_id,
							kind: values.kind,
							assistPlayerId: values.assistPlayerId,
						});
						await onAddGoal(payload);
						setGoalTarget(null);
					}}
				/>
			)}
			{slotTarget && (
				<ChampionshipEventBenchModal
					title={slotTitle}
					players={benchPlayers}
					isPending={savingPlayer}
					errorMessage={playerError}
					onCancel={() => {
						if (savingPlayer) {
							return;
						}

						setSlotTarget(null);
					}}
					onSelect={async (playerId) => {
						await onSetPlayer(slotTarget.teamId, slotTarget.slot, playerId);
						setSlotTarget(null);
					}}
				/>
			)}
		</div>
	);
}
