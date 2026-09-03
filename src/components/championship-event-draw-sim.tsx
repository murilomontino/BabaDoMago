import { LoaderCircle, Share2, Shuffle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/button";
import { EventAttendanceTable } from "@/components/event-attendance-table";
import {
	EVENT_TEAM_PLAYER_SLOT_CLASS,
	EVENT_TEAM_POSITION_CHIP_CLASS,
	EventTeamColorDot,
	EventTeamPlayerRow,
	EventTeamRatingAverage,
} from "@/components/event-team-player";
import {
	type AttendanceSeedMode,
	applyVisibleAttendance,
	builderTeamsFromDrafts,
	builderTeamsHavePlayers,
	defaultGoalkeeperIds,
	EVENT_TEAM_MESSAGE,
	EVENT_TEAM_POSITION_LABEL,
	type EventTeamBuilderTeam,
	type EventWeekday,
	eventGoalkeeperIds,
	eventTeamSlotPosition,
	keepGoalkeepersPresent,
	seedPresentIdsFromHistory,
	setGoalkeeperSelection,
	teamSlotsToPlayerIds,
	validateEventAttendance,
	validateEventTeams,
	validateTeamsInAttendance,
} from "@/const/championship-event";
import {
	drawSimSeedWeekday,
	EVENT_DRAW_SIM_LABEL,
	EVENT_DRAW_SIM_MODE,
	type EventDrawSimMode,
} from "@/const/event-draw-sim";
import { eventTeamColorStyle, eventTeamName } from "@/const/event-team-color";
import {
	EVENT_TEAM_SHARE_LABEL,
	eventTeamsShareCards,
} from "@/const/event-team-share";
import { championshipRatingCeiling } from "@/const/player-rating";
import { BUTTON_VARIANT, CARD_CLASS, ERROR_CLASS } from "@/const/ui";
import { runEventTeamDraw } from "@/lib/event-team-draw";
import { runEventTeamPotDraw } from "@/lib/event-team-pot-draw";
import { shareEventTeamsImage } from "@/lib/share-event-teams-image";
import type { ChampionshipPlayer } from "@/types/championship";
import type { ChampionshipEvent } from "@/types/championship-event";

type ChampionshipEventDrawSimProps = {
	players: ChampionshipPlayer[];
	championshipName: string;
	playersPerTeam: number;
	eventWeekday?: number | null;
	attendanceCounts: ReadonlyMap<number, number>;
	seedEvents?: readonly ChampionshipEvent[];
};

function drawSimButtonLabel(
	isDrawing: boolean,
	mode: EventDrawSimMode,
	buttonMode: EventDrawSimMode,
): string {
	if (isDrawing && mode === buttonMode) {
		return EVENT_DRAW_SIM_LABEL.drawing;
	}

	if (buttonMode === EVENT_DRAW_SIM_MODE.pots) {
		return EVENT_DRAW_SIM_LABEL.drawPots;
	}

	return EVENT_DRAW_SIM_LABEL.drawBalanced;
}

function DrawSimTeamCard({
	team,
	teamIndex,
	presentById,
	goalkeeperIds,
	ceiling,
	presentRatings,
}: {
	team: EventTeamBuilderTeam;
	teamIndex: number;
	presentById: ReadonlyMap<number, ChampionshipPlayer>;
	goalkeeperIds: readonly number[];
	ceiling: number;
	presentRatings: readonly number[];
}) {
	const cardStyle = eventTeamColorStyle(team.color);
	const playerIds = teamSlotsToPlayerIds(team.slots);
	const ratings = playerIds.flatMap((playerId) => {
		const player = presentById.get(playerId);
		if (!player) {
			return [];
		}

		return [player.rating];
	});

	return (
		<article
			className="relative rounded-lg border border-line bg-surface p-2 text-sm"
			style={cardStyle}
		>
			<EventTeamColorDot color={team.color} />
			<p className="mb-1 pr-5 text-xs font-medium">
				{eventTeamName(team.color, teamIndex)}
			</p>
			<ul className="space-y-1">
				{team.slots.flatMap((slotValue, slot) => {
					if (!slotValue) {
						return [];
					}

					const player = presentById.get(Number(slotValue));
					if (!player) {
						return [];
					}

					return [
						<li
							key={`${team.key}-player-${player.id}`}
							className={EVENT_TEAM_PLAYER_SLOT_CLASS}
						>
							<span className={`${EVENT_TEAM_POSITION_CHIP_CLASS} shrink-0`}>
								{EVENT_TEAM_POSITION_LABEL[eventTeamSlotPosition(slot)]}
							</span>
							<EventTeamPlayerRow
								player={player}
								ceiling={ceiling}
								isGoalkeeperVolunteer={
									slot !== 0 && goalkeeperIds.includes(player.id)
								}
							/>
						</li>,
					];
				})}
			</ul>
			<EventTeamRatingAverage
				ratings={ratings}
				presentRatings={presentRatings}
			/>
		</article>
	);
}

export function ChampionshipEventDrawSim({
	players,
	championshipName,
	playersPerTeam,
	eventWeekday = null,
	attendanceCounts,
	seedEvents = [],
}: ChampionshipEventDrawSimProps) {
	const [presentIds, setPresentIds] = useState<number[]>([]);
	const [goalkeeperIds, setGoalkeeperIds] = useState(() =>
		eventGoalkeeperIds(defaultGoalkeeperIds(players), []),
	);
	const [teams, setTeams] = useState<EventTeamBuilderTeam[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const [drawingMode, setDrawingMode] = useState<EventDrawSimMode | null>(null);
	const [isSharing, setIsSharing] = useState(false);
	const drawWorkerRef = useRef<Worker | null>(null);

	const rosterIds = players.map((player) => player.id);
	const seedWeekday: EventWeekday | null = drawSimSeedWeekday(eventWeekday);
	const ceiling = championshipRatingCeiling(
		players.map((player) => player.rating),
	);
	const presentPlayers = players.filter((player) =>
		presentIds.includes(player.id),
	);
	const presentById = new Map(
		presentPlayers.map((player) => [player.id, player]),
	);
	const presentRatings = presentPlayers.map((player) => player.rating);
	const presentGoalkeeperIds = keepGoalkeepersPresent(
		goalkeeperIds,
		presentIds,
	);
	const hasTeams = builderTeamsHavePlayers(teams);
	const busy = isDrawing || isSharing;

	useEffect(() => {
		return () => {
			drawWorkerRef.current?.terminate();
			drawWorkerRef.current = null;
		};
	}, []);

	function handleSetPresent(playerIds: readonly number[], present: boolean) {
		setPresentIds((current) =>
			applyVisibleAttendance(current, playerIds, present),
		);
		setTeams([]);
		setError(null);
	}

	function handleSetGoalkeeper(
		playerIds: readonly number[],
		asGoalkeeper: boolean,
	) {
		setGoalkeeperIds((current) =>
			setGoalkeeperSelection(current, playerIds, asGoalkeeper),
		);
		setError(null);
	}

	function handleSeedAttendance(mode: AttendanceSeedMode) {
		setPresentIds(
			seedPresentIdsFromHistory(mode, seedEvents, rosterIds, {
				weekday: seedWeekday,
			}),
		);
		setTeams([]);
		setError(null);
	}

	async function runDraw(mode: EventDrawSimMode) {
		const attendanceInvalid = validateEventAttendance(presentIds, rosterIds);
		if (attendanceInvalid) {
			setError(attendanceInvalid);
			return;
		}

		setIsDrawing(true);
		setDrawingMode(mode);
		setError(null);
		try {
			const input = {
				players: presentPlayers.map(({ id, rating }) => ({ id, rating })),
				playersPerTeam,
				volunteerIds: presentGoalkeeperIds,
			};
			const { worker, done } =
				mode === EVENT_DRAW_SIM_MODE.pots
					? runEventTeamPotDraw(input)
					: runEventTeamDraw(input);
			drawWorkerRef.current = worker;
			const { teams: drafts } = await done;
			const teamsInvalid =
				validateEventTeams(drafts, playersPerTeam) ??
				validateTeamsInAttendance(drafts, presentIds);
			if (teamsInvalid) {
				setError(teamsInvalid);
				setTeams([]);
				return;
			}

			setTeams(builderTeamsFromDrafts(drafts, playersPerTeam));
		} catch {
			setError(EVENT_DRAW_SIM_LABEL.drawFailed);
			setTeams([]);
		} finally {
			drawWorkerRef.current?.terminate();
			drawWorkerRef.current = null;
			setIsDrawing(false);
			setDrawingMode(null);
		}
	}

	async function handleShareTeams() {
		setIsSharing(true);
		setError(null);
		try {
			await shareEventTeamsImage(
				eventTeamsShareCards(teams, presentPlayers),
				ceiling,
				{
					championshipName,
					startsAt: new Date().toISOString(),
				},
			);
		} catch {
			setError(EVENT_TEAM_SHARE_LABEL.shareFailed);
		} finally {
			setIsSharing(false);
		}
	}

	return (
		<section className="space-y-4">
			<div className={CARD_CLASS}>
				<p className="text-sm font-medium text-fg">
					{EVENT_DRAW_SIM_LABEL.title}
				</p>
				<p className="mt-1 text-sm text-fg-muted">
					{EVENT_DRAW_SIM_LABEL.hint}
				</p>
			</div>

			<EventAttendanceTable
				players={players}
				attendanceCounts={attendanceCounts}
				presentIds={presentIds}
				goalkeeperIds={goalkeeperIds}
				onSetPresent={handleSetPresent}
				onSetGoalkeeper={handleSetGoalkeeper}
				onSeedAttendance={handleSeedAttendance}
			/>

			<div className="flex flex-wrap gap-2">
				<Button
					variant={BUTTON_VARIANT.secondary}
					disabled={busy}
					onClick={() => {
						void runDraw(EVENT_DRAW_SIM_MODE.balanced);
					}}
				>
					{isDrawing && drawingMode === EVENT_DRAW_SIM_MODE.balanced && (
						<LoaderCircle className="size-4 animate-spin" aria-hidden />
					)}
					{!(isDrawing && drawingMode === EVENT_DRAW_SIM_MODE.balanced) && (
						<Shuffle className="size-4" />
					)}
					{drawSimButtonLabel(
						isDrawing,
						drawingMode ?? EVENT_DRAW_SIM_MODE.balanced,
						EVENT_DRAW_SIM_MODE.balanced,
					)}
				</Button>
				<Button
					variant={BUTTON_VARIANT.secondary}
					disabled={busy}
					onClick={() => {
						void runDraw(EVENT_DRAW_SIM_MODE.pots);
					}}
				>
					{isDrawing && drawingMode === EVENT_DRAW_SIM_MODE.pots && (
						<LoaderCircle className="size-4 animate-spin" aria-hidden />
					)}
					{!(isDrawing && drawingMode === EVENT_DRAW_SIM_MODE.pots) && (
						<Shuffle className="size-4" />
					)}
					{drawSimButtonLabel(
						isDrawing,
						drawingMode ?? EVENT_DRAW_SIM_MODE.pots,
						EVENT_DRAW_SIM_MODE.pots,
					)}
				</Button>
				{hasTeams && (
					<Button
						variant={BUTTON_VARIANT.secondary}
						disabled={busy}
						onClick={() => {
							void handleShareTeams();
						}}
					>
						{isSharing && (
							<LoaderCircle className="size-4 animate-spin" aria-hidden />
						)}
						{!isSharing && <Share2 className="size-4" />}
						{isSharing && EVENT_TEAM_SHARE_LABEL.sharing}
						{!isSharing && EVENT_TEAM_SHARE_LABEL.shareTeams}
					</Button>
				)}
			</div>

			{error && <p className={ERROR_CLASS}>{error}</p>}

			{!hasTeams && !isDrawing && (
				<p className="text-sm text-fg-muted">
					{EVENT_DRAW_SIM_LABEL.emptyTeams}
				</p>
			)}

			{hasTeams && (
				<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
					{teams.map((team, teamIndex) => (
						<DrawSimTeamCard
							key={team.key}
							team={team}
							teamIndex={teamIndex}
							presentById={presentById}
							goalkeeperIds={presentGoalkeeperIds}
							ceiling={ceiling}
							presentRatings={presentRatings}
						/>
					))}
				</div>
			)}

			{isDrawing && (
				<p className="text-sm text-fg-muted" aria-live="polite">
					{EVENT_TEAM_MESSAGE.drawing}
				</p>
			)}
		</section>
	);
}
