import { Link } from "@tanstack/react-router";
import { Copy, Play, Square, Trash2 } from "lucide-react";
import { type RefObject, useState } from "react";
import { Button } from "@/components/button";
import { DeleteEventModal } from "@/components/delete-event-modal";
import { EndEventModal } from "@/components/end-event-modal";
import { IconTooltipButton } from "@/components/molecules/icon-tooltip-button";
import {
	canStartEventMatch,
	clearAttendanceDraft,
	draftAttendanceForEnd,
	EVENT_ACTION,
	EVENT_STATUS,
	type EventStatus,
	eventMatchTeamCount,
	matchPlayerIdsMissingFromAttendance,
	mergePresentIdsForEnd,
} from "@/const/championship-event";
import {
	copyMatchLinkLabel,
	matchPlayUrl,
	openEventMatch,
} from "@/const/championship-event-match";
import {
	eventMvpCandidates,
	mvpPlayerIdsWhenAllowed,
	toggleEventMvpPlayerId,
} from "@/const/event-mvp";
import { eventRatingPreview } from "@/const/event-rating-adjustment";
import { playerVisibleName } from "@/const/player-name";
import { championshipRatingCeiling } from "@/const/player-rating";
import { ROUTES } from "@/const/routes";
import { BUTTON_VARIANT, buttonClassName } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";
import type { ChampionshipEvent } from "@/types/championship-event";

type ChampionshipEventDetailActionsProps = {
	event: ChampionshipEvent;
	players: ChampionshipPlayer[];
	canManage: boolean;
	canSetMvp: boolean;
	showTeamBuilder: boolean;
	status: EventStatus;
	draftPresentIdsRef: RefObject<number[]>;
	onEnd: (
		presentPlayerIds: number[] | null,
		mvpPlayerIds: number[] | null,
	) => Promise<void>;
	onDelete: () => Promise<void>;
	ending: boolean;
	endError: string | null;
	deleting: boolean;
	deleteError: string | null;
};

