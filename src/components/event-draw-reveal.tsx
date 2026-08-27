import { ChevronRight, Pause, Play } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/button";
import {
	EVENT_TEAM_PLAYER_SLOT_CLASS,
	EVENT_TEAM_POSITION_CHIP_CLASS,
	EventTeamColorDot,
	EventTeamPlayerRow,
	EventTeamRatingAverage,
} from "@/components/event-team-player";
import {
	EVENT_TEAM_POSITION_LABEL,
	eventTeamPlayerPosition,
	formatEventStartsAt,
} from "@/const/championship-event";
import { resolveRosterPlayer } from "@/const/championship-event-roster";
import {
	EVENT_DRAW_REVEAL_LABEL,
	EVENT_DRAW_REVEAL_MOTION,
	EVENT_DRAW_REVEAL_PHASE,
	type EventDrawRevealPhase,
	eventDrawRevealCanNext,
	eventDrawRevealCardKey,
	eventDrawRevealItemCount,
	eventDrawRevealShowControls,
	eventDrawRevealSlotIsGoalkeeper,
	eventDrawRevealVisibleCards,
} from "@/const/event-draw-reveal";
import { eventTeamColorStyle } from "@/const/event-team-color";
import type { EventTeamShareCard } from "@/const/event-team-share";
import { BUTTON_VARIANT } from "@/const/ui";
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
}: EventDrawRevealProps) {
	const reduceMotion = useReducedMotion();
	const when = formatEventStartsAt(startsAt);
	const visibleCards = eventDrawRevealVisibleCards(cards, visibleCount);
	const showStart = phase === EVENT_DRAW_REVEAL_PHASE.poster;
	const showReplay = phase === EVENT_DRAW_REVEAL_PHASE.done;
	const showControls = eventDrawRevealShowControls(
		phase,
		Boolean(reduceMotion),
	);
	const canNext = eventDrawRevealCanNext(
		visibleCount,
		eventDrawRevealItemCount(cards),
	);

	return (
		<div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4">
			<header className="text-center">
				<p className="text-sm font-medium text-fg-muted">{championshipName}</p>
				<p className="text-xs text-fg-muted">
					{when.date} · {when.time}
				</p>
				<h1 className="mt-2 text-2xl font-semibold tracking-tight text-fg">
					{EVENT_DRAW_REVEAL_LABEL.title}
				</h1>
			</header>
			{showStart && (
				<div className="mt-auto flex justify-center">
					<Button className="h-14 min-w-40 text-base" onClick={onStart}>
						{EVENT_DRAW_REVEAL_LABEL.start}
					</Button>
				</div>
			)}
			<ul className="grid grid-cols-1 gap-2">
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
								className="relative rounded-lg border border-line bg-surface p-2 text-sm"
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
				<div className="mt-auto flex flex-col gap-2 sm:flex-row sm:justify-center">
					{autoplay && (
						<Button
							variant={BUTTON_VARIANT.secondary}
							className="h-14 min-w-40 text-base"
							onClick={onPause}
						>
							<Pause className="size-5" />
							{EVENT_DRAW_REVEAL_LABEL.pause}
						</Button>
					)}
					{!autoplay && (
						<Button className="h-14 min-w-40 text-base" onClick={onPlay}>
							<Play className="size-5" />
							{EVENT_DRAW_REVEAL_LABEL.play}
						</Button>
					)}
					<Button
						variant={BUTTON_VARIANT.secondary}
						className="h-14 min-w-40 text-base"
						disabled={!canNext}
						onClick={onNext}
					>
						<ChevronRight className="size-5" />
						{EVENT_DRAW_REVEAL_LABEL.next}
					</Button>
				</div>
			)}
			{showReplay && (
				<div className="mt-auto flex justify-center">
					<Button
						variant={BUTTON_VARIANT.secondary}
						className="h-14 min-w-40 text-base"
						onClick={onReplay}
					>
						{EVENT_DRAW_REVEAL_LABEL.replay}
					</Button>
				</div>
			)}
		</div>
	);
}
