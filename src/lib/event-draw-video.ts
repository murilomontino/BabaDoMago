import { ArrayBufferTarget } from "mp4-muxer";
import {
	EVENT_DRAW_AUDIO_TRACK,
	renderEventDrawAudioTrack,
} from "./event-draw-audio-track.ts";
import {
	type EventDrawRenderData,
	prepareEventDrawAvatars,
	renderEventDrawFrame,
} from "./event-draw-canvas-render.ts";
import {
	EVENT_DRAW_VIDEO_CONFIG,
	eventDrawCompleteTimeSec,
	eventDrawRevealTimesSec,
	eventDrawTotalDurationSec,
} from "./event-draw-video-timeline.ts";
import {
	createAacEncoderConfig,
	createMp4EncoderConfig,
	createMp4Muxer,
	createPaddedCanvas,
	mp4BufferToBlob,
} from "./mp4-encoder-util.ts";

export type EventDrawVideoProgressCallback = (percent: number) => void;

export type GenerateEventDrawVideoOptions = {
	data: EventDrawRenderData;
	onProgress?: EventDrawVideoProgressCallback;
	signal?: AbortSignal;
};

const AUDIO_CHUNK_FRAMES = 1024;

type AudioEncodeInput = {
	buffer: AudioBuffer;
	config: AudioEncoderConfig;
};

async function prepareAudio(
	data: EventDrawRenderData,
	durationSec: number,
): Promise<AudioEncodeInput | null> {
	const config = await createAacEncoderConfig({
		sampleRate: EVENT_DRAW_AUDIO_TRACK.sampleRate,
		channels: EVENT_DRAW_AUDIO_TRACK.channels,
	});
	if (!config) {
		return null;
	}

	const buffer = await renderEventDrawAudioTrack({
		revealTimesSec: eventDrawRevealTimesSec(data.cards),
		completeTimeSec: eventDrawCompleteTimeSec(data.cards),
		durationSec,
	});
	if (!buffer) {
		return null;
	}

	return { buffer, config };
}

/** Fatia o AudioBuffer em AudioData e joga tudo no AudioEncoder. */
async function encodeAudio(
	audio: AudioEncodeInput,
	muxer: ReturnType<typeof createMp4Muxer>,
): Promise<void> {
	const { buffer, config } = audio;
	const channels = buffer.numberOfChannels;
	const sampleRate = buffer.sampleRate;

	let audioError: Error | null = null;
	const encoder = new AudioEncoder({
		output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
		error: (err) => {
			audioError = err;
		},
	});
	encoder.configure(config);

	const channelData = Array.from({ length: channels }, (_, index) =>
		buffer.getChannelData(index),
	);

	for (let offset = 0; offset < buffer.length; offset += AUDIO_CHUNK_FRAMES) {
		if (audioError) {
			encoder.close();
			throw audioError;
		}

		const frames = Math.min(AUDIO_CHUNK_FRAMES, buffer.length - offset);
		const interleaved = new Float32Array(frames * channels);
		for (let channel = 0; channel < channels; channel++) {
			const source = channelData[channel];
			if (!source) continue;
			for (let frame = 0; frame < frames; frame++) {
				interleaved[frame * channels + channel] = source[offset + frame] ?? 0;
			}
		}

		const audioData = new AudioData({
			format: "f32",
			sampleRate,
			numberOfFrames: frames,
			numberOfChannels: channels,
			timestamp: Math.round((offset / sampleRate) * 1_000_000),
			data: interleaved,
		});
		encoder.encode(audioData);
		audioData.close();
	}

	await encoder.flush();
	encoder.close();

	if (audioError) {
		throw audioError;
	}
}

export async function generateEventDrawVideo(
	options: GenerateEventDrawVideoOptions,
): Promise<Blob | null> {
	const { data, onProgress, signal } = options;
	const { width, height, fps } = EVENT_DRAW_VIDEO_CONFIG;

	const totalDurationSec = eventDrawTotalDurationSec(data.cards);
	const totalFrames = Math.ceil(totalDurationSec * fps);

	const videoConfig = await createMp4EncoderConfig({ width, height, fps });
	if (!videoConfig) {
		return null;
	}

	const audio = await prepareAudio(data, totalDurationSec);
	const avatars = await prepareEventDrawAvatars(data);

	const renderCanvas = document.createElement("canvas");
	renderCanvas.width = width;
	renderCanvas.height = height;
	const renderCtx = renderCanvas.getContext("2d");
	if (!renderCtx) {
		throw new Error("Contexto canvas 2D indisponivel");
	}

	const padded = createPaddedCanvas(width, height);
	const target = new ArrayBufferTarget();
	const muxer = createMp4Muxer(
		target,
		{ width, height, fps },
		audio
			? {
					sampleRate: EVENT_DRAW_AUDIO_TRACK.sampleRate,
					channels: EVENT_DRAW_AUDIO_TRACK.channels,
				}
			: null,
	);

	let encodeError: Error | null = null;
	const encoder = new VideoEncoder({
		output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
		error: (err) => {
			encodeError = err;
		},
	});
	encoder.configure(videoConfig);

	const frameDurationUs = Math.round(1_000_000 / fps);

	for (let frameIdx = 0; frameIdx < totalFrames; frameIdx++) {
		if (signal?.aborted) {
			encoder.close();
			throw new Error("Geracao de video cancelada");
		}
		if (encodeError) {
			encoder.close();
			throw encodeError;
		}

		renderEventDrawFrame(renderCtx, data, frameIdx / fps, avatars);

		padded.context.drawImage(renderCanvas, 0, 0);

		const videoFrame = new VideoFrame(padded.canvas, {
			timestamp: frameIdx * frameDurationUs,
			duration: frameDurationUs,
		});

		encoder.encode(videoFrame, { keyFrame: frameIdx % (fps * 2) === 0 });
		videoFrame.close();

		if (onProgress && frameIdx % 5 === 0) {
			const percent = Math.min(97, Math.round((frameIdx / totalFrames) * 97));
			onProgress(percent);
		}

		if (encoder.encodeQueueSize > fps) {
			await new Promise<void>((resolve) => {
				encoder.addEventListener("dequeue", () => resolve(), { once: true });
			});
		} else if (frameIdx % 10 === 0) {
			await new Promise((resolve) => setTimeout(resolve, 0));
		}
	}

	await encoder.flush();
	encoder.close();

	if (encodeError) {
		throw encodeError;
	}

	if (audio) {
		onProgress?.(98);
		await encodeAudio(audio, muxer);
	}

	muxer.finalize();
	onProgress?.(100);

	return mp4BufferToBlob(target.buffer);
}
