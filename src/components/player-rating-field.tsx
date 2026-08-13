import { useField } from "formik";
import { PlayerRating } from "@/components/player-rating";
import { playerRatingSchema } from "@/const/form-schema";
import { starFillToRating } from "@/const/player-rating";

type PlayerRatingFieldProps = {
	ceiling: number;
	disabled?: boolean;
	onCommit?: (rating: number) => void;
};

export function PlayerRatingField({
	ceiling,
	disabled,
	onCommit,
}: PlayerRatingFieldProps) {
	const [field, , helpers] = useField<number>("rating");

	function handleChange(starFill: number) {
		const rating = starFillToRating(starFill, ceiling);
		void helpers.setValue(rating, true);
		if (!onCommit) {
			return;
		}

		if (!playerRatingSchema.isValidSync({ rating })) {
			return;
		}

		onCommit(rating);
	}

	return (
		<PlayerRating
			rating={field.value}
			ceiling={ceiling}
			disabled={disabled}
			onChange={handleChange}
		/>
	);
}
