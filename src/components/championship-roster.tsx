import { UserPlus } from "lucide-react";
import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { PlayerRating } from "@/components/player-rating";
import {
	ASSIGNABLE_CHAMPIONSHIP_ROLES,
	type AssignableChampionshipRole,
	CHAMPIONSHIP_ROLE,
	CHAMPIONSHIP_ROLE_LABEL,
	resolveChampionshipRole,
} from "@/const/championship-role";
import {
	championshipRatingCeiling,
	starFillToRating,
} from "@/const/player-rating";
import { BUTTON_VARIANT, FIELD_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";

type ChampionshipRosterProps = {
	players: ChampionshipPlayer[];
	createdBy: string;
	currentUserId: string | null;
	claimingPlayerId: number | null;
	onClaim: (playerId: number) => void;
	onChangeRating?: (playerId: number, rating: number) => void;
	ratingPlayerId?: number | null;
	onChangeRole?: (playerId: number, role: AssignableChampionshipRole) => void;
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
}: ChampionshipRosterProps) {
	const alreadyMember = Boolean(
		currentUserId && players.some((player) => player.user_id === currentUserId),
	);

	if (players.length === 0) {
		return (
			<EmptyState
				icon={<UserPlus className="size-10" />}
				title="Nenhum jogador ainda"
			/>
		);
	}

	const ceiling = championshipRatingCeiling(
		players.map((player) => player.rating),
	);

	return (
		<ul className="divide-y divide-stone-100">
			{players.map((player) => {
				const canClaim = !player.user_id && !alreadyMember;
				const displayRole = resolveChampionshipRole(
					createdBy,
					player.user_id,
					player.role,
				);
				const canEditRole = Boolean(
					onChangeRole &&
						player.user_id &&
						displayRole !== CHAMPIONSHIP_ROLE.owner,
				);

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
								<div className="mt-1">
									<PlayerRating
										rating={player.rating}
										ceiling={ceiling}
										disabled={ratingPlayerId === player.id}
										onChange={
											onChangeRating &&
											((starFill) =>
												onChangeRating(
													player.id,
													starFillToRating(starFill, ceiling),
												))
										}
									/>
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
						{canClaim && (
							<Button
								variant={BUTTON_VARIANT.secondary}
								onClick={() => onClaim(player.id)}
								disabled={claimingPlayerId === player.id}
							>
								<UserPlus className="size-4" />
								Conectar
							</Button>
						)}
					</li>
				);
			})}
		</ul>
	);
}
