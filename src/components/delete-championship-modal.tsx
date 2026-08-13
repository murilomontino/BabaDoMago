import { Field, Form, Formik } from "formik";
import { Button } from "@/components/button";
import { FormError } from "@/components/form-error";
import { deleteChampionshipSchema } from "@/const/form-schema";
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
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
			<Formik
				initialValues={{ typedName: "" }}
				validationSchema={deleteChampionshipSchema(championshipName)}
				validateOnMount
				onSubmit={() => {
					onConfirm();
				}}
			>
				{({ isValid }) => (
					<Form className="w-full max-w-lg rounded-xl bg-white p-4 shadow-lg">
						<p className="mb-1 text-sm font-medium tracking-tight text-stone-800">
							Excluir campeonato
						</p>
						<p className="mb-3 text-sm text-stone-600">
							Digite o nome do baba para confirmar.
						</p>
						<p className="mb-3 select-all text-sm font-bold text-stone-900">
							"{championshipName}"
						</p>
						<label
							htmlFor="typed-championship-name"
							className="block text-sm text-stone-600"
						>
							Nome do baba
							<Field
								id="typed-championship-name"
								name="typedName"
								autoComplete="off"
								className={`mt-1 ${FIELD_CLASS}`}
							/>
						</label>
						<FormError name="typedName" />
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
								disabled={isPending || !isValid}
							>
								Excluir
							</Button>
						</div>
					</Form>
				)}
			</Formik>
		</div>
	);
}
