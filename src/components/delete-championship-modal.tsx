import { Field, Form, Formik } from "formik";
import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import { FormError } from "@/components/form-error";
import { deleteChampionshipSchema } from "@/const/form-schema";
import {
	BUTTON_VARIANT,
	ERROR_CLASS,
	FIELD_CLASS,
	MODAL_CLASS,
} from "@/const/ui";

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
		<AppDialog onClose={onCancel}>
			<Formik
				initialValues={{ typedName: "" }}
				validationSchema={deleteChampionshipSchema(championshipName)}
				validateOnMount
				onSubmit={() => {
					onConfirm();
				}}
			>
				{({ isValid }) => (
					<Form className={MODAL_CLASS}>
						<p className="mb-1 text-sm font-medium tracking-tight text-fg">
							Excluir campeonato
						</p>
						<p className="mb-3 text-sm text-fg-muted">
							Digite o nome do baba para confirmar.
						</p>
						<p className="mb-3 select-all text-sm font-bold text-fg">
							"{championshipName}"
						</p>
						<label
							htmlFor="typed-championship-name"
							className="block text-sm text-fg-muted"
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
		</AppDialog>
	);
}
