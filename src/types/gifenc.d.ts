declare module "gifenc" {
	export type GifFormat = "rgb565" | "rgb444" | "rgba4444";
	export type GifPalette = number[][];

	export function quantize(
		rgba: Uint8Array | Uint8ClampedArray,
		maxColors: number,
		opts?: { format?: GifFormat; oneBitAlpha?: boolean | number },
	): GifPalette;

	export function applyPalette(
		rgba: Uint8Array | Uint8ClampedArray,
		palette: GifPalette,
		format?: GifFormat,
	): Uint8Array;

	export function GIFEncoder(opts?: {
		auto?: boolean;
		initialCapacity?: number;
	}): {
		writeFrame(
			index: Uint8Array,
			width: number,
			height: number,
			opts?: {
				palette?: GifPalette;
				delay?: number;
				repeat?: number;
				transparent?: boolean;
				dispose?: number;
				first?: boolean;
			},
		): void;
		finish(): void;
		bytes(): Uint8Array;
	};
}
