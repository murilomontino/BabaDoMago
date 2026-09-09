import { useEffect, useReducer, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
	applyVisibleAttendance,
	builderTeamsFromDrafts,
	builderTeamsHavePlayers,
	defaultGoalkeeperIds,
	EVENT_BUILDER_STEP,
	EVENT_TEAM_MESSAGE,
	eventDrawInputRating,
	eventGoalkeeperIds,
	eventIsoWeekday,
	eventTeamCount,
	keepGoalkeepersPresent,
	resizeBuilderTeams,
	seedPresentIdsFromHistory,
	setGoalkeeperSelection,
	validateEventAttendance,
	validateEventTeams,
	validateTeamsInAttendance,
} from "@/const/championship-event";
import {
	EVENT_BUILDER_UI_INITIAL,
	eventBuilderUiReducer,
} from "@/const/event-builder-ui";
import { championshipRatingCeiling } from "@/const/player-rating";
import { eventDrawUrl } from "@/const/event-draw-reveal";
import { ROUTES } from "@/const/routes";
import { caughtErrorMessage } from "@/lib/error-message";
import { runEventTeamDraw } from "@/lib/event-team-draw";
import { shareEventTeamsImage } from "@/lib/share-event-teams-image";
import {
	EVENT_TEAM_SHARE_LABEL,
	eventTeamsShareCards,
} from "@/const/event-team-share";
import type { ChampionshipPlayer } from "@/types/championship";
import type {
	EventBuilderStep,
	EventTeamBuilderTeam,
	EventTeamDraft,
	AttendanceSeedMode,
	EventWeekday,
} from "@/const/championship-event";

type EventBuilderSeedEvent = {
	id: number;
	ended_at: string | null;
	starts_at: string;
	attendance: readonly { player_id: number }[];
};

type SaveAttendanceMutate = (presentPlayerIds: number[], goalkeeperPlayerIds: number[]) => Promise<void>;

type SubmitMutate = (
	values: {
		presentPlayerIds: number[];
		goalkeeperPlayerIds: number[];
		teams: EventTeamDraft[];
		isDraw?: boolean;
	},
	keepOpen?: boolean,
) => Promise<void>;

type UseEventBuilderUiArgs = {
	playersPerTeam: number;
	players: readonly ChampionshipPlayer[];
	seedEvents?: readonly EventBuilderSeedEvent[];
	startsAt: string;
	championshipName: string;
	championshipId: number;
	eventId: number;
	initialPresentIds?: readonly number[];
	initialGoalkeeperIds?: readonly number[];
	isPending: boolean;
	onStepChange: (step: EventBuilderStep) => void;
	onPresentIdsChange?: (playerIds: readonly number[]) => void;
	onAddPlayer?: (values: {
		displayNames: string[];
		rating: number;
		isGoalkeeper: boolean;
	}) => Promise<ChampionshipPlayer[]>;
	onSaveAttendance: SaveAttendanceMutate;
	onSubmit: SubmitMutate;
};

type SetTeams = (teams: EventTeamBuilderTeam[]) => void;

type OpenDrawRoute =
	| typeof ROUTES.championshipEventDraw
	| typeof ROUTES.championshipEventPotDraw;

