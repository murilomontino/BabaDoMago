import { ArrowLeftRight, ChevronDown, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/button";
import { ChampionshipEventBenchModal } from "@/components/championship-event-bench-modal";
import { ChampionshipEventGoalModal } from "@/components/championship-event-goal-modal";
import { ChampionshipEventSubstitutionModal } from "@/components/championship-event-substitution-modal";
import { EndEventMatchModal } from "@/components/end-event-match-modal";
import { EventTeamColorModal } from "@/components/event-team-color-modal";
import {
	EVENT_TEAM_CHIP_TIP,
	EVENT_TEAM_PLAYER_SLOT_CLASS,
	EVENT_TEAM_POSITION_CHIP_CLASS,
	EventTeamChip,
	EventTeamColorDot,
	EventTeamPlayerAvatar,
	EventTeamPlayerRow,
	EventTeamRatingAverage,
} from "@/components/event-team-player";
import { GoalkeeperGlovesIcon } from "@/components/goalkeeper-gloves-icon";
import {
	isMatchClockDebugVisible,
	MatchClockDebug,
} from "@/components/match-clock-debug";
import {
	MATCH_GOAL_TIMELINE_GRID_CLASS,
	MatchGoalTimeline,
} from "@/components/molecules/match-goal-timeline";
import {
	OWN_GOAL_LABEL_POSITION,
	OwnGoalIcon,
	type OwnGoalLabelPosition,
	SoccerBallIcon,
} from "@/components/soccer-ball-icon";
import {
	attendanceGoalkeeperIds,
	EVENT_ACTION,
	EVENT_TEAM_MESSAGE,
	EVENT_TEAM_POSITION_LABEL,
	eventTeamPlayerPosition,
	eventTeamSlotPosition,
	eventTeamsSharePlayers,
} from "@/const/championship-event";
import {
	canConfirmMatchTeams,
	EVENT_GOAL_LABEL,
	EVENT_MATCH_CLOCK_LABEL,
	EVENT_MATCH_END_INTENT,
	EVENT_MATCH_LABEL,
	EVENT_MATCH_TEAM_PREVIEW,
	type EventMatchEndIntent,
	formatMatchClock,
	formatMatchScore,
	MATCH_CLOCK_ACTION,
	type MatchClockAction,
	matchActiveTeamPlayers,
	matchAssistCandidates,
	matchBenchPlayerIds,
	matchClockElapsedSeconds,
	matchClockIsPaused,
	matchClockIsStarted,
	matchEndWinnerLabel,
	matchGoalPayload,
	matchScore,
	matchTeamSlots,
	matchTeamStarName,
	matchWinnerTeamId,
	mergeMatchClock,
	sortBenchForSlot,
	toggleMatchTeamSelection,
} from "@/const/championship-event-match";
import { CHAMPIONSHIP_ROLE } from "@/const/championship-role";
import {
	type EventTeamColor,
	eventTeamColorStyle,
	eventTeamName,
	usedEventTeamColors,
} from "@/const/event-team-color";
import { playerVisibleName } from "@/const/player-name";
import { championshipRatingCeiling } from "@/const/player-rating";
import { BUTTON_VARIANT, ERROR_CLASS } from "@/const/ui";
import {
	matchClockFromStore,
	useMatchClockStore,
} from "@/hooks/match-clock-store";
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

function slotActionTitle(
	match: ChampionshipEventMatch,
	slotTarget: SlotTarget | null,
	playersPerTeam: number,
): string {
	if (!slotTarget) {
		return EVENT_ACTION.fillSlot;
	}

	const occupied = matchTeamSlots(
		match.players,
		slotTarget.teamId,
		playersPerTeam,
	)[slotTarget.slot];
	if (occupied) {
		return EVENT_ACTION.swapPlayer;
	}

	return EVENT_ACTION.fillSlot;
}

function pickOrderFromIndex(pickIndex: number): number | null {
	if (pickIndex < 0) {
		return null;
	}

	return pickIndex + 1;
}

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
		nickname_tags: [],
		avatar_url: null,
		rating: 0,
		role: CHAMPIONSHIP_ROLE.member,
		is_goalkeeper: false,
		deleted_at: null,
		goals: 0,
		assists: 0,
		assisted_goals: 0,
		own_goals: 0,
		wins: 0,
		losses: 0,
		draws: 0,
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

function matchSlotPlayer(
	row: ChampionshipEventMatchPlayer | null,
	rosterById: Map<number, ChampionshipPlayer>,
): ChampionshipPlayer | null {
	if (row === null) {
		return null;
	}

	return resolvePlayer(row.player_id, row.display_name, rosterById);
}

function matchSlotPosition(
	row: ChampionshipEventMatchPlayer | null,
	slot: number,
) {
	if (row === null) {
		return eventTeamSlotPosition(slot);
	}

	return eventTeamPlayerPosition(row.is_goalkeeper);
}

function ownGoalTeamPlayers(
	ownGoalTeamId: number | null | undefined,
	matchPlayers: ChampionshipEventMatch["players"],
	rosterById: Map<number, ChampionshipPlayer>,
): ChampionshipPlayer[] {
	if (!ownGoalTeamId) {
		return [];
	}

	return matchActiveTeamPlayers(matchPlayers, ownGoalTeamId).map((row) =>
		resolvePlayer(row.player_id, row.display_name, rosterById),
	);
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
	onStart: (teamAId: number, teamBId: number) => Promise<void>;
	onSetPlayer: (
		teamId: number,
		slot: number,
		playerId: number | null,
		includeStats?: boolean,
	) => Promise<void>;
	onSetGoalkeeper: (teamId: number, playerId: number) => Promise<void>;
	onAddGoal: (values: {
		scorerPlayerId: number;
		assistPlayerId: number | null;
		isOwnGoal: boolean;
		elapsedSeconds: number | null;
	}) => Promise<void>;
	onUndoGoal: (goalId: number) => Promise<void>;
	onEnd: () => Promise<void>;
	onNext: () => Promise<void>;
	onStartClock: () => void;
	onPause: () => void;
	onResume: () => void;
	onChangeTeamColor: (
		teamId: number,
		color: EventTeamColor | null,
	) => Promise<void>;
	savingColor: boolean;
	colorError: string | null;
};

const TEAM_CARD_LONG_PRESS_MS = 500;
const TEAM_CARD_LONG_PRESS_MOVE_PX = 8;
const TEAM_PICK_EXPAND_TRANSITION =
	"duration-300 ease-out motion-reduce:transition-none";

function TeamPick({
	team,
	selected,
	pickOrder,
	rosterById,
	ceiling,
	presentRatings,
	onSelect,
	onLongPress,
}: {
	team: ChampionshipEventTeam;
	selected: boolean;
	pickOrder: number | null;
	rosterById: Map<number, ChampionshipPlayer>;
	ceiling: number;
	presentRatings: readonly number[];
	onSelect: () => void;
	onLongPress: () => void;
}) {
	const [expanded, setExpanded] = useState(false);
	const timerRef = useRef<number | null>(null);
	const originRef = useRef<{ x: number; y: number } | null>(null);
	const skipClickRef = useRef(false);
	const openedRef = useRef(false);
	const style = eventTeamColorStyle(team.color);
	const teamRoster = team.players.map((row) => ({
		row,
		player: resolvePlayer(row.player_id, row.display_name, rosterById),
	}));
	const canExpand = teamRoster.length > EVENT_MATCH_TEAM_PREVIEW.players;
	const previewRoster = teamRoster.slice(0, EVENT_MATCH_TEAM_PREVIEW.players);
	const extraRoster = teamRoster.slice(EVENT_MATCH_TEAM_PREVIEW.players);

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
		<div
			className={`relative w-full overflow-hidden rounded-lg border bg-surface text-sm ${
				selected ? "border-pitch ring-2 ring-pitch" : "border-line"
			}`}
			style={style}
		>
			<EventTeamColorDot color={team.color} />
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
				className="w-full select-none px-2 pt-2 text-left touch-manipulation"
			>
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
					{previewRoster.map(({ row, player }) => {
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
				{canExpand && (
					<div
						className={`grid transition-[grid-template-rows] ${TEAM_PICK_EXPAND_TRANSITION} ${
							expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
						}`}
					>
						<ul className="min-h-0 space-y-1 overflow-hidden pt-1">
							{extraRoster.map(({ row, player }) => {
								const position = eventTeamPlayerPosition(row.is_goalkeeper);

								return (
									<li key={row.id} className={EVENT_TEAM_PLAYER_SLOT_CLASS}>
										<span
											className={`${EVENT_TEAM_POSITION_CHIP_CLASS} shrink-0`}
										>
											{EVENT_TEAM_POSITION_LABEL[position]}
										</span>
										<EventTeamPlayerRow player={player} ceiling={ceiling} />
									</li>
								);
							})}
						</ul>
					</div>
				)}
			</button>
			<div className="flex items-center justify-between gap-1 px-2 pb-2 pt-1">
				{canExpand && (
					<button
						type="button"
						aria-expanded={expanded}
						className="inline-flex items-center gap-1 text-xs font-medium text-fg-muted"
						onClick={() => {
							setExpanded((open) => !open);
						}}
					>
						{expanded && EVENT_MATCH_LABEL.showLess}
						{!expanded && EVENT_MATCH_LABEL.showMore}
						<ChevronDown
							className={`size-3.5 shrink-0 transition-transform ${TEAM_PICK_EXPAND_TRANSITION} ${
								expanded ? "rotate-180" : ""
							}`}
						/>
					</button>
				)}
				<div className="ml-auto [&>p]:mt-0">
					<EventTeamRatingAverage
						ratings={teamRoster.map(({ player }) => player.rating)}
						presentRatings={presentRatings}
					/>
				</div>
			</div>
		</div>
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
	onSetGoalkeeper,
	onEditSlot,
}: {
	color: EventTeamColor | null;
	sortOrder: number;
	slots: readonly (ChampionshipEventMatchPlayer | null)[];
	rosterById: Map<number, ChampionshipPlayer>;
	disabled: boolean;
	onMarkGoal: (player: ChampionshipEventMatchPlayer) => void;
	onSetGoalkeeper: (player: ChampionshipEventMatchPlayer) => void;
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
						const player = matchSlotPlayer(row, rosterById);
						const position = matchSlotPosition(row, slot);

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
										<span className="flex min-w-0 flex-1 items-center gap-1.5">
											<EventTeamPlayerAvatar player={player} />
											<span className="min-w-0 flex-1 truncate text-left text-xs font-medium">
												{playerVisibleName(player)}
											</span>
										</span>
										<SoccerBallIcon className="size-4 shrink-0" />
									</button>
								)}
								{!player && (
									<p className="min-w-0 flex-1 truncate text-xs text-fg-muted">
										{EVENT_MATCH_LABEL.emptySlot}
									</p>
								)}
								{row && !row.is_goalkeeper && (
									<Button
										variant={BUTTON_VARIANT.ghost}
										className="h-7 shrink-0 px-1.5"
										aria-label={EVENT_ACTION.setGoalkeeper}
										disabled={disabled}
										onClick={() => onSetGoalkeeper(row)}
									>
										<GoalkeeperGlovesIcon className="size-4" />
									</Button>
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

function OwnGoalButton({
	disabled,
	labelPosition,
	onClick,
}: {
	disabled: boolean;
	labelPosition: OwnGoalLabelPosition;
	onClick: () => void;
}) {
	const label = (
		<span
			className="text-xs font-medium leading-none text-danger-fg"
			aria-hidden="true"
		>
			{EVENT_GOAL_LABEL.ownGoalShort}
		</span>
	);

	return (
		<button
			type="button"
			aria-label={EVENT_GOAL_LABEL.ownGoal}
			disabled={disabled}
			className="inline-flex shrink-0 items-center gap-0.5 hover:opacity-80 disabled:opacity-50"
			onClick={onClick}
		>
			{labelPosition === OWN_GOAL_LABEL_POSITION.start && label}
			<OwnGoalIcon className="size-3.5" />
			{labelPosition === OWN_GOAL_LABEL_POSITION.end && label}
		</button>
	);
}

function matchClockBarAction(
	started: boolean,
	paused: boolean,
): MatchClockAction {
	if (!started) {
		return MATCH_CLOCK_ACTION.start;
	}

	if (paused) {
		return MATCH_CLOCK_ACTION.resume;
	}

	return MATCH_CLOCK_ACTION.pause;
}

function MatchClockBar({
	match,
	busy,
	onStartClock,
	onPause,
	onResume,
}: {
	match: ChampionshipEventMatch;
	busy: boolean;
	onStartClock: () => void;
	onPause: () => void;
	onResume: () => void;
}) {
	const elapsedSeconds = useMatchClock(match);
	const started = matchClockIsStarted(match);
	const paused = matchClockIsPaused(match);
	const action = matchClockBarAction(started, paused);
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
	onStart,
	onSetPlayer,
	onSetGoalkeeper,
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
	const presentRatings = event.attendance.map(
		(row) => rosterById.get(row.player_id)?.rating ?? row.rating,
	);
	const [selected, setSelected] = useState<number[]>([]);
	const [slotTarget, setSlotTarget] = useState<SlotTarget | null>(null);
	const [pendingSwap, setPendingSwap] = useState<PendingSwap | null>(null);
	const [goalTarget, setGoalTarget] = useState<GoalTarget | null>(null);
	const [ownGoalTeamId, setOwnGoalTeamId] = useState<number | null>(null);
	const resumeOnCloseRef = useRef(false);
	const goalElapsedRef = useRef(0);
	const localClock = useMatchClockStore((state) =>
		matchClockFromStore(state.clocks, match?.id ?? null),
	);

	useEffect(() => {
		if (!match?.ended_at) {
			return;
		}

		useMatchClockStore.getState().clear(match.id);
	}, [match?.ended_at, match?.id]);
	const [endIntent, setEndIntent] = useState<EventMatchEndIntent | null>(null);
	const [colorTeam, setColorTeam] = useState<ChampionshipEventTeam | null>(
		null,
	);
	const busy = starting || savingPlayer || savingGoal || undoing || ending;
	const canStartSelected = canConfirmMatchTeams(selected);
	const selectedTeamA = event.teams.find((team) => team.id === selected[0]);
	const selectedTeamB = event.teams.find((team) => team.id === selected[1]);
	const sharedPlayersError =
		selectedTeamA &&
		selectedTeamB &&
		eventTeamsSharePlayers(selectedTeamA.players, selectedTeamB.players)
			? EVENT_TEAM_MESSAGE.sharedPlayers
			: null;

	const selectableTeams = event.teams;

	if (!match) {
		return (
			<div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
				<p className="mb-2 shrink-0 text-sm font-medium text-fg">
					{EVENT_MATCH_LABEL.selectTeams}
				</p>
				<ul className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
					{selectableTeams.map((team) => {
						const pickOrder = pickOrderFromIndex(selected.indexOf(team.id));

						return (
							<li key={team.id}>
								<TeamPick
									team={team}
									selected={pickOrder !== null}
									pickOrder={pickOrder}
									rosterById={rosterById}
									ceiling={ceiling}
									presentRatings={presentRatings}
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
					{(startError || sharedPlayersError) && (
						<p className={ERROR_CLASS}>{startError ?? sharedPlayersError}</p>
					)}
					<div className="flex justify-end">
						<Button
							className="w-full md:w-auto"
							disabled={
								starting || !canStartSelected || Boolean(sharedPlayersError)
							}
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
							.flatMap((team) => usedEventTeamColors(team.color))}
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
	const ownGoalPlayers = ownGoalTeamPlayers(
		ownGoalTeamId,
		match.players,
		rosterById,
	);
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
	const volunteerGoalkeeperIds = new Set(
		attendanceGoalkeeperIds(event.attendance),
	);
	const slotTitle = slotActionTitle(match, slotTarget, event.players_per_team);
	const clockMatch = mergeMatchClock(match, localClock);
	const goalModalOpen = goalTarget !== null || ownGoalTeamId !== null;

	function beginGoalClockHold() {
		const running =
			matchClockIsStarted(clockMatch) && !matchClockIsPaused(clockMatch);
		goalElapsedRef.current = matchClockElapsedSeconds(clockMatch, Date.now());
		resumeOnCloseRef.current = running;
		if (!running) {
			return;
		}

		void onPause();
	}

	function endGoalClockHold() {
		if (!resumeOnCloseRef.current) {
			return;
		}

		resumeOnCloseRef.current = false;
		void onResume();
	}

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

					beginGoalClockHold();
					setGoalTarget({ teamId: match.team_a_id, player });
				}}
				onSetGoalkeeper={(player) => {
					if (busy) {
						return;
					}

					void onSetGoalkeeper(match.team_a_id, player.player_id);
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
					<div className="flex min-w-0 items-center gap-1">
						<OwnGoalButton
							disabled={busy}
							labelPosition={OWN_GOAL_LABEL_POSITION.end}
							onClick={() => {
								if (busy) {
									return;
								}

								beginGoalClockHold();
								setOwnGoalTeamId(match.team_a_id);
							}}
						/>
						<p className="min-w-0 flex-1 truncate text-right text-sm font-medium text-fg">
							{starA}
						</p>
						<EventTeamChip
							color={teamA.color}
							sortOrder={teamA.sort_order}
							tip={EVENT_TEAM_CHIP_TIP.end}
						/>
					</div>
					<p className="text-2xl font-semibold tabular-nums text-fg">
						{formatMatchScore(score.teamA, score.teamB)}
					</p>
					<div className="flex min-w-0 items-center gap-1">
						<EventTeamChip
							color={teamB.color}
							sortOrder={teamB.sort_order}
							tip={EVENT_TEAM_CHIP_TIP.start}
						/>
						<p className="min-w-0 flex-1 truncate text-sm font-medium text-fg">
							{starB}
						</p>
						<OwnGoalButton
							disabled={busy}
							labelPosition={OWN_GOAL_LABEL_POSITION.start}
							onClick={() => {
								if (busy) {
									return;
								}

								beginGoalClockHold();
								setOwnGoalTeamId(match.team_b_id);
							}}
						/>
					</div>
				</div>
				<MatchClockBar
					match={clockMatch}
					busy={busy || goalModalOpen}
					onStartClock={() => {
						if (busy || goalModalOpen) {
							return;
						}

						void onStartClock();
					}}
					onPause={() => {
						if (busy || goalModalOpen) {
							return;
						}

						void onPause();
					}}
					onResume={() => {
						if (busy || goalModalOpen) {
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

					beginGoalClockHold();
					setGoalTarget({ teamId: match.team_b_id, player });
				}}
				onSetGoalkeeper={(player) => {
					if (busy) {
						return;
					}

					void onSetGoalkeeper(match.team_b_id, player.player_id);
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
					).map((row) =>
						resolvePlayer(row.player_id, row.display_name, rosterById),
					)}
					isPending={savingGoal}
					errorMessage={goalError}
					onCancel={() => {
						if (savingGoal) {
							return;
						}

						setGoalTarget(null);
						void endGoalClockHold();
					}}
					onConfirm={async (values) => {
						const payload = matchGoalPayload({
							scorerPlayerId: goalTarget.player.player_id,
							kind: values.kind,
							assistPlayerId: values.assistPlayerId,
						});
						await onAddGoal({
							...payload,
							elapsedSeconds: goalElapsedRef.current,
						});
						setGoalTarget(null);
						endGoalClockHold();
					}}
				/>
			)}
			{ownGoalTeamId !== null && (
				<ChampionshipEventBenchModal
					title={EVENT_GOAL_LABEL.ownGoal}
					players={ownGoalPlayers}
					ceiling={ceiling}
					emptyMessage={EVENT_MATCH_LABEL.emptyTeam}
					isPending={savingGoal}
					errorMessage={goalError}
					onCancel={() => {
						if (savingGoal) {
							return;
						}

						setOwnGoalTeamId(null);
						void endGoalClockHold();
					}}
					onSelect={async (playerId) => {
						await onAddGoal({
							scorerPlayerId: playerId,
							assistPlayerId: null,
							isOwnGoal: true,
							elapsedSeconds: goalElapsedRef.current,
						});
						setOwnGoalTeamId(null);
						endGoalClockHold();
					}}
				/>
			)}
			{slotTarget && (
				<ChampionshipEventBenchModal
					title={slotTitle}
					players={sortBenchForSlot(
						benchPlayers,
						slotTarget.slot,
						(playerId) =>
							rosterById.get(playerId)?.is_goalkeeper === true ||
							volunteerGoalkeeperIds.has(playerId),
					)}
					ceiling={ceiling}
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
										useMatchClockStore.getState().clear(match.id);
										await onEnd();
										break;
									case EVENT_MATCH_END_INTENT.next:
										useMatchClockStore.getState().clear(match.id);
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
			{isMatchClockDebugVisible() && <MatchClockDebug matchId={match.id} />}
		</div>
	);
}
