import { type FormEvent, useState } from "react";
import {
	PLAYER_RATING,
	PLAYER_STARS,
	ratingToStarFill,
} from "@/const/player-rating";

const STAR_PATH =
	"M12 2.5l2.6 5.27 5.82.85-4.21 4.1 1 5.78L12 15.77 6.79 18.5l1-5.78-4.21-4.1 5.82-.85L12 2.5z";

type PlayerRatingProps = {
	rating: number;
	ceiling: number;
};

type PlayerRatingInputProps = {
	rating: number;
	onCommit: (rating: number) => void;
	disabled?: boolean;
};

function StarIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			className={className}
			aria-hidden="true"
			focusable="false"
		>
			<path d={STAR_PATH} />
		</svg>
	);
}

export function PlayerRating({ rating, ceiling }: PlayerRatingProps) {
	const fill = ratingToStarFill(rating, ceiling);

	return (
		<div className="relative inline-flex">
			<span className="sr-only">
				Nota {rating} de {PLAYER_RATING.max}, {fill} de{" "}
				{PLAYER_RATING.starCount} estrelas no baba
			</span>
			<div className="flex text-slate-300" aria-hidden="true">
				{PLAYER_STARS.map((star) => (
					<StarIcon
						key={`empty-${star.id}`}
						className="h-5 w-5 shrink-0 fill-current"
					/>
				))}
			</div>
			<div
				className="pointer-events-none absolute inset-y-0 left-0 overflow-hidden text-amber-400"
				style={{ width: `${(fill / PLAYER_RATING.starCount) * 100}%` }}
				aria-hidden="true"
			>
				<div className="flex w-max">
					{PLAYER_STARS.map((star) => (
						<StarIcon
							key={`fill-${star.id}`}
							className="h-5 w-5 shrink-0 fill-current"
						/>
					))}
				</div>
			</div>
		</div>
	);
}

export function PlayerRatingInput({
	rating,
	onCommit,
	disabled,
}: PlayerRatingInputProps) {
	const [value, setValue] = useState(String(rating));
	const [prevRating, setPrevRating] = useState(rating);

	if (rating !== prevRating) {
		setPrevRating(rating);
		setValue(String(rating));
	}

	function commit() {
		const next = Number(value);
		if (
			!Number.isInteger(next) ||
			next < PLAYER_RATING.min ||
			next > PLAYER_RATING.max
		) {
			setValue(String(rating));
			return;
		}

		if (next === rating) {
			return;
		}

		onCommit(next);
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		commit();
	}

	return (
		<form onSubmit={handleSubmit}>
			<input
				type="number"
				min={PLAYER_RATING.min}
				max={PLAYER_RATING.max}
				value={value}
				disabled={disabled}
				onChange={(event) => setValue(event.target.value)}
				onBlur={commit}
				aria-label={`Nota de ${PLAYER_RATING.min} a ${PLAYER_RATING.max}`}
				className="w-16 rounded border border-slate-300 px-2 py-0.5 text-sm"
			/>
		</form>
	);
}
