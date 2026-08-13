import { ArrowLeftRight, Goal, Handshake } from "lucide-react";
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
	EVENT_GOAL_LABEL,
	EVENT_MATCH_LABEL,
	formatMatchScore,
	matchAssistCandidates,
	matchBenchPlayerIds,
	matchGoalPayload,
	matchGoalTimeline,
	matchScore,
	matchTeamPlayers,
	matchTeamSlots,
	matchTeamStarName,
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
		own_goals: 0,
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
	onSetGoalkeeper: (teamId: number, playerId: number) => Promise<void>;
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
	disabled,
	onMarkGoal,
	onEditSlot,
	onSetGoalkeeper,
}: {
	color: EventTeamColor | null;
	sortOrder: number;
	slots: readonly (ChampionshipEventMatchPlayer | null)[];
	rosterById: Map<number, ChampionshipPlayer>;
	disabled: boolean;
	onMarkGoal: (player: ChampionshipEventMatchPlayer) => void;
	onEditSlot: (slot: number) => void;
	onSetGoalkeeper: (player: ChampionshipEventMatchPlayer) => void;
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
						const position = occupied
							? eventTeamPlayerPosition(row.is_goalkeeper)
							: eventTeamSlotPosition(slot);

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
								{row && !row.is_goalkeeper && (
									<Button
										variant={BUTTON_VARIANT.secondary}
										className="h-7 px-2 text-xs"
										disabled={disabled}
										onClick={() => onSetGoalkeeper(row)}
									>
										{EVENT_ACTION.setGoalkeeper}
									</Button>
								)}
								{row && (
									<Button
										variant={BUTTON_VARIANT.ghost}
										className="h-7 px-2"
										aria-label={EVENT_ACTION.markGoal}
										disabled={disabled}
										onClick={() => onMarkGoal(row)}
									>
										<Goal className="size-4" />
									</Button>
								)}
								{occupied && (
									<Button
										variant={BUTTON_VARIANT.ghost}
										className="h-7 px-2"
										aria-label={EVENT_ACTION.swapPlayer}
										disabled={disabled}
										onClick={() => onEditSlot(slot)}
									>
										<ArrowLeftRight className="size-4" />
									</Button>
								)}
								{!occupied && (
									<Button
										variant={BUTTON_VARIANT.ghost}
										className="h-7 px-2 text-xs"
										disabled={disabled}
										onClick={() => onEditSlot(slot)}
									>
										{EVENT_ACTION.fillSlot}
									</Button>
								)}
							</li>
						);
					},
				)}
			</ul>
		</section>
	);
}

function GoalTimelineEvent({
	scorerName,
	assistName,
	isOwnGoal,
	mirror,
}: {
	scorerName: string;
	assistName: string | null;
	isOwnGoal: boolean;
	mirror: boolean;
}) {
	return (
		<span
			className={`inline-flex min-w-0 max-w-full items-center gap-1 text-xs text-fg-muted ${
				mirror ? "flex-row-reverse" : ""
			}`}
		>
			{isOwnGoal && (
				<Goal
					className="size-3 shrink-0 text-danger-fg"
					aria-label={EVENT_GOAL_LABEL.ownGoal}
				/>
			)}
			{!isOwnGoal && (
				<Goal className="size-3 shrink-0" aria-label={EVENT_GOAL_LABEL.goal} />
			)}
			<span className="truncate">{scorerName}</span>
			{assistName && (
				<Handshake
					className="size-3 shrink-0"
					aria-label={EVENT_GOAL_LABEL.assist}
				/>
			)}
			{assistName && <span className="truncate">{assistName}</span>}
		</span>
	);
}

