import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import { BUTTON_VARIANT, ERROR_CLASS, MODAL_CLASS } from "@/const/ui";

type EndEventModalProps = {
	isPending: boolean;
	errorMessage: string | null;
	onCancel: () => void;
	onConfirm: () => void;
};

export function EndEventModal({
	isPending,
	errorMessage,
	onCancel,
	onConfirm,
}: EndEventModalProps) {
	return (
		<AppDialog onClose={onCancel}>
			<div className={MODAL_CLASS}>
				<p className="mb-1 text-sm font-medium tracking-tight text-fg">
					Encerrar evento
				</p>
				<p className="mb-3 text-sm text-fg-muted">
					O evento fica marcado como encerrado. Ainda dá para adicionar partidas
					depois.
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
						Encerrar
					</Button>
				</div>
			</div>
		</AppDialog>
	);
}
