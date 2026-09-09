export type EventBuilderUiState = {
	presentIds: number[];
	goalkeeperIds: number[];
	attendanceError: string | null;
	teamsError: string | null;
	isDrawing: boolean;
	isSharing: boolean;
	isOpeningDraw: boolean;
	copiedDrawLink: boolean;
	drawConfirmOpen: boolean;
};

export type EventBuilderUiAction =
	| {
			type: "SET_PRESENT";
			presentIds: readonly number[];
	  }
	| {
			type: "SET_GOALKEEPERS";
			goalkeeperIds: readonly number[];
	  }
	| {
			type: "CLEAR_ATTENDANCE_ERROR";
	  }
	| {
			type: "ATTENDANCE_ERROR";
			error: string;
	  }
	| {
			type: "TEAMS_ERROR";
			error: string;
	  }
	| {
			type: "CLEAR_TEAMS_ERROR";
	  }
	| {
			type: "DRAW_START";
	  }
	| {
			type: "DRAW_END";
	  }
	| {
			type: "OPENING_DRAW_START";
	  }
	| {
			type: "OPENING_DRAW_END";
	  }
	| {
			type: "SHARE_START";
	  }
	| {
			type: "SHARE_END";
	  }
	| {
			type: "COPIED_DRAW_LINK";
			copiedDrawLink: boolean;
	  }
	| {
			type: "DRAW_CONFIRM_OPEN";
	  }
	| {
			type: "DRAW_CONFIRM_CLOSE";
	  };

export const EVENT_BUILDER_UI_INITIAL: EventBuilderUiState = {
	presentIds: [],
	goalkeeperIds: [],
	attendanceError: null,
	teamsError: null,
	isDrawing: false,
	isSharing: false,
	isOpeningDraw: false,
	copiedDrawLink: false,
	drawConfirmOpen: false,
};

export function eventBuilderUiReducer(
	state: EventBuilderUiState,
	action: EventBuilderUiAction,
): EventBuilderUiState {
	switch (action.type) {
		case "SET_PRESENT":
			return {
				...state,
				presentIds: [...action.presentIds],
				attendanceError: null,
			};
		case "SET_GOALKEEPERS":
			return {
				...state,
				goalkeeperIds: [...action.goalkeeperIds],
				attendanceError: null,
			};
		case "CLEAR_ATTENDANCE_ERROR":
			return {
				...state,
				attendanceError: null,
			};
		case "ATTENDANCE_ERROR":
			return {
				...state,
				attendanceError: action.error,
			};
		case "TEAMS_ERROR":
			return {
				...state,
				teamsError: action.error,
			};
		case "CLEAR_TEAMS_ERROR":
			return {
				...state,
				teamsError: null,
			};
		case "DRAW_START":
			return {
				...state,
				isDrawing: true,
			};
		case "DRAW_END":
			return {
				...state,
				isDrawing: false,
			};
		case "OPENING_DRAW_START":
			return {
				...state,
				isOpeningDraw: true,
			};
		case "OPENING_DRAW_END":
			return {
				...state,
				isOpeningDraw: false,
			};
		case "SHARE_START":
			return {
				...state,
				isSharing: true,
				teamsError: null,
			};
		case "SHARE_END":
			return {
				...state,
				isSharing: false,
			};
		case "COPIED_DRAW_LINK":
			return {
				...state,
				copiedDrawLink: action.copiedDrawLink,
			};
		case "DRAW_CONFIRM_OPEN":
			return {
				...state,
				drawConfirmOpen: true,
			};
		case "DRAW_CONFIRM_CLOSE":
			return {
				...state,
				drawConfirmOpen: false,
			};
		default: {
			const _never: never = action;
			void _never;
			return state;
		}
	}
}
