import { Equal, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/button";
import { EventTeamColorDot } from "@/components/event-team-player";
import { PlayerRating } from "@/components/player-rating";
import { resolveRosterPlayer } from "@/const/championship-event-roster";
import {
	canSetEventPlayerVoteDraft,
	canVoteEventPlayer,
	EVENT_PLAYER_VOTE_LABEL,
	type EventPlayerVoteChoice,
	type EventPlayerVoteDraft,
	eventPlayerVoteBudgetSummary,
	eventPlayerVoteChipLabel,
	eventPlayerVoteChoiceLabel,
	eventPlayerVoteTeamSections,
	isEventPlayerVoteLocked,
	nextEventPlayerVoteValue,
} from "@/const/event-player-vote";
import { eventTeamColorStyle } from "@/const/event-team-color";
import { playerVisibleName } from "@/const/player-name";
import { PLAYER_STAR_CLASS } from "@/const/player-rating";
import { BUTTON_VARIANT, CHIP_CLASS, ERROR_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";
import type {
	ChampionshipEventAttendance,
	ChampionshipEventTeam,
} from "@/types/championship-event";

type EventPlayerVoteListProps = {
	attendance: readonly ChampionshipEventAttendance[];
	teams: readonly ChampionshipEventTeam[];
	players: readonly ChampionshipPlayer[];
	ceiling: number;
	canVoteRole: boolean;
	eventEnded: boolean;
	votesClosed: boolean;
	votesVoided: boolean;
	voterPresent: boolean;
	voterPlayerId: number | null;
	draftVotes: EventPlayerVoteDraft;
	votingEnabled: boolean;
	ballotLocked: boolean;
	showBudget: boolean;
	error: string | null;
	onDraftChange: (
		targetPlayerId: number,
		value: EventPlayerVoteChoice | null,
	) => void;
};

function VotePlayerAvatar({
	avatarUrl,
	name,
}: {
	avatarUrl: string | null;
	name: string;
}) {
	if (avatarUrl) {
		return (
			<img
				src={avatarUrl}
				alt=""
				referrerPolicy="no-referrer"
				className="h-10 w-10 shrink-0 rounded-full object-cover"
			/>
		);
	}

	return (
		<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pitch-soft text-sm font-medium text-pitch-fg">
			{name.charAt(0).toUpperCase()}
		</span>
	);
}

export function EventPlayerVoteList({
	attendance,
	teams,
	players,
	ceiling,
	canVoteRole,
	eventEnded,
	votesClosed,
	votesVoided,
	voterPresent,
	voterPlayerId,
	draftVotes,
	votingEnabled,
	ballotLocked,
	showBudget,
	error,
	onDraftChange,
}: EventPlayerVoteListProps) {
	if (attendance.length === 0) {
		return (
			<p className="text-sm text-fg-muted">{EVENT_PLAYER_VOTE_LABEL.empty}</p>
		);
	}

	const rosterById = new Map(players.map((player) => [player.id, player]));
	const sections = eventPlayerVoteTeamSections(attendance, teams);
	const attendanceByPlayerId = new Map(
		attendance.map((row) => [row.player_id, row] as const),
	);

	return (
		<div className="space-y-2">
			{canVoteRole && !eventEnded && (
				<p className="text-sm text-fg-muted">
					{EVENT_PLAYER_VOTE_LABEL.needEnded}
				</p>
			)}
			{!canVoteRole && (
				<p className="text-sm text-fg-muted">
					{EVENT_PLAYER_VOTE_LABEL.needPresent}
				</p>
			)}
			{canVoteRole && eventEnded && votesVoided && (
				<p className="text-sm text-fg-muted">
					{EVENT_PLAYER_VOTE_LABEL.votesVoided}
				</p>
			)}
			{canVoteRole && eventEnded && !votesVoided && votesClosed && (
				<p className="text-sm text-fg-muted">
					{EVENT_PLAYER_VOTE_LABEL.votesClosed}
				</p>
			)}
			{canVoteRole &&
				eventEnded &&
				!votesVoided &&
				!votesClosed &&
				!voterPresent && (
				<p className="text-sm text-fg-muted">
					{EVENT_PLAYER_VOTE_LABEL.needPresent}
				</p>
			)}
			{ballotLocked &&
				canVoteRole &&
				eventEnded &&
				!votesVoided &&
				!votesClosed &&
				voterPresent && (
				<p className="text-sm text-fg-muted">
					{EVENT_PLAYER_VOTE_LABEL.votesSubmitted}
				</p>
			)}
			{showBudget && (
				<p className="text-sm text-fg-muted">
					{eventPlayerVoteBudgetSummary(draftVotes)}
				</p>
			)}
			{error && <p className={ERROR_CLASS}>{error}</p>}
			{sections.map((section) => {
				const cardStyle = eventTeamColorStyle(section.color);

				return (
					<section
						key={section.teamId ?? "none"}
						className="relative rounded-lg border border-line bg-surface p-2 text-sm"
						style={cardStyle}
					>
						<EventTeamColorDot color={section.color} />
						<div className="mb-1 flex items-center gap-1 pr-5">
							<p className="min-w-0 flex-1 text-xs font-medium">
								{section.title}
							</p>
						</div>
						<ul className="space-y-1">
							{section.rows.flatMap((slot) => {
								const row = attendanceByPlayerId.get(slot.player_id);
								if (!row) {
									return [];
								}

								const player = resolveRosterPlayer(
									row.player_id,
									row.display_name,
									rosterById,
								);
								const name = playerVisibleName(player);
								const rating = player.rating;
								const draftVote = draftVotes.get(row.player_id) ?? null;
								const chip = votesVoided
									? null
									: eventPlayerVoteChipLabel(row.vote_rating_delta);
								const canVote = canVoteEventPlayer({
									canVote: canVoteRole,
									eventEnded,
									votesClosed,
									votesVoided,
									voterPresent,
									targetPlayerId: row.player_id,
									voterPlayerId,
									voteRatingDelta: row.vote_rating_delta,
									votingEnabled,
								});
								const isSelf = voterPlayerId === row.player_id;
								const locked =
									!votesVoided &&
									isEventPlayerVoteLocked(row.vote_rating_delta);
								const showSubmittedChoice =
									!votingEnabled && draftVote !== null && !isSelf;
								const nextLike = nextEventPlayerVoteValue(draftVote, "like");
								const nextDislike = nextEventPlayerVoteValue(
									draftVote,
									"dislike",
								);
								const nextMaintain = nextEventPlayerVoteValue(
									draftVote,
									"maintain",
								);
								const canLike =
									canVote &&
									canSetEventPlayerVoteDraft(draftVotes, row.player_id, nextLike);
								const canDislike =
									canVote &&
									canSetEventPlayerVoteDraft(
										draftVotes,
										row.player_id,
										nextDislike,
									);
								const canMaintain =
									canVote &&
									canSetEventPlayerVoteDraft(
										draftVotes,
										row.player_id,
										nextMaintain,
									);

								return [
									<li
										key={row.player_id}
										className="flex flex-col gap-2 rounded-md bg-surface-muted px-2 py-2 text-fg"
									>
										<div className="flex min-w-0 items-start gap-3">
											<VotePlayerAvatar
												avatarUrl={player.avatar_url}
												name={name}
											/>
											<div className="min-w-0 space-y-1">
												<div className="flex flex-wrap items-center gap-2">
													<p className="truncate text-sm font-medium text-fg">
														{name}
													</p>
													{chip && <span className={CHIP_CLASS}>{chip}</span>}
													{locked && (
														<span className={CHIP_CLASS}>
															{EVENT_PLAYER_VOTE_LABEL.closed}
														</span>
													)}
													{isSelf && (
														<span className={CHIP_CLASS}>
															{EVENT_PLAYER_VOTE_LABEL.cannotVoteSelf}
														</span>
													)}
													{showSubmittedChoice && draftVote && (
														<span className={CHIP_CLASS}>
															{eventPlayerVoteChoiceLabel(draftVote)}
														</span>
													)}
												</div>
												<div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
													<PlayerRating
														rating={rating}
														ceiling={ceiling}
														starClassName={PLAYER_STAR_CLASS.compact}
													/>
													<span className={CHIP_CLASS}>{rating}</span>
													<span>
														{EVENT_PLAYER_VOTE_LABEL.goals} {row.goals}
													</span>
													<span>
														{EVENT_PLAYER_VOTE_LABEL.assists} {row.assists}
													</span>
												</div>
											</div>
										</div>
										{canVote && (
											<div className="grid w-full min-w-0 grid-cols-3 gap-1">
												<Button
													variant={
														draftVote === "like"
															? BUTTON_VARIANT.primary
															: BUTTON_VARIANT.secondary
													}
													className="min-w-0 gap-1 px-2 text-xs"
													disabled={!canLike}
													aria-pressed={draftVote === "like"}
													aria-label={EVENT_PLAYER_VOTE_LABEL.like}
													onClick={() => {
														onDraftChange(row.player_id, nextLike);
													}}
												>
													<ThumbsUp className="size-4 shrink-0" />
													<span className="truncate">
														{EVENT_PLAYER_VOTE_LABEL.like}
													</span>
												</Button>
												<Button
													variant={
														draftVote === "dislike"
															? BUTTON_VARIANT.danger
															: BUTTON_VARIANT.secondary
													}
													className="min-w-0 gap-1 px-2 text-xs"
													disabled={!canDislike}
													aria-pressed={draftVote === "dislike"}
													aria-label={EVENT_PLAYER_VOTE_LABEL.dislike}
													onClick={() => {
														onDraftChange(row.player_id, nextDislike);
													}}
												>
													<ThumbsDown className="size-4 shrink-0" />
													<span className="truncate">
														{EVENT_PLAYER_VOTE_LABEL.dislike}
													</span>
												</Button>
												<Button
													variant={
														draftVote === "maintain"
															? BUTTON_VARIANT.primary
															: BUTTON_VARIANT.secondary
													}
													className="min-w-0 gap-1 px-2 text-xs"
													disabled={!canMaintain}
													aria-pressed={draftVote === "maintain"}
													aria-label={EVENT_PLAYER_VOTE_LABEL.maintain}
													onClick={() => {
														onDraftChange(row.player_id, nextMaintain);
													}}
												>
													<Equal className="size-4 shrink-0" />
													<span className="truncate">
														{EVENT_PLAYER_VOTE_LABEL.maintain}
													</span>
												</Button>
											</div>
										)}
									</li>,
								];
							})}
						</ul>
					</section>
				);
			})}
		</div>
	);
}