export function useEventBuilderUi({
	playersPerTeam,
	players,
	seedEvents = [],
	startsAt,
	championshipName,
	championshipId,
	eventId,
	initialPresentIds = [],
	initialGoalkeeperIds = [],
	isPending,
	onStepChange,
	onPresentIdsChange,
	onAddPlayer,
	onSaveAttendance,
	onSubmit,
}: UseEventBuilderUiArgs) {
	const navigate = useNavigate();
	const [state, dispatch] = useReducer(eventBuilderUiReducer, {
		...EVENT_BUILDER_UI_INITIAL,
		presentIds: [...initialPresentIds],
		goalkeeperIds: eventGoalkeeperIds(
			defaultGoalkeeperIds(players),
			initialGoalkeeperIds,
		),
	});
	const drawSetTeamsRef = useRef<SetTeams | null>(null);
	const drawWorkerRef = useRef<Worker | null>(null);

	const rosterIds = players.map((player) => player.id);
	const seedWeekday: EventWeekday = eventIsoWeekday(startsAt);
	const ceiling = championshipRatingCeiling(
		players.flatMap((player) => [player.rating, player.goalkeeper_rating]),
	);
	const presentPlayers = players.filter((player) =>
		state.presentIds.includes(player.id),
	);
	const presentGoalkeeperIds = keepGoalkeepersPresent(
		state.goalkeeperIds,
		state.presentIds,
	);
	const busy = isPending || state.isDrawing || state.isOpeningDraw;

	useEffect(
		() => () => {
			drawWorkerRef.current?.terminate();
		},
		[],
	);

	function setPresentIds(nextPresentIds: readonly number[]) {
		dispatch({ type: "SET_PRESENT", presentIds: nextPresentIds });
		onPresentIdsChange?.(nextPresentIds);
	}

	function setGoalkeeperIds(nextGoalkeeperIds: readonly number[]) {
		dispatch({ type: "SET_GOALKEEPERS", goalkeeperIds: nextGoalkeeperIds });
	}

	function setAttendanceError(error: string | null) {
		if (error === null) {
			dispatch({ type: "CLEAR_ATTENDANCE_ERROR" });
			return;
		}

		dispatch({ type: "ATTENDANCE_ERROR", error });
	}

	function clearAttendanceError() {
		dispatch({ type: "CLEAR_ATTENDANCE_ERROR" });
	}

	function setTeamsError(error: string | null) {
		if (error === null) {
			dispatch({ type: "CLEAR_TEAMS_ERROR" });
			return;
		}

		dispatch({ type: "TEAMS_ERROR", error });
	}

	function clearTeamsError() {
		dispatch({ type: "CLEAR_TEAMS_ERROR" });
	}

	function handleSetPresent(playerIds: readonly number[], present: boolean) {
		const nextPresent = applyVisibleAttendance(state.presentIds, playerIds, present);
		setPresentIds(nextPresent);
	}

	function handleSeedAttendance(mode: AttendanceSeedMode) {
		const nextPresent = seedPresentIdsFromHistory(mode, seedEvents, rosterIds, {
			weekday: seedWeekday,
		});
		setPresentIds(nextPresent);
	}

	function handleSetGoalkeeper(
		playerIds: readonly number[],
		asGoalkeeper: boolean,
	) {
		const nextGoalkeepers = setGoalkeeperSelection(
			state.goalkeeperIds,
			playerIds,
			asGoalkeeper,
		);
		setGoalkeeperIds(nextGoalkeepers);
	}

	async function handleAddPlayer(values: {
		displayNames: string[];
		rating: number;
		isGoalkeeper: boolean;
	}): Promise<ChampionshipPlayer[]> {
		if (!onAddPlayer) {
			return [];
		}

		const created = await onAddPlayer(values);
		if (created.length === 0) {
			return created;
		}

		const createdIds = created.map((player) => player.id);
		handleSetPresent(createdIds, true);
		if (values.isGoalkeeper) {
			handleSetGoalkeeper(createdIds, true);
		}
		return created;
	}

	function tryGoToTeams(
		teams: EventTeamBuilderTeam[],
		setTeams: SetTeams,
	): boolean {
		const invalid = validateEventAttendance(state.presentIds, rosterIds);
		if (invalid) {
			dispatch({ type: "ATTENDANCE_ERROR", error: invalid });
			return false;
		}

		setTeams(
			resizeBuilderTeams(
				teams,
				eventTeamCount(state.presentIds.length, playersPerTeam),
				playersPerTeam,
				new Set(state.presentIds),
			),
		);
		dispatch({ type: "CLEAR_TEAMS_ERROR" });
		onStepChange(EVENT_BUILDER_STEP.teams);
		return true;
	}

	async function handleDrawTeams(setTeams: SetTeams): Promise<boolean> {
		const attendanceInvalid = validateEventAttendance(state.presentIds, rosterIds);
		if (attendanceInvalid) {
			dispatch({ type: "ATTENDANCE_ERROR", error: attendanceInvalid });
			onStepChange(EVENT_BUILDER_STEP.attendance);
			return false;
		}

		dispatch({ type: "DRAW_START" });
		try {
			const volunteerSet = new Set(presentGoalkeeperIds);
			const { worker, done } = runEventTeamDraw({
				players: presentPlayers.map((player) => ({
					id: player.id,
					rating: eventDrawInputRating(player, volunteerSet.has(player.id)),
				})),
				playersPerTeam,
				volunteerIds: presentGoalkeeperIds,
			});
			drawWorkerRef.current = worker;
			const { teams: drafts } = await done;
			const teamsInvalid =
				validateEventTeams(drafts, playersPerTeam) ??
				validateTeamsInAttendance(drafts, state.presentIds);
			if (teamsInvalid) {
				dispatch({ type: "TEAMS_ERROR", error: teamsInvalid });
				return false;
			}

			await onSubmit(
				{
					presentPlayerIds: state.presentIds,
					goalkeeperPlayerIds: presentGoalkeeperIds,
					teams: drafts,
					isDraw: true,
				},
				true,
			);
			setTeams(builderTeamsFromDrafts(drafts, playersPerTeam));
			dispatch({ type: "CLEAR_TEAMS_ERROR" });
			return true;
		} catch {
			dispatch({ type: "TEAMS_ERROR", error: EVENT_TEAM_MESSAGE.drawFailed });
			return false;
		} finally {
			drawWorkerRef.current?.terminate();
			drawWorkerRef.current = null;
			dispatch({ type: "DRAW_END" });
		}
	}

	function requestDrawTeams(
		teams: EventTeamBuilderTeam[],
		setTeams: SetTeams,
	) {
		if (!builderTeamsHavePlayers(teams)) {
			void handleDrawTeams(setTeams);
			return;
		}

		drawSetTeamsRef.current = setTeams;
		dispatch({ type: "DRAW_CONFIRM_OPEN" });
	}

	function confirmDrawTeams() {
		const setTeams = drawSetTeamsRef.current;
		drawSetTeamsRef.current = null;
		dispatch({ type: "DRAW_CONFIRM_CLOSE" });
		if (!setTeams) {
			return;
		}

		void handleDrawTeams(setTeams);
	}

	function cancelDrawTeams() {
		drawSetTeamsRef.current = null;
		dispatch({ type: "DRAW_CONFIRM_CLOSE" });
	}

	async function openDrawCeremony(to: OpenDrawRoute) {
		const invalid = validateEventAttendance(state.presentIds, rosterIds);
		if (invalid) {
			dispatch({ type: "ATTENDANCE_ERROR", error: invalid });
			return;
		}

		dispatch({ type: "OPENING_DRAW_START" });
		try {
			await onSaveAttendance(state.presentIds, presentGoalkeeperIds);
			await navigate({
				to,
				params: {
					championshipId: String(championshipId),
					eventId: String(eventId),
				},
			});
		} catch (error) {
			dispatch({
				type: "ATTENDANCE_ERROR",
				error: caughtErrorMessage(error, EVENT_TEAM_MESSAGE.needAttendance),
			});
		} finally {
			dispatch({ type: "OPENING_DRAW_END" });
		}
	}

	async function handleShareTeams(teams: EventTeamBuilderTeam[]) {
		dispatch({ type: "SHARE_START" });
		try {
			await shareEventTeamsImage(
				eventTeamsShareCards(teams, presentPlayers, state.goalkeeperIds),
				ceiling,
				{ championshipName, startsAt },
			);
		} catch {
			dispatch({ type: "TEAMS_ERROR", error: EVENT_TEAM_SHARE_LABEL.shareFailed });
		} finally {
			dispatch({ type: "SHARE_END" });
		}
	}

	async function handleCopyDrawLink() {
		const url = eventDrawUrl(
			window.location.origin,
			championshipId,
			eventId,
			ROUTES.championshipEventDraw,
		);
		await navigator.clipboard.writeText(url);
		dispatch({ type: "COPIED_DRAW_LINK", copiedDrawLink: true });
	}

	return {
		...state,
		presentPlayers,
		presentGoalkeeperIds,
		ceiling,
		busy,
		setAttendanceError,
		clearAttendanceError,
		setTeamsError,
		clearTeamsError,
		handleSetPresent,
		handleSeedAttendance,
		handleSetGoalkeeper,
		handleAddPlayer,
		tryGoToTeams,
		handleDrawTeams,
		requestDrawTeams,
		confirmDrawTeams,
		cancelDrawTeams,
		openDrawCeremony,
		handleShareTeams,
		handleCopyDrawLink,
	};
}
