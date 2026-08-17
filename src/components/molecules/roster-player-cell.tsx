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
import {
	isGoalkeeperKind,
	PLAYER_KIND,
	PLAYER_KIND_LABEL,
	PLAYER_KIND_OPTIONS,
	PLAYER_LABEL,
	playerKindFromGoalkeeper,
} from "@/const/player-name";
import { PLAYER_PROFILE_LABEL } from "@/const/player-profile";
import { MODAL_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";

const ROLE_TAG_CLASS =
	"mt-1 inline-flex rounded-full bg-pitch-soft px-2 py-0.5 text-xs font-medium text-pitch-fg";

const KIND_SELECT_CLASS =
	"mt-1 h-6 cursor-pointer rounded-full border-0 px-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pitch/20";

const KIND_SELECT_ON_CLASS = `${KIND_SELECT_CLASS} bg-pitch-soft text-pitch-fg`;

const KIND_SELECT_OFF_CLASS = `${KIND_SELECT_CLASS} bg-surface-muted text-fg-muted`;

const ROLE_PICKER = {
	title: "Permissão",
} as const;

export type RosterPlayerCellProps = {
	player: ChampionshipPlayer;
	createdBy: string;
	onChangeRole?: (playerId: number, role: AssignableChampionshipRole) => void;
	onChangeGoalkeeper?: (playerId: number, isGoalkeeper: boolean) => void;
};

export function RosterPlayerCell({
	player,
	createdBy,
	onChangeRole,
	onChangeGoalkeeper,
}: RosterPlayerCellProps) {
	const [open, setOpen] = useState(false);
	const displayRole = resolveChampionshipRole(
		createdBy,
		player.user_id,
		player.role,
	);
	const isChampionshipOwner = displayRole === CHAMPIONSHIP_ROLE.owner;
	const selectedKind = playerKindFromGoalkeeper(player.is_goalkeeper);
	const canEditGoalkeeper = Boolean(onChangeGoalkeeper && !player.deleted_at);
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
						{canEditGoalkeeper && onChangeGoalkeeper && (
							<select
								aria-label={PLAYER_LABEL.player}
								value={selectedKind}
								className={
									selectedKind === PLAYER_KIND.goalkeeper
										? KIND_SELECT_ON_CLASS
										: KIND_SELECT_OFF_CLASS
								}
								onChange={(event) => {
									const nextKind = playerKindFromGoalkeeper(
										event.target.value === PLAYER_KIND.goalkeeper,
									);
									if (nextKind === selectedKind) {
										return;
									}

									onChangeGoalkeeper(player.id, isGoalkeeperKind(nextKind));
								}}
							>
								{PLAYER_KIND_OPTIONS.map((option) => (
									<option key={option} value={option}>
										{PLAYER_KIND_LABEL[option]}
									</option>
								))}
							</select>
						)}
						{!canEditGoalkeeper && player.is_goalkeeper && (
							<span className={ROLE_TAG_CLASS}>{PLAYER_LABEL.goalkeeper}</span>
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
