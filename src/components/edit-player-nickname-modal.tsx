import { Field, Form, Formik } from "formik";
import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import { FormError } from "@/components/form-error";
import { playerNicknameSchema } from "@/const/form-schema";
import { PLAYER_LABEL, playerVisibleName } from "@/const/player-name";
import {
	BUTTON_VARIANT,
	ERROR_CLASS,
	FIELD_CLASS,
	MODAL_CLASS,
} from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";

type EditPlayerNicknameModalProps = {
	player: ChampionshipPlayer;
	isPending: boolean;
	errorMessage: string | null;
	onCancel: () => void;
	onConfirm: (nickname: string) => void;
};

export function EditPlayerNicknameModal({
	player,
	isPending,
	errorMessage,
	onCancel,
	onConfirm,
}: EditPlayerNicknameModalProps) {
	const visibleName = playerVisibleName(player);

	return (
		<AppDialog onClose={onCancel}>
			<Formik
				initialValues={{ nickname: player.nickname ?? "" }}
				enableReinitialize
				validationSchema={playerNicknameSchema}
				onSubmit={(values) => {
					onConfirm(values.nickname ?? "");
				}}
			>
				<Form className={MODAL_CLASS}>
					<p className="mb-3 text-sm font-medium tracking-tight text-fg">
						{PLAYER_LABEL.nickname}
					</p>
					<div className="mb-3 flex flex-col items-center gap-2">
						{player.avatar_url && (
							<img
								src={player.avatar_url}
								alt=""
								referrerPolicy="no-referrer"
								className="h-14 w-14 rounded-full object-cover"
							/>
						)}
						{!player.avatar_url && (
							<span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-pitch-soft text-lg font-medium text-pitch-fg">
								{visibleName.charAt(0).toUpperCase()}
							</span>
						)}
						<p className="text-sm font-medium text-fg">{visibleName}</p>
					</div>
					<label
						htmlFor="player-nickname"
						className="block text-sm text-fg-muted"
					>
						{PLAYER_LABEL.nickname}
						<Field
							id="player-nickname"
							name="nickname"
							placeholder={PLAYER_LABEL.nicknamePlaceholder}
							autoComplete="off"
							className={`mt-1 ${FIELD_CLASS}`}
						/>
					</label>
					<FormError name="nickname" />
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
						<Button type="submit" disabled={isPending}>
							Salvar
						</Button>
					</div>
				</Form>
			</Formik>
		</AppDialog>
	);
}
