import { Field, Form, Formik } from "formik";
import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import { FormError } from "@/components/form-error";
import { EVENT_ACTION } from "@/const/championship-event";
import { EVENT_TEAM_COLOR_LABEL } from "@/const/event-team-color";
import { addMatchFormSchema } from "@/const/form-schema";
import {
	BUTTON_VARIANT,
	ERROR_CLASS,
	FIELD_CLASS,
	MODAL_CLASS,
} from "@/const/ui";
import type { ChampionshipEventTeam } from "@/types/championship-event";

type AddEventMatchModalProps = {
	teams: readonly ChampionshipEventTeam[];
	isPending: boolean;
	errorMessage: string | null;
	onCancel: () => void;
	onAdd: (values: { teamAId: number; teamBId: number }) => Promise<void>;
};

export function AddEventMatchModal({
	teams,
	isPending,
	errorMessage,
	onCancel,
	onAdd,
}: AddEventMatchModalProps) {
	return (
		<AppDialog onClose={onCancel}>
			<div className={MODAL_CLASS}>
				<p className="mb-3 text-sm font-medium tracking-tight text-fg">
					{EVENT_ACTION.addMatch}
				</p>
				<Formik
					initialValues={{ teamAId: "", teamBId: "" }}
					validationSchema={addMatchFormSchema}
					validateOnMount
					onSubmit={async (values) => {
						await onAdd({
							teamAId: Number(values.teamAId),
							teamBId: Number(values.teamBId),
						});
					}}
				>
					{({ isValid }) => (
						<Form className="space-y-2">
							<label
								htmlFor="match-team-a"
								className="block text-sm text-fg-muted"
							>
								Time A
								<Field
									as="select"
									id="match-team-a"
									name="teamAId"
									className={`mt-1 ${FIELD_CLASS}`}
								>
									<option value="">Selecionar</option>
									{teams.map((team) => (
										<option key={team.id} value={team.id}>
											{EVENT_TEAM_COLOR_LABEL[team.color] ?? team.color}
										</option>
									))}
								</Field>
							</label>
							<label
								htmlFor="match-team-b"
								className="block text-sm text-fg-muted"
							>
								Time B
								<Field
									as="select"
									id="match-team-b"
									name="teamBId"
									className={`mt-1 ${FIELD_CLASS}`}
								>
									<option value="">Selecionar</option>
									{teams.map((team) => (
										<option key={team.id} value={team.id}>
											{EVENT_TEAM_COLOR_LABEL[team.color] ?? team.color}
										</option>
									))}
								</Field>
							</label>
							<FormError name="teamAId" />
							<FormError name="teamBId" />
							{errorMessage && <p className={ERROR_CLASS}>{errorMessage}</p>}
							<div className="mt-4 flex justify-end gap-2">
								<Button
									type="button"
									variant={BUTTON_VARIANT.secondary}
									onClick={onCancel}
									disabled={isPending}
								>
									Cancelar
								</Button>
								<Button type="submit" disabled={isPending || !isValid}>
									{EVENT_ACTION.addMatch}
								</Button>
							</div>
						</Form>
					)}
				</Formik>
			</div>
		</AppDialog>
	);
}
