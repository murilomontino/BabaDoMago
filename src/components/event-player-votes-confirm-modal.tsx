import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import { EVENT_PLAYER_VOTE_LABEL } from "@/const/event-player-vote";
import {
	BUTTON_VARIANT,
	type ButtonVariant,
	ERROR_CLASS,
	MODAL_CLASS,
} from "@/const/ui";

type EventPlayerVotesConfirmModalProps = {
	title: string;
	hint: string;
	confirmLabel: string;
	confirmVariant: ButtonVariant;
	isPending: boolean;
	errorMessage: string | null;
	onCancel: () => void;
	onConfirm: () => void;
};

export function EventPlayerVotesConfirmModal({
	title,
	hint,
	confirmLabel,
	confirmVariant,
	isPending,
	errorMessage,
	onCancel,
	onConfirm,
}: EventPlayerVotesConfirmModalProps) {
	return (
		<AppDialog onClose={onCancel}>
			<div className={MODAL_CLASS}>
				<p className="mb-1 text-sm font-medium tracking-tight text-fg">
					{title}
				</p>
				<p className="mb-3 text-sm text-fg-muted">{hint}</p>
				{errorMessage && (
					<p className={`mb-2 ${ERROR_CLASS}`}>{errorMessage}</p>
				)}
				<div className="mt-4 flex justify-end gap-2">
					<Button
						variant={BUTTON_VARIANT.secondary}
						onClick={onCancel}
						disabled={isPending}
					>
						{EVENT_PLAYER_VOTE_LABEL.back}
					</Button>
					<Button
						variant={confirmVariant}
						onClick={onConfirm}
						disabled={isPending}
					>
						{confirmLabel}
					</Button>
				</div>
			</div>
		</AppDialog>
	);
}
