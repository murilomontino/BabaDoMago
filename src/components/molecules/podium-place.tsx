import { Award, Medal, Trophy } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { PlayerRating } from "@/components/player-rating";
import { playerVisibleName } from "@/const/player-name";
import {
	formatPodiumMetric,
	PODIUM_ANIMATION_DELAY,
	PODIUM_PLACE,
	PODIUM_STAND_HEIGHT,
	type PodiumMetricId,
	type PodiumPlace,
} from "@/const/podium";
import type { RosterRow } from "@/const/roster-stats";

type PodiumPlaceCardProps = {
	place: PodiumPlace;
	row: RosterRow;
	metric: PodiumMetricId;
	ceiling: number;
};

function PodiumMedal({ place }: { place: PodiumPlace }) {
	switch (place) {
		case PODIUM_PLACE.first:
			return <Trophy className="size-5 text-amber-400" />;
		case PODIUM_PLACE.second:
			return <Medal className="size-5 text-fg-muted" />;
		case PODIUM_PLACE.third:
			return <Award className="size-5 text-fg-subtle" />;
		default: {
			const _exhaustive: never = place;
			return _exhaustive;
		}
	}
}

export default function PodiumPlaceCard({
	place,
	row,
	metric,
	ceiling,
}: PodiumPlaceCardProps) {
	const reduceMotion = useReducedMotion();
	const visibleName = playerVisibleName(row);
	const showLegalName = visibleName !== row.display_name;
	const height = PODIUM_STAND_HEIGHT[place];

	return (
		<div className="flex w-28 flex-col items-center sm:w-32">
			<div className="mb-2 flex w-full flex-col items-center gap-1 text-center">
				{row.avatar_url && (
					<img
						src={row.avatar_url}
						alt=""
						referrerPolicy="no-referrer"
						className="h-14 w-14 rounded-full object-cover"
					/>
				)}
				{!row.avatar_url && (
					<span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-pitch-soft text-lg font-medium text-pitch-fg">
						{visibleName.charAt(0).toUpperCase()}
					</span>
				)}
				<p className="max-w-full truncate text-sm font-semibold text-fg">
					{visibleName}
				</p>
				{showLegalName && (
					<p className="max-w-full truncate text-xs text-fg-muted">
						{row.display_name}
					</p>
				)}
				<PlayerRating rating={row.rating} ceiling={ceiling} />
				<p className="text-sm font-semibold tabular-nums text-pitch-fg">
					{formatPodiumMetric(metric, row[metric])}
				</p>
				<PodiumMedal place={place} />
			</div>
			<motion.div
				className="flex w-full items-start justify-center overflow-hidden rounded-t-xl border border-line bg-pitch-soft"
				initial={reduceMotion ? { height } : { height: 0 }}
				animate={{ height }}
				transition={{
					type: "spring",
					stiffness: 120,
					damping: 18,
					delay: reduceMotion ? 0 : PODIUM_ANIMATION_DELAY[place],
				}}
			>
				<span className="pt-2 text-lg font-bold text-pitch-fg">{place}</span>
			</motion.div>
		</div>
	);
}
