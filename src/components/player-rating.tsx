import { useState } from "react";
import {
	PLAYER_RATING,
	PLAYER_STAR_CLASS,
	PLAYER_STAR_PATH,
	PLAYER_STARS,
	ratingToStarFill,
	STAR_SIDE,
	type StarSide,
	snapStarFill,
	starHalfToFill,
} from "@/const/player-rating";

type PlayerRatingProps = {
	rating: number;
	ceiling: number;
	onChange?: (starFill: number) => void;
	disabled?: boolean;
	starClassName?: string;
};

function StarIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			className={className}
			aria-hidden="true"
			focusable="false"
		>
			<path d={PLAYER_STAR_PATH} />
		</svg>
	);
}

export function PlayerRating({
	rating,
	ceiling,
	onChange,
	disabled,
	starClassName = PLAYER_STAR_CLASS.default,
}: PlayerRatingProps) {
	const [hoverFill, setHoverFill] = useState<number | null>(null);
	const fill = ratingToStarFill(rating, ceiling);
	const currentFill = snapStarFill(fill);
	const interactive = Boolean(onChange) && !disabled;
	const displayFill = hoverFill ?? fill;

	function handleHalfClick(starIndex: number, side: StarSide) {
		if (!onChange) {
			return;
		}

		const nextFill = starHalfToFill(starIndex, side);
		if (nextFill === currentFill) {
			if (starIndex === 0 && side === STAR_SIDE.left && currentFill === 0.5) {
				onChange(0);
			}
			return;
		}

		onChange(nextFill);
	}

	return (
		<div className="relative inline-flex">
			<span className="sr-only">
				{currentFill} de {PLAYER_RATING.starCount} estrelas
			</span>
			<div className="flex text-fg-subtle" aria-hidden="true">
				{PLAYER_STARS.map((star) => (
					<StarIcon key={`empty-${star.id}`} className={starClassName} />
				))}
			</div>
			<div
				className="pointer-events-none absolute inset-y-0 left-0 overflow-hidden text-amber-400"
				style={{ width: `${(displayFill / PLAYER_RATING.starCount) * 100}%` }}
				aria-hidden="true"
			>
				<div className="flex w-max">
					{PLAYER_STARS.map((star) => (
						<StarIcon key={`fill-${star.id}`} className={starClassName} />
					))}
				</div>
			</div>
			{interactive && (
				<fieldset
					className="absolute inset-0 z-10 m-0 flex cursor-pointer border-0 p-0"
					onMouseLeave={() => setHoverFill(null)}
				>
					<legend className="sr-only">Alterar estrelas</legend>
					{PLAYER_STARS.map((star) => (
						<span key={star.id} className={`relative ${starClassName}`}>
							<button
								type="button"
								className="absolute inset-y-0 left-0 w-1/2 cursor-pointer"
								aria-label={`${starHalfToFill(star.index, STAR_SIDE.left)} estrelas`}
								onMouseEnter={() =>
									setHoverFill(starHalfToFill(star.index, STAR_SIDE.left))
								}
								onClick={() => handleHalfClick(star.index, STAR_SIDE.left)}
							/>
							<button
								type="button"
								className="absolute inset-y-0 right-0 w-1/2 cursor-pointer"
								aria-label={`${starHalfToFill(star.index, STAR_SIDE.right)} estrelas`}
								onMouseEnter={() =>
									setHoverFill(starHalfToFill(star.index, STAR_SIDE.right))
								}
								onClick={() => handleHalfClick(star.index, STAR_SIDE.right)}
							/>
						</span>
					))}
				</fieldset>
			)}
		</div>
	);
}
