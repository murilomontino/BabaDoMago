import { ChevronDown, Handshake, Star, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/button";
import { ChampionshipEventEditGoalModal } from "@/components/championship-event-edit-goal-modal";
import { MatchupAnalysisPanel } from "@/components/event-matchup-analysis";
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
	canEditEndedMatchGoal,
	canOpenEventHistoryMatch,
	EVENT_MATCH_ICON,
	EVENT_MATCH_ICON_LEGEND,
	EVENT_MATCH_LABEL,
	EVENT_MATCH_SUBSTITUTION_LABEL,
	type EventMatchIcon,
	type MatchGoalEditPayload,
	formatMatchScore,
	isOpenMatch,
	matchScore,
	matchTeamPlayers,
	matchWinnerTeam,
	openEventMatch,
} from "@/const/championship-event-match";
import { resolveRosterPlayer } from "@/const/championship-event-roster";
import {
	analyzeMatchHistoryMatchup,
	eventMatchupFavoriteStats,
	formatMatchupFavoriteHitRate,
	MATCHUP_LABEL,
	type MatchupMatchReview,
	matchFavoriteTeamId,
	matchupFavoriteTeamId,
} from "@/const/event-matchup-analysis";
import { eventTeamName } from "@/const/event-team-color";
import { PLAYER_LABEL, playerVisibleName } from "@/const/player-name";
import { BUTTON_VARIANT, CARD_CLASS, CHIP_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";
import type {
	ChampionshipEvent,
	ChampionshipEventAttendance,
	ChampionshipEventGoal,
	ChampionshipEventMatch,
	ChampionshipEventMatchPlayer,
	ChampionshipEventTeam,
} from "@/types/championship-event";

type ChampionshipEventMatchHistoryProps = {
	matches: readonly ChampionshipEventMatch[];
	teams: readonly ChampionshipEventTeam[];
	rosterById: ReadonlyMap<number, ChampionshipPlayer>;
	roster: readonly ChampionshipPlayer[];
	attendance: readonly ChampionshipEventAttendance[];
	historyEvents: readonly ChampionshipEvent[];
	showMatchDelete: boolean;
	showGoalEdit: boolean;
	eventEnded: boolean;
	editGoalPending?: boolean;
	editGoalError?: string | null;
	onOpenMatch: (match: ChampionshipEventMatch) => void;
	onRemoveMatch: (match: ChampionshipEventMatch) => void;
	onEditGoal: (payload: MatchGoalEditPayload) => Promise<void>;
};

function MatchHistoryMatchupReview({
	review,
	teamA,
	teamB,
}: {
	review: MatchupMatchReview;
	teamA: ChampionshipEventTeam;
	teamB: ChampionshipEventTeam;
}) {
	return (
		<div className="mt-3 space-y-3 border-t border-line pt-2">
			<MatchupAnalysisPanel
				analysis={review.analysis}
				home={{
					title: eventTeamName(teamA.color, teamA.sort_order),
					color: teamA.color,
				}}
				away={{
					title: eventTeamName(teamB.color, teamB.sort_order),
					color: teamB.color,
				}}
			/>
		</div>
	);
}

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
	roster,
	attendance,
	historyEvents,
	showMatchDelete,
	showGoalEdit,
	canOpenMatch,
	editGoalPending,
	editGoalError,
	onOpenMatch,
	onRemoveMatch,
	onEditGoal,
}: {
	match: ChampionshipEventMatch;
	teamById: ReadonlyMap<number, ChampionshipEventTeam>;
	rosterById: ReadonlyMap<number, ChampionshipPlayer>;
	roster: readonly ChampionshipPlayer[];
	attendance: readonly ChampionshipEventAttendance[];
	historyEvents: readonly ChampionshipEvent[];
	showMatchDelete: boolean;
	showGoalEdit: boolean;
	canOpenMatch: boolean;
	editGoalPending: boolean;
	editGoalError: string | null;
	onOpenMatch: (match: ChampionshipEventMatch) => void;
	onRemoveMatch: (match: ChampionshipEventMatch) => void;
	onEditGoal: (payload: MatchGoalEditPayload) => Promise<void>;
}) {
	const [analysisOpen, setAnalysisOpen] = useState(false);
	const [editingGoal, setEditingGoal] = useState<ChampionshipEventGoal | null>(
		null,
	);
	const teamA = teamById.get(match.team_a_id) ?? null;
	const teamB = teamById.get(match.team_b_id) ?? null;
	const review =
		teamA && teamB
			? analyzeMatchHistoryMatchup({
					match,
					teamA,
					teamB,
					attendance,
					historyEvents,
					roster,
				})
			: null;

	if (!teamA || !teamB) {
		return null;
	}

	const frozenFavoriteId = matchFavoriteTeamId(match);
	const liveFavoriteId =
		review === null
			? null
			: matchupFavoriteTeamId(
					review.analysis.favoriteSide,
					match.team_a_id,
					match.team_b_id,
				);
	const favoriteTeamId =
		frozenFavoriteId === undefined ? liveFavoriteId : frozenFavoriteId;
	const teamAFavorite = favoriteTeamId === match.team_a_id;
	const teamBFavorite = favoriteTeamId === match.team_b_id;

	const playedA = matchTeamPlayers(match.players, match.team_a_id);
	const playedB = matchTeamPlayers(match.players, match.team_b_id);
	const teamAIds = new Set(playedA.map((player) => player.player_id));
	const score = matchScore(match.goals, teamAIds);
	const winner = matchWinnerTeam(match.winner_team_id, teamById);
	const open = isOpenMatch(match);
	const canEditGoals = canEditEndedMatchGoal(match, showGoalEdit);
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

	function playerName(playerId: number) {
		const row = matchPlayerById.get(playerId);
		return playerVisibleName(
			resolveRosterPlayer(playerId, row?.display_name ?? "", rosterById),
		);
	}

	const scoreHeader = (
		<>
			<div className="flex min-w-0 items-center justify-end gap-1">
				{teamAFavorite && (
					<Star
						aria-label={MATCHUP_LABEL.favoriteByFields}
						className="size-3.5 shrink-0 fill-amber-400 text-amber-400"
					/>
				)}
				<EventTeamChip color={teamA.color} sortOrder={teamA.sort_order} />
			</div>
			<p className="text-2xl font-semibold tabular-nums text-fg">
				{formatMatchScore(score.teamA, score.teamB)}
			</p>
			<div className="flex min-w-0 items-center justify-start gap-1">
				<EventTeamChip color={teamB.color} sortOrder={teamB.sort_order} />
				{teamBFavorite && (
					<Star
						aria-label={MATCHUP_LABEL.favoriteByFields}
						className="size-3.5 shrink-0 fill-amber-400 text-amber-400"
					/>
				)}
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
		</>
	);

	return (
		<li className={cardClass}>
			<div className="flex items-start gap-2">
				<div className="min-w-0 flex-1">
					<div className={MATCH_GOAL_TIMELINE_GRID_CLASS}>
						{canOpenMatch && (
							<button
								type="button"
								aria-label={EVENT_ACTION.editMatch}
								className="col-span-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2 gap-y-0.5 text-left"
								onClick={() => {
									onOpenMatch(match);
								}}
							>
								{scoreHeader}
							</button>
						)}
						{!canOpenMatch && scoreHeader}
						<MatchGoalTimeline
							goals={match.goals}
							teamAPlayerIds={teamAIds}
							playerName={playerName}
							editDisabled={editGoalPending}
							onEditGoal={
								canEditGoals
									? (goalId) => {
											const goal = match.goals.find((row) => row.id === goalId);
											if (!goal) {
												return;
											}

											setEditingGoal(goal);
										}
									: undefined
							}
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
				</div>
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
			{review && (
				<div className="mt-2 border-t border-line pt-2">
					<Button
						variant={BUTTON_VARIANT.ghost}
						className="h-8 w-full justify-between gap-2 px-2 text-xs"
						aria-expanded={analysisOpen}
						aria-label={MATCHUP_LABEL.openAnalysis}
						onClick={() => {
							setAnalysisOpen((current) => !current);
						}}
					>
						<span>
							{analysisOpen
								? MATCHUP_LABEL.hideAnalysis
								: MATCHUP_LABEL.openAnalysis}
						</span>
						<ChevronDown
							className={`size-4 shrink-0 transition-transform ${
								analysisOpen ? "rotate-180" : ""
							}`}
						/>
					</Button>
					{analysisOpen && (
						<MatchHistoryMatchupReview
							review={review}
							teamA={teamA}
							teamB={teamB}
						/>
					)}
				</div>
			)}
			{editingGoal && (
				<ChampionshipEventEditGoalModal
					goal={editingGoal}
					matchPlayers={match.players}
					rosterById={rosterById}
					isPending={editGoalPending}
					errorMessage={editGoalError}
					onCancel={() => {
						setEditingGoal(null);
					}}
					onSave={async (payload) => {
						await onEditGoal(payload);
						setEditingGoal(null);
					}}
				/>
			)}
		</li>
	);
}

