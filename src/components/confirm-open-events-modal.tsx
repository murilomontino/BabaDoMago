import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import { EVENT_CREATE_OPEN_LABEL } from "@/const/championship-event";
import { BUTTON_VARIANT, ERROR_CLASS, MODAL_CLASS } from "@/const/ui";

type ConfirmOpenEventsModalProps = {
	isPending: boolean;
	errorMessage: string | null;
	onCancel: () => void;
	onCreateOnly: () => void;
	onCloseAndCreate: () => void;
};

export function ConfirmOpenEventsModal({
	isPending,
	errorMessage,
	onCancel,
	onCreateOnly,
	onCloseAndCreate,
}: ConfirmOpenEventsModalProps) {
	return (
		<AppDialog onClose={onCancel}>
			<div className={MODAL_CLASS}>
				<p className="mb-1 text-sm font-medium tracking-tight text-fg">
					{EVENT_CREATE_OPEN_LABEL.title}
				</p>
				<p className="mb-3 text-sm text-fg-muted">
					{EVENT_CREATE_OPEN_LABEL.hint}
				</p>
				{errorMessage && (
					<p className={`mb-2 ${ERROR_CLASS}`}>{errorMessage}</p>
				)}
				<div className="mt-4 flex flex-wrap justify-end gap-2">
					<Button
						variant={BUTTON_VARIANT.secondary}
						onClick={onCancel}
						disabled={isPending}
					>
						{EVENT_CREATE_OPEN_LABEL.cancel}
					</Button>
					<Button
						variant={BUTTON_VARIANT.secondary}
						onClick={onCreateOnly}
						disabled={isPending}
					>
						{EVENT_CREATE_OPEN_LABEL.createOnly}
					</Button>
					<Button
						variant={BUTTON_VARIANT.danger}
						onClick={onCloseAndCreate}
						disabled={isPending}
					>
						{EVENT_CREATE_OPEN_LABEL.closeAndCreate}
					</Button>
				</div>
			</div>
		</AppDialog>
	);
}
