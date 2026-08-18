import { Handshake, X } from "lucide-react";
import { EventTeamChip } from "@/components/event-team-player";
import { GoalIcon } from "@/components/goal-icon";
import { GoalkeeperGlovesIcon } from "@/components/goalkeeper-gloves-icon";
import {
	MATCH_GOAL_TIMELINE_GRID_CLASS,
	MatchGoalTimeline,
} from "@/components/molecules/match-goal-timeline";
import { OwnGoalIcon } from "@/components/soccer-ball-icon";
import { EVENT_ACTION, EVENT_SECTION_LABEL } from "@/const/championship-event";
import {
	EVENT_MATCH_ICON,
	EVENT_MATCH_ICON_LEGEND,
	EVENT_MATCH_LABEL,
	EVENT_MATCH_SUBSTITUTION_LABEL,
	type EventMatchIcon,
	formatMatchScore,
	isOpenMatch,
	matchScore,
	matchTeamPlayers,
	matchWinnerTeam,
} from "@/const/championship-event-match";
import { resolveRosterPlayer } from "@/const/championship-event-roster";
import { PLAYER_LABEL, playerVisibleName } from "@/const/player-name";
import { CARD_CLASS, CHIP_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";
import type {
	ChampionshipEventMatch,
	ChampionshipEventMatchPlayer,
	ChampionshipEventTeam,
} from "@/types/championship-event";

type ChampionshipEventMatchHistoryProps = {
	matches: readonly ChampionshipEventMatch[];
	teams: readonly ChampionshipEventTeam[];
	rosterById: ReadonlyMap<number, ChampionshipPlayer>;
	showMatchDelete: boolean;
	canOpenMatch: boolean;
	onOpenMatch: (match: ChampionshipEventMatch) => void;
	onRemoveMatch: (match: ChampionshipEventMatch) => void;
};

function MatchLineupPlayer({
	row,
	rosterById,
	alignEnd,
}: {
	row: ChampionshipEventMatchPlayer;
	rosterById: ReadonlyMap<number, ChampionshipPlayer>;
	alignEnd: boolean;
}) {
	const player = resolveRosterPlayer(
		row.player_id,
		row.display_name,
		rosterById,
	);

	return (
		<li
			className={`flex min-w-0 items-center gap-1 text-xs text-fg-muted ${
				alignEnd ? "justify-end" : "justify-start"
			}`}
		>
			{row.is_substituted && (
				<span className={CHIP_CLASS}>
					{EVENT_MATCH_SUBSTITUTION_LABEL.chip}
				</span>
			)}
			{row.is_goalkeeper && (
				<GoalkeeperGlovesIcon
					className="size-3 shrink-0"
					aria-label={PLAYER_LABEL.goalkeeper}
				/>
			)}
			<span className="truncate">{playerVisibleName(player)}</span>
		</li>
	);
}

function MatchIconGlyph({ id }: { id: EventMatchIcon }) {
	switch (id) {
		case EVENT_MATCH_ICON.goalkeeper:
			return <GoalkeeperGlovesIcon className="size-3 shrink-0" />;
		case EVENT_MATCH_ICON.goal:
			return <GoalIcon className="size-3 shrink-0" />;
		case EVENT_MATCH_ICON.assist:
			return <Handshake className="size-3 shrink-0" />;
		case EVENT_MATCH_ICON.ownGoal:
			return <OwnGoalIcon className="size-3 shrink-0" />;
		default: {
			const _exhaustive: never = id;
			return _exhaustive;
		}
	}
}

function MatchIconLegend() {
	return (
		<ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-muted">
			{EVENT_MATCH_ICON_LEGEND.map((item) => (
				<li key={item.id} className="inline-flex items-center gap-1">
					<MatchIconGlyph id={item.id} />
					{item.label}
				</li>
			))}
		</ul>
	);
}

function MatchHistoryCard({
	match,
	teamById,
	rosterById,
	showMatchDelete,
	canOpenMatch,
	onOpenMatch,
	onRemoveMatch,
}: {
	match: ChampionshipEventMatch;
	teamById: ReadonlyMap<number, ChampionshipEventTeam>;
	rosterById: ReadonlyMap<number, ChampionshipPlayer>;
	showMatchDelete: boolean;
	canOpenMatch: boolean;
	onOpenMatch: (match: ChampionshipEventMatch) => void;
	onRemoveMatch: (match: ChampionshipEventMatch) => void;
}) {
	const teamA = teamById.get(match.team_a_id);
	const teamB = teamById.get(match.team_b_id);
	if (!teamA || !teamB) {
		return null;
	}

	const playedA = matchTeamPlayers(match.players, match.team_a_id);
	const playedB = matchTeamPlayers(match.players, match.team_b_id);
	const teamAIds = new Set(playedA.map((player) => player.player_id));
	const score = matchScore(match.goals, teamAIds);
	const winner = matchWinnerTeam(match.winner_team_id, teamById);
	const open = isOpenMatch(match);
	const matchPlayerById = new Map(
		match.players.map((row) => [row.player_id, row]),
	);
	const cardClass = [
		CARD_CLASS,
		open && "ring-1 ring-pitch/40",
		canOpenMatch && "hover:bg-surface-muted",
	]
		.filter(Boolean)
		.join(" ");

	const body = (
		<>
			<div className={MATCH_GOAL_TIMELINE_GRID_CLASS}>
				<div className="flex min-w-0 justify-end">
					<EventTeamChip color={teamA.color} sortOrder={teamA.sort_order} />
				</div>
				<p className="text-2xl font-semibold tabular-nums text-fg">
					{formatMatchScore(score.teamA, score.teamB)}
				</p>
				<div className="flex min-w-0 justify-start">
					<EventTeamChip color={teamB.color} sortOrder={teamB.sort_order} />
				</div>
				<div className="col-span-3 flex items-center justify-center gap-2">
					{open && <span className={CHIP_CLASS}>{EVENT_MATCH_LABEL.open}</span>}
					{!open && winner && (
						<EventTeamChip color={winner.color} sortOrder={winner.sort_order} />
					)}
					{!open && !winner && (
						<span className={CHIP_CLASS}>{EVENT_MATCH_LABEL.draw}</span>
					)}
				</div>
				<MatchGoalTimeline
					goals={match.goals}
					teamAPlayerIds={teamAIds}
					playerName={(playerId) => {
						const row = matchPlayerById.get(playerId);
						return playerVisibleName(
							resolveRosterPlayer(
								playerId,
								row?.display_name ?? "",
								rosterById,
							),
						);
					}}
				/>
			</div>
			{match.players.length > 0 && (
				<div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-2">
					<ul className="space-y-0.5">
						{playedA.map((row) => (
							<MatchLineupPlayer
								key={row.id}
								row={row}
								rosterById={rosterById}
								alignEnd
							/>
						))}
					</ul>
					<ul className="space-y-0.5">
						{playedB.map((row) => (
							<MatchLineupPlayer
								key={row.id}
								row={row}
								rosterById={rosterById}
								alignEnd={false}
							/>
						))}
					</ul>
				</div>
			)}
		</>
	);

	return (
		<li className={cardClass}>
			<div className="flex items-start gap-2">
				{canOpenMatch && (
					<button
						type="button"
						aria-label={EVENT_ACTION.editMatch}
						className="min-w-0 flex-1 text-left"
						onClick={() => {
							onOpenMatch(match);
						}}
					>
						{body}
					</button>
				)}
				{!canOpenMatch && <div className="min-w-0 flex-1">{body}</div>}
				{showMatchDelete && (
					<button
						type="button"
						aria-label={EVENT_ACTION.removeMatch}
						className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-muted hover:text-danger-fg"
						onClick={(event) => {
							event.stopPropagation();
							onRemoveMatch(match);
						}}
					>
						<X className="size-4" />
					</button>
				)}
			</div>
		</li>
	);
}

export function ChampionshipEventMatchHistory({
	matches,
	teams,
	rosterById,
	showMatchDelete,
	canOpenMatch,
	onOpenMatch,
	onRemoveMatch,
}: ChampionshipEventMatchHistoryProps) {
	const teamById = new Map(teams.map((team) => [team.id, team]));

	return (
		<div>
			<p className="mb-1 text-xs font-medium uppercase tracking-wide text-fg-muted">
				{EVENT_SECTION_LABEL.matches}
			</p>
			{matches.length === 0 && (
				<p className="text-sm text-fg-muted">{EVENT_MATCH_LABEL.none}</p>
			)}
			{matches.length > 0 && (
				<>
					<MatchIconLegend />
					<ul className="space-y-2">
						{matches.map((match) => (
							<MatchHistoryCard
								key={match.id}
								match={match}
								teamById={teamById}
								rosterById={rosterById}
								showMatchDelete={showMatchDelete}
								canOpenMatch={canOpenMatch}
								onOpenMatch={onOpenMatch}
								onRemoveMatch={onRemoveMatch}
							/>
						))}
					</ul>
				</>
			)}
		</div>
	);
}
