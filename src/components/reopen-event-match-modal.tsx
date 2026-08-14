import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import { EVENT_MATCH_REOPEN_LABEL } from "@/const/championship-event-match";
import { BUTTON_VARIANT, ERROR_CLASS, MODAL_CLASS } from "@/const/ui";

type ReopenEventMatchModalProps = {
	isPending: boolean;
	errorMessage: string | null;
	onCancel: () => void;
	onConfirm: () => void;
};

export function ReopenEventMatchModal({
	isPending,
	errorMessage,
	onCancel,
	onConfirm,
}: ReopenEventMatchModalProps) {
	return (
		<AppDialog onClose={onCancel}>
			<div className={MODAL_CLASS}>
				<p className="mb-1 text-sm font-medium tracking-tight text-fg">
					{EVENT_MATCH_REOPEN_LABEL.title}
				</p>
				<p className="mb-3 text-sm text-fg-muted">
					{EVENT_MATCH_REOPEN_LABEL.hint}
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
						{EVENT_MATCH_REOPEN_LABEL.cancel}
					</Button>
					<Button onClick={onConfirm} disabled={isPending}>
						{EVENT_MATCH_REOPEN_LABEL.confirm}
					</Button>
				</div>
			</div>
		</AppDialog>
	);
}
