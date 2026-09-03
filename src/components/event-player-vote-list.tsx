import { Equal, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/button";
import { EventTeamColorDot } from "@/components/event-team-player";
import { PlayerRating } from "@/components/player-rating";
import { resolveRosterPlayer } from "@/const/championship-event-roster";
import {
	canVoteEventPlayer,
	EVENT_PLAYER_VOTE_LABEL,
	type EventPlayerVoteChoice,
	eventPlayerVoteChipLabel,
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
	voterPresent: boolean;
	voterPlayerId: number | null;
	myVotes: ReadonlyMap<number, EventPlayerVoteChoice>;
	pendingTargetId: number | null;
	error: string | null;
	onVote: (targetPlayerId: number, value: EventPlayerVoteChoice | null) => void;
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
	voterPresent,
	voterPlayerId,
	myVotes,
	pendingTargetId,
	error,
	onVote,
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
			{canVoteRole && eventEnded && votesClosed && (
				<p className="text-sm text-fg-muted">
					{EVENT_PLAYER_VOTE_LABEL.votesClosed}
				</p>
			)}
			{canVoteRole && eventEnded && !votesClosed && !voterPresent && (
				<p className="text-sm text-fg-muted">
					{EVENT_PLAYER_VOTE_LABEL.needPresent}
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
								const myVote = myVotes.get(row.player_id) ?? null;
								const chip = eventPlayerVoteChipLabel(row.vote_rating_delta);
								const canVote = canVoteEventPlayer({
									canVote: canVoteRole,
									eventEnded,
									votesClosed,
									voterPresent,
									targetPlayerId: row.player_id,
									voterPlayerId,
									voteRatingDelta: row.vote_rating_delta,
								});
								const busy = pendingTargetId === row.player_id;
								const isSelf = voterPlayerId === row.player_id;
								const locked = isEventPlayerVoteLocked(row.vote_rating_delta);

								return [
									<li
										key={row.player_id}
										className="flex flex-col gap-2 rounded-md bg-surface-muted px-2 py-2 text-fg sm:flex-row sm:items-center sm:justify-between"
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
											<div className="flex shrink-0 gap-2">
												<Button
													variant={
														myVote === "like"
															? BUTTON_VARIANT.primary
															: BUTTON_VARIANT.secondary
													}
													disabled={busy}
													aria-pressed={myVote === "like"}
													aria-label={EVENT_PLAYER_VOTE_LABEL.like}
													onClick={() => {
														onVote(
															row.player_id,
															nextEventPlayerVoteValue(myVote, "like"),
														);
													}}
												>
													<ThumbsUp className="size-4" />
													{EVENT_PLAYER_VOTE_LABEL.like}
												</Button>
												<Button
													variant={
														myVote === "dislike"
															? BUTTON_VARIANT.danger
															: BUTTON_VARIANT.secondary
													}
													disabled={busy}
													aria-pressed={myVote === "dislike"}
													aria-label={EVENT_PLAYER_VOTE_LABEL.dislike}
													onClick={() => {
														onVote(
															row.player_id,
															nextEventPlayerVoteValue(myVote, "dislike"),
														);
													}}
												>
													<ThumbsDown className="size-4" />
													{EVENT_PLAYER_VOTE_LABEL.dislike}
												</Button>
												<Button
													variant={
														myVote === "maintain"
															? BUTTON_VARIANT.primary
															: BUTTON_VARIANT.secondary
													}
													disabled={busy}
													aria-pressed={myVote === "maintain"}
													aria-label={EVENT_PLAYER_VOTE_LABEL.maintain}
													onClick={() => {
														onVote(
															row.player_id,
															nextEventPlayerVoteValue(myVote, "maintain"),
														);
													}}
												>
													<Equal className="size-4" />
													{EVENT_PLAYER_VOTE_LABEL.maintain}
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
