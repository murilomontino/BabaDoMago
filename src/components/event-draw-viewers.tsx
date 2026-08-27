import { useEffect, useRef, useState } from "react";
import { EventTeamPlayerAvatar } from "@/components/event-team-player";
import {
	type EventDrawViewer,
	eventDrawRevealViewingBadgeCount,
	eventDrawRevealViewingLabel,
} from "@/const/event-draw-reveal";
import { playerVisibleName } from "@/const/player-name";
import type { ChampionshipPlayer } from "@/types/championship";

const VIEWERS_BADGE_CLASS =
	"relative z-10 inline-flex size-11 items-center justify-center rounded-full bg-pitch text-sm font-bold tabular-nums text-white shadow-[0_0_0_4px_rgba(74,222,128,0.45),0_0_18px_rgba(22,101,52,0.85)]";

type EventDrawViewersProps = {
	viewers: readonly EventDrawViewer[];
	rosterById: ReadonlyMap<number, ChampionshipPlayer>;
};

export function EventDrawViewers({
	viewers,
	rosterById,
}: EventDrawViewersProps) {
	const [open, setOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);
	const countLabel = eventDrawRevealViewingLabel(viewers.length);

	useEffect(() => {
		if (!open) {
			return;
		}

		function onPointerDown(event: PointerEvent) {
			if (rootRef.current?.contains(event.target as Node)) {
				return;
			}

			setOpen(false);
		}

		function onKeyDown(event: KeyboardEvent) {
			if (event.key !== "Escape") {
				return;
			}

			setOpen(false);
		}

		document.addEventListener("pointerdown", onPointerDown);
		document.addEventListener("keydown", onKeyDown);

		return () => {
			document.removeEventListener("pointerdown", onPointerDown);
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [open]);

	function toggleOpen() {
		setOpen((isOpen) => !isOpen);
	}

	return (
		<div ref={rootRef} className="relative shrink-0">
			<button
				type="button"
				aria-label={countLabel}
				aria-expanded={open}
				aria-haspopup="dialog"
				onClick={toggleOpen}
				className={VIEWERS_BADGE_CLASS}
			>
				{eventDrawRevealViewingBadgeCount(viewers.length)}
			</button>
			{open && (
				<div
					role="dialog"
					aria-label={countLabel}
					className="absolute right-0 top-full z-20 mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-lg border border-line bg-surface p-2 shadow-lg"
				>
					<p className="mb-1 text-xs font-medium text-fg">{countLabel}</p>
					{viewers.length > 0 && (
						<ul className="max-h-56 space-y-1 overflow-y-auto">
							{viewers.map((viewer) => (
								<EventDrawViewerItem
									key={viewer.playerId}
									viewer={viewer}
									player={rosterById.get(viewer.playerId)}
								/>
							))}
						</ul>
					)}
				</div>
			)}
		</div>
	);
}

type EventDrawViewerItemProps = {
	viewer: EventDrawViewer;
	player: ChampionshipPlayer | undefined;
};

function EventDrawViewerItem({ viewer, player }: EventDrawViewerItemProps) {
	if (player) {
		return (
			<li className="flex min-w-0 items-center gap-1.5 rounded-md bg-surface-muted px-1.5 py-1">
				<EventTeamPlayerAvatar player={player} />
				<span className="min-w-0 flex-1 truncate text-xs font-medium">
					{playerVisibleName(player)}
				</span>
			</li>
		);
	}

	return (
		<li className="flex min-w-0 items-center gap-1.5 rounded-md bg-surface-muted px-1.5 py-1">
			<EventDrawViewerFallbackAvatar viewer={viewer} />
			<span className="min-w-0 flex-1 truncate text-xs font-medium">
				{viewer.displayName}
			</span>
		</li>
	);
}

function EventDrawViewerFallbackAvatar({
	viewer,
}: {
	viewer: EventDrawViewer;
}) {
	if (viewer.avatarUrl) {
		return (
			<img
				src={viewer.avatarUrl}
				alt=""
				referrerPolicy="no-referrer"
				className="h-6 w-6 shrink-0 rounded-full object-cover"
			/>
		);
	}

	return (
		<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/20 text-[10px] font-medium">
			{viewer.displayName.charAt(0).toUpperCase()}
		</span>
	);
}
