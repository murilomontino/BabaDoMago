import { ArrayBufferTarget } from "mp4-muxer";
import {
	EVENT_DRAW_VIDEO_CONFIG,
	type EventDrawRenderData,
	prepareEventDrawAvatars,
	renderEventDrawFrame,
} from "./event-draw-canvas-render.ts";
import {
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

export async function generateEventDrawVideo(
	options: GenerateEventDrawVideoOptions,
): Promise<Blob | null> {
	const { data, onProgress, signal } = options;
	const { width, height, fps, introDurationSec, playerRevealSec, outroDurationSec } =
		EVENT_DRAW_VIDEO_CONFIG;

	const totalPlayers = data.cards.reduce((acc, c) => acc + c.players.length, 0);
	const totalDurationSec =
		introDurationSec + totalPlayers * playerRevealSec + outroDurationSec;
	const totalFrames = Math.ceil(totalDurationSec * fps);

	const videoConfig = await createMp4EncoderConfig({ width, height, fps });
	if (!videoConfig) {
		return null;
	}

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
	const muxer = createMp4Muxer(target, { width, height, fps });

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

		const progressSec = frameIdx / fps;
		await renderEventDrawFrame(renderCtx, data, progressSec, avatars);

		padded.context.drawImage(renderCanvas, 0, 0);

		const videoFrame = new VideoFrame(padded.canvas, {
			timestamp: frameIdx * frameDurationUs,
			duration: frameDurationUs,
		});

		encoder.encode(videoFrame, { keyFrame: frameIdx % (fps * 2) === 0 });
		videoFrame.close();

		if (onProgress && frameIdx % 5 === 0) {
			const percent = Math.min(99, Math.round((frameIdx / totalFrames) * 100));
			onProgress(percent);
		}

		if (frameIdx % 10 === 0) {
			await new Promise((resolve) => setTimeout(resolve, 0));
		}
	}

	await encoder.flush();
	encoder.close();

	if (encodeError) {
		throw encodeError;
	}

	muxer.finalize();
	if (onProgress) {
		onProgress(100);
	}

	return mp4BufferToBlob(target.buffer);
}
