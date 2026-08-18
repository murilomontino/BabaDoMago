import { shouldHoldWakeLock } from "./wake-lock.ts";

function check(actual: unknown, expected: unknown, message: string): void {
	if (actual !== expected) {
		throw new Error(
			`${message}: expected ${String(expected)}, got ${String(actual)}`,
		);
	}
}

check(shouldHoldWakeLock(true, true), true, "open and visible");
check(shouldHoldWakeLock(true, false), false, "open and hidden");
check(shouldHoldWakeLock(false, true), false, "no match visible");
check(shouldHoldWakeLock(false, false), false, "no match hidden");

console.log("wake-lock ok");
