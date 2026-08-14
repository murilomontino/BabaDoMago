import { ArrowLeftRight, Goal, Pause, Play } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/button";
import { ChampionshipEventBenchModal } from "@/components/championship-event-bench-modal";
import { ChampionshipEventGoalModal } from "@/components/championship-event-goal-modal";
import { ChampionshipEventSubstitutionModal } from "@/components/championship-event-substitution-modal";
import { EndEventMatchModal } from "@/components/end-event-match-modal";
import { EventTeamColorModal } from "@/components/event-team-color-modal";
import {
	EVENT_TEAM_PLAYER_SLOT_CLASS,
	EVENT_TEAM_POSITION_CHIP_CLASS,
	EventTeamColorDot,
	EventTeamPlayerRow,
	EventTeamRatingAverage,
} from "@/components/event-team-player";
import {
	MATCH_GOAL_TIMELINE_GRID_CLASS,
	MatchGoalTimeline,
} from "@/components/molecules/match-goal-timeline";
import {
	EVENT_ACTION,
	EVENT_TEAM_POSITION_LABEL,
	eventTeamPlayerPosition,
	eventTeamSlotPosition,
} from "@/const/championship-event";
import {
	canConfirmMatchTeams,
	EVENT_GOAL_LABEL,
	EVENT_MATCH_CLOCK_LABEL,
	EVENT_MATCH_END_INTENT,
	EVENT_MATCH_LABEL,
	type EventMatchEndIntent,
	formatMatchClock,
	formatMatchScore,
	matchActiveTeamPlayers,
	matchAssistCandidates,
	matchBenchPlayerIds,
	matchClockIsPaused,
	matchClockIsStarted,
	matchEndWinnerLabel,
	matchGoalPayload,
	matchScore,
	matchTeamSlots,
	matchTeamStarName,
	matchWinnerTeamId,
	toggleMatchTeamSelection,
} from "@/const/championship-event-match";
import { CHAMPIONSHIP_ROLE } from "@/const/championship-role";
import {
	type EventTeamColor,
	eventTeamColorStyle,
	eventTeamName,
} from "@/const/event-team-color";
import { playerVisibleName } from "@/const/player-name";
import { championshipRatingCeiling } from "@/const/player-rating";
import { BUTTON_VARIANT, ERROR_CLASS } from "@/const/ui";
import { useMatchClock } from "@/hooks/use-match-clock";
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

type PendingSwap = {
	teamId: number;
	slot: number;
	incomingPlayerId: number;
	outgoingName: string;
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
		mvps: 0,
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
	undoing: boolean;
	undoError: string | null;
	ending: boolean;
	endError: string | null;
	clockError: string | null;
	pausing: boolean;
	onStart: (teamAId: number, teamBId: number) => Promise<void>;
	onSetPlayer: (
		teamId: number,
		slot: number,
		playerId: number | null,
		includeStats?: boolean,
	) => Promise<void>;
	onAddGoal: (values: {
		scorerPlayerId: number;
		assistPlayerId: number | null;
		isOwnGoal: boolean;
	}) => Promise<void>;
	onUndoGoal: (goalId: number) => Promise<void>;
	onEnd: () => Promise<void>;
	onNext: () => Promise<void>;
	onStartClock: () => Promise<void>;
	onPause: () => Promise<void>;
	onResume: () => Promise<void>;
	onChangeTeamColor: (
		teamId: number,
		color: EventTeamColor | null,
	) => Promise<void>;
	savingColor: boolean;
	colorError: string | null;
};

const TEAM_CARD_LONG_PRESS_MS = 500;
const TEAM_CARD_LONG_PRESS_MOVE_PX = 8;

