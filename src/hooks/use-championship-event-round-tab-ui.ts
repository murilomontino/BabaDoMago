import { useCallback, useReducer } from "react";
import { caughtErrorMessage } from "@/lib/error-message";
import {
	ROUND_TAB_UI_INITIAL,
	championshipEventRoundTabUiReducer,
	type RoundTabModal,
	type RoundTabUiState,
} from "@/const/championship-event-round-tab-ui";
import { EVENT_RECAP_SHARE_LABEL } from "@/const/event-recap-share";
import { EVENT_TEAM_SHARE_LABEL } from "@/const/event-team-share";
import type { ChampionshipPlayer } from "@/types/championship";
import type {
	ChampionshipEventMatch,
	ChampionshipEventTeam,
} from "@/types/championship-event";

type OpenRoundTabModal = Exclude<RoundTabModal, { type: "none" }>;

type UseChampionshipEventRoundTabUiResult = RoundTabUiState & {
	isSharingTeams: boolean;
	shareTeamsError: string | null;
	isSharingRecap: boolean;
	shareRecapError: string | null;
	copiedDrawLink: boolean;
	copiedVoteLink: boolean;
	openMvp: () => void;
	openAttendance: () => void;
	openLateJoin: () => void;
	openAttendanceStats: () => void;
	openAddTeam: () => void;
	openEditTeam: (team: ChampionshipEventTeam) => void;
	openRemoveTeam: (team: ChampionshipEventTeam) => void;
	openRemoveAttendance: (player: ChampionshipPlayer) => void;
	openRemoveMatch: (match: ChampionshipEventMatch) => void;
	openReopenMatch: (match: ChampionshipEventMatch) => void;
	closeModal: () => void;
	handleShareTeams: (shareTeams: () => Promise<void>) => Promise<void>;
	handleShareRecap: (shareRecap: () => Promise<void>) => Promise<void>;
	markDrawLinkCopied: () => void;
	markVoteLinkCopied: () => void;
};

export function useChampionshipEventRoundTabUi(): UseChampionshipEventRoundTabUiResult {
	const [state, dispatch] = useReducer(
		championshipEventRoundTabUiReducer,
		ROUND_TAB_UI_INITIAL,
	);

	const openModal = useCallback((modal: OpenRoundTabModal) => {
		dispatch({ type: "modal/open", modal });
	}, []);

	const closeModal = useCallback(() => {
		dispatch({ type: "modal/close" });
	}, []);

	const openMvp = useCallback(() => {
		openModal({ type: "mvp" });
	}, [openModal]);

	const openAttendance = useCallback(() => {
		openModal({ type: "attendance" });
	}, [openModal]);

	const openLateJoin = useCallback(() => {
		openModal({ type: "lateJoin" });
	}, [openModal]);

	const openAttendanceStats = useCallback(() => {
		openModal({ type: "attendanceStats" });
	}, [openModal]);

	const openAddTeam = useCallback(() => {
		openModal({ type: "addTeam" });
	}, [openModal]);

	const openEditTeam = useCallback(
		(team: ChampionshipEventTeam) => {
			openModal({ type: "editTeam", team });
		},
		[openModal],
	);

	const openRemoveTeam = useCallback(
		(team: ChampionshipEventTeam) => {
			openModal({ type: "removeTeam", team });
		},
		[openModal],
	);

	const openRemoveAttendance = useCallback(
		(player: ChampionshipPlayer) => {
			openModal({ type: "removeAttendance", player });
		},
		[openModal],
	);

	const openRemoveMatch = useCallback(
		(match: ChampionshipEventMatch) => {
			openModal({ type: "removeMatch", match });
		},
		[openModal],
	);

	const openReopenMatch = useCallback(
		(match: ChampionshipEventMatch) => {
			openModal({ type: "reopenMatch", match });
		},
		[openModal],
	);

	const handleShareTeams = useCallback(async (shareTeams: () => Promise<void>) => {
		dispatch({ type: "shareTeams/start" });
		try {
			await shareTeams();
			dispatch({ type: "shareTeams/done" });
		} catch (error) {
			dispatch({
				type: "shareTeams/fail",
				error: caughtErrorMessage(error, EVENT_TEAM_SHARE_LABEL.shareFailed),
			});
		}
	}, []);

	const handleShareRecap = useCallback(async (shareRecap: () => Promise<void>) => {
		dispatch({ type: "shareRecap/start" });
		try {
			await shareRecap();
			dispatch({ type: "shareRecap/done" });
		} catch (error) {
			dispatch({
				type: "shareRecap/fail",
				error: caughtErrorMessage(error, EVENT_RECAP_SHARE_LABEL.shareFailed),
			});
		}
	}, []);

	const markDrawLinkCopied = useCallback(() => {
		dispatch({ type: "copyDrawLink/done" });
	}, []);

	const markVoteLinkCopied = useCallback(() => {
		dispatch({ type: "copyVoteLink/done" });
	}, []);

	return {
		...state,
		isSharingTeams: state.share.teams.isSharing,
		shareTeamsError: state.share.teams.error,
		isSharingRecap: state.share.recap.isSharing,
		shareRecapError: state.share.recap.error,
		copiedDrawLink: state.share.copiedDrawLink,
		copiedVoteLink: state.share.copiedVoteLink,
		openMvp,
		openAttendance,
		openLateJoin,
		openAttendanceStats,
		openAddTeam,
		openEditTeam,
		openRemoveTeam,
		openRemoveAttendance,
		openRemoveMatch,
		openReopenMatch,
		closeModal,
		handleShareTeams,
		handleShareRecap,
		markDrawLinkCopied,
		markVoteLinkCopied,
	};
}
