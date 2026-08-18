export const MATCH_FEEDBACK = {
	goalMs: 40,
	timeUpMs: [200, 80, 200],
	whistleHz: 1760,
	whistleFirstMs: 120,
	whistleGapMs: 40,
	whistleSecondMs: 180,
} as const;

let audioContext: AudioContext | null = null;

function audioContextConstructor(): typeof AudioContext | undefined {
	if (typeof window === "undefined") {
		return undefined;
	}

	return window.AudioContext;
}

function getAudioContext(): AudioContext | null {
	const Constructor = audioContextConstructor();
	if (!Constructor) {
		return null;
	}

	if (!audioContext) {
		audioContext = new Constructor();
	}

	return audioContext;
}

export function unlockMatchAudio(): void {
	const context = getAudioContext();
	if (!context) {
		return;
	}

	if (context.state === "suspended") {
		void context.resume();
	}
}

export function vibrate(pattern: number | readonly number[]): void {
	if (typeof navigator === "undefined") {
		return;
	}

	if (typeof navigator.vibrate !== "function") {
		return;
	}

	if (typeof pattern === "number") {
		navigator.vibrate(pattern);
		return;
	}

	navigator.vibrate([...pattern]);
}

function playTone(
	context: AudioContext,
	frequency: number,
	startOffset: number,
	duration: number,
) {
	const oscillator = context.createOscillator();
	const gain = context.createGain();
	oscillator.type = "square";
	oscillator.frequency.value = frequency;
	gain.gain.value = 0.18;
	oscillator.connect(gain);
	gain.connect(context.destination);
	const startAt = context.currentTime + startOffset;
	oscillator.start(startAt);
	oscillator.stop(startAt + duration);
}

export function whistle(): void {
	const context = getAudioContext();
	if (!context) {
		return;
	}

	void context.resume();
	const first = MATCH_FEEDBACK.whistleFirstMs / 1000;
	const gap = MATCH_FEEDBACK.whistleGapMs / 1000;
	const second = MATCH_FEEDBACK.whistleSecondMs / 1000;
	playTone(context, MATCH_FEEDBACK.whistleHz, 0, first);
	playTone(context, MATCH_FEEDBACK.whistleHz, first + gap, second);
}

export function signalGoal(): void {
	vibrate(MATCH_FEEDBACK.goalMs);
}

export function signalMatchTimeUp(): void {
	whistle();
	vibrate(MATCH_FEEDBACK.timeUpMs);
}