function TeamPick({
	team,
	selected,
	pickOrder,
	rosterById,
	ceiling,
	onSelect,
	onLongPress,
}: {
	team: ChampionshipEventTeam;
	selected: boolean;
	pickOrder: number | null;
	rosterById: Map<number, ChampionshipPlayer>;
	ceiling: number;
	onSelect: () => void;
	onLongPress: () => void;
}) {
	const style = eventTeamColorStyle(team.color);
	const teamRoster = team.players.map((row) => ({
		row,
		player: resolvePlayer(row.player_id, row.display_name, rosterById),
	}));
	const timerRef = useRef<number | null>(null);
	const originRef = useRef<{ x: number; y: number } | null>(null);
	const skipClickRef = useRef(false);
	const openedRef = useRef(false);

	function clearTimer() {
		if (timerRef.current === null) {
			return;
		}

		window.clearTimeout(timerRef.current);
		timerRef.current = null;
	}

	function openColor() {
		if (openedRef.current) {
			return;
		}

		openedRef.current = true;
		skipClickRef.current = true;
		clearTimer();
		onLongPress();
	}

	return (
		<button
			type="button"
			onClick={() => {
				if (skipClickRef.current) {
					skipClickRef.current = false;
					return;
				}

				onSelect();
			}}
			onPointerDown={(event) => {
				if (event.button !== 0) {
					return;
				}

				openedRef.current = false;
				skipClickRef.current = false;
				originRef.current = { x: event.clientX, y: event.clientY };
				clearTimer();
				timerRef.current = window.setTimeout(() => {
					openColor();
				}, TEAM_CARD_LONG_PRESS_MS);
			}}
			onPointerMove={(event) => {
				const origin = originRef.current;
				if (!origin || timerRef.current === null) {
					return;
				}

				const movedX = Math.abs(event.clientX - origin.x);
				const movedY = Math.abs(event.clientY - origin.y);
				if (
					movedX < TEAM_CARD_LONG_PRESS_MOVE_PX &&
					movedY < TEAM_CARD_LONG_PRESS_MOVE_PX
				) {
					return;
				}

				clearTimer();
			}}
			onPointerUp={clearTimer}
			onPointerCancel={clearTimer}
			onContextMenu={(event) => {
				event.preventDefault();
				openColor();
			}}
			className={`relative w-full select-none rounded-lg border bg-surface p-2 text-left text-sm touch-manipulation ${
				selected ? "border-pitch ring-2 ring-pitch" : "border-line"
			}`}
			style={style}
		>
			<EventTeamColorDot color={team.color} />
			<div className="mb-1 flex items-center gap-1 pr-5">
				<p className="min-w-0 flex-1 text-xs font-medium">
					{eventTeamName(team.color, team.sort_order)}
				</p>
				<span
					className={`inline-flex h-7 shrink-0 items-center rounded-lg px-2 text-xs font-medium ${
						selected
							? "bg-pitch text-white"
							: "border border-line bg-surface text-fg"
					}`}
				>
					{pickOrder !== null
						? `${EVENT_MATCH_LABEL.picked} ${pickOrder}`
						: EVENT_MATCH_LABEL.select}
				</span>
			</div>
			<ul className="space-y-1">
				{teamRoster.map(({ row, player }) => {
					const position = eventTeamPlayerPosition(row.is_goalkeeper);

					return (
						<li key={row.id} className={EVENT_TEAM_PLAYER_SLOT_CLASS}>
							<span className={`${EVENT_TEAM_POSITION_CHIP_CLASS} shrink-0`}>
								{EVENT_TEAM_POSITION_LABEL[position]}
							</span>
							<EventTeamPlayerRow player={player} ceiling={ceiling} />
						</li>
					);
				})}
			</ul>
			<EventTeamRatingAverage
				ratings={teamRoster.map(({ player }) => player.rating)}
			/>
		</button>
	);
}

const MATCH_PLAY_SLOT_CLASS =
	"flex min-h-0 flex-1 items-center gap-1 rounded-md bg-surface-muted px-1 py-0.5 text-fg";

