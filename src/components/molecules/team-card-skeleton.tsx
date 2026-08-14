import { Skeleton } from "@/components/atoms/skeleton";
import {
	EVENT_TEAM_PLAYER_SLOT_CLASS,
	EVENT_TEAM_POSITION_CHIP_CLASS,
} from "@/components/event-team-player";
import {
	EVENT_TEAM_AVERAGE_LABEL,
	EVENT_TEAM_POSITION_LABEL,
	eventTeamSlotPosition,
} from "@/const/championship-event";
import { SKELETON_TEAM_SLOTS } from "@/const/skeleton";

export function TeamCardSkeleton() {
	return (
		<article className="relative rounded-lg border border-line bg-surface p-2 text-sm">
			<Skeleton className="mb-2 h-4 w-24" />
			<ul className="space-y-1">
				{SKELETON_TEAM_SLOTS.map((slot) => {
					const position = eventTeamSlotPosition(slot);

					return (
						<li key={slot} className={EVENT_TEAM_PLAYER_SLOT_CLASS}>
							<span className={`${EVENT_TEAM_POSITION_CHIP_CLASS} shrink-0`}>
								{EVENT_TEAM_POSITION_LABEL[position]}
							</span>
							<Skeleton className="h-3 flex-1" />
						</li>
					);
				})}
			</ul>
			<p className="mt-2 text-right text-xs text-fg-muted">
				{EVENT_TEAM_AVERAGE_LABEL}{" "}
				<Skeleton className="inline-block h-3 w-8 align-middle" />
			</p>
		</article>
	);
}
