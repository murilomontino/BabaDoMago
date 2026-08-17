import { Field, type FieldProps, Formik } from "formik";
import { Plus } from "lucide-react";
import { Button } from "@/components/button";
import { FormError } from "@/components/form-error";
import { PlayerRatingField } from "@/components/player-rating-field";
import { EVENT_ATTENDANCE_ACTION } from "@/const/championship-event";
import { addPlayerFormSchema } from "@/const/form-schema";
import { parsePlayerNameList } from "@/const/player-name-list";
import { PLAYER_RATING } from "@/const/player-rating";
import { BUTTON_VARIANT, ERROR_CLASS, FIELD_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";

type EventAttendanceAddPlayerProps = {
	ceiling: number;
	isAddingPlayer: boolean;
	addPlayerError: string | null;
	onAddPlayer: (values: {
		displayNames: string[];
		rating: number;
		isGoalkeeper: boolean;
	}) => Promise<ChampionshipPlayer[]>;
};

export function EventAttendanceAddPlayer({
	ceiling,
	isAddingPlayer,
	addPlayerError,
	onAddPlayer,
}: EventAttendanceAddPlayerProps) {
	return (
		<Formik
			initialValues={{
				name: "",
				rating: PLAYER_RATING.default,
				isGoalkeeper: false,
			}}
			validationSchema={addPlayerFormSchema}
			onSubmit={async (values, helpers) => {
				await onAddPlayer({
					displayNames: parsePlayerNameList(values.name),
					rating: values.rating,
					isGoalkeeper: false,
				});
				helpers.resetForm();
			}}
		>
			{({ submitForm }) => (
				<div className="space-y-2">
					<p className="text-sm text-fg-muted">
						{EVENT_ATTENDANCE_ACTION.addPlayer}
					</p>
					<div className="flex flex-col items-stretch gap-2 md:flex-row md:flex-wrap md:items-center">
						<Field name="name">
							{(props: FieldProps<string>) => (
								<input
									{...props.field}
									id="event-attendance-add-player"
									type="text"
									placeholder={EVENT_ATTENDANCE_ACTION.addPlayerPlaceholder}
									autoComplete="off"
									disabled={isAddingPlayer}
									className={`min-w-0 flex-1 ${FIELD_CLASS}`}
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
						<PlayerRatingField ceiling={ceiling} disabled={isAddingPlayer} />
						<Button
							variant={BUTTON_VARIANT.ghost}
							disabled={isAddingPlayer}
							aria-label={EVENT_ATTENDANCE_ACTION.addPlayerAria}
							className="w-full px-2 !text-pitch-fg hover:!bg-pitch-soft md:w-auto"
							onClick={() => {
								void submitForm();
							}}
						>
							<Plus className="size-4" />
							add
						</Button>
					</div>
					<FormError name="name" />
					<FormError name="rating" />
					{addPlayerError && <p className={ERROR_CLASS}>{addPlayerError}</p>}
				</div>
			)}
		</Formik>
	);
}
