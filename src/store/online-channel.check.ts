import { createDebouncedEmitter } from "./online-channel.ts";

function check(actual: unknown, expected: unknown, message: string): void {
	if (actual !== expected) {
		throw new Error(`${message}: ${String(actual)} !== ${String(expected)}`);
	}
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

let count = 0;
const emitter = createDebouncedEmitter(() => {
	count += 1;
}, 30);
emitter.schedule();
emitter.schedule();
emitter.schedule();
await sleep(80);
check(count, 1, "debounce collapses bursts to one emit");

emitter.schedule();
emitter.cancel();
await sleep(80);
check(count, 1, "cancel drops pending emit");

console.log("online-channel ok");
