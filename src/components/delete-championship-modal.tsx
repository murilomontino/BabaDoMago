import { type FormEvent, useState } from "react";
import { Button } from "@/components/button";
import { BUTTON_VARIANT, ERROR_CLASS, FIELD_CLASS } from "@/const/ui";

type DeleteChampionshipModalProps = {
	championshipName: string;
	isPending: boolean;
	errorMessage: string | null;
	onCancel: () => void;
	onConfirm: () => void;
};

export function DeleteChampionshipModal({
	championshipName,
	isPending,
	errorMessage,
	onCancel,
	onConfirm,
}: DeleteChampionshipModalProps) {
	const [typedName, setTypedName] = useState("");
	const nameMatches = typedName.trim() === championshipName;

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!nameMatches) {
			return;
		}

		onConfirm();
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
			<form
				onSubmit={handleSubmit}
				className="w-full max-w-lg rounded-xl bg-white p-4 shadow-lg"
			>
				<p className="mb-1 text-sm font-medium tracking-tight text-stone-800">
					Excluir campeonato
				</p>
				<p className="mb-3 text-sm text-stone-600">
					Digite o nome do baba para confirmar.
				</p>
				<p className="mb-3 select-all text-sm font-bold text-stone-900">
					"{championshipName}"
				</p>
				<label className="block text-sm text-stone-600">
					Nome do baba
					<input
						value={typedName}
						onChange={(event) => setTypedName(event.target.value)}
						autoComplete="off"
						className={`mt-1 ${FIELD_CLASS}`}
					/>
				</label>
				{errorMessage && (
					<p className={`mt-2 ${ERROR_CLASS}`}>{errorMessage}</p>
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
						type="submit"
						variant={BUTTON_VARIANT.danger}
						disabled={isPending || !nameMatches}
					>
						Excluir
					</Button>
				</div>
			</form>
		</div>
	);
}
