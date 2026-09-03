import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import { EVENT_PLAYER_VOTE_LABEL } from "@/const/event-player-vote";
import { BUTTON_VARIANT, ERROR_CLASS, MODAL_CLASS } from "@/const/ui";

type VoidEventPlayerVotesModalProps = {
	isPending: boolean;
	errorMessage: string | null;
	onCancel: () => void;
	onConfirm: () => void;
};

export function VoidEventPlayerVotesModal({
	isPending,
	errorMessage,
	onCancel,
	onConfirm,
}: VoidEventPlayerVotesModalProps) {
	return (
		<AppDialog onClose={onCancel}>
			<div className={MODAL_CLASS}>
				<p className="mb-1 text-sm font-medium tracking-tight text-fg">
					{EVENT_PLAYER_VOTE_LABEL.cancelVotes}
				</p>
				<p className="mb-3 text-sm text-fg-muted">
					{EVENT_PLAYER_VOTE_LABEL.cancelVotesHint}
				</p>
				{errorMessage && (
					<p className={`mb-2 ${ERROR_CLASS}`}>{errorMessage}</p>
				)}
				<div className="mt-4 flex justify-end gap-2">
					<Button
						variant={BUTTON_VARIANT.secondary}
						onClick={onCancel}
						disabled={isPending}
					>
						Voltar
					</Button>
					<Button
						variant={BUTTON_VARIANT.danger}
						onClick={onConfirm}
						disabled={isPending}
					>
						{EVENT_PLAYER_VOTE_LABEL.cancelVotes}
					</Button>
				</div>
			</div>
		</AppDialog>
	);
}
