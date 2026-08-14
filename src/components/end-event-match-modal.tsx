import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import {
	EVENT_MATCH_END_LABEL,
	EVENT_MATCH_LABEL,
	type EventMatchEndIntent,
	eventMatchEndConfirmLabel,
	eventMatchEndTitle,
} from "@/const/championship-event-match";
import { BUTTON_VARIANT, ERROR_CLASS, MODAL_CLASS } from "@/const/ui";

type EndEventMatchModalProps = {
	intent: EventMatchEndIntent;
	scoreLabel: string;
	winnerLabel: string;
	isPending: boolean;
	errorMessage: string | null;
	onCancel: () => void;
	onConfirm: () => void;
};

export function EndEventMatchModal({
	intent,
	scoreLabel,
	winnerLabel,
	isPending,
	errorMessage,
	onCancel,
	onConfirm,
}: EndEventMatchModalProps) {
	return (
		<AppDialog onClose={onCancel}>
			<div className={MODAL_CLASS}>
				<p className="mb-1 text-sm font-medium tracking-tight text-fg">
					{eventMatchEndTitle(intent)}
				</p>
				<p className="mb-3 text-sm text-fg-muted">
					{EVENT_MATCH_END_LABEL.hint}
				</p>
				<p className="text-2xl font-semibold tabular-nums text-fg">
					{scoreLabel}
				</p>
				{winnerLabel === EVENT_MATCH_LABEL.draw && (
					<p className="mt-1 text-sm text-fg-muted">{EVENT_MATCH_LABEL.draw}</p>
				)}
				{winnerLabel !== EVENT_MATCH_LABEL.draw && (
					<p className="mt-1 text-sm text-fg-muted">
						{EVENT_MATCH_LABEL.winner}: {winnerLabel}
					</p>
				)}
				{errorMessage && (
					<p className={`mb-2 mt-3 ${ERROR_CLASS}`}>{errorMessage}</p>
				)}
				<div className="mt-4 flex justify-end gap-2">
					<Button
						variant={BUTTON_VARIANT.secondary}
						onClick={onCancel}
						disabled={isPending}
					>
						{EVENT_MATCH_END_LABEL.cancel}
					</Button>
					<Button
						variant={BUTTON_VARIANT.danger}
						onClick={onConfirm}
						disabled={isPending}
					>
						{eventMatchEndConfirmLabel(intent)}
					</Button>
				</div>
			</div>
		</AppDialog>
	);
}
