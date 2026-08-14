import { useState } from "react";
import { AppDialog } from "@/components/atoms/app-dialog";
import { PlayerNameLink } from "@/components/molecules/player-name-link";
import {
	ASSIGNABLE_CHAMPIONSHIP_ROLES,
	type AssignableChampionshipRole,
	CHAMPIONSHIP_ROLE,
	CHAMPIONSHIP_ROLE_LABEL,
	resolveChampionshipRole,
} from "@/const/championship-role";
import { PLAYER_PROFILE_LABEL } from "@/const/player-profile";
import { MODAL_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";

const ROLE_TAG_CLASS =
	"mt-1 inline-flex rounded-full bg-pitch-soft px-2 py-0.5 text-xs font-medium text-pitch-fg";

const ROLE_PICKER = {
	title: "Permissão",
} as const;

export type RosterPlayerCellProps = {
	player: ChampionshipPlayer;
	createdBy: string;
	onChangeRole?: (playerId: number, role: AssignableChampionshipRole) => void;
};

export function RosterPlayerCell({
	player,
	createdBy,
	onChangeRole,
}: RosterPlayerCellProps) {
	const [open, setOpen] = useState(false);
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
			<PlayerNameLink
				player={player}
				afterName={
					<>
						{!player.user_id && (
							<span className="mt-1 inline-flex rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-fg-muted">
								{PLAYER_PROFILE_LABEL.noAccount}
							</span>
						)}
						{player.user_id && canEditRole && onChangeRole && (
							<button
								type="button"
								className={`${ROLE_TAG_CLASS} cursor-pointer hover:opacity-80`}
								onClick={() => {
									setOpen(true);
								}}
							>
								{CHAMPIONSHIP_ROLE_LABEL[displayRole]}
							</button>
						)}
						{player.user_id && !canEditRole && (
							<span className={ROLE_TAG_CLASS}>
								{CHAMPIONSHIP_ROLE_LABEL[displayRole]}
							</span>
						)}
					</>
				}
			/>
			{open && canEditRole && onChangeRole && (
				<AppDialog
					onClose={() => {
						setOpen(false);
					}}
				>
					<div className={MODAL_CLASS}>
						<p className="mb-3 text-sm font-medium tracking-tight text-fg">
							{ROLE_PICKER.title}
						</p>
						<ul className="-mx-1">
							{ASSIGNABLE_CHAMPIONSHIP_ROLES.map((role) => (
								<li key={role}>
									<button
										type="button"
										disabled={role === displayRole}
										onClick={() => {
											onChangeRole(player.id, role);
											setOpen(false);
										}}
										className="flex w-full rounded-lg px-3 py-2 text-left text-sm text-fg hover:bg-surface-muted disabled:opacity-50"
									>
										{CHAMPIONSHIP_ROLE_LABEL[role]}
									</button>
								</li>
							))}
						</ul>
					</div>
				</AppDialog>
			)}
		</div>
	);
}
