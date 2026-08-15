import {
	ChartColumn,
	Merge,
	Trash2,
	Unlink,
	UserCheck,
	UserPen,
	UserPlus,
	UserX,
} from "lucide-react";
import { Button } from "@/components/button";
import { IconTooltipButton } from "@/components/molecules/icon-tooltip-button";
import { EVENT_ACTION } from "@/const/championship-event";
import {
	CHAMPIONSHIP_ROLE,
	type ChampionshipRole,
	canEditPlayerNickname,
	canOverrideEndedEvent,
	resolveChampionshipRole,
} from "@/const/championship-role";
import { PLAYER_LABEL } from "@/const/player-name";
import { BUTTON_VARIANT } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";

const ROSTER_ACTION_LABEL = {
	connect: "Conectar",
	disconnect: "Desconectar",
	merge: "Unir",
	deactivate: "Desativar",
	activate: "Ativar",
	remove: "Excluir",
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
	onEditEventStats?: (playerId: number) => void;
	eventStatsPlayerId?: number | null;
	onUnlink?: (playerId: number) => void;
	unlinkingPlayerId?: number | null;
	onMerge?: (playerId: number) => void;
	onDeactivate?: (playerId: number) => void;
	deactivatingPlayerId?: number | null;
	onReactivate?: (playerId: number) => void;
	reactivatingPlayerId?: number | null;
	onRemove?: (playerId: number) => void;
	removingPlayerId?: number | null;
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
	onEditEventStats,
	eventStatsPlayerId,
	onUnlink,
	unlinkingPlayerId,
	onMerge,
	onDeactivate,
	deactivatingPlayerId,
	onReactivate,
	reactivatingPlayerId,
	onRemove,
	removingPlayerId,
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
	const canMerge = Boolean(
		onMerge && !isChampionshipOwner && !player.deleted_at,
	);
	const canDeactivate = Boolean(
		onDeactivate && !isChampionshipOwner && !player.deleted_at,
	);
	const canReactivate = Boolean(onReactivate && player.deleted_at);
	const canRemove = Boolean(onRemove && player.deleted_at && !player.user_id);
	const canEditNickname = Boolean(
		onEditNickname &&
			!player.deleted_at &&
			canEditPlayerNickname(actorRole, player.user_id, currentUserId),
	);
	const canEditEventStats = Boolean(
		onEditEventStats && !player.deleted_at && canOverrideEndedEvent(actorRole),
	);

	if (
		!canClaim &&
		!canEditNickname &&
		!canEditEventStats &&
		!canUnlink &&
		!canMerge &&
		!canDeactivate &&
		!canReactivate &&
		!canRemove
	) {
		return null;
	}

	return (
		<div className="grid w-full grid-cols-2 gap-1 px-3 md:mx-auto md:inline-grid md:w-max md:grid-cols-3 md:justify-items-center md:px-0">
			{canEditNickname && onEditNickname && (
				<IconTooltipButton
					expandOnMobile
					label={PLAYER_LABEL.nickname}
					icon={<UserPen className="size-4" />}
					onClick={() => onEditNickname(player.id)}
					disabled={nicknamePlayerId === player.id}
				/>
			)}
			{canEditEventStats && onEditEventStats && (
				<IconTooltipButton
					expandOnMobile
					label={EVENT_ACTION.editPlayerEventStats}
					icon={<ChartColumn className="size-4" />}
					onClick={() => onEditEventStats(player.id)}
					disabled={eventStatsPlayerId === player.id}
				/>
			)}
			{canClaim && onClaim && (
				<Button
					variant={BUTTON_VARIANT.primary}
					className="col-span-2 w-full"
					onClick={() => onClaim(player.id)}
					disabled={claimingPlayerId === player.id}
				>
					<UserPlus />
					{ROSTER_ACTION_LABEL.connect}
				</Button>
			)}
			{canUnlink && onUnlink && (
				<IconTooltipButton
					expandOnMobile
					label={ROSTER_ACTION_LABEL.disconnect}
					icon={<Unlink className="size-4" />}
					onClick={() => onUnlink(player.id)}
					disabled={unlinkingPlayerId === player.id}
				/>
			)}
			{canMerge && onMerge && (
				<IconTooltipButton
					expandOnMobile
					label={ROSTER_ACTION_LABEL.merge}
					icon={<Merge className="size-4" />}
					onClick={() => onMerge(player.id)}
				/>
			)}
			{canDeactivate && onDeactivate && (
				<IconTooltipButton
					expandOnMobile
					label={ROSTER_ACTION_LABEL.deactivate}
					icon={<UserX className="size-4" />}
					variant={BUTTON_VARIANT.danger}
					onClick={() => onDeactivate(player.id)}
					disabled={deactivatingPlayerId === player.id}
				/>
			)}
			{canReactivate && onReactivate && (
				<IconTooltipButton
					expandOnMobile
					label={ROSTER_ACTION_LABEL.activate}
					icon={<UserCheck className="size-4" />}
					variant={BUTTON_VARIANT.primary}
					onClick={() => onReactivate(player.id)}
					disabled={reactivatingPlayerId === player.id}
				/>
			)}
			{canRemove && onRemove && (
				<IconTooltipButton
					expandOnMobile
					label={ROSTER_ACTION_LABEL.remove}
					icon={<Trash2 className="size-4" />}
					variant={BUTTON_VARIANT.danger}
					onClick={() => onRemove(player.id)}
					disabled={removingPlayerId === player.id}
				/>
			)}
		</div>
	);
}
