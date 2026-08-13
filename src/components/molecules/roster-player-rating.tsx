import { Formik } from "formik";
import { PlayerRating } from "@/components/player-rating";
import { PlayerRatingField } from "@/components/player-rating-field";
import { playerRatingSchema } from "@/const/form-schema";
import { CHIP_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";

export type RosterPlayerRatingProps = {
	player: ChampionshipPlayer;
	isOwnerViewer: boolean;
	ceiling: number;
	onChangeRating?: (playerId: number, rating: number) => void;
	ratingPlayerId?: number | null;
};

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
			{isOwnerViewer && <span className={CHIP_CLASS}>{player.rating}</span>}
		</div>
	);
}
