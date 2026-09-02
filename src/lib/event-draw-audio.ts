/**
 * Efeitos sonoros sintetizados via WebAudio API.
 * Nao depende de arquivos .mp3/wav externos, sem risco de copyright ou 404.
 * Todos os sons sao envoltos em try-catch para falhar silenciosamente
 * se o browser bloquear autoplay ou AudioContext.
 */

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
	if (typeof window === "undefined") {
		return null;
	}
	try {
		if (!sharedAudioContext) {
			const AudioCtx =
				window.AudioContext ||
				(window as unknown as { webkitAudioContext: typeof AudioContext })
					.webkitAudioContext;
			if (AudioCtx) {
				sharedAudioContext = new AudioCtx();
			}
		}
		if (sharedAudioContext?.state === "suspended") {
			sharedAudioContext.resume().catch(() => {});
		}
		return sharedAudioContext;
	} catch {
		return null;
	}
}

/**
 * Beep curto e suave para quando um jogador e revelado.
 */
export function playRevealSound(): void {
	try {
		const ctx = getAudioContext();
		if (!ctx) {
			return;
		}

		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();

		osc.type = "sine";
		osc.frequency.setValueAtTime(587.33, now); // D5
		osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5

		gain.gain.setValueAtTime(0.15, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

		osc.connect(gain);
		gain.connect(ctx.destination);

		osc.start(now);
		osc.stop(now + 0.08);
	} catch {
		// Falha silenciosa se audio for bloqueado
	}
}

/**
 * Acorde alegre de conclusao quando todos os times foram revelados.
 */
export function playDrawCompleteSound(): void {
	try {
		const ctx = getAudioContext();
		if (!ctx) {
			return;
		}

		const now = ctx.currentTime;
		const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Acorde C Maior)

		notes.forEach((freq, idx) => {
			const noteTime = now + idx * 0.06;
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();

			osc.type = "triangle";
			osc.frequency.setValueAtTime(freq, noteTime);

			gain.gain.setValueAtTime(0.2, noteTime);
			gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);

			osc.connect(gain);
			gain.connect(ctx.destination);

			osc.start(noteTime);
			osc.stop(noteTime + 0.25);
		});
	} catch {
		// Falha silenciosa
	}
}
