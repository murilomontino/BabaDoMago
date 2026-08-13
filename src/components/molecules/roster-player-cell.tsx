import { Formik } from "formik";
import { PlayerRating } from "@/components/player-rating";
import { PlayerRatingField } from "@/components/player-rating-field";
import {
	ASSIGNABLE_CHAMPIONSHIP_ROLES,
	type AssignableChampionshipRole,
	CHAMPIONSHIP_ROLE,
	CHAMPIONSHIP_ROLE_LABEL,
	resolveChampionshipRole,
} from "@/const/championship-role";
import { playerRatingSchema } from "@/const/form-schema";
import { CHIP_CLASS, FIELD_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";

export type RosterPlayerCellProps = {
	player: ChampionshipPlayer;
	createdBy: string;
	isOwnerViewer: boolean;
	ceiling: number;
	onChangeRating?: (playerId: number, rating: number) => void;
	ratingPlayerId?: number | null;
	onChangeRole?: (playerId: number, role: AssignableChampionshipRole) => void;
};

export function RosterPlayerCell({
	player,
	createdBy,
	isOwnerViewer,
	ceiling,
	onChangeRating,
	ratingPlayerId,
	onChangeRole,
}: RosterPlayerCellProps) {
	const displayRole = resolveChampionshipRole(
		createdBy,
		player.user_id,
		player.role,
	);
	const isChampionshipOwner = displayRole === CHAMPIONSHIP_ROLE.owner;
	const canEditRole = Boolean(
		onChangeRole && player.user_id && !isChampionshipOwner,
	);

	return (
		<div className="flex min-w-0 items-center gap-3">
			{player.avatar_url && (
				<img
					src={player.avatar_url}
					alt=""
					referrerPolicy="no-referrer"
					className="h-9 w-9 rounded-full object-cover"
				/>
			)}
			{!player.avatar_url && (
				<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pitch-soft text-sm font-medium text-pitch-fg">
					{player.display_name.charAt(0).toUpperCase()}
				</span>
			)}
			<div className="min-w-0">
				<p className="font-medium text-fg">{player.display_name}</p>
				<div className="mt-1 flex items-center gap-2">
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
				{player.user_id && (
					<span className="mt-1 inline-flex rounded-full bg-pitch-soft px-2 py-0.5 text-xs font-medium text-pitch-fg">
						{CHAMPIONSHIP_ROLE_LABEL[displayRole]}
					</span>
				)}
				{!player.user_id && (
					<span className="mt-1 inline-flex rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-fg-muted">
						Sem conta
					</span>
				)}
				{canEditRole && onChangeRole && (
					<select
						value={player.role}
						onChange={(event) => {
							const nextRole = ASSIGNABLE_CHAMPIONSHIP_ROLES.find(
								(role) => role === event.target.value,
							);
							if (!nextRole) {
								return;
							}

							onChangeRole(player.id, nextRole);
						}}
						className={`mt-1 ${FIELD_CLASS} py-1 text-xs`}
					>
						{ASSIGNABLE_CHAMPIONSHIP_ROLES.map((role) => (
							<option key={role} value={role}>
								{CHAMPIONSHIP_ROLE_LABEL[role]}
							</option>
						))}
					</select>
				)}
			</div>
		</div>
	);
}