function MatchTeamBlock({
	color,
	sortOrder,
	slots,
	rosterById,
	disabled,
	onMarkGoal,
	onEditSlot,
}: {
	color: EventTeamColor | null;
	sortOrder: number;
	slots: readonly (ChampionshipEventMatchPlayer | null)[];
	rosterById: Map<number, ChampionshipPlayer>;
	disabled: boolean;
	onMarkGoal: (player: ChampionshipEventMatchPlayer) => void;
	onEditSlot: (slot: number) => void;
}) {
	const style = eventTeamColorStyle(color);

	return (
		<section
			className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-line bg-surface p-1.5"
			style={style}
		>
			<EventTeamColorDot color={color} />
			<p className="mb-1 shrink-0 pr-5 text-xs font-medium">
				{eventTeamName(color, sortOrder)}
			</p>
			<ul className="flex min-h-0 flex-1 flex-col gap-0.5">
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
							<li key={`slot-${slot}`} className={MATCH_PLAY_SLOT_CLASS}>
								<span className={`${EVENT_TEAM_POSITION_CHIP_CLASS} shrink-0`}>
									{EVENT_TEAM_POSITION_LABEL[position]}
								</span>
								{row && player && (
									<button
										type="button"
										className="inline-flex min-h-7 min-w-0 flex-1 items-center justify-between gap-1 self-stretch rounded-md px-1.5 hover:bg-black/10 disabled:opacity-50"
										aria-label={EVENT_ACTION.markGoal}
										disabled={disabled}
										onClick={() => onMarkGoal(row)}
									>
										<span className="min-w-0 flex-1 truncate text-left text-xs font-medium">
											{playerVisibleName(player)}
										</span>
										<SoccerBallIcon className="size-4 shrink-0" />
									</button>
								)}
								{!player && (
									<p className="min-w-0 flex-1 truncate text-xs text-fg-muted">
										{EVENT_MATCH_LABEL.emptySlot}
									</p>
								)}
								{occupied && (
									<Button
										variant={BUTTON_VARIANT.ghost}
										className="h-7 shrink-0 px-1.5"
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
										className="h-7 shrink-0 px-1.5 text-xs"
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

function SoccerBallIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			focusable="false"
		>
			<circle cx="12" cy="12" r="10" />
			<path d="M12 7.5 16.2 10.5 14.6 15.5h-5.2L7.8 10.5z" />
			<path d="M12 7.5V2" />
			<path d="m16.2 10.5 5.3-1.8" />
			<path d="m7.8 10.5-5.3-1.8" />
			<path d="m14.6 15.5 2.6 5.8" />
			<path d="m9.4 15.5-2.6 5.8" />
		</svg>
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

const MATCH_CLOCK_ACTION = {
	start: "start",
	pause: "pause",
	resume: "resume",
} as const;

type MatchClockAction =
	(typeof MATCH_CLOCK_ACTION)[keyof typeof MATCH_CLOCK_ACTION];

function matchClockAction(started: boolean, paused: boolean): MatchClockAction {
	if (!started) {
		return MATCH_CLOCK_ACTION.start;
	}

	if (paused) {
		return MATCH_CLOCK_ACTION.resume;
	}

	return MATCH_CLOCK_ACTION.pause;
}

function MatchClockBar({
	elapsedSeconds,
	started,
	paused,
	busy,
	onStartClock,
	onPause,
	onResume,
}: {
	elapsedSeconds: number;
	started: boolean;
	paused: boolean;
	busy: boolean;
	onStartClock: () => void;
	onPause: () => void;
	onResume: () => void;
}) {
	const action = matchClockAction(started, paused);
	const playing = action !== MATCH_CLOCK_ACTION.pause;

	function handleClick() {
		if (busy) {
			return;
		}

		switch (action) {
			case MATCH_CLOCK_ACTION.start:
				onStartClock();
				return;
			case MATCH_CLOCK_ACTION.resume:
				onResume();
				return;
			case MATCH_CLOCK_ACTION.pause:
				onPause();
				return;
			default: {
				const _exhaustive: never = action;
				return _exhaustive;
			}
		}
	}

	return (
		<button
			type="button"
			disabled={busy}
			aria-label={EVENT_MATCH_CLOCK_LABEL[action]}
			onClick={handleClick}
			className="flex w-full shrink-0 flex-col items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 disabled:opacity-50"
		>
			<span className="w-full text-center text-4xl font-semibold tabular-nums tracking-tight text-fg">
				{formatMatchClock(elapsedSeconds)}
			</span>
			<span
				className={`inline-flex items-center gap-2 text-sm font-medium ${playing ? "text-pitch-fg" : "text-fg-muted"}`}
			>
				{playing && <Play className="size-4" />}
				{!playing && <Pause className="size-4" />}
				{EVENT_MATCH_CLOCK_LABEL[action]}
			</span>
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
	undoing,
	undoError,
	ending,
	endError,
	clockError,
	pausing,
	onStart,
	onSetPlayer,
	onAddGoal,
	onUndoGoal,
	onEnd,
	onNext,
	onStartClock,
	onPause,
	onResume,
	onChangeTeamColor,
	savingColor,
	colorError,
}: ChampionshipEventPlayProps) {
	const rosterById = new Map(players.map((player) => [player.id, player]));
	const teamById = new Map(event.teams.map((team) => [team.id, team]));
	const ceiling = championshipRatingCeiling(
		players.map((player) => player.rating),
	);
	const [selected, setSelected] = useState<number[]>([]);
	const [slotTarget, setSlotTarget] = useState<SlotTarget | null>(null);
	const [pendingSwap, setPendingSwap] = useState<PendingSwap | null>(null);
	const [goalTarget, setGoalTarget] = useState<GoalTarget | null>(null);
	const [ownGoalTeamId, setOwnGoalTeamId] = useState<number | null>(null);
	const [endIntent, setEndIntent] = useState<EventMatchEndIntent | null>(null);
	const [colorTeam, setColorTeam] = useState<ChampionshipEventTeam | null>(
		null,
	);
	const busy =
		starting || savingPlayer || savingGoal || undoing || ending || pausing;
	const elapsedSeconds = useMatchClock(match);
	const canStartSelected = canConfirmMatchTeams(selected);

	if (!match) {
		return (
			<div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
				<ul className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
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
									onLongPress={() => {
										if (starting) {
											return;
										}

										setColorTeam(team);
									}}
								/>
							</li>
						);
					})}
				</ul>
				<div className="shrink-0 space-y-2 pt-2">
					{startError && <p className={ERROR_CLASS}>{startError}</p>}
					<div className="flex justify-end">
						<Button
							className="w-full md:w-auto"
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
				</div>
				{colorTeam && (
					<EventTeamColorModal
						color={colorTeam.color}
						usedColors={event.teams
							.filter((team) => team.id !== colorTeam.id)
							.flatMap((team) => (team.color === null ? [] : [team.color]))}
						isPending={savingColor}
						errorMessage={colorError}
						onCancel={() => {
							if (savingColor) {
								return;
							}

							setColorTeam(null);
						}}
						onSelect={async (color) => {
							if (color === colorTeam.color) {
								setColorTeam(null);
								return;
							}

							try {
								await onChangeTeamColor(colorTeam.id, color);
								setColorTeam(null);
							} catch {
								return;
							}
						}}
					/>
				)}
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
	const winnerLabel = matchEndWinnerLabel(
		matchWinnerTeamId(
			match.team_a_id,
			match.team_b_id,
			score.teamA,
			score.teamB,
		),
		match.team_a_id,
		starA,
		starB,
	);
	const ownGoalPlayers = ownGoalTeamId
		? matchActiveTeamPlayers(match.players, ownGoalTeamId).map((row) =>
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
		<div className="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden">
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
			/>
			<div className="flex shrink-0 flex-col gap-2">
				<div className={MATCH_GOAL_TIMELINE_GRID_CLASS}>
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
				</div>
				<MatchClockBar
					elapsedSeconds={elapsedSeconds}
					started={matchClockIsStarted(match)}
					paused={matchClockIsPaused(match)}
					busy={busy}
					onStartClock={() => {
						if (busy) {
							return;
						}

						void onStartClock();
					}}
					onPause={() => {
						if (busy) {
							return;
						}

						void onPause();
					}}
					onResume={() => {
						if (busy) {
							return;
						}

						void onResume();
					}}
				/>
				<div className="max-h-16 overflow-y-auto">
					<div className={MATCH_GOAL_TIMELINE_GRID_CLASS}>
						<MatchGoalTimeline
							goals={match.goals}
							teamAPlayerIds={teamAIds}
							undoDisabled={busy}
							onUndoGoal={(goalId) => {
								if (busy) {
									return;
								}

								void onUndoGoal(goalId);
							}}
							playerName={(playerId) => {
								const row = matchPlayerById.get(playerId);
								return playerVisibleName(
									resolvePlayer(playerId, row?.display_name ?? "", rosterById),
								);
							}}
						/>
					</div>
				</div>
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
			/>
			{(playerError || goalError || undoError || endError || clockError) && (
				<p className={`shrink-0 ${ERROR_CLASS}`}>
					{playerError || goalError || undoError || endError || clockError}
				</p>
			)}
			<div className="grid shrink-0 grid-cols-2 gap-2">
				<Button
					variant={BUTTON_VARIANT.ghost}
					className="h-14 text-base"
					disabled={busy}
					onClick={() => {
						if (busy) {
							return;
						}

						setEndIntent(EVENT_MATCH_END_INTENT.end);
					}}
				>
					{EVENT_ACTION.endMatch}
				</Button>
				<Button
					className="h-14 text-base"
					disabled={busy}
					onClick={() => {
						if (busy) {
							return;
						}

						setEndIntent(EVENT_MATCH_END_INTENT.next);
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
						const occupied = matchTeamSlots(
							match.players,
							slotTarget.teamId,
							event.players_per_team,
						)[slotTarget.slot];
						if (!occupied) {
							await onSetPlayer(slotTarget.teamId, slotTarget.slot, playerId);
							setSlotTarget(null);
							return;
						}

						setPendingSwap({
							teamId: slotTarget.teamId,
							slot: slotTarget.slot,
							incomingPlayerId: playerId,
							outgoingName: playerVisibleName(
								resolvePlayer(
									occupied.player_id,
									occupied.display_name,
									rosterById,
								),
							),
						});
						setSlotTarget(null);
					}}
				/>
			)}
			{pendingSwap && (
				<ChampionshipEventSubstitutionModal
					playerName={pendingSwap.outgoingName}
					isPending={savingPlayer}
					errorMessage={playerError}
					onCancel={() => {
						if (savingPlayer) {
							return;
						}

						setPendingSwap(null);
					}}
					onConfirm={(includeStats) => {
						void (async () => {
							try {
								await onSetPlayer(
									pendingSwap.teamId,
									pendingSwap.slot,
									pendingSwap.incomingPlayerId,
									includeStats,
								);
								setPendingSwap(null);
							} catch {
								return;
							}
						})();
					}}
				/>
			)}
			{endIntent && (
				<EndEventMatchModal
					intent={endIntent}
					scoreLabel={formatMatchScore(score.teamA, score.teamB)}
					winnerLabel={winnerLabel}
					isPending={ending}
					errorMessage={endError}
					onCancel={() => {
						if (ending) {
							return;
						}

						setEndIntent(null);
					}}
					onConfirm={() => {
						void (async () => {
							try {
								switch (endIntent) {
									case EVENT_MATCH_END_INTENT.end:
										await onEnd();
										break;
									case EVENT_MATCH_END_INTENT.next:
										await onNext();
										break;
									default: {
										const _exhaustive: never = endIntent;
										return _exhaustive;
									}
								}
								setEndIntent(null);
							} catch {
								return;
							}
						})();
					}}
				/>
			)}
		</div>
	);
}
