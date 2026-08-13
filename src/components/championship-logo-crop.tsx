import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { getCroppedJpeg } from "@/lib/crop-image";

type ChampionshipLogoCropProps = {
	imageSrc: string;
	onCancel: () => void;
	onConfirm: (file: File) => void;
};

export function ChampionshipLogoCrop({
	imageSrc,
	onCancel,
	onConfirm,
}: ChampionshipLogoCropProps) {
	const [crop, setCrop] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
	const [isCropping, setIsCropping] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const handleCropComplete = useCallback((_: Area, croppedPixels: Area) => {
		setCroppedAreaPixels(croppedPixels);
	}, []);

	async function handleConfirm() {
		if (!croppedAreaPixels) {
			return;
		}

		setIsCropping(true);
		setErrorMessage(null);

		try {
			const blob = await getCroppedJpeg(imageSrc, croppedAreaPixels);
			onConfirm(new File([blob], "logo.jpg", { type: blob.type }));
		} catch (error) {
			setErrorMessage(
				error instanceof Error ? error.message : "Falha ao gerar o recorte",
			);
			setIsCropping(false);
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
			<div className="w-full max-w-lg rounded-xl bg-white p-4 shadow-lg">
				<p className="mb-3 text-sm font-medium text-slate-800">Ajustar logo</p>
				<div className="relative h-72 overflow-hidden rounded-lg bg-slate-900">
					<Cropper
						image={imageSrc}
						crop={crop}
						zoom={zoom}
						aspect={1}
						onCropChange={setCrop}
						onZoomChange={setZoom}
						onCropComplete={handleCropComplete}
					/>
				</div>
				<label className="mt-3 block text-sm text-slate-600">
					Zoom
					<input
						type="range"
						min={1}
						max={3}
						step={0.1}
						value={zoom}
						onChange={(event) => setZoom(Number(event.target.value))}
						className="mt-1 w-full"
					/>
				</label>
				{errorMessage && (
					<p className="mt-2 text-sm text-red-600">{errorMessage}</p>
				)}
				<div className="mt-4 flex justify-end gap-2">
					<button
						type="button"
						onClick={onCancel}
						disabled={isCropping}
						className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
					>
						Cancelar
					</button>
					<button
						type="button"
						onClick={() => {
							void handleConfirm();
						}}
						disabled={isCropping || !croppedAreaPixels}
						className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
					>
						Usar
					</button>
				</div>
			</div>
		</div>
	);
}
