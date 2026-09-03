import {
	AudioBufferSource,
	BufferTarget,
	CanvasSource,
	canEncodeAudio,
	canEncodeVideo,
	Mp4OutputFormat,
	Output,
	Quality,
} from "mediabunny";
import { renderEventDrawAudioTrack } from "./event-draw-audio-track.ts";
import {
	type EventDrawRenderData,
	prepareEventDrawAvatars,
	renderEventDrawFrame,
} from "./event-draw-canvas-render.ts";
import {
	EVENT_DRAW_VIDEO_CONFIG,
	eventDrawCompleteTimeSec,
	eventDrawPotRevealTimesSec,
	eventDrawRevealTimesSec,
	eventDrawTotalDurationSec,
} from "./event-draw-video-timeline.ts";

function videoPotCount(data: EventDrawRenderData): number {
	if (!data.pots) {
		return 0;
	}

	return data.pots.length;
}

const FRAMES_PER_BACKPRESSURE_AWAIT = 15;

/**
 * H.264 Constrained Baseline 3.1: o perfil que aparelhos antigos e o
 * WhatsApp aceitam sem reclamar. Quando o browser nao encoda esse perfil,
 * deixamos a mediabunny escolher.
 */
const AVC_COMPATIBLE_CODEC = "avc1.42E01F";

export type EventDrawVideoProgressCallback = (percent: number) => void;

export const EVENT_DRAW_VIDEO_BITRATE = {
	video: 2_500_000,
	audio: 128_000,
} as const;

export type EventDrawVideoResult = {
	blob: Blob;
	/** false quando nenhum encoder AAC estava disponivel e o MP4 saiu mudo. */
	hasAudio: boolean;
};

export type GenerateEventDrawVideoOptions = {
	data: EventDrawRenderData;
	onProgress?: EventDrawVideoProgressCallback;
	signal?: AbortSignal;
};

/**
 * Garante um encoder AAC. O Firefox nao implementa AAC no WebCodecs, entao
 * carregamos sob demanda o polyfill WASM — so nesse caso, para o Chrome nao
 * pagar o custo do download.
 */
export async function ensureAacEncoder(): Promise<boolean> {
	if (await canEncodeAudio("aac")) {
		return true;
	}

	try {
		const { registerAacEncoder } = await import("@mediabunny/aac-encoder");
		registerAacEncoder();
	} catch {
		return false;
	}

	return canEncodeAudio("aac");
}

export async function generateEventDrawVideo(
	options: GenerateEventDrawVideoOptions,
): Promise<EventDrawVideoResult | null> {
	const { data, onProgress, signal } = options;
	const { width, height, fps } = EVENT_DRAW_VIDEO_CONFIG;

	if (!(await canEncodeVideo("avc"))) {
		return null;
	}

	const fullCodecString = (await canEncodeVideo("avc", {
		width,
		height,
		fullCodecString: AVC_COMPATIBLE_CODEC,
	}))
		? AVC_COMPATIBLE_CODEC
		: undefined;

	const potCount = videoPotCount(data);
	const totalDurationSec = eventDrawTotalDurationSec(data.cards, potCount);
	const totalFrames = Math.ceil(totalDurationSec * fps);

	const hasAudio = await ensureAacEncoder();
	const avatars = await prepareEventDrawAvatars(data);

	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		throw new Error("Contexto canvas 2D indisponivel");
	}

	const output = new Output({
		format: new Mp4OutputFormat({ fastStart: "in-memory" }),
		target: new BufferTarget(),
	});

	const videoSource = new CanvasSource(canvas, {
		codec: "avc",
		quality: new Quality({ bitrate: EVENT_DRAW_VIDEO_BITRATE.video }),
		keyFrameInterval: 2,
		fullCodecString,
	});
	output.addVideoTrack(videoSource, { frameRate: fps });

	const audioSource = hasAudio
		? new AudioBufferSource({
				codec: "aac",
				quality: new Quality({ bitrate: EVENT_DRAW_VIDEO_BITRATE.audio }),
			})
		: null;
	if (audioSource) {
		output.addAudioTrack(audioSource);
	}

	try {
		await output.start();

		// A trilha inteira entra antes dos frames: o muxer aplica contrapressao
		// no video enquanto o audio da mesma janela de tempo nao chegou, entao
		// alimentar o audio depois trava a geracao.
		if (audioSource) {
			const buffer = await renderEventDrawAudioTrack({
				revealTimesSec: [
					...eventDrawPotRevealTimesSec(potCount),
					...eventDrawRevealTimesSec(data.cards, potCount),
				],
				completeTimeSec: eventDrawCompleteTimeSec(data.cards, potCount),
				durationSec: totalDurationSec,
			});
			if (buffer) {
				await audioSource.add(buffer);
			}
			audioSource.close();
		}

		const frameDuration = 1 / fps;
		let pending: Promise<void> | null = null;

		for (let frameIdx = 0; frameIdx < totalFrames; frameIdx++) {
			if (signal?.aborted) {
				throw new Error("Geracao de video cancelada");
			}

			renderEventDrawFrame(ctx, data, frameIdx / fps, avatars);
			pending = videoSource.add(frameIdx / fps, frameDuration);

			// Aguardar a contrapressao a cada frame custa um macrotask por frame,
			// e aba em segundo plano limita isso a ~1/s: a geracao levaria minutos.
			// Agrupar mantem a contrapressao respeitada com uma fracao do custo.
			if (frameIdx % FRAMES_PER_BACKPRESSURE_AWAIT === 0) {
				await pending;
				pending = null;
				onProgress?.(Math.min(98, Math.round((frameIdx / totalFrames) * 98)));
			}
		}

		if (pending) {
			await pending;
		}

		await output.finalize();
	} catch (error) {
		await output.cancel().catch(() => undefined);
		throw error;
	}

	const buffer = output.target.buffer;
	if (!buffer) {
		return null;
	}

	onProgress?.(100);

	return {
		blob: new Blob([buffer], { type: "video/mp4" }),
		hasAudio: Boolean(audioSource),
	};
}
