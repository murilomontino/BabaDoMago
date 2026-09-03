import { EVENT_ACTION, EVENT_WEEKDAY } from "./championship-event.ts";
import {
	drawSimSeedWeekday,
	EVENT_DRAW_SIM_LABEL,
	EVENT_DRAW_SIM_MODE,
} from "./event-draw-sim.ts";

function check(actual: unknown, expected: unknown): void {
	if (actual !== expected) {
		throw new Error(`expected ${String(expected)}, got ${String(actual)}`);
	}
}

check(EVENT_DRAW_SIM_LABEL.drawBalanced, EVENT_ACTION.drawTeams);
check(EVENT_DRAW_SIM_LABEL.drawPots, EVENT_ACTION.openPotDraw);
check(EVENT_DRAW_SIM_MODE.balanced, "balanced");
check(EVENT_DRAW_SIM_MODE.pots, "pots");
check(drawSimSeedWeekday(null), null);
check(drawSimSeedWeekday(99), null);
check(drawSimSeedWeekday(EVENT_WEEKDAY.wednesday), EVENT_WEEKDAY.wednesday);

console.log("event-draw-sim ok");
