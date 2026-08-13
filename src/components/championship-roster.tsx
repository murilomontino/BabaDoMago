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
		return <p className="text-slate-600">Nenhum jogador ainda.</p>;
	}

	const ceiling = championshipRatingCeiling(
		players.map((player) => player.rating),
	);

	return (
		<ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
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
						className="flex items-center justify-between gap-3 px-4 py-3"
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
								<span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-700">
									{player.display_name.charAt(0).toUpperCase()}
								</span>
							)}
							<div>
								<p className="font-medium text-slate-900">
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
									<p className="text-xs text-slate-500">
										{CHAMPIONSHIP_ROLE_LABEL[displayRole]}
									</p>
								)}
								{!player.user_id && (
									<p className="text-xs text-slate-500">Sem conta</p>
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
										className="mt-1 rounded border border-slate-300 px-2 py-1 text-xs"
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
							<button
								type="button"
								onClick={() => onClaim(player.id)}
								disabled={claimingPlayerId === player.id}
								className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
							>
								Conectar
							</button>
						)}
					</li>
				);
			})}
		</ul>
	);
}
