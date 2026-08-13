import { X } from "lucide-react";
import type { CSSProperties } from "react";
import { PlayerRating } from "@/components/player-rating";
import {
	EVENT_TEAM_AVERAGE_LABEL,
	eventTeamRatingAverage,
	formatEventTeamRatingAverage,
} from "@/const/championship-event";
import {
	EVENT_TEAM_COLOR_NONE_LABEL,
	EVENT_TEAM_FG,
	eventTeamColorFg,
} from "@/const/event-team-color";
import { playerVisibleName } from "@/const/player-name";
import type { ChampionshipPlayer } from "@/types/championship";

type EventTeamColorDotProps = {
	color: string | null;
};

export function EventTeamColorDot({ color }: EventTeamColorDotProps) {
	if (color === null) {
		return null;
	}

	return (
		<span
			aria-hidden
			className="absolute right-2 top-2 size-3 rounded-full border border-black/25"
			style={{ backgroundColor: color }}
		/>
	);
}

type EventTeamColorNoneButtonProps = {
	selected: boolean;
	onSelect: () => void;
};

export function EventTeamColorNoneButton({
	selected,
	onSelect,
}: EventTeamColorNoneButtonProps) {
	return (
		<button
			type="button"
			aria-label={EVENT_TEAM_COLOR_NONE_LABEL}
			aria-pressed={selected}
			onClick={onSelect}
			className={`relative size-5 overflow-hidden rounded-md border-2 ${selected ? "border-current" : "border-black/20"}`}
			style={{ backgroundColor: "var(--color-surface)" }}
		>
			<span
				aria-hidden
				className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top_right,transparent_calc(50%-1px),var(--color-danger)_50%,transparent_calc(50%+1px))]"
			/>
		</button>
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
		<div className="flex min-w-0 flex-1 items-center gap-1.5">
			{player.avatar_url && (
				<img
					src={player.avatar_url}
					alt=""
					referrerPolicy="no-referrer"
					className="h-6 w-6 shrink-0 rounded-full object-cover"
				/>
			)}
			{!player.avatar_url && (
				<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/20 text-[10px] font-medium">
					{visibleName.charAt(0).toUpperCase()}
				</span>
			)}
			<p className="min-w-0 flex-1 truncate text-xs font-medium">
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

type EventTeamRatingAverageProps = {
	ratings: readonly number[];
};

export function EventTeamRatingAverage({
	ratings,
}: EventTeamRatingAverageProps) {
	if (ratings.length === 0) {
		return null;
	}

	const average = formatEventTeamRatingAverage(eventTeamRatingAverage(ratings));

	return (
		<p className="mt-1 text-right text-xs font-medium tabular-nums">
			<span className="sr-only">{EVENT_TEAM_AVERAGE_LABEL} </span>
			{average}
		</p>
	);
}
