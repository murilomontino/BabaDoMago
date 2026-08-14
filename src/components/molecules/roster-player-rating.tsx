import { Formik } from "formik";
import { type KeyboardEvent, useEffect, useState } from "react";
import { PlayerRating } from "@/components/player-rating";
import { PlayerRatingField } from "@/components/player-rating-field";
import { playerRatingSchema } from "@/const/form-schema";
import {
	PLAYER_RATING_INPUT,
	parsePlayerRatingInput,
} from "@/const/player-rating";
import { CHIP_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";

export type RosterPlayerRatingProps = {
	player: ChampionshipPlayer;
	isOwnerViewer: boolean;
	ceiling: number;
	onChangeRating?: (playerId: number, rating: number) => void;
	ratingPlayerId?: number | null;
};

function RosterRatingInput({
	rating,
	disabled,
	onCommit,
}: {
	rating: number;
	disabled: boolean;
	onCommit: (rating: number) => void;
}) {
	const [draft, setDraft] = useState(String(rating));

	useEffect(() => {
		setDraft(String(rating));
	}, [rating]);

	function revert() {
		setDraft(String(rating));
	}

	function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
		if (event.key === "Escape") {
			revert();
			event.currentTarget.blur();
			return;
		}

		if (event.key !== "Enter") {
			return;
		}

		event.preventDefault();
		const parsed = parsePlayerRatingInput(draft);
		if (parsed === null) {
			revert();
			return;
		}

		if (parsed !== rating) {
			onCommit(parsed);
		}

		event.currentTarget.blur();
	}

	return (
		<input
			type="text"
			inputMode="decimal"
			aria-label={PLAYER_RATING_INPUT.ariaLabel}
			disabled={disabled}
			value={draft}
			className={`${CHIP_CLASS} w-12 border-0 text-center outline-none focus:ring-2 focus:ring-pitch/20`}
			onChange={(event) => {
				setDraft(event.target.value);
			}}
			onBlur={revert}
			onKeyDown={handleKeyDown}
		/>
	);
}

export function RosterPlayerRating({
	player,
	isOwnerViewer,
	ceiling,
	onChangeRating,
	ratingPlayerId,
}: RosterPlayerRatingProps) {
	return (
		<div className="flex items-center gap-2">
			{onChangeRating && (
				<Formik
					initialValues={{ rating: player.rating }}
					enableReinitialize
					validationSchema={playerRatingSchema}
					onSubmit={(values) => onChangeRating(player.id, values.rating)}
				>
					<PlayerRatingField
						ceiling={ceiling}
						disabled={ratingPlayerId === player.id}
						onCommit={(rating) => onChangeRating(player.id, rating)}
					/>
				</Formik>
			)}
			{!onChangeRating && (
				<PlayerRating rating={player.rating} ceiling={ceiling} />
			)}
			{isOwnerViewer && onChangeRating && (
				<RosterRatingInput
					rating={player.rating}
					disabled={ratingPlayerId === player.id}
					onCommit={(rating) => onChangeRating(player.id, rating)}
				/>
			)}
			{isOwnerViewer && !onChangeRating && (
				<span className={CHIP_CLASS}>{player.rating}</span>
			)}
		</div>
	);
}
