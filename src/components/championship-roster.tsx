import { Formik } from "formik";
import { Unlink, UserCheck, UserPlus, UserX } from "lucide-react";
import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
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
import { championshipRatingCeiling } from "@/const/player-rating";
import { BUTTON_VARIANT, FIELD_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";

type ChampionshipRosterProps = {
	players: ChampionshipPlayer[];
	createdBy: string;
	currentUserId: string | null;
	claimingPlayerId?: number | null;
	onClaim?: (playerId: number) => void;
	onChangeRating?: (playerId: number, rating: number) => void;
	ratingPlayerId?: number | null;
	onChangeRole?: (playerId: number, role: AssignableChampionshipRole) => void;
	onUnlink?: (playerId: number) => void;
	unlinkingPlayerId?: number | null;
	onDeactivate?: (playerId: number) => void;
	deactivatingPlayerId?: number | null;
	onReactivate?: (playerId: number) => void;
	reactivatingPlayerId?: number | null;
	emptyTitle?: string;
};

export function ChampionshipRoster({
	players,
	createdBy,
	currentUserId,
	claimingPlayerId,
	onClaim,
	onChangeRating,
	ratingPlayerId,
	onChangeRole,
	onUnlink,
	unlinkingPlayerId,
	onDeactivate,
	deactivatingPlayerId,
	onReactivate,
	reactivatingPlayerId,
	emptyTitle = "Nenhum jogador ainda",
}: ChampionshipRosterProps) {
	const alreadyMember = Boolean(
		currentUserId && players.some((player) => player.user_id === currentUserId),
	);
	const isOwner = Boolean(currentUserId && currentUserId === createdBy);

	if (players.length === 0) {
		return (
			<EmptyState icon={<UserPlus className="size-10" />} title={emptyTitle} />
		);
	}

	const ceiling = championshipRatingCeiling(
		players.map((player) => player.rating),
	);

	return (
		<ul className="divide-y divide-stone-100">
			{players.map((player) => {
				const displayRole = resolveChampionshipRole(
					createdBy,
					player.user_id,
					player.role,
				);
				const isChampionshipOwner = displayRole === CHAMPIONSHIP_ROLE.owner;
				const canClaim = Boolean(
					onClaim && !player.user_id && !alreadyMember && !player.deleted_at,
				);
				const canEditRole = Boolean(
					onChangeRole && player.user_id && !isChampionshipOwner,
				);
				const canUnlink = Boolean(
					onUnlink &&
						player.user_id &&
						!isChampionshipOwner &&
						!player.deleted_at,
				);
				const canDeactivate = Boolean(
					onDeactivate && !isChampionshipOwner && !player.deleted_at,
				);
				const canReactivate = Boolean(onReactivate && player.deleted_at);

				return (
					<li
						key={player.id}
						className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
					>
						<div className="flex items-center gap-3">
							{player.avatar_url && (
								<img
									src={player.avatar_url}
									alt=""
									referrerPolicy="no-referrer"
									className="h-9 w-9 rounded-full object-cover"
								/>
							)}
							{!player.avatar_url && (
								<span className="flex h-9 w-9 items-center justify-center rounded-full bg-pitch-soft text-sm font-medium text-pitch">
									{player.display_name.charAt(0).toUpperCase()}
								</span>
							)}
							<div>
								<p className="font-medium text-stone-900">
									{player.display_name}
								</p>
								<div className="mt-1 flex items-center gap-2">
									{onChangeRating && (
										<Formik
											initialValues={{ rating: player.rating }}
											enableReinitialize
											validationSchema={playerRatingSchema}
											onSubmit={(values) =>
												onChangeRating(player.id, values.rating)
											}
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
									{isOwner && (
										<span className="rounded bg-stone-100 px-1.5 py-0.5 text-xs font-medium tabular-nums text-stone-700">
											{player.rating}
										</span>
									)}
								</div>
								{player.user_id && (
									<span className="mt-1 inline-flex rounded-full bg-pitch-soft px-2 py-0.5 text-xs font-medium text-pitch">
										{CHAMPIONSHIP_ROLE_LABEL[displayRole]}
									</span>
								)}
								{!player.user_id && (
									<span className="mt-1 inline-flex rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
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
						<div className="flex flex-wrap justify-end gap-2">
							{canClaim && onClaim && (
								<Button
									variant={BUTTON_VARIANT.secondary}
									onClick={() => onClaim(player.id)}
									disabled={claimingPlayerId === player.id}
								>
									<UserPlus className="size-4" />
									Conectar
								</Button>
							)}
							{canUnlink && onUnlink && (
								<Button
									variant={BUTTON_VARIANT.secondary}
									onClick={() => onUnlink(player.id)}
									disabled={unlinkingPlayerId === player.id}
								>
									<Unlink className="size-4" />
									Desconectar
								</Button>
							)}
							{canDeactivate && onDeactivate && (
								<Button
									variant={BUTTON_VARIANT.danger}
									onClick={() => onDeactivate(player.id)}
									disabled={deactivatingPlayerId === player.id}
								>
									<UserX className="size-4" />
									Desativar
								</Button>
							)}
							{canReactivate && onReactivate && (
								<Button
									onClick={() => onReactivate(player.id)}
									disabled={reactivatingPlayerId === player.id}
								>
									<UserCheck className="size-4" />
									Ativar
								</Button>
							)}
						</div>
					</li>
				);
			})}
		</ul>
	);
}
