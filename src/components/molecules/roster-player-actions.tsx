import { Unlink, UserCheck, UserPlus, UserX } from "lucide-react";
import { Button } from "@/components/button";
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
	);
}
