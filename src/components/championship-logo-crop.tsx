import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import { BUTTON_VARIANT, ERROR_CLASS, MODAL_CLASS } from "@/const/ui";
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
		<AppDialog onClose={onCancel}>
			<div className={MODAL_CLASS}>
				<p className="mb-3 text-sm font-medium tracking-tight text-fg">
					Ajustar logo
				</p>
				<div className="relative h-72 overflow-hidden rounded-lg bg-black">
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
				<label className="mt-3 block text-sm text-fg-muted">
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
					<p className={`mt-2 ${ERROR_CLASS}`}>{errorMessage}</p>
				)}
				<div className="mt-4 flex justify-end gap-2">
					<Button
						variant={BUTTON_VARIANT.secondary}
						onClick={onCancel}
						disabled={isCropping}
					>
						Cancelar
					</Button>
					<Button
						onClick={() => {
							void handleConfirm();
						}}
						disabled={isCropping || !croppedAreaPixels}
					>
						Usar
					</Button>
				</div>
			</div>
		</AppDialog>
	);
}
