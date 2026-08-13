import { Unlink, UserCheck, UserPlus, UserX } from "lucide-react";
import { IconTooltipButton } from "@/components/molecules/icon-tooltip-button";
import {
	CHAMPIONSHIP_ROLE,
	resolveChampionshipRole,
} from "@/const/championship-role";
import { BUTTON_VARIANT } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";

export type RosterPlayerActionsProps = {
	player: ChampionshipPlayer;
	createdBy: string;
	alreadyMember: boolean;
	claimingPlayerId?: number | null;
	onClaim?: (playerId: number) => void;
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
	alreadyMember,
	claimingPlayerId,
	onClaim,
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

	if (!canClaim && !canUnlink && !canDeactivate && !canReactivate) {
		return null;
	}

	return (
		<div className="flex flex-wrap justify-center gap-2">
			{canClaim && onClaim && (
				<IconTooltipButton
					label="Conectar"
					icon={<UserPlus className="size-4" />}
					onClick={() => onClaim(player.id)}
					disabled={claimingPlayerId === player.id}
				/>
			)}
			{canUnlink && onUnlink && (
				<IconTooltipButton
					label="Desconectar"
					icon={<Unlink className="size-4" />}
					onClick={() => onUnlink(player.id)}
					disabled={unlinkingPlayerId === player.id}
				/>
			)}
			{canDeactivate && onDeactivate && (
				<IconTooltipButton
					label="Desativar"
					icon={<UserX className="size-4" />}
					variant={BUTTON_VARIANT.danger}
					onClick={() => onDeactivate(player.id)}
					disabled={deactivatingPlayerId === player.id}
				/>
			)}
			{canReactivate && onReactivate && (
				<IconTooltipButton
					label="Ativar"
					icon={<UserCheck className="size-4" />}
					variant={BUTTON_VARIANT.primary}
					onClick={() => onReactivate(player.id)}
					disabled={reactivatingPlayerId === player.id}
				/>
			)}
		</div>
	);
}
