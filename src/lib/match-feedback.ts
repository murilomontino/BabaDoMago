export const MATCH_SOUND = {
	start: "/soms/whistle-start.mp3",
	goal: "/soms/goal-crowd.mp3",
	end: "/soms/whistle-end.mp3",
} as const;

export const MATCH_FEEDBACK = {
	goalMs: 40,
	timeUpMs: [200, 80, 200],
} as const;

const players = new Map<string, HTMLAudioElement>();

function getPlayer(src: string): HTMLAudioElement | null {
	if (typeof Audio === "undefined") {
		return null;
	}

	const existing = players.get(src);
	if (existing) {
		return existing;
	}

	const audio = new Audio(src);
	audio.preload = "auto";
	players.set(src, audio);
	return audio;
}

export function unlockMatchAudio(): void {
	for (const src of Object.values(MATCH_SOUND)) {
		const audio = getPlayer(src);
		if (!audio) {
			continue;
		}

		audio.load();
		void audio
			.play()
			.then(() => {
				audio.pause();
				audio.currentTime = 0;
			})
			.catch(() => {
				return;
			});
	}
}

function playSound(src: string): void {
	const audio = getPlayer(src);
	if (!audio) {
		return;
	}

	audio.pause();
	audio.currentTime = 0;
	void audio.play().catch(() => {
		return;
	});
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

export function signalMatchStart(): void {
	playSound(MATCH_SOUND.start);
}

export function signalGoal(): void {
	playSound(MATCH_SOUND.goal);
	vibrate(MATCH_FEEDBACK.goalMs);
}

export function signalMatchTimeUp(): void {
	playSound(MATCH_SOUND.end);
	vibrate(MATCH_FEEDBACK.timeUpMs);
}
