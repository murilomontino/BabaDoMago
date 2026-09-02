/**
 * Renderiza offline a mesma trilha sonora tocada na tela do sorteio
 * (src/lib/event-draw-audio.ts) para dentro de um AudioBuffer, para que o
 * video MP4 saia com os mesmos sons das revelacoes e do acorde final.
 */

export const EVENT_DRAW_AUDIO_TRACK = {
	sampleRate: 48_000,
	channels: 1,
	revealAttack: 0.08,
	completeNoteGap: 0.06,
	completeNoteRelease: 0.25,
	revealGain: 0.15,
	completeGain: 0.2,
	revealFrom: 587.33,
	revealTo: 880,
	completeNotes: [523.25, 659.25, 783.99, 1046.5],
} as const;

export type EventDrawAudioTrackOptions = {
	revealTimesSec: readonly number[];
	completeTimeSec: number | null;
	durationSec: number;
};

function scheduleReveal(ctx: OfflineAudioContext, at: number): void {
	const osc = ctx.createOscillator();
	const gain = ctx.createGain();
	const end = at + EVENT_DRAW_AUDIO_TRACK.revealAttack;

	osc.type = "sine";
	osc.frequency.setValueAtTime(EVENT_DRAW_AUDIO_TRACK.revealFrom, at);
	osc.frequency.exponentialRampToValueAtTime(
		EVENT_DRAW_AUDIO_TRACK.revealTo,
		end,
	);

	gain.gain.setValueAtTime(EVENT_DRAW_AUDIO_TRACK.revealGain, at);
	gain.gain.exponentialRampToValueAtTime(0.001, end);

	osc.connect(gain);
	gain.connect(ctx.destination);
	osc.start(at);
	osc.stop(end);
}

function scheduleComplete(ctx: OfflineAudioContext, at: number): void {
	EVENT_DRAW_AUDIO_TRACK.completeNotes.forEach((freq, idx) => {
		const noteTime = at + idx * EVENT_DRAW_AUDIO_TRACK.completeNoteGap;
		const end = noteTime + EVENT_DRAW_AUDIO_TRACK.completeNoteRelease;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();

		osc.type = "triangle";
		osc.frequency.setValueAtTime(freq, noteTime);

		gain.gain.setValueAtTime(EVENT_DRAW_AUDIO_TRACK.completeGain, noteTime);
		gain.gain.exponentialRampToValueAtTime(0.001, end);

		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start(noteTime);
		osc.stop(end);
	});
}

export async function renderEventDrawAudioTrack(
	options: EventDrawAudioTrackOptions,
): Promise<AudioBuffer | null> {
	if (typeof OfflineAudioContext === "undefined") {
		return null;
	}

	const { sampleRate, channels } = EVENT_DRAW_AUDIO_TRACK;
	const length = Math.max(1, Math.ceil(options.durationSec * sampleRate));

	try {
		const ctx = new OfflineAudioContext(channels, length, sampleRate);

		for (const time of options.revealTimesSec) {
			if (time >= 0 && time < options.durationSec) {
				scheduleReveal(ctx, time);
			}
		}

		if (
			options.completeTimeSec !== null &&
			options.completeTimeSec >= 0 &&
			options.completeTimeSec < options.durationSec
		) {
			scheduleComplete(ctx, options.completeTimeSec);
		}

		return await ctx.startRendering();
	} catch {
		return null;
	}
}
