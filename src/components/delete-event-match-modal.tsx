import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import { EVENT_ACTION } from "@/const/championship-event";
import { BUTTON_VARIANT, ERROR_CLASS, MODAL_CLASS } from "@/const/ui";

type DeleteEventMatchModalProps = {
	isPending: boolean;
	errorMessage: string | null;
	onCancel: () => void;
	onConfirm: () => void;
};

export function DeleteEventMatchModal({
	isPending,
	errorMessage,
	onCancel,
	onConfirm,
}: DeleteEventMatchModalProps) {
	return (
		<AppDialog onClose={onCancel}>
			<div className={MODAL_CLASS}>
				<p className="mb-1 text-sm font-medium tracking-tight text-fg">
					{EVENT_ACTION.removeMatch}
				</p>
				<p className="mb-3 text-sm text-fg-muted">
					A partida some da lista. Estatísticas voltam atrás.
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
						Cancelar
					</Button>
					<Button
						variant={BUTTON_VARIANT.danger}
						onClick={onConfirm}
						disabled={isPending}
					>
						{EVENT_ACTION.removeMatch}
					</Button>
				</div>
			</div>
		</AppDialog>
	);
}
