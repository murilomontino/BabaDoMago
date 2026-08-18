import { Field, Form, Formik, useFormikContext } from "formik";
import { X } from "lucide-react";
import type { KeyboardEvent } from "react";
import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import { FormError } from "@/components/form-error";
import { playerNicknameSchema } from "@/const/form-schema";
import {
	normalizeNicknameTags,
	PLAYER_LABEL,
	playerVisibleName,
} from "@/const/player-name";
import {
	BUTTON_VARIANT,
	CHIP_CLASS,
	ERROR_CLASS,
	FIELD_CLASS,
	MODAL_CLASS,
} from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";

type NicknameFormValues = {
	nickname: string;
	nickname_tags: string[];
	tagDraft: string;
};

type EditPlayerNicknameModalProps = {
	player: ChampionshipPlayer;
	isPending: boolean;
	errorMessage: string | null;
	onCancel: () => void;
	onConfirm: (nickname: string, nicknameTags: string[]) => void;
};

function nextTagsFromDraft(
	tags: readonly string[],
	draft: string,
): { tags: string[]; draft: string } {
	if (!draft.includes(",") && !draft.includes("\n")) {
		return { tags: [...tags], draft };
	}

	const parts = draft.split(/[,\n]/);
	const rest = parts.at(-1) ?? "";
	return {
		tags: normalizeNicknameTags([...tags, ...parts.slice(0, -1)]),
		draft: rest,
	};
}

function NicknameTagsField({ disabled }: { disabled: boolean }) {
	const { values, setFieldValue } = useFormikContext<NicknameFormValues>();

	function applyTags(nextTags: string[], nextDraft: string) {
		void setFieldValue("nickname_tags", nextTags);
		void setFieldValue("tagDraft", nextDraft);
	}

	function handleDraftKeyDown(event: KeyboardEvent<HTMLInputElement>) {
		if (event.key !== "Enter") {
			return;
		}

		event.preventDefault();
		applyTags(
			normalizeNicknameTags([...values.nickname_tags, values.tagDraft]),
			"",
		);
	}

	return (
		<label
			htmlFor="player-nickname-tags"
			className="mt-3 block text-sm text-fg-muted"
		>
			{PLAYER_LABEL.nicknameTags}
			{values.nickname_tags.length > 0 && (
				<div className="mt-1 flex flex-wrap gap-1">
					{values.nickname_tags.map((tag, index) => (
						<span
							key={tag}
							className={`inline-flex items-center gap-1 ${CHIP_CLASS}`}
						>
							{tag}
							<button
								type="button"
								aria-label={`${PLAYER_LABEL.nicknameTagRemove} ${tag}`}
								disabled={disabled}
								className="rounded text-fg-muted hover:text-fg"
								onClick={() => {
									applyTags(
										values.nickname_tags.filter(
											(_, tagIndex) => tagIndex !== index,
										),
										values.tagDraft,
									);
								}}
							>
								<X className="size-3" />
							</button>
						</span>
					))}
				</div>
			)}
			<input
				id="player-nickname-tags"
				name="tagDraft"
				value={values.tagDraft}
				placeholder={PLAYER_LABEL.nicknameTagsPlaceholder}
				autoComplete="off"
				disabled={disabled}
				className={`mt-1 ${FIELD_CLASS}`}
				onChange={(event) => {
					const next = nextTagsFromDraft(
						values.nickname_tags,
						event.target.value,
					);
					applyTags(next.tags, next.draft);
				}}
				onKeyDown={handleDraftKeyDown}
			/>
		</label>
	);
}

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
				initialValues={{
					nickname: player.nickname ?? "",
					nickname_tags: [...player.nickname_tags],
					tagDraft: "",
				}}
				enableReinitialize
				validationSchema={playerNicknameSchema}
				onSubmit={(values) => {
					onConfirm(
						values.nickname ?? "",
						normalizeNicknameTags([...values.nickname_tags, values.tagDraft]),
					);
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
					<NicknameTagsField disabled={isPending} />
					<FormError name="nickname_tags" />
					<FormError name="tagDraft" />
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