export function ChampionshipEventMatchHistory({
	matches,
	teams,
	rosterById,
	roster,
	attendance,
	historyEvents,
	showMatchDelete,
	showGoalEdit,
	eventEnded,
	editGoalPending = false,
	editGoalError = null,
	onOpenMatch,
	onRemoveMatch,
	onEditGoal,
}: ChampionshipEventMatchHistoryProps) {
	const teamById = new Map(teams.map((team) => [team.id, team]));
	const hasOpenMatch = openEventMatch(matches) !== null;
	const favoriteStats = eventMatchupFavoriteStats(matches);
	const favoriteHitCaption =
		favoriteStats.decreed > 0
			? formatMatchupFavoriteHitRate(favoriteStats)
			: null;

	return (
		<div>
			<p className="mb-1 text-xs font-medium uppercase tracking-wide text-fg-muted">
				{EVENT_SECTION_LABEL.matches}
			</p>
			{favoriteHitCaption && (
				<p className="mb-2 text-sm font-medium tabular-nums text-fg">
					{MATCHUP_LABEL.favoriteHitRate}: {favoriteHitCaption}
				</p>
			)}
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
								roster={roster}
								attendance={attendance}
								historyEvents={historyEvents}
								showMatchDelete={showMatchDelete}
								showGoalEdit={showGoalEdit}
								canOpenMatch={canOpenEventHistoryMatch(match, {
									eventEnded,
									hasOpenMatch,
								})}
								editGoalPending={editGoalPending}
								editGoalError={editGoalError}
								onOpenMatch={onOpenMatch}
								onRemoveMatch={onRemoveMatch}
								onEditGoal={onEditGoal}
							/>
						))}
					</ul>
				</>
			)}
		</div>
	);
}
