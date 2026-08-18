import { MATCH_SOUND } from "./match-feedback.ts";

function check(actual: unknown, expected: unknown, message: string): void {
	if (actual !== expected) {
		throw new Error(
			`${message}: expected ${String(expected)}, got ${String(actual)}`,
		);
	}
}

check(MATCH_SOUND.start, "/soms/whistle-start.mp3", "start sound");
check(MATCH_SOUND.goal, "/soms/goal-crowd.mp3", "goal sound");
check(MATCH_SOUND.end, "/soms/whistle-end.mp3", "end sound");

console.log("match-feedback ok");
