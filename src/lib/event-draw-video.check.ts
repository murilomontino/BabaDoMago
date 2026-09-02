import { EVENT_DRAW_VIDEO_CONFIG } from "./event-draw-canvas-render.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

check(EVENT_DRAW_VIDEO_CONFIG.width === 540, "largura 540px (9:16)");
check(EVENT_DRAW_VIDEO_CONFIG.height === 960, "altura 960px (9:16)");
check(EVENT_DRAW_VIDEO_CONFIG.fps === 30, "30 fps");
check(EVENT_DRAW_VIDEO_CONFIG.outroDurationSec === 5, "fecho de 5s");

console.log("event-draw-video ok");
