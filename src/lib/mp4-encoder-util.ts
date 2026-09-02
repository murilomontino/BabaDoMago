import { type ArrayBufferTarget, Muxer } from "mp4-muxer";

export type Mp4EncoderOptions = {
	width: number;
	height: number;
	fps: number;
	bitrate?: number;
};

export async function createMp4EncoderConfig(
	options: Mp4EncoderOptions,
): Promise<VideoEncoderConfig | null> {
	if (typeof VideoEncoder === "undefined") {
		return null;
	}

	const width = options.width % 2 === 0 ? options.width : options.width + 1;
	const height = options.height % 2 === 0 ? options.height : options.height + 1;
	const bitrate = options.bitrate ?? 2_500_000;
	const fps = options.fps;

	const shared: VideoEncoderConfig = {
		codec: "avc1.42E01F",
		width,
		height,
		bitrate,
		framerate: fps,
	};

	const candidates: VideoEncoderConfig[] = [
		{
			...shared,
			avc: { format: "avc" },
			hardwareAcceleration: "prefer-software",
		},
		{ ...shared, avc: { format: "avc" } },
		shared,
	];

	for (const candidate of candidates) {
		try {
			const result = await VideoEncoder.isConfigSupported(candidate);
			if (result.supported && result.config) {
				return result.config;
			}
		} catch {
			// ignora falhas individuais
		}
	}

	return null;
}

export function createMp4Muxer(
	target: ArrayBufferTarget,
	options: Mp4EncoderOptions,
): Muxer<ArrayBufferTarget> {
	const width = options.width % 2 === 0 ? options.width : options.width + 1;
	const height = options.height % 2 === 0 ? options.height : options.height + 1;

	return new Muxer({
		target,
		video: {
			codec: "avc",
			width,
			height,
		},
		fastStart: "in-memory",
	});
}

export function createPaddedCanvas(
	width: number,
	height: number,
): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } {
	const paddedWidth = width % 2 === 0 ? width : width + 1;
	const paddedHeight = height % 2 === 0 ? height : height + 1;
	const canvas = document.createElement("canvas");
	canvas.width = paddedWidth;
	canvas.height = paddedHeight;
	const context = canvas.getContext("2d");
	if (!context) {
		throw new Error("nao foi possivel criar contexto 2d");
	}
	return { canvas, context };
}

export function mp4BufferToBlob(buffer: ArrayBuffer): Blob {
	return new Blob([buffer], { type: "video/mp4" });
}
