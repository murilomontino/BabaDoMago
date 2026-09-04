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
	goalkeeperCeiling?: number;
	onChangeRating?: (playerId: number, rating: number) => void;
	onChangeGoalkeeperRating?: (playerId: number, rating: number) => void;
	ratingPlayerId?: number | null;
};

function RosterRatingInput({
	rating,
	disabled,
	ariaLabel,
	onCommit,
}: {
	rating: number;
	disabled: boolean;
	ariaLabel: string;
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
			aria-label={ariaLabel}
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

function RosterRatingTrack({
	rating,
	ceiling,
	isOwnerViewer,
	busy,
	ariaLabel,
	onChange,
}: {
	rating: number;
	ceiling: number;
	isOwnerViewer: boolean;
	busy: boolean;
	ariaLabel: string;
	onChange?: (rating: number) => void;
}) {
	return (
		<div className="flex items-center gap-2">
			{onChange && (
				<Formik
					initialValues={{ rating }}
					enableReinitialize
					validationSchema={playerRatingSchema}
					onSubmit={(values) => onChange(values.rating)}
				>
					<PlayerRatingField
						ceiling={ceiling}
						disabled={busy}
						onCommit={onChange}
					/>
				</Formik>
			)}
			{!onChange && <PlayerRating rating={rating} ceiling={ceiling} />}
			{isOwnerViewer && onChange && (
				<RosterRatingInput
					rating={rating}
					disabled={busy}
					ariaLabel={ariaLabel}
					onCommit={onChange}
				/>
			)}
			{isOwnerViewer && !onChange && (
				<span className={CHIP_CLASS}>{rating}</span>
			)}
		</div>
	);
}

export function RosterPlayerRating({
	player,
	isOwnerViewer,
	ceiling,
	goalkeeperCeiling = ceiling,
	onChangeRating,
	onChangeGoalkeeperRating,
	ratingPlayerId,
}: RosterPlayerRatingProps) {
	const busy = ratingPlayerId === player.id;

	return (
		<div className="flex flex-col gap-1">
			<RosterRatingTrack
				rating={player.rating}
				ceiling={ceiling}
				isOwnerViewer={isOwnerViewer}
				busy={busy}
				ariaLabel={PLAYER_RATING_INPUT.ariaLabel}
				onChange={
					onChangeRating
						? (rating) => onChangeRating(player.id, rating)
						: undefined
				}
			/>
			{player.is_goalkeeper && (
				<RosterRatingTrack
					rating={player.goalkeeper_rating}
					ceiling={goalkeeperCeiling}
					isOwnerViewer={isOwnerViewer}
					busy={busy}
					ariaLabel={PLAYER_RATING_INPUT.goalkeeperAriaLabel}
					onChange={
						onChangeGoalkeeperRating
							? (rating) => onChangeGoalkeeperRating(player.id, rating)
							: undefined
					}
				/>
			)}
		</div>
	);
}
