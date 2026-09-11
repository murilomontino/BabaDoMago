import type { LucideIcon } from "lucide-react";
import { CircleOff, Equal, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/button";
import { EventTeamColorDot } from "@/components/event-team-player";
import { FormHeatmapPlayerStrip } from "@/components/molecules/championship-form-heatmap";
import { PlayerRating } from "@/components/player-rating";
import { resolveRosterPlayer } from "@/const/championship-event-roster";
import {
	formHeatmapEndedColumns,
	playerFormHeatmapCells,
} from "@/const/championship-form-heatmap";
import {
	canSetEventPlayerVoteDraft,
	canVoteEventPlayer,
	EVENT_PLAYER_VOTE,
	EVENT_PLAYER_VOTE_LABEL,
	EVENT_PLAYER_VOTE_LIST_KIND,
	type EventPlayerVoteChoice,
	type EventPlayerVoteCount,
	type EventPlayerVoteDraft,
	eventPlayerVoteBudgetSummary,
	eventPlayerVoteCardClassName,
	eventPlayerVoteChipLabel,
	eventPlayerVoteChoiceLabel,
	eventPlayerVoteListEntriesForRow,
	eventPlayerVoteShowsSavedChoice,
	eventPlayerVoteTargetKey,
	eventPlayerVoteTeamSections,
	eventPlayerVoteTrackBadgeClassName,
	eventPlayerVoteTrackBadgeLabel,
	eventPlayerVoteTrackDelta,
	eventPlayerVoteTrackLabel,
	isEventPlayerVoteLocked,
	nextEventPlayerVoteValue,
} from "@/const/event-player-vote";
import {
	EVENT_RATING_TRACK,
	type EventRatingTrack,
	eventActivePlayerRating,
} from "@/const/event-rating-adjustment";
import {
	eventTeamColorBadgeStyle,
	eventTeamColorStyle,
	eventTeamColorWashStyle,
} from "@/const/event-team-color";
import { playerVisibleName } from "@/const/player-name";
import {
	PLAYER_STAR_CLASS,
	PLAYER_STAR_FILL_CLASS,
} from "@/const/player-rating";
import { BUTTON_VARIANT, CHIP_CLASS, ERROR_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";
import type {
	ChampionshipEvent,
	ChampionshipEventAttendance,
	ChampionshipEventTeam,
} from "@/types/championship-event";

const EVENT_PLAYER_VOTE_CHOICE_ICON = {
	[EVENT_PLAYER_VOTE.like]: ThumbsUp,
	[EVENT_PLAYER_VOTE.dislike]: ThumbsDown,
	[EVENT_PLAYER_VOTE.maintain]: Equal,
	[EVENT_PLAYER_VOTE.blank]: CircleOff,
} as const satisfies Record<EventPlayerVoteChoice, LucideIcon>;

const EVENT_PLAYER_VOTE_LEGEND_ITEMS = [
	EVENT_PLAYER_VOTE.like,
	EVENT_PLAYER_VOTE.dislike,
	EVENT_PLAYER_VOTE.maintain,
	EVENT_PLAYER_VOTE.blank,
] as const;

type EventPlayerVoteListProps = {
	attendance: readonly ChampionshipEventAttendance[];
	teams: readonly ChampionshipEventTeam[];
	players: readonly ChampionshipPlayer[];
	formWindowEvents: readonly ChampionshipEvent[];
	ceiling: number;
	goalkeeperCeiling: number;
	ratingMinMatches: number;
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
	allowSelfVote: boolean;
	voteCounts: ReadonlyMap<number, EventPlayerVoteCount> | null;
	error: string | null;
	onDraftChange: (
		targetPlayerId: number,
		track: EventRatingTrack,
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

function EventPlayerVoteChoiceLegend() {
	return (
		<div className="rounded-lg border border-line bg-surface px-2 py-2">
			<p className="mb-1.5 text-xs font-medium text-fg-muted">
				{EVENT_PLAYER_VOTE_LABEL.legend}
			</p>
			<ul className="flex flex-wrap gap-x-4 gap-y-2">
				{EVENT_PLAYER_VOTE_LEGEND_ITEMS.map((choice) => {
					const Icon = EVENT_PLAYER_VOTE_CHOICE_ICON[choice];
					return (
						<li
							key={choice}
							className="inline-flex items-center gap-1.5 text-xs text-fg-muted"
						>
							<Icon className="size-3.5 shrink-0" aria-hidden />
							{eventPlayerVoteChoiceLabel(choice)}
						</li>
					);
				})}
			</ul>
		</div>
	);
}

export function EventPlayerVoteList({
	attendance,
	teams,
	players,
	formWindowEvents,
	ceiling,
	goalkeeperCeiling,
	ratingMinMatches,
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
	allowSelfVote,
	voteCounts,
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
	const formColumnIds = formHeatmapEndedColumns(formWindowEvents).map(
		(column) => column.eventId,
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
			{votingEnabled && <EventPlayerVoteChoiceLegend />}
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
								const isSelf = voterPlayerId === row.player_id;
								const count = voteCounts?.get(row.player_id);
								const entries = eventPlayerVoteListEntriesForRow(
									row,
									ratingMinMatches,
								);

								return entries.flatMap((entry) => {
									if (entry.kind === EVENT_PLAYER_VOTE_LIST_KIND.belowMin) {
										const track = entry.track;
										const isGoalkeeper =
											track === EVENT_RATING_TRACK.goalkeeper;
										const rating = eventActivePlayerRating(
											isGoalkeeper,
											row.rating,
											row.goalkeeper_rating,
										);
										const ratingCeiling = isGoalkeeper
											? goalkeeperCeiling
											: ceiling;
										const fillClassName = isGoalkeeper
											? PLAYER_STAR_FILL_CLASS.goalkeeper
											: PLAYER_STAR_FILL_CLASS.line;
										const cardStyle = isGoalkeeper
											? eventTeamColorWashStyle(section.color)
											: undefined;
										const badgeStyle = isGoalkeeper
											? eventTeamColorBadgeStyle(section.color)
											: undefined;

										return [
											<li
												key={entry.key}
												className={eventPlayerVoteCardClassName(track, {
													belowMin: true,
												})}
												style={cardStyle}
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
															{track && (
																<span
																	className={eventPlayerVoteTrackBadgeClassName(
																		track,
																	)}
																	style={badgeStyle}
																>
																	{eventPlayerVoteTrackBadgeLabel(track)}
																</span>
															)}
															{track ===
																EVENT_RATING_TRACK.goalkeeper && (
																<span className={CHIP_CLASS}>
																	{eventPlayerVoteTrackLabel(track)}
																</span>
															)}
														</div>
														{track && (
															<div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
																<PlayerRating
																	rating={rating}
																	ceiling={ratingCeiling}
																	starClassName={PLAYER_STAR_CLASS.compact}
																	fillClassName={fillClassName}
																/>
																<span className={CHIP_CLASS}>{rating}</span>
																<span>
																	{EVENT_PLAYER_VOTE_LABEL.matches}{" "}
																	{entry.matches}
																</span>
															</div>
														)}
														<p className="text-xs text-fg-muted">
															{EVENT_PLAYER_VOTE_LABEL.belowMinMatches}
														</p>
													</div>
												</div>
											</li>,
										];
									}

									const track = entry.track;
									if (!track) {
										return [];
									}

									const isGoalkeeper = track === EVENT_RATING_TRACK.goalkeeper;
									const targetKey = eventPlayerVoteTargetKey(
										row.player_id,
										track,
									);
									const trackDelta = eventPlayerVoteTrackDelta(row, track);
									const rating = eventActivePlayerRating(
										isGoalkeeper,
										row.rating,
										row.goalkeeper_rating,
									);
									const ratingCeiling = isGoalkeeper
										? goalkeeperCeiling
										: ceiling;
									const draftVote = draftVotes.get(targetKey) ?? null;
									const chip = votesVoided
										? null
										: eventPlayerVoteChipLabel(trackDelta);
									const canVote = canVoteEventPlayer({
										canVote: canVoteRole,
										eventEnded,
										votesClosed,
										votesVoided,
										voterPresent,
										targetPlayerId: row.player_id,
										voterPlayerId,
										voteRatingDelta: trackDelta,
										votingEnabled,
										allowSelfVote,
									});
									const locked =
										!votesVoided && isEventPlayerVoteLocked(trackDelta);
									const showSubmittedChoice = eventPlayerVoteShowsSavedChoice({
										draftVote,
										locked,
										votingEnabled,
									});
									const nextLike = nextEventPlayerVoteValue(draftVote, "like");
									const nextDislike = nextEventPlayerVoteValue(
										draftVote,
										"dislike",
									);
									const nextMaintain = nextEventPlayerVoteValue(
										draftVote,
										"maintain",
									);
									const nextBlank = nextEventPlayerVoteValue(
										draftVote,
										"blank",
									);
									const canLike =
										canVote &&
										canSetEventPlayerVoteDraft(draftVotes, targetKey, nextLike);
									const canDislike =
										canVote &&
										canSetEventPlayerVoteDraft(
											draftVotes,
											targetKey,
											nextDislike,
										);
									const canMaintain =
										canVote &&
										canSetEventPlayerVoteDraft(
											draftVotes,
											targetKey,
											nextMaintain,
										);
									const canBlank =
										canVote &&
										canSetEventPlayerVoteDraft(
											draftVotes,
											targetKey,
											nextBlank,
										);
									const fillClassName = isGoalkeeper
										? PLAYER_STAR_FILL_CLASS.goalkeeper
										: PLAYER_STAR_FILL_CLASS.line;
									const cardStyle = isGoalkeeper
										? eventTeamColorWashStyle(section.color)
										: undefined;
									const badgeStyle = isGoalkeeper
										? eventTeamColorBadgeStyle(section.color)
										: undefined;

									return [
										<li
											key={entry.key}
											className={eventPlayerVoteCardClassName(track)}
											style={cardStyle}
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
														<span
															className={eventPlayerVoteTrackBadgeClassName(
																track,
															)}
															style={badgeStyle}
														>
															{eventPlayerVoteTrackBadgeLabel(track)}
														</span>
														{isGoalkeeper && (
															<span className={CHIP_CLASS}>
																{eventPlayerVoteTrackLabel(track)}
															</span>
														)}
														{chip && <span className={CHIP_CLASS}>{chip}</span>}
														{locked && (
															<span className={CHIP_CLASS}>
																{EVENT_PLAYER_VOTE_LABEL.closed}
															</span>
														)}
														{!allowSelfVote && isSelf && (
															<span className={CHIP_CLASS}>
																{EVENT_PLAYER_VOTE_LABEL.cannotVoteSelf}
															</span>
														)}
														{count && (
															<span className={CHIP_CLASS}>
																{EVENT_PLAYER_VOTE_LABEL.like} {count.likes}
															</span>
														)}
														{count && (
															<span className={CHIP_CLASS}>
																{EVENT_PLAYER_VOTE_LABEL.dislike}{" "}
																{count.dislikes}
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
															ceiling={ratingCeiling}
															starClassName={PLAYER_STAR_CLASS.compact}
															fillClassName={fillClassName}
														/>
														<span className={CHIP_CLASS}>{rating}</span>
														<span>
															{EVENT_PLAYER_VOTE_LABEL.matches}{" "}
															{entry.matches}
														</span>
														{!isGoalkeeper && (
															<span>
																{EVENT_PLAYER_VOTE_LABEL.goals} {row.goals}
															</span>
														)}
														{!isGoalkeeper && (
															<span>
																{EVENT_PLAYER_VOTE_LABEL.assists}{" "}
																{row.assists}
															</span>
														)}
													</div>
													<FormHeatmapPlayerStrip
														cells={playerFormHeatmapCells(
															row.player_id,
															formWindowEvents,
														)}
														columnIds={formColumnIds}
													/>
												</div>
											</div>
											{canVote && (
												<div className="grid w-full min-w-0 grid-cols-4 gap-1">
													<Button
														variant={
															draftVote === "like"
																? BUTTON_VARIANT.primary
																: BUTTON_VARIANT.secondary
														}
														className="min-w-0 px-2"
														disabled={!canLike}
														aria-pressed={draftVote === "like"}
														aria-label={EVENT_PLAYER_VOTE_LABEL.like}
														onClick={() => {
															onDraftChange(row.player_id, track, nextLike);
														}}
													>
														<ThumbsUp className="size-4 shrink-0" />
													</Button>
													<Button
														variant={
															draftVote === "dislike"
																? BUTTON_VARIANT.danger
																: BUTTON_VARIANT.secondary
														}
														className="min-w-0 px-2"
														disabled={!canDislike}
														aria-pressed={draftVote === "dislike"}
														aria-label={EVENT_PLAYER_VOTE_LABEL.dislike}
														onClick={() => {
															onDraftChange(row.player_id, track, nextDislike);
														}}
													>
														<ThumbsDown className="size-4 shrink-0" />
													</Button>
													<Button
														variant={
															draftVote === "maintain"
																? BUTTON_VARIANT.soft
																: BUTTON_VARIANT.secondary
														}
														className="min-w-0 px-2"
														disabled={!canMaintain}
														aria-pressed={draftVote === "maintain"}
														aria-label={EVENT_PLAYER_VOTE_LABEL.maintain}
														onClick={() => {
															onDraftChange(row.player_id, track, nextMaintain);
														}}
													>
														<Equal className="size-4 shrink-0" />
													</Button>
													<Button
														variant={
															draftVote === "blank"
																? BUTTON_VARIANT.muted
																: BUTTON_VARIANT.secondary
														}
														className="min-w-0 px-2"
														disabled={!canBlank}
														aria-pressed={draftVote === "blank"}
														aria-label={EVENT_PLAYER_VOTE_LABEL.blank}
														onClick={() => {
															onDraftChange(row.player_id, track, nextBlank);
														}}
													>
														<CircleOff className="size-4 shrink-0" />
													</Button>
												</div>
											)}
										</li>,
									];
								});
							})}
						</ul>
					</section>
				);
			})}
			{votingEnabled && <EventPlayerVoteChoiceLegend />}
		</div>
	);
}
