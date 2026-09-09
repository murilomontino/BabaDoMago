import {
	EVENT_BUILDER_UI_INITIAL,
	eventBuilderUiReducer,
} from "./event-builder-ui.ts";

function check(actual: unknown, expected: unknown): void {
	if (actual !== expected) {
		throw new Error(`expected ${String(expected)}, got ${String(actual)}`);
	}
}

const baseState = {
	...EVENT_BUILDER_UI_INITIAL,
	presentIds: [1, 2],
	goalkeeperIds: [2],
	attendanceError: "attendance",
	teamsError: "teams",
};

let state = eventBuilderUiReducer(baseState, {
	type: "SET_PRESENT",
	presentIds: [3, 4],
});
check(state.presentIds.join(","), "3,4");
check(state.attendanceError, null);

state = eventBuilderUiReducer(state, {
	type: "SET_GOALKEEPERS",
	goalkeeperIds: [4],
});
check(state.goalkeeperIds.join(","), "4");
check(state.attendanceError, null);

state = eventBuilderUiReducer(state, { type: "ATTENDANCE_ERROR", error: "bad" });
check(state.attendanceError, "bad");

state = eventBuilderUiReducer(state, { type: "CLEAR_ATTENDANCE_ERROR" });
check(state.attendanceError, null);

state = eventBuilderUiReducer(state, { type: "TEAMS_ERROR", error: "draw" });
check(state.teamsError, "draw");

state = eventBuilderUiReducer(state, { type: "CLEAR_TEAMS_ERROR" });
check(state.teamsError, null);

state = eventBuilderUiReducer(state, { type: "DRAW_START" });
check(state.isDrawing, true);
state = eventBuilderUiReducer(state, { type: "DRAW_END" });
check(state.isDrawing, false);

state = eventBuilderUiReducer(state, { type: "OPENING_DRAW_START" });
check(state.isOpeningDraw, true);
state = eventBuilderUiReducer(state, { type: "OPENING_DRAW_END" });
check(state.isOpeningDraw, false);

state = eventBuilderUiReducer(state, { type: "SHARE_START" });
check(state.isSharing, true);
check(state.teamsError, null);
state = eventBuilderUiReducer(state, { type: "SHARE_END" });
check(state.isSharing, false);

state = eventBuilderUiReducer(state, {
	type: "COPIED_DRAW_LINK",
	copiedDrawLink: true,
});
check(state.copiedDrawLink, true);

state = eventBuilderUiReducer(state, { type: "DRAW_CONFIRM_OPEN" });
check(state.drawConfirmOpen, true);
state = eventBuilderUiReducer(state, { type: "DRAW_CONFIRM_CLOSE" });
check(state.drawConfirmOpen, false);

console.log("event-builder-ui ok");
