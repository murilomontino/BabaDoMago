import { X } from "lucide-react";
import type { CSSProperties } from "react";
import { PlayerRating } from "@/components/player-rating";
import { EVENT_TEAM_FG, eventTeamColorFg } from "@/const/event-team-color";
import { playerVisibleName } from "@/const/player-name";
import type { ChampionshipPlayer } from "@/types/championship";

type EventTeamColorDotProps = {
	color: string;
};

export function EventTeamColorDot({ color }: EventTeamColorDotProps) {
	return (
		<span
			aria-hidden
			className="absolute right-2 top-2 size-3 rounded-full border border-black/25"
			style={{ backgroundColor: color }}
		/>
	);
}

type EventTeamRemoveButtonProps = {
	label: string;
	color: string;
	onClick: () => void;
	iconClassName?: string;
};

export function EventTeamRemoveButton({
	label,
	color,
	onClick,
	iconClassName = "size-3.5",
}: EventTeamRemoveButtonProps) {
	return (
		<button
			type="button"
			aria-label={label}
			className="inline-flex items-center justify-center rounded-lg px-2 py-2 transition hover:bg-black/25 hover:[color:var(--event-team-x-hover)]! focus-visible:bg-black/25 focus-visible:[color:var(--event-team-x-hover)]!"
			style={
				{
					color,
					"--event-team-x-hover": EVENT_TEAM_FG.hover,
				} as CSSProperties
			}
			onClick={onClick}
		>
			<X className={iconClassName} />
		</button>
	);
}

type EventTeamPlayerRowProps = {
	player: ChampionshipPlayer;
	ceiling: number;
	backgroundColor: string;
	onRemove?: () => void;
};

export function EventTeamPlayerRow({
	player,
	ceiling,
	backgroundColor,
	onRemove,
}: EventTeamPlayerRowProps) {
	const visibleName = playerVisibleName(player);
	const fg = eventTeamColorFg(backgroundColor);

	return (
		<div className="flex min-w-0 flex-1 items-center gap-2">
			{player.avatar_url && (
				<img
					src={player.avatar_url}
					alt=""
					referrerPolicy="no-referrer"
					className="h-8 w-8 shrink-0 rounded-full object-cover"
				/>
			)}
			{!player.avatar_url && (
				<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/20 text-xs font-medium">
					{visibleName.charAt(0).toUpperCase()}
				</span>
			)}
			<p className="min-w-0 flex-1 truncate text-sm font-medium">
				{visibleName}
			</p>
			<PlayerRating rating={player.rating} ceiling={ceiling} />
			{onRemove && (
				<EventTeamRemoveButton
					label={`Remover ${visibleName}`}
					color={fg}
					onClick={onRemove}
				/>
			)}
		</div>
	);
}
