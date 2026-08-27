import {
	ChevronRight,
	Link2,
	LoaderCircle,
	Pause,
	Play,
	Share2,
	Shuffle,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import {
	EVENT_TEAM_PLAYER_SLOT_CLASS,
	EVENT_TEAM_POSITION_CHIP_CLASS,
	EventTeamColorDot,
	EventTeamPlayerRow,
	EventTeamRatingAverage,
} from "@/components/event-team-player";
import {
	EVENT_ACTION,
	EVENT_TEAM_POSITION_LABEL,
	eventTeamPlayerPosition,
	formatEventStartsAt,
} from "@/const/championship-event";
import { resolveRosterPlayer } from "@/const/championship-event-roster";
import {
	copyDrawLinkLabel,
	EVENT_DRAW_REVEAL_LABEL,
	EVENT_DRAW_REVEAL_MOTION,
	EVENT_DRAW_REVEAL_PHASE,
	type EventDrawRevealPhase,
	eventDrawRevealCanNext,
	eventDrawRevealCardKey,
	eventDrawRevealGridClass,
	eventDrawRevealItemCount,
	eventDrawRevealShareIsPrimary,
	eventDrawRevealShowControls,
	eventDrawRevealShowShare,
	eventDrawRevealSlotIsGoalkeeper,
	eventDrawRevealVisibleCards,
	eventDrawRevealWaitingHint,
} from "@/const/event-draw-reveal";
import { eventTeamColorStyle } from "@/const/event-team-color";
import {
	EVENT_TEAM_SHARE_LABEL,
	type EventTeamShareCard,
} from "@/const/event-team-share";
import { PLAYER_STAR_CLASS } from "@/const/player-rating";
import { BUTTON_VARIANT, ERROR_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";

type EventDrawRevealProps = {
	championshipName: string;
	startsAt: string;
	cards: readonly EventTeamShareCard[];
	visibleCount: number;
	phase: EventDrawRevealPhase;
	autoplay: boolean;
	ceiling: number;
	rosterById: ReadonlyMap<number, ChampionshipPlayer>;
	onStart: () => void;
	onReplay: () => void;
	onPause: () => void;
	onPlay: () => void;
	onNext: () => void;
	onShare: () => void;
	isSharing: boolean;
	shareError: string | null;
};

function revealEnterInitial(reduceMotion: boolean | null) {
	if (reduceMotion) {
		return false as const;
	}

	return { opacity: 0, y: EVENT_DRAW_REVEAL_MOTION.y };
}

export function EventDrawReveal({
	championshipName,
	startsAt,
	cards,
	visibleCount,
	phase,
	autoplay,
	ceiling,
	rosterById,
	onStart,
	onReplay,
	onPause,
	onPlay,
	onNext,
	onShare,
	isSharing,
	shareError,
}: EventDrawRevealProps) {
	const reduceMotion = useReducedMotion();
	const when = formatEventStartsAt(startsAt);
	const visibleCards = eventDrawRevealVisibleCards(cards, visibleCount);
	const showStart = phase === EVENT_DRAW_REVEAL_PHASE.poster;
	const showReplay = phase === EVENT_DRAW_REVEAL_PHASE.done;
	const showShare = eventDrawRevealShowShare(phase);
	const shareVariant = drawShareButtonVariant(
		eventDrawRevealShareIsPrimary(phase),
	);
	const shareLabel = drawShareButtonLabel(isSharing, showReplay);
	const showControls = eventDrawRevealShowControls(
		phase,
		Boolean(reduceMotion),
	);
	const canNext = eventDrawRevealCanNext(
		visibleCount,
		eventDrawRevealItemCount(cards),
	);

	return (
		<div className="mx-auto flex min-h-0 w-full flex-1 flex-col gap-3 overflow-hidden sm:gap-4">
			<header className="shrink-0 px-1 text-center">
				<p className="text-sm font-medium text-fg-muted">{championshipName}</p>
				<p className="text-xs text-fg-muted">
					{when.date} · {when.time}
				</p>
				<h1 className="mt-1 text-xl font-semibold tracking-tight text-fg sm:mt-2 sm:text-2xl">
					{EVENT_DRAW_REVEAL_LABEL.title}
				</h1>
			</header>
			<ul
				className={`scrollbar-thin grid min-h-0 flex-1 content-start gap-2 overflow-y-auto overscroll-contain ${eventDrawRevealGridClass(cards.length)}`}
			>
				<AnimatePresence initial={false}>
					{visibleCards.map((card) => {
						const cardStyle = eventTeamColorStyle(card.color);
						const ratings = card.players.map((player) => player.rating);

						return (
							<motion.li
								key={eventDrawRevealCardKey(card)}
								initial={revealEnterInitial(reduceMotion)}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: EVENT_DRAW_REVEAL_MOTION.duration }}
								className="relative rounded-lg border border-line bg-surface p-1.5 text-sm"
								style={cardStyle}
							>
								<div className="mb-1 flex items-center gap-1">
									<EventTeamColorDot color={card.color} />
									<p className="min-w-0 flex-1 text-xs font-medium">
										{card.title}
									</p>
								</div>
								<ul className="space-y-1">
									<AnimatePresence initial={false}>
										{card.players.map((sharePlayer) => {
											const player = resolveRosterPlayer(
												sharePlayer.id,
												sharePlayer.name,
												rosterById,
											);
											const position = eventTeamPlayerPosition(
												eventDrawRevealSlotIsGoalkeeper(sharePlayer.number),
											);

											return (
												<motion.li
													key={sharePlayer.id}
													initial={revealEnterInitial(reduceMotion)}
													animate={{ opacity: 1, y: 0 }}
													transition={{
														duration: EVENT_DRAW_REVEAL_MOTION.duration,
													}}
													className={EVENT_TEAM_PLAYER_SLOT_CLASS}
												>
													<span
														className={`${EVENT_TEAM_POSITION_CHIP_CLASS} shrink-0`}
													>
														{EVENT_TEAM_POSITION_LABEL[position]}
													</span>
													<EventTeamPlayerRow
														player={player}
														ceiling={ceiling}
														starClassName={PLAYER_STAR_CLASS.compact}
													/>
												</motion.li>
											);
										})}
									</AnimatePresence>
								</ul>
								<EventTeamRatingAverage ratings={ratings} />
							</motion.li>
						);
					})}
				</AnimatePresence>
			</ul>
			{showControls && (
				<div className="flex shrink-0 flex-col gap-2 py-1 sm:flex-row sm:justify-center">
					{autoplay && (
						<Button
							variant={BUTTON_VARIANT.secondary}
							className="h-12 w-full text-sm sm:h-14 sm:min-w-40 sm:w-auto sm:text-base"
							onClick={onPause}
						>
							<Pause className="size-5" />
							<span className="sm:hidden">
								{EVENT_DRAW_REVEAL_LABEL.pauseShort}
							</span>
							<span className="hidden sm:inline">
								{EVENT_DRAW_REVEAL_LABEL.pause}
							</span>
						</Button>
					)}
					{!autoplay && (
						<Button
							className="h-12 w-full text-sm sm:h-14 sm:min-w-40 sm:w-auto sm:text-base"
							onClick={onPlay}
						>
							<Play className="size-5" />
							<span className="sm:hidden">
								{EVENT_DRAW_REVEAL_LABEL.playShort}
							</span>
							<span className="hidden sm:inline">
								{EVENT_DRAW_REVEAL_LABEL.play}
							</span>
						</Button>
					)}
					<Button
						variant={BUTTON_VARIANT.secondary}
						className="h-12 w-full text-sm sm:h-14 sm:min-w-40 sm:w-auto sm:text-base"
						disabled={!canNext}
						onClick={onNext}
					>
						<ChevronRight className="size-5" />
						<span className="sm:hidden">
							{EVENT_DRAW_REVEAL_LABEL.nextShort}
						</span>
						<span className="hidden sm:inline">
							{EVENT_DRAW_REVEAL_LABEL.next}
						</span>
					</Button>
				</div>
			)}
			{showStart && (
				<div className="flex shrink-0 justify-center py-1">
					<Button
						className="h-12 w-full text-base sm:h-14 sm:min-w-40 sm:w-auto"
						onClick={onStart}
					>
						{EVENT_DRAW_REVEAL_LABEL.start}
					</Button>
				</div>
			)}
			{(showShare || showReplay) && (
				<div className="flex shrink-0 flex-col gap-1 py-1">
					{shareError && <p className={ERROR_CLASS}>{shareError}</p>}
					<div className="flex gap-2">
						{showShare && (
							<Button
								variant={shareVariant}
								className="h-12 min-w-0 flex-1 text-sm sm:h-14 sm:text-base"
								disabled={isSharing}
								onClick={onShare}
							>
								{isSharing && (
									<LoaderCircle className="size-5 shrink-0 animate-spin" />
								)}
								{!isSharing && <Share2 className="size-5 shrink-0" />}
								<span className="truncate">{shareLabel}</span>
							</Button>
						)}
						{showReplay && (
							<Button
								variant={BUTTON_VARIANT.secondary}
								className="h-12 min-w-0 flex-1 text-sm sm:h-14 sm:text-base"
								onClick={onReplay}
							>
								<span className="truncate">
									{EVENT_DRAW_REVEAL_LABEL.replay}
								</span>
							</Button>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

function drawShareButtonVariant(isPrimary: boolean) {
	if (isPrimary) {
		return BUTTON_VARIANT.primary;
	}

	return BUTTON_VARIANT.secondary;
}

function drawShareButtonLabel(isSharing: boolean, compact: boolean) {
	if (isSharing) {
		return EVENT_TEAM_SHARE_LABEL.sharing;
	}

	if (compact) {
		return EVENT_DRAW_REVEAL_LABEL.shareShort;
	}

	return EVENT_TEAM_SHARE_LABEL.shareTeams;
}

type EventDrawWaitingProps = {
	championshipName: string;
	dateLabel: string;
	canDraw: boolean;
	copied: boolean;
	isDrawing: boolean;
	drawError: string | null;
	onCopyLink: () => void;
	onDraw: () => void;
};

export function EventDrawWaiting({
	championshipName,
	dateLabel,
	canDraw,
	copied,
	isDrawing,
	drawError,
	onCopyLink,
	onDraw,
}: EventDrawWaitingProps) {
	return (
		<div className="min-h-0 flex-1 overflow-y-auto">
			<EmptyState
				icon={<Shuffle className="size-10" />}
				title={EVENT_DRAW_REVEAL_LABEL.empty}
				description={`${championshipName} · ${dateLabel}. ${eventDrawRevealWaitingHint(canDraw)}`}
				action={
					<div className="flex w-full max-w-xs flex-col gap-2">
						{drawError && <p className={ERROR_CLASS}>{drawError}</p>}
						<Button
							variant={BUTTON_VARIANT.secondary}
							disabled={isDrawing}
							onClick={onCopyLink}
						>
							<Link2 className="size-4" />
							{copyDrawLinkLabel(copied)}
						</Button>
						{canDraw && (
							<Button disabled={isDrawing} onClick={onDraw}>
								<Shuffle className="size-4" />
								{EVENT_ACTION.drawTeams}
							</Button>
						)}
					</div>
				}
			/>
		</div>
	);
}