function OwnGoalButton({
	disabled,
	onClick,
}: {
	disabled: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			aria-label={EVENT_GOAL_LABEL.ownGoal}
			disabled={disabled}
			className="inline-flex shrink-0 text-danger-fg hover:opacity-80 disabled:opacity-50"
			onClick={onClick}
		>
			<Goal className="size-3.5" />
		</button>
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
	onSetGoalkeeper,
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
	const [ownGoalTeamId, setOwnGoalTeamId] = useState<number | null>(null);
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
	const starA =
		matchTeamStarName(match.players, match.team_a_id, rosterById) ??
		eventTeamName(teamA.color, teamA.sort_order);
	const starB =
		matchTeamStarName(match.players, match.team_b_id, rosterById) ??
		eventTeamName(teamB.color, teamB.sort_order);
	const timeline = matchGoalTimeline(match.goals);
	const ownGoalPlayers = ownGoalTeamId
		? matchTeamPlayers(match.players, ownGoalTeamId).map((row) =>
				resolvePlayer(row.player_id, row.display_name, rosterById),
			)
		: [];
	const matchPlayerById = new Map(
		match.players.map((row) => [row.player_id, row]),
	);
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
				disabled={busy}
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
				onSetGoalkeeper={(player) => {
					if (busy) {
						return;
					}

					void onSetGoalkeeper(match.team_a_id, player.player_id);
				}}
			/>
			<div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2 gap-y-0.5">
				<p className="flex min-w-0 items-center justify-end gap-1 text-sm font-medium text-fg">
					<OwnGoalButton
						disabled={busy}
						onClick={() => {
							if (busy) {
								return;
							}

							setOwnGoalTeamId(match.team_a_id);
						}}
					/>
					<span className="truncate">{starA}</span>
				</p>
				<p className="text-2xl font-semibold tabular-nums text-fg">
					{formatMatchScore(score.teamA, score.teamB)}
				</p>
				<p className="flex min-w-0 items-center justify-start gap-1 text-sm font-medium text-fg">
					<span className="truncate">{starB}</span>
					<OwnGoalButton
						disabled={busy}
						onClick={() => {
							if (busy) {
								return;
							}

							setOwnGoalTeamId(match.team_b_id);
						}}
					/>
				</p>
				{timeline.map((goal) => {
					const scorer = matchPlayerById.get(goal.scorer_player_id);
					const assist =
						goal.assist_player_id === null
							? null
							: matchPlayerById.get(goal.assist_player_id);
					const forTeamA = teamAIds.has(goal.scorer_player_id);
					const event = (
						<GoalTimelineEvent
							scorerName={playerVisibleName(
								resolvePlayer(
									goal.scorer_player_id,
									scorer?.display_name ?? "",
									rosterById,
								),
							)}
							assistName={
								assist
									? playerVisibleName(
											resolvePlayer(
												assist.player_id,
												assist.display_name,
												rosterById,
											),
										)
									: null
							}
							isOwnGoal={goal.is_own_goal}
							mirror={forTeamA}
						/>
					);

					return (
						<div key={goal.id} className="contents">
							<div className="flex min-w-0 justify-end">
								{forTeamA && event}
							</div>
							<span />
							<div className="flex min-w-0 justify-start">
								{!forTeamA && event}
							</div>
						</div>
					);
				})}
			</div>
			<MatchTeamBlock
				color={teamB.color}
				sortOrder={teamB.sort_order}
				slots={matchTeamSlots(
					match.players,
					match.team_b_id,
					event.players_per_team,
				)}
				rosterById={rosterById}
				disabled={busy}
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
				onSetGoalkeeper={(player) => {
					if (busy) {
						return;
					}

					void onSetGoalkeeper(match.team_b_id, player.player_id);
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
			{ownGoalTeamId !== null && (
				<ChampionshipEventBenchModal
					title={EVENT_GOAL_LABEL.ownGoal}
					players={ownGoalPlayers}
					emptyMessage={EVENT_MATCH_LABEL.emptyTeam}
					isPending={savingGoal}
					errorMessage={goalError}
					onCancel={() => {
						if (savingGoal) {
							return;
						}

						setOwnGoalTeamId(null);
					}}
					onSelect={async (playerId) => {
						await onAddGoal({
							scorerPlayerId: playerId,
							assistPlayerId: null,
							isOwnGoal: true,
						});
						setOwnGoalTeamId(null);
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
