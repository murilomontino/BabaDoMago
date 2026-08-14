import { Field, Form, Formik } from "formik";
import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import { FormError } from "@/components/form-error";
import { mergePlayersSchema } from "@/const/form-schema";
import { playerVisibleName } from "@/const/player-name";
import {
	BUTTON_VARIANT,
	ERROR_CLASS,
	FIELD_CLASS,
	MODAL_CLASS,
} from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";

const MERGE_PLAYER_LABEL = {
	title: "Unir jogadores",
	keep: "Jogador sem conta",
	absorb: "Jogador com conta",
	hint: "A conta Google vai para o jogador sem conta. O outro será desativado.",
	submit: "Unir",
	cancel: "Cancelar",
	placeholder: "Selecionar jogador",
} as const;

type MergeChampionshipPlayersModalProps = {
	players: ChampionshipPlayer[];
	createdBy: string;
	starter: ChampionshipPlayer;
	isPending: boolean;
	errorMessage: string | null;
	onCancel: () => void;
	onConfirm: (keepPlayerId: number, absorbPlayerId: number) => void;
};

export function MergeChampionshipPlayersModal({
	players,
	createdBy,
	starter,
	isPending,
	errorMessage,
	onCancel,
	onConfirm,
}: MergeChampionshipPlayersModalProps) {
	const keepPlayers = players.filter(
		(player) => !player.user_id && !player.deleted_at,
	);
	const absorbPlayers = players.filter(
		(player) =>
			player.user_id && player.user_id !== createdBy && !player.deleted_at,
	);

	return (
		<AppDialog onClose={onCancel}>
			<Formik
				initialValues={{
					keepPlayerId: starter.user_id ? "" : String(starter.id),
					absorbPlayerId: starter.user_id ? String(starter.id) : "",
				}}
				enableReinitialize
				validationSchema={mergePlayersSchema}
				onSubmit={(values) => {
					onConfirm(Number(values.keepPlayerId), Number(values.absorbPlayerId));
				}}
			>
				{({ isValid }) => (
					<Form className={MODAL_CLASS}>
						<p className="mb-1 text-sm font-medium tracking-tight text-fg">
							{MERGE_PLAYER_LABEL.title}
						</p>
						<p className="mb-3 text-sm text-fg-muted">
							{MERGE_PLAYER_LABEL.hint}
						</p>
						<label
							htmlFor="merge-keep-player"
							className="mb-3 block text-sm text-fg-muted"
						>
							{MERGE_PLAYER_LABEL.keep}
							<Field
								as="select"
								id="merge-keep-player"
								name="keepPlayerId"
								className={`mt-1 ${FIELD_CLASS}`}
							>
								<option value="">{MERGE_PLAYER_LABEL.placeholder}</option>
								{keepPlayers.map((player) => (
									<option key={player.id} value={player.id}>
										{playerVisibleName(player)}
									</option>
								))}
							</Field>
						</label>
						<FormError name="keepPlayerId" />
						<label
							htmlFor="merge-absorb-player"
							className="mb-3 block text-sm text-fg-muted"
						>
							{MERGE_PLAYER_LABEL.absorb}
							<Field
								as="select"
								id="merge-absorb-player"
								name="absorbPlayerId"
								className={`mt-1 ${FIELD_CLASS}`}
							>
								<option value="">{MERGE_PLAYER_LABEL.placeholder}</option>
								{absorbPlayers.map((player) => (
									<option key={player.id} value={player.id}>
										{playerVisibleName(player)}
									</option>
								))}
							</Field>
						</label>
						<FormError name="absorbPlayerId" />
						{errorMessage && (
							<p className={`mt-2 ${ERROR_CLASS}`}>{errorMessage}</p>
						)}
						<div className="mt-4 flex justify-end gap-2">
							<Button
								type="button"
								variant={BUTTON_VARIANT.secondary}
								onClick={onCancel}
								disabled={isPending}
							>
								{MERGE_PLAYER_LABEL.cancel}
							</Button>
							<Button type="submit" disabled={isPending || !isValid}>
								{MERGE_PLAYER_LABEL.submit}
							</Button>
						</div>
					</Form>
				)}
			</Formik>
		</AppDialog>
	);
}
