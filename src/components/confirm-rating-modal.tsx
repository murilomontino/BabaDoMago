import { Button } from "@/components/button";
import { PlayerRating } from "@/components/player-rating";
import { BUTTON_VARIANT, ERROR_CLASS } from "@/const/ui";

type ConfirmRatingModalProps = {
	playerName: string;
	avatarUrl: string | null;
	from: number;
	to: number;
	ceiling: number;
	isPending: boolean;
	errorMessage: string | null;
	onCancel: () => void;
	onConfirm: () => void;
};

function RatingSnapshot({
	rating,
	ceiling,
}: {
	rating: number;
	ceiling: number;
}) {
	return (
		<div className="flex items-center justify-center gap-2">
			<PlayerRating rating={rating} ceiling={ceiling} />
			<span className="rounded bg-stone-100 px-1.5 py-0.5 text-xs font-medium tabular-nums text-stone-700">
				{rating}
			</span>
		</div>
	);
}

export function ConfirmRatingModal({
	playerName,
	avatarUrl,
	from,
	to,
	ceiling,
	isPending,
	errorMessage,
	onCancel,
	onConfirm,
}: ConfirmRatingModalProps) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
			<div className="w-full max-w-lg rounded-xl bg-white p-4 text-center shadow-lg">
				<p className="mb-3 text-sm font-medium tracking-tight text-stone-800">
					Alterar nota
				</p>
				<div className="mb-3 flex flex-col items-center gap-2">
					{avatarUrl && (
						<img
							src={avatarUrl}
							alt=""
							referrerPolicy="no-referrer"
							className="h-14 w-14 rounded-full object-cover"
						/>
					)}
					{!avatarUrl && (
						<span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-pitch-soft text-lg font-medium text-pitch">
							{playerName.charAt(0).toUpperCase()}
						</span>
					)}
					<p className="text-sm font-medium text-stone-900">{playerName}</p>
				</div>
				<div className="mb-3 flex flex-wrap items-center justify-center gap-3">
					<RatingSnapshot rating={from} ceiling={ceiling} />
					<span className="text-sm font-bold text-stone-900">→</span>
					<RatingSnapshot rating={to} ceiling={ceiling} />
				</div>
				{errorMessage && (
					<p className={`mt-2 ${ERROR_CLASS}`}>{errorMessage}</p>
				)}
				<div className="mt-4 flex justify-center gap-2">
					<Button
						variant={BUTTON_VARIANT.secondary}
						onClick={onCancel}
						disabled={isPending}
					>
						Cancelar
					</Button>
					<Button onClick={onConfirm} disabled={isPending}>
						Confirmar
					</Button>
				</div>
			</div>
		</div>
	);
}
