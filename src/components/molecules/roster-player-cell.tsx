import { useState } from "react";
import { AppDialog } from "@/components/atoms/app-dialog";
import {
	ASSIGNABLE_CHAMPIONSHIP_ROLES,
	type AssignableChampionshipRole,
	CHAMPIONSHIP_ROLE,
	CHAMPIONSHIP_ROLE_LABEL,
	resolveChampionshipRole,
} from "@/const/championship-role";
import { playerVisibleName } from "@/const/player-name";
import { MODAL_CLASS, PLAYER_AVATAR_CLASS } from "@/const/ui";
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
	const visibleName = playerVisibleName(player);
	const showLegalName = visibleName !== player.display_name;

	return (
		<div className="flex min-w-0 items-center gap-3">
			{player.avatar_url && (
				<img
					src={player.avatar_url}
					alt=""
					referrerPolicy="no-referrer"
					className={`${PLAYER_AVATAR_CLASS} rounded-full object-cover`}
				/>
			)}
			{!player.avatar_url && (
				<span
					className={`flex items-center justify-center rounded-full bg-pitch-soft text-sm font-medium text-pitch-fg ${PLAYER_AVATAR_CLASS}`}
				>
					{visibleName.charAt(0).toUpperCase()}
				</span>
			)}
			<div className="min-w-0">
				<p className="truncate font-medium text-fg">{visibleName}</p>
				{showLegalName && (
					<p className="truncate text-xs text-fg-muted">
						{player.display_name}
					</p>
				)}
				{!player.user_id && (
					<span className="mt-1 inline-flex rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-fg-muted">
						Sem conta
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
			</div>
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
