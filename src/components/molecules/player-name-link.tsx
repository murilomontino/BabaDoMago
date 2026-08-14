import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { playerVisibleName } from "@/const/player-name";
import { ROUTES } from "@/const/routes";
import { PLAYER_AVATAR_CLASS } from "@/const/ui";

export const PLAYER_NAME_LINK_LAYOUT = {
	row: "row",
	stack: "stack",
} as const;

export type PlayerNameLinkLayout =
	(typeof PLAYER_NAME_LINK_LAYOUT)[keyof typeof PLAYER_NAME_LINK_LAYOUT];

export type PlayerNameLinkPlayer = {
	id: number;
	championship_id: number;
	display_name: string;
	nickname: string | null;
	avatar_url: string | null;
};

type PlayerNameLinkProps = {
	player: PlayerNameLinkPlayer;
	layout?: PlayerNameLinkLayout;
	afterName?: ReactNode;
	avatarClassName?: string;
};

function PlayerAvatar({
	player,
	visibleName,
	className,
}: {
	player: PlayerNameLinkPlayer;
	visibleName: string;
	className: string;
}) {
	if (player.avatar_url) {
		return (
			<img
				src={player.avatar_url}
				alt=""
				referrerPolicy="no-referrer"
				className={`${className} rounded-full object-cover`}
			/>
		);
	}

	return (
		<span
			className={`flex shrink-0 items-center justify-center rounded-full bg-pitch-soft font-medium text-pitch-fg ${className}`}
		>
			{visibleName.charAt(0).toUpperCase()}
		</span>
	);
}

function PlayerNames({
	visibleName,
	displayName,
	nameClassName,
}: {
	visibleName: string;
	displayName: string;
	nameClassName: string;
}) {
	const showLegalName = visibleName !== displayName;

	return (
		<div className="min-w-0">
			<p className={nameClassName}>{visibleName}</p>
			{showLegalName && (
				<p className="truncate text-xs text-fg-muted">{displayName}</p>
			)}
		</div>
	);
}

export function PlayerNameLink({
	player,
	layout = PLAYER_NAME_LINK_LAYOUT.row,
	afterName,
	avatarClassName,
}: PlayerNameLinkProps) {
	const visibleName = playerVisibleName(player);
	const params = {
		championshipId: String(player.championship_id),
		playerId: String(player.id),
	};

	switch (layout) {
		case PLAYER_NAME_LINK_LAYOUT.stack:
			return (
				<Link
					to={ROUTES.championshipPlayer}
					params={params}
					className="flex w-full flex-col items-center gap-1 text-center hover:opacity-80"
				>
					<PlayerAvatar
						player={player}
						visibleName={visibleName}
						className={avatarClassName ?? "h-14 w-14 text-lg"}
					/>
					<PlayerNames
						visibleName={visibleName}
						displayName={player.display_name}
						nameClassName="max-w-full truncate text-sm font-semibold text-fg"
					/>
				</Link>
			);
		case PLAYER_NAME_LINK_LAYOUT.row:
			return (
				<div className="flex min-w-0 items-center gap-3">
					<Link
						to={ROUTES.championshipPlayer}
						params={params}
						className="hover:opacity-80"
					>
						<PlayerAvatar
							player={player}
							visibleName={visibleName}
							className={avatarClassName ?? `${PLAYER_AVATAR_CLASS} text-sm`}
						/>
					</Link>
					<div className="min-w-0">
						<Link
							to={ROUTES.championshipPlayer}
							params={params}
							className="block hover:opacity-80"
						>
							<PlayerNames
								visibleName={visibleName}
								displayName={player.display_name}
								nameClassName="truncate font-medium text-fg"
							/>
						</Link>
						{afterName}
					</div>
				</div>
			);
		default: {
			const _exhaustive: never = layout;
			return _exhaustive;
		}
	}
}
