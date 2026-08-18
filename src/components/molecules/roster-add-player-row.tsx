import { Field, type FieldProps, Formik, useFormikContext } from "formik";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/button";
import { FormError } from "@/components/form-error";
import { PlayerRatingField } from "@/components/player-rating-field";
import { addPlayerFormSchema } from "@/const/form-schema";
import {
	PLAYER_KIND,
	PLAYER_KIND_LABEL,
	PLAYER_KIND_OPTIONS,
	PLAYER_LABEL,
	playerKindFromGoalkeeper,
} from "@/const/player-name";
import {
	PLAYER_NAME_LIST,
	parsePlayerNameList,
	playerNameListInputValue,
} from "@/const/player-name-list";
import { PLAYER_RATING } from "@/const/player-rating";
import {
	BUTTON_VARIANT,
	ERROR_CLASS,
	FIELD_CLASS,
	PLAYER_AVATAR_CLASS,
	PLAYER_KIND_SELECT_CLASS,
} from "@/const/ui";

type RosterAddPlayerFormProps = {
	onAddPlayer: (values: {
		displayNames: string[];
		rating: number;
		isGoalkeeper: boolean;
	}) => Promise<void>;
	children: ReactNode;
};

type RosterAddPlayerBusyProps = {
	isAddingPlayer: boolean;
};

type RosterAddPlayerNameCellProps = RosterAddPlayerBusyProps & {
	addPlayerError: string | null;
};

type RosterAddPlayerRatingCellProps = RosterAddPlayerBusyProps & {
	ceiling: number;
};

export function RosterAddPlayerForm({
	onAddPlayer,
	children,
}: RosterAddPlayerFormProps) {
	return (
		<Formik
			initialValues={{
				name: "",
				rating: PLAYER_RATING.default,
				isGoalkeeper: false,
			}}
			validationSchema={addPlayerFormSchema}
			validateOnChange={false}
			onSubmit={async (values, helpers) => {
				await onAddPlayer({
					displayNames: parsePlayerNameList(values.name),
					rating: values.rating,
					isGoalkeeper: values.isGoalkeeper,
				});
				helpers.resetForm();
			}}
		>
			{children}
		</Formik>
	);
}

export function RosterAddPlayerNameCell({
	isAddingPlayer,
	addPlayerError,
}: RosterAddPlayerNameCellProps) {
	const { submitForm } = useFormikContext();

	return (
		<div className="flex min-w-0 items-center gap-3">
			<span
				className={`flex items-center justify-center rounded-full bg-pitch-soft text-pitch-fg ${PLAYER_AVATAR_CLASS}`}
			>
				<Plus className="size-4" />
			</span>
			<div className="min-w-0 flex-1 space-y-1">
				<div className="flex min-w-0 flex-col items-start">
					<Field name="name">
						{(props: FieldProps<string>) => (
							<input
								{...props.field}
								type="text"
								placeholder={PLAYER_NAME_LIST.inputPlaceholder}
								autoComplete="off"
								disabled={isAddingPlayer}
								className={`min-w-0 max-w-36 ${FIELD_CLASS}`}
								onPaste={(event) => {
									const raw = event.clipboardData.getData("text");
									const next = playerNameListInputValue(raw);
									if (next === raw) {
										return;
									}

									event.preventDefault();
									void props.form.setFieldValue(props.field.name, next);
								}}
								onKeyDown={(event) => {
									if (event.key !== "Enter") {
										return;
									}

									event.preventDefault();
									event.stopPropagation();
									void submitForm();
								}}
							/>
						)}
					</Field>
					<Field name="isGoalkeeper">
						{(props: FieldProps<boolean>) => {
							const selectedKind = playerKindFromGoalkeeper(
								props.field.value === true,
							);

							return (
								<select
									aria-label={PLAYER_LABEL.player}
									value={selectedKind}
									disabled={isAddingPlayer}
									className={
										selectedKind === PLAYER_KIND.goalkeeper
											? PLAYER_KIND_SELECT_CLASS.on
											: PLAYER_KIND_SELECT_CLASS.off
									}
									onChange={(event) => {
										void props.form.setFieldValue(
											props.field.name,
											event.target.value === PLAYER_KIND.goalkeeper,
										);
									}}
								>
									{PLAYER_KIND_OPTIONS.map((option) => (
										<option key={option} value={option}>
											{PLAYER_KIND_LABEL[option]}
										</option>
									))}
								</select>
							);
						}}
					</Field>
				</div>
				<FormError name="name" />
				{addPlayerError && <p className={ERROR_CLASS}>{addPlayerError}</p>}
			</div>
		</div>
	);
}

export function RosterAddPlayerRatingCell({
	ceiling,
	isAddingPlayer,
}: RosterAddPlayerRatingCellProps) {
	return (
		<div>
			<PlayerRatingField ceiling={ceiling} disabled={isAddingPlayer} />
			<FormError name="rating" />
		</div>
	);
}

export function RosterAddPlayerActionsCell({
	isAddingPlayer,
}: RosterAddPlayerBusyProps) {
	const { submitForm } = useFormikContext();

	return (
		<Button
			variant={BUTTON_VARIANT.ghost}
			disabled={isAddingPlayer}
			aria-label={PLAYER_LABEL.addAria}
			className="w-full px-2 !text-pitch-fg hover:!bg-pitch-soft md:w-auto"
			onClick={() => {
				void submitForm();
			}}
		>
			<Plus className="size-4" />
			{PLAYER_LABEL.add}
		</Button>
	);
}
