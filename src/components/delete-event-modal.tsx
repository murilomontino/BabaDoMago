import { Button } from "@/components/button";
import { BUTTON_VARIANT, ERROR_CLASS, MODAL_CLASS } from "@/const/ui";

type DeleteEventModalProps = {
	isPending: boolean;
	errorMessage: string | null;
	onCancel: () => void;
	onConfirm: () => void;
};

export function DeleteEventModal({
	isPending,
	errorMessage,
	onCancel,
	onConfirm,
}: DeleteEventModalProps) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
			<div className={MODAL_CLASS}>
				<p className="mb-1 text-sm font-medium tracking-tight text-fg">
					Excluir evento
				</p>
				<p className="mb-3 text-sm text-fg-muted">
					O evento some da lista. Dá para criar outro no mesmo dia.
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
						Excluir
					</Button>
				</div>
			</div>
		</div>
	);
}
