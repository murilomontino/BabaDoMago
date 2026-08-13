import type { Area } from "react-easy-crop";
import { CHAMPIONSHIP_LOGO } from "@/const/championship-logo";

const JPEG_QUALITIES = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4] as const;

function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.addEventListener("load", () => resolve(image));
		image.addEventListener("error", () =>
			reject(new Error("Não foi possível ler a imagem")),
		);
		image.src = src;
	});
}

function canvasToJpeg(
	canvas: HTMLCanvasElement,
	quality: number,
): Promise<Blob> {
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (!blob) {
					reject(new Error("Falha ao gerar o recorte"));
					return;
				}

				resolve(blob);
			},
			CHAMPIONSHIP_LOGO.mimeJpeg,
			quality,
		);
	});
}

export async function getCroppedJpeg(
	imageSrc: string,
	pixelCrop: Area,
): Promise<Blob> {
	const image = await loadImage(imageSrc);
	const canvas = document.createElement("canvas");
	canvas.width = pixelCrop.width;
	canvas.height = pixelCrop.height;
	const context = canvas.getContext("2d");
	if (!context) {
		throw new Error("Falha ao gerar o recorte");
	}

	context.drawImage(
		image,
		pixelCrop.x,
		pixelCrop.y,
		pixelCrop.width,
		pixelCrop.height,
		0,
		0,
		pixelCrop.width,
		pixelCrop.height,
	);

	for (const quality of JPEG_QUALITIES) {
		const blob = await canvasToJpeg(canvas, quality);
		if (blob.size <= CHAMPIONSHIP_LOGO.maxBytes) {
			return blob;
		}
	}

	throw new Error("Logo deve ter no máximo 1 MB");
}