export function ChampionshipEventDetailActions({
	event,
	players,
	canManage,
	canSetMvp,
	showTeamBuilder,
	status,
	draftPresentIdsRef,
	onEnd,
	onDelete,
	ending,
	endError,
	deleting,
	deleteError,
}: ChampionshipEventDetailActionsProps) {
	const ended = status === EVENT_STATUS.ended;
	const showStartMatch =
		!showTeamBuilder &&
		canStartEventMatch({
			ended,
			teamCount: eventMatchTeamCount(event.teams),
		});
	const openMatch = openEventMatch(event.matches);
	const [copied, setCopied] = useState(false);
	const [isEndOpen, setIsEndOpen] = useState(false);
	const [endMvpPlayerIds, setEndMvpPlayerIds] = useState<number[] | null>(null);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);

	const attendanceIds = event.attendance.map((row) => row.player_id);
	const missingMatchPlayerIds = matchPlayerIdsMissingFromAttendance(
		event.matches,
		attendanceIds,
	);
	const presentPlayerIdsForEnd = mergePresentIdsForEnd(
		draftAttendanceForEnd(showTeamBuilder, draftPresentIdsRef.current),
		attendanceIds,
		missingMatchPlayerIds,
	);
	const mvpCandidateIds = eventMvpCandidates(event.attendance)
		.map((row) => row.playerId)
		.filter(
			(playerId) =>
				presentPlayerIdsForEnd === null ||
				presentPlayerIdsForEnd.includes(playerId),
		);
	const mvpPlayerIds = endMvpPlayerIds ?? mvpCandidateIds;
	const ratingPreview = eventRatingPreview({
		attendance: event.attendance,
		players,
		presentPlayerIds: presentPlayerIdsForEnd,
		mvpPlayerIds,
	});
	const previewCeiling = championshipRatingCeiling([
		...players.map((player) => player.rating),
		...ratingPreview.map((row) => row.to),
	]);

	const canEndEvent = canManage && status === EVENT_STATUS.open;

	if (!showStartMatch && !canManage) {
		return null;
	}

	async function handleCopyMatchLink() {
		const url = matchPlayUrl(
			window.location.origin,
			event.championship_id,
			event.id,
			ROUTES.championshipEventPlay,
		);
		await navigator.clipboard.writeText(url);
		setCopied(true);
	}

	function openEndEvent() {
		setEndMvpPlayerIds(null);
		setIsEndOpen(true);
	}

	return (
		<>
			<div className="flex flex-col gap-2">
				<div className="flex flex-wrap items-center gap-2">
					<div className="flex items-center gap-1">
						{showStartMatch && (
							<IconTooltipButton
								showLabel
								label={copyMatchLinkLabel(copied)}
								icon={<Copy className="size-4" />}
								onClick={() => {
									void handleCopyMatchLink();
								}}
							/>
						)}
						{canEndEvent && (
							<span className="hidden md:inline-flex">
								<IconTooltipButton
									showLabel
									label={EVENT_ACTION.endEvent}
									icon={<Square className="size-4 fill-current" />}
									variant={BUTTON_VARIANT.ghost}
									onClick={openEndEvent}
								/>
							</span>
						)}
						{canManage && (
							<IconTooltipButton
								showLabel
								label={EVENT_ACTION.deleteEvent}
								icon={<Trash2 className="size-4" />}
								variant={BUTTON_VARIANT.danger}
								onClick={() => setIsDeleteOpen(true)}
							/>
						)}
					</div>
					{showStartMatch && (
						<Link
							to={ROUTES.championshipEventPlay}
							params={{
								championshipId: String(event.championship_id),
								eventId: String(event.id),
							}}
							className={buttonClassName(
								BUTTON_VARIANT.primary,
								"w-full md:ml-auto md:w-auto",
							)}
						>
							<Play className="size-4" />
							{openMatch ? EVENT_ACTION.continueMatch : EVENT_ACTION.startMatch}
						</Link>
					)}
				</div>
				{canEndEvent && (
					<Button
						variant={BUTTON_VARIANT.secondary}
						className="w-full md:hidden"
						onClick={openEndEvent}
					>
						<Square className="fill-current" />
						{EVENT_ACTION.endEvent}
					</Button>
				)}
			</div>
			{isEndOpen && (
				<EndEventModal
					rows={ratingPreview}
					ceiling={previewCeiling}
					canSetMvp={canSetMvp}
					mvpCandidateIds={mvpCandidateIds}
					missingAttendanceNames={missingMatchPlayerIds.map((playerId) => {
						const player = players.find((item) => item.id === playerId);
						if (player) {
							return playerVisibleName(player);
						}

						const matchPlayer = event.matches
							.flatMap((match) => match.players)
							.find((row) => row.player_id === playerId);
						return matchPlayer?.display_name ?? String(playerId);
					})}
					isPending={ending}
					errorMessage={endError}
					onToggleMvp={(playerId) => {
						setEndMvpPlayerIds((current) =>
							toggleEventMvpPlayerId(current ?? mvpCandidateIds, playerId),
						);
					}}
					onCancel={() => {
						if (ending) {
							return;
						}

						setEndMvpPlayerIds(null);
						setIsEndOpen(false);
					}}
					onConfirm={() => {
						void (async () => {
							try {
								await onEnd(
									presentPlayerIdsForEnd,
									mvpPlayerIdsWhenAllowed(canSetMvp, mvpPlayerIds),
								);
								clearAttendanceDraft(event.id);
								setEndMvpPlayerIds(null);
								setIsEndOpen(false);
							} catch {
								return;
							}
						})();
					}}
				/>
			)}
			{isDeleteOpen && (
				<DeleteEventModal
					isPending={deleting}
					errorMessage={deleteError}
					onCancel={() => {
						if (deleting) {
							return;
						}

						setIsDeleteOpen(false);
					}}
					onConfirm={() => {
						void (async () => {
							try {
								await onDelete();
							} catch {
								return;
							}
						})();
					}}
				/>
			)}
		</>
	);
}
