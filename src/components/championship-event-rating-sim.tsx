import { useState } from "react";
import { EVENT_TEAM_POSITION_CHIP_CLASS } from "@/components/event-team-player";
import { PlayerRating } from "@/components/player-rating";
import {
	attendanceMvpPlayerIds,
	EVENT_MVP_LABEL,
	formatEventMvpCount,
	toggleEventMvpPlayerId,
} from "@/const/event-mvp";
import { formatEventRating } from "@/const/event-rating-adjustment";
import {
	EVENT_RATING_SIM_ABBR,
	EVENT_RATING_SIM_LABEL,
	type EventRatingSimRow,
	eventRatingSimHasEndedMatches,
	eventRatingSimMvpCandidateIds,
	eventRatingSimRows,
	formatEventRatingSimRate,
} from "@/const/event-rating-sim";
import { championshipRatingCeiling, PLAYER_STAR_CLASS } from "@/const/player-rating";
import { CARD_CLASS, CHIP_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";
import type { ChampionshipEvent } from "@/types/championship-event";

type ChampionshipEventRatingSimProps = {
	event: ChampionshipEvent;
	players: ChampionshipPlayer[];
	canSetMvp: boolean;
};

function RatingSnapshot({
	rating,
	ceiling,
}: {
	rating: number;
	ceiling: number;
}) {
	return (
		<div className="flex min-w-0 items-center gap-1">
			<PlayerRating
				rating={rating}
				ceiling={ceiling}
				starClassName={PLAYER_STAR_CLASS.compact}
			/>
			<span className={CHIP_CLASS}>{formatEventRating(rating)}</span>
		</div>
	);
}

function mvpBorderClass(isMvp: boolean): string {
	if (isMvp) {
		return "border-pitch";
	}

	return "border-line";
}

function SimRowHint({ row }: { row: EventRatingSimRow }) {
	if (row.belowMinMatches) {
		return (
			<p className="mt-1 text-xs text-fg-muted">
				{EVENT_RATING_SIM_LABEL.belowMinMatches}
			</p>
		);
	}

	if (row.isSeed) {
		return (
			<p className="mt-1 text-xs text-fg-muted">{EVENT_RATING_SIM_LABEL.seed}</p>
		);
	}

	if (row.inDeadZone) {
		return (
			<p className="mt-1 text-xs text-fg-muted">
				{EVENT_RATING_SIM_LABEL.deadZone}
			</p>
		);
	}

	return null;
}

function SimRowBody({
	row,
	ceiling,
}: {
	row: EventRatingSimRow;
	ceiling: number;
}) {
	return (
		<>
			<div className="flex min-w-0 items-center gap-1">
				<p className="min-w-0 truncate text-sm font-medium text-fg">{row.name}</p>
				{row.isMvp && (
					<span className={`${EVENT_TEAM_POSITION_CHIP_CLASS} shrink-0`}>
						{EVENT_MVP_LABEL.badge}
					</span>
				)}
			</div>
			<p className="mt-1 text-xs tabular-nums text-fg-muted">
				<span title={EVENT_RATING_SIM_LABEL.wins}>
					{EVENT_RATING_SIM_ABBR.wins} {row.wins}
				</span>
				{" · "}
				<span title={EVENT_RATING_SIM_LABEL.draws}>
					{EVENT_RATING_SIM_ABBR.draws} {row.draws}
				</span>
				{" · "}
				<span title={EVENT_RATING_SIM_LABEL.losses}>
					{EVENT_RATING_SIM_ABBR.losses} {row.losses}
				</span>
				{" · "}
				<span title={EVENT_RATING_SIM_LABEL.matches}>
					{EVENT_RATING_SIM_ABBR.matches} {row.matches}
				</span>
				{" · "}
				<span title={EVENT_RATING_SIM_LABEL.rate}>
					{formatEventRatingSimRate(row.rate)}
				</span>
				{" · "}
				<span title={EVENT_RATING_SIM_LABEL.delta}>
					{EVENT_RATING_SIM_LABEL.delta} {formatEventRating(row.delta)}
				</span>
			</p>
			<p className="mt-1 flex items-center gap-1 md:hidden">
				<span className="text-xs font-medium tabular-nums">
					{formatEventRating(row.from)}
				</span>
				<span className="text-xs font-bold text-fg">→</span>
				<span className="text-xs font-medium tabular-nums">
					{formatEventRating(row.to)}
				</span>
			</p>
			<div className="mt-1 hidden flex-nowrap items-center gap-1 overflow-hidden md:flex">
				<RatingSnapshot rating={row.from} ceiling={ceiling} />
				<span className="text-xs font-bold text-fg">→</span>
				<RatingSnapshot rating={row.to} ceiling={ceiling} />
			</div>
			<SimRowHint row={row} />
		</>
	);
}

function SimRowCard({
	row,
	ceiling,
	canToggleMvp,
	onToggleMvp,
}: {
	row: EventRatingSimRow;
	ceiling: number;
	canToggleMvp: boolean;
	onToggleMvp: (playerId: number) => void;
}) {
	const body = <SimRowBody row={row} ceiling={ceiling} />;

	if (!canToggleMvp) {
		return <li className={`${CARD_CLASS} p-2`}>{body}</li>;
	}

	return (
		<li>
			<button
				type="button"
				className={`w-full rounded-lg border p-2 text-left ${mvpBorderClass(row.isMvp)}`}
				onClick={() => {
					onToggleMvp(row.playerId);
				}}
			>
				{body}
			</button>
		</li>
	);
}

export function ChampionshipEventRatingSim({
	event,
	players,
	canSetMvp,
}: ChampionshipEventRatingSimProps) {
	const [mvpPlayerIds, setMvpPlayerIds] = useState(() =>
		attendanceMvpPlayerIds(event.attendance),
	);
	const hasEndedMatches = eventRatingSimHasEndedMatches(event.matches);
	const ceiling = championshipRatingCeiling(players.map((player) => player.rating));
	const mvpCandidateIds = new Set(
		eventRatingSimMvpCandidateIds({
			attendance: event.attendance,
			matches: event.matches,
			teams: event.teams,
			skipGuestGoalkeeperMatches: event.skip_guest_goalkeeper_matches,
		}),
	);
	const rows = eventRatingSimRows({
		attendance: event.attendance,
		players,
		matches: event.matches,
		teams: event.teams,
		skipGuestGoalkeeperMatches: event.skip_guest_goalkeeper_matches,
		mvpPlayerIds,
	});
	const selectedMvpCount = rows.filter((row) => row.isMvp).length;

	return (
		<div className="space-y-3">
			<div className="flex flex-wrap items-baseline justify-between gap-2">
				<div>
					<p className="text-xs font-medium uppercase tracking-wide text-fg-muted">
						{EVENT_RATING_SIM_LABEL.title}
					</p>
					<p className="mt-1 text-sm text-fg-muted">{EVENT_RATING_SIM_LABEL.hint}</p>
				</div>
				{canSetMvp && hasEndedMatches && (
					<p className="text-xs text-fg-muted">
						{formatEventMvpCount(selectedMvpCount)}
					</p>
				)}
			</div>
			{!hasEndedMatches && (
				<p className="text-sm text-fg-muted">{EVENT_RATING_SIM_LABEL.empty}</p>
			)}
			{hasEndedMatches && (
				<ul className="space-y-2">
					{rows.map((row) => (
						<SimRowCard
							key={row.playerId}
							row={row}
							ceiling={ceiling}
							canToggleMvp={canSetMvp && mvpCandidateIds.has(row.playerId)}
							onToggleMvp={(playerId) => {
								setMvpPlayerIds((current) =>
									toggleEventMvpPlayerId(current, playerId),
								);
							}}
						/>
					))}
				</ul>
			)}
			{canSetMvp && hasEndedMatches && (
				<p className="text-xs text-fg-muted">{EVENT_MVP_LABEL.toggleHint}</p>
			)}
		</div>
	);
}
