import type { ChampionshipPlayer } from "@/types/championship";
import type {
	ChampionshipEventMatch,
	ChampionshipEventTeam,
} from "@/types/championship-event";

type RoundTabShareTaskState = {
	isSharing: boolean;
	error: string | null;
};

export type RoundTabShareState = {
	teams: RoundTabShareTaskState;
	recap: RoundTabShareTaskState;
	copiedDrawLink: boolean;
	copiedVoteLink: boolean;
};

type RoundTabModalNone = {
	type: "none";
};

type RoundTabModalMvp = {
	type: "mvp";
};

type RoundTabModalAttendance = {
	type: "attendance";
};

type RoundTabModalLateJoin = {
	type: "lateJoin";
};

type RoundTabModalAttendanceStats = {
	type: "attendanceStats";
};

type RoundTabModalAddTeam = {
	type: "addTeam";
};

type RoundTabModalEditTeam = {
	type: "editTeam";
	team: ChampionshipEventTeam;
};

type RoundTabModalRemoveTeam = {
	type: "removeTeam";
	team: ChampionshipEventTeam;
};

type RoundTabModalRemoveAttendance = {
	type: "removeAttendance";
	player: ChampionshipPlayer;
};

type RoundTabModalRemoveMatch = {
	type: "removeMatch";
	match: ChampionshipEventMatch;
};

type RoundTabModalReopenMatch = {
	type: "reopenMatch";
	match: ChampionshipEventMatch;
};

export type RoundTabModal =
	| RoundTabModalNone
	| RoundTabModalMvp
	| RoundTabModalAttendance
	| RoundTabModalLateJoin
	| RoundTabModalAttendanceStats
	| RoundTabModalAddTeam
	| RoundTabModalEditTeam
	| RoundTabModalRemoveTeam
	| RoundTabModalRemoveAttendance
	| RoundTabModalRemoveMatch
	| RoundTabModalReopenMatch;

export type RoundTabUiState = {
	share: RoundTabShareState;
	modal: RoundTabModal;
};

const ROUND_TAB_SHARE_SECTION_INITIAL: RoundTabShareTaskState = {
	isSharing: false,
	error: null,
};

export const ROUND_TAB_UI_INITIAL: RoundTabUiState = {
	share: {
		teams: { ...ROUND_TAB_SHARE_SECTION_INITIAL },
		recap: { ...ROUND_TAB_SHARE_SECTION_INITIAL },
		copiedDrawLink: false,
		copiedVoteLink: false,
	},
	modal: { type: "none" },
};

type RoundTabShareAction =
	| { type: "shareTeams/start" }
	| { type: "shareTeams/fail"; error: string }
	| { type: "shareTeams/done" }
	| { type: "shareRecap/start" }
	| { type: "shareRecap/fail"; error: string }
	| { type: "shareRecap/done" };

type RoundTabCopyAction =
	| { type: "copyDrawLink/done" }
	| { type: "copyVoteLink/done" };

type RoundTabModalAction =
	| { type: "modal/open"; modal: Exclude<RoundTabModal, RoundTabModalNone> }
	| { type: "modal/close" };

export type RoundTabUiAction =
	| RoundTabShareAction
	| RoundTabCopyAction
	| RoundTabModalAction;

export function isRoundTabModalType<
	Type extends RoundTabModal["type"],
>(
	modal: RoundTabModal,
	type: Type,
): modal is Extract<RoundTabModal, { type: Type }> {
	return modal.type === type;
}

export function roundTabModalTeam(
	modal: RoundTabModal,
): ChampionshipEventTeam | null {
	if (modal.type === "editTeam" || modal.type === "removeTeam") {
		return modal.team;
	}

	return null;
}

export function roundTabEditTeam(
	modal: RoundTabModal,
): ChampionshipEventTeam | null {
	if (modal.type !== "editTeam") {
		return null;
	}

	return modal.team;
}

export function roundTabRemoveTeam(
	modal: RoundTabModal,
): ChampionshipEventTeam | null {
	if (modal.type !== "removeTeam") {
		return null;
	}

	return modal.team;
}

export function roundTabModalPlayer(
	modal: RoundTabModal,
): ChampionshipPlayer | null {
	if (modal.type === "removeAttendance") {
		return modal.player;
	}

	return null;
}

export function roundTabRemoveMatch(
	modal: RoundTabModal,
): ChampionshipEventMatch | null {
	if (modal.type !== "removeMatch") {
		return null;
	}

	return modal.match;
}

export function roundTabReopenMatch(
	modal: RoundTabModal,
): ChampionshipEventMatch | null {
	if (modal.type !== "reopenMatch") {
		return null;
	}

	return modal.match;
}

export function roundTabModalMatch(
	modal: RoundTabModal,
): ChampionshipEventMatch | null {
	if (modal.type === "removeMatch" || modal.type === "reopenMatch") {
		return modal.match;
	}

	return null;
}

function nextShareSection(
	section: RoundTabShareTaskState,
	action: RoundTabShareAction,
	prefix: "shareTeams" | "shareRecap",
): RoundTabShareTaskState {
	if (prefix === "shareTeams") {
		switch (action.type) {
			case "shareTeams/start":
				return { isSharing: true, error: null };
			case "shareTeams/fail":
				return { isSharing: false, error: action.error };
			case "shareTeams/done":
				return { ...section, isSharing: false, error: null };
			default:
				return section;
		}
	}

	switch (action.type) {
		case "shareRecap/start":
			return { isSharing: true, error: null };
		case "shareRecap/fail":
			return { isSharing: false, error: action.error };
		case "shareRecap/done":
			return { ...section, isSharing: false, error: null };
		default:
			return section;
	}
}

export function championshipEventRoundTabUiReducer(
	state: RoundTabUiState,
	action: RoundTabUiAction,
): RoundTabUiState {
	switch (action.type) {
		case "shareTeams/start":
		case "shareTeams/fail":
		case "shareTeams/done":
			return {
				...state,
				share: {
					...state.share,
					teams: nextShareSection(state.share.teams, action, "shareTeams"),
				},
			};
		case "shareRecap/start":
		case "shareRecap/fail":
		case "shareRecap/done":
			return {
				...state,
				share: {
					...state.share,
					recap: nextShareSection(state.share.recap, action, "shareRecap"),
				},
			};
		case "copyDrawLink/done":
			return {
				...state,
				share: {
					...state.share,
					copiedDrawLink: true,
				},
			};
		case "copyVoteLink/done":
			return {
				...state,
				share: {
					...state.share,
					copiedVoteLink: true,
				},
			};
		case "modal/open":
			return {
				...state,
				modal: action.modal,
			};
		case "modal/close":
			return {
				...state,
				modal: { type: "none" },
			};
		default: {
			const _exhaustive: never = action;
			void _exhaustive;
			return state;
		}
	}
}
