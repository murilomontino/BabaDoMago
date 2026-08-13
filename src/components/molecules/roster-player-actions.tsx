import { Unlink, UserCheck, UserPen, UserPlus, UserX } from "lucide-react";
import { Button } from "@/components/button";
import { IconTooltipButton } from "@/components/molecules/icon-tooltip-button";
import {
	CHAMPIONSHIP_ROLE,
	type ChampionshipRole,
	canEditPlayerNickname,
	resolveChampionshipRole,
} from "@/const/championship-role";
import { PLAYER_LABEL } from "@/const/player-name";
import { BUTTON_VARIANT } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";

const ROSTER_ACTION_LABEL = {
	connect: "Conectar",
	disconnect: "Desconectar",
	deactivate: "Desativar",
	activate: "Ativar",
} as const;

export type RosterPlayerActionsProps = {
	player: ChampionshipPlayer;
	createdBy: string;
	actorRole: ChampionshipRole;
	currentUserId: string | null;
	alreadyMember: boolean;
	claimingPlayerId?: number | null;
	onClaim?: (playerId: number) => void;
	onEditNickname?: (playerId: number) => void;
	nicknamePlayerId?: number | null;
	onUnlink?: (playerId: number) => void;
	unlinkingPlayerId?: number | null;
	onDeactivate?: (playerId: number) => void;
	deactivatingPlayerId?: number | null;
	onReactivate?: (playerId: number) => void;
	reactivatingPlayerId?: number | null;
};

export function RosterPlayerActions({
	player,
	createdBy,
	actorRole,
	currentUserId,
	alreadyMember,
	claimingPlayerId,
	onClaim,
	onEditNickname,
	nicknamePlayerId,
	onUnlink,
	unlinkingPlayerId,
	onDeactivate,
	deactivatingPlayerId,
	onReactivate,
	reactivatingPlayerId,
}: RosterPlayerActionsProps) {
	const displayRole = resolveChampionshipRole(
		createdBy,
		player.user_id,
		player.role,
	);
	const isChampionshipOwner = displayRole === CHAMPIONSHIP_ROLE.owner;
	const canClaim = Boolean(
		onClaim && !player.user_id && !alreadyMember && !player.deleted_at,
	);
	const canUnlink = Boolean(
		onUnlink && player.user_id && !isChampionshipOwner && !player.deleted_at,
	);
	const canDeactivate = Boolean(
		onDeactivate && !isChampionshipOwner && !player.deleted_at,
	);
	const canReactivate = Boolean(onReactivate && player.deleted_at);
	const canEditNickname = Boolean(
		onEditNickname &&
			!player.deleted_at &&
			canEditPlayerNickname(actorRole, player.user_id, currentUserId),
	);

	if (
		!canClaim &&
		!canEditNickname &&
		!canUnlink &&
		!canDeactivate &&
		!canReactivate
	) {
		return null;
	}

	return (
		<div className="flex flex-wrap justify-center gap-2">
			{canEditNickname && onEditNickname && (
				<IconTooltipButton
					label={PLAYER_LABEL.nickname}
					icon={<UserPen className="size-4" />}
					onClick={() => onEditNickname(player.id)}
					disabled={nicknamePlayerId === player.id}
				/>
			)}
			{canClaim && onClaim && (
				<Button
					variant={BUTTON_VARIANT.secondary}
					onClick={() => onClaim(player.id)}
					disabled={claimingPlayerId === player.id}
				>
					<UserPlus className="size-4" />
					{ROSTER_ACTION_LABEL.connect}
				</Button>
			)}
			{canUnlink && onUnlink && (
				<IconTooltipButton
					label={ROSTER_ACTION_LABEL.disconnect}
					icon={<Unlink className="size-4" />}
					onClick={() => onUnlink(player.id)}
					disabled={unlinkingPlayerId === player.id}
				/>
			)}
			{canDeactivate && onDeactivate && (
				<IconTooltipButton
					label={ROSTER_ACTION_LABEL.deactivate}
					icon={<UserX className="size-4" />}
					variant={BUTTON_VARIANT.danger}
					onClick={() => onDeactivate(player.id)}
					disabled={deactivatingPlayerId === player.id}
				/>
			)}
			{canReactivate && onReactivate && (
				<IconTooltipButton
					label={ROSTER_ACTION_LABEL.activate}
					icon={<UserCheck className="size-4" />}
					variant={BUTTON_VARIANT.primary}
					onClick={() => onReactivate(player.id)}
					disabled={reactivatingPlayerId === player.id}
				/>
			)}
		</div>
	);
}
