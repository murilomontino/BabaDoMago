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
const claimed = new Set<string>();
let unlocked = false;

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

// O iOS libera o áudio por elemento, e só dentro de um gesto do usuário. Roda
// uma vez, no mudo, para o toque que inicia o relógio não sair sem apito.
export function unlockMatchAudio(): void {
	if (unlocked) {
		return;
	}

	unlocked = true;
	for (const src of Object.values(MATCH_SOUND)) {
		const audio = getPlayer(src);
		if (!audio) {
			continue;
		}

		audio.muted = true;
		void audio
			.play()
			.then(() => {
				audio.muted = false;
				if (claimed.has(src)) {
					return;
				}

				audio.pause();
				audio.currentTime = 0;
			})
			.catch(() => {
				audio.muted = false;
			});
	}
}

function playSound(src: string): void {
	const audio = getPlayer(src);
	if (!audio) {
		return;
	}

	claimed.add(src);
	audio.muted = false;
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
