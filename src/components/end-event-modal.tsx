import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import { PlayerRating } from "@/components/player-rating";
import { EVENT_END_LABEL } from "@/const/championship-event";
import {
	type EventRatingPreviewRow,
	formatEventRating,
} from "@/const/event-rating-adjustment";
import { PLAYER_STAR_CLASS } from "@/const/player-rating";
import { BUTTON_VARIANT, CHIP_CLASS, ERROR_CLASS } from "@/const/ui";

type EndEventModalProps = {
	rows: readonly EventRatingPreviewRow[];
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
		<div className="flex min-w-0 items-center gap-1">
			<PlayerRating
				rating={rating}
				ceiling={ceiling}
				starClassName={PLAYER_STAR_CLASS.compact}
			/>
			<span className={CHIP_CLASS}>{formatEventRating(rating)}</span>
		</div>
	);
}

export function EndEventModal({
	rows,
	ceiling,
	isPending,
	errorMessage,
	onCancel,
	onConfirm,
}: EndEventModalProps) {
	return (
		<AppDialog onClose={onCancel}>
			<div className="max-h-[90dvh] w-full max-w-5xl overflow-y-auto rounded-xl bg-surface p-4 shadow-lg">
				<p className="mb-1 text-sm font-medium tracking-tight text-fg">
					{EVENT_END_LABEL.title}
				</p>
				<p className="mb-3 text-sm text-fg-muted">{EVENT_END_LABEL.hint}</p>
				{rows.length > 0 && (
					<ul className="mb-3 grid grid-cols-3 gap-2">
						{rows.map((row) => (
							<li
								key={row.playerId}
								className="rounded-lg border border-line p-2"
							>
								<p className="truncate text-sm font-medium text-fg">
									{row.name}
								</p>
								<div className="mt-1 flex flex-nowrap items-center gap-1 overflow-hidden">
									<RatingSnapshot rating={row.from} ceiling={ceiling} />
									<span className="text-xs font-bold text-fg">→</span>
									<RatingSnapshot rating={row.to} ceiling={ceiling} />
								</div>
							</li>
						))}
					</ul>
				)}
				{errorMessage && (
					<p className={`mb-2 ${ERROR_CLASS}`}>{errorMessage}</p>
				)}
				<div className="mt-4 flex justify-end gap-2">
					<Button
						variant={BUTTON_VARIANT.secondary}
						onClick={onCancel}
						disabled={isPending}
					>
						{EVENT_END_LABEL.cancel}
					</Button>
					<Button
						variant={BUTTON_VARIANT.danger}
						onClick={onConfirm}
						disabled={isPending}
					>
						{EVENT_END_LABEL.confirm}
					</Button>
				</div>
			</div>
		</AppDialog>
	);
}
