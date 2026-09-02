import { formatEventRating } from "@/const/event-rating-adjustment";
import {
	EVENT_DRAW_REVEAL_MOTION,
	eventDrawRevealRoundRobinSlots,
	type EventDrawRevealSlot,
} from "@/const/event-draw-reveal";
import {
	eventTeamColorFg,
	eventTeamColorPastel,
} from "@/const/event-team-color";
import {
	EVENT_TEAM_SHARE,
	type EventTeamShareCard,
	eventTeamShareAverageLabel,
} from "@/const/event-team-share";
import {
	PLAYER_RATING,
	PLAYER_STAR_PATH,
	PLAYER_STARS,
	ratingToStarFill,
} from "@/const/player-rating";
import { loadAvatar } from "@/lib/load-avatar";

export const EVENT_DRAW_VIDEO_CONFIG = {
	width: 540,
	height: 960,
	fps: 30,
	introDurationSec: 2,
	playerRevealSec: 1.5,
	outroDurationSec: 5,
} as const;

export type EventDrawRenderData = {
	championshipName: string;
	eventDateLabel: string;
	algorithmVersion: number;
	seed: number;
	inputHash: string;
	cards: readonly EventTeamShareCard[];
	ceiling: number;
};

const STAR_VIEWBOX = 24;

const VIDEO_COLOR = {
	field: "#fafaf9",
	pitchSoft: "#ecfdf5",
	surface: "#ffffff",
	surfaceMuted: "#f5f5f4",
	fg: "#1c1917",
	fgMuted: "#57534e",
	fgSubtle: "#a8a29e",
	line: "#e7e5e4",
	starEmpty: "#a8a29e",
	starFill: "#fbbf24",
	avatar: "#e7e5e4",
	accent: "#166534",
} as const;

function easeOutCubic(t: number): number {
	return 1 - (1 - t) ** 3;
}

function fitText(
	ctx: CanvasRenderingContext2D,
	text: string,
	maxWidth: number,
): string {
	if (ctx.measureText(text).width <= maxWidth) {
		return text;
	}
	let t = text;
	while (t.length > 0 && ctx.measureText(`${t}\u2026`).width > maxWidth) {
		t = t.slice(0, -1);
	}
	return t ? `${t}\u2026` : "\u2026";
}

function drawStars(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	size: number,
	rating: number,
	ceiling: number,
) {
	const fill = ratingToStarFill(rating, ceiling);
	const path = new Path2D(PLAYER_STAR_PATH);
	const scale = size / STAR_VIEWBOX;

	function paint(color: string) {
		ctx.fillStyle = color;
		for (const star of PLAYER_STARS) {
			ctx.save();
			ctx.translate(x + star.index * size, y);
			ctx.scale(scale, scale);
			ctx.fill(path);
			ctx.restore();
		}
	}

	paint(VIDEO_COLOR.starEmpty);
	ctx.save();
	ctx.beginPath();
	ctx.rect(
		x,
		y,
		(fill / PLAYER_RATING.starCount) * size * PLAYER_RATING.starCount,
		size,
	);
	ctx.clip();
	paint(VIDEO_COLOR.starFill);
	ctx.restore();
}

function drawAvatar(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	size: number,
	name: string,
	image: HTMLImageElement | undefined,
) {
	const r = size / 2;
	const cx = x + r;
	const cy = y + r;

	ctx.save();
	ctx.beginPath();
	ctx.arc(cx, cy, r, 0, Math.PI * 2);
	ctx.closePath();
	ctx.clip();

	if (image) {
		ctx.drawImage(image, x, y, size, size);
		ctx.restore();
		return;
	}

	ctx.fillStyle = VIDEO_COLOR.avatar;
	ctx.fill();
	ctx.restore();

	ctx.fillStyle = VIDEO_COLOR.fgMuted;
	ctx.font = `600 ${Math.round(size * 0.42)}px system-ui, sans-serif`;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(name.charAt(0).toUpperCase() || "?", cx, cy);
	ctx.textAlign = "start";
	ctx.textBaseline = "alphabetic";
}

function drawPlayerRow(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	rowHeight: number,
	player: EventTeamShareCard["players"][number],
	ceiling: number,
	avatars: ReadonlyMap<string, HTMLImageElement>,
	opacity: number,
	offsetY: number,
) {
	ctx.save();
	ctx.globalAlpha = opacity;
	ctx.translate(0, offsetY);

	const innerY = y + 3;
	const innerH = rowHeight - 6;

	ctx.fillStyle = VIDEO_COLOR.surfaceMuted;
	ctx.beginPath();
	ctx.roundRect(x, innerY, width, innerH, 6);
	ctx.fill();

	const midY = innerY + innerH / 2;
	const padX = 6;

	const positionChip = player.number === 1 ? "GK" : "JOG";
	ctx.fillStyle = VIDEO_COLOR.surface;
	ctx.beginPath();
	ctx.roundRect(padX, midY - 9, 28, 18, 4);
	ctx.fill();
	ctx.fillStyle = VIDEO_COLOR.fgMuted;
	ctx.font = "600 10px system-ui, sans-serif";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(positionChip, padX + 14, midY);

	const avatarX = padX + 28 + 6;
	const avatarSize = 22;
	drawAvatar(
		ctx,
		avatarX,
		midY - avatarSize / 2,
		avatarSize,
		player.name,
		player.avatarUrl ? avatars.get(player.avatarUrl) : undefined,
	);

	const starSize = 13;
	const starsWidth = starSize * PLAYER_RATING.starCount;
	const ratingW = 32;
	const rightX = x + width - padX;
	const starsX = rightX - ratingW - 6 - starsWidth;

	drawStars(ctx, starsX, midY - starSize / 2, starSize, player.rating, ceiling);

	ctx.fillStyle = VIDEO_COLOR.fg;
	ctx.font = "600 11px system-ui, sans-serif";
	ctx.textAlign = "end";
	ctx.textBaseline = "middle";
	ctx.fillText(formatEventRating(player.rating), rightX, midY);

	const nameX = avatarX + avatarSize + 6;
	const nameMaxW = Math.max(0, starsX - 6 - nameX);
	ctx.fillStyle = VIDEO_COLOR.fg;
	ctx.font = "600 12px system-ui, sans-serif";
	ctx.textAlign = "start";
	ctx.textBaseline = "middle";
	ctx.fillText(fitText(ctx, player.name, nameMaxW), nameX, midY);
	ctx.textBaseline = "alphabetic";

	ctx.restore();
}

function drawCard(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	card: EventTeamShareCard,
	cardIndex: number,
	ceiling: number,
	avatars: ReadonlyMap<string, HTMLImageElement>,
	visibleSlots: readonly EventDrawRevealSlot[],
	revealProgress: ReadonlyMap<string, number>,
) {
	const bg = card.color
		? eventTeamColorPastel(card.color)
		: VIDEO_COLOR.surface;
	const titleColor = card.color
		? eventTeamColorFg(bg)
		: VIDEO_COLOR.fg;

	ctx.fillStyle = bg;
	ctx.strokeStyle = VIDEO_COLOR.line;
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.roundRect(x, y, width, height, 8);
	ctx.fill();
	ctx.stroke();

	if (card.color) {
		ctx.fillStyle = card.color;
		ctx.beginPath();
		ctx.arc(x + width - 12, y + 12, 5, 0, Math.PI * 2);
		ctx.fill();
	}

	ctx.fillStyle = titleColor;
	ctx.font = "700 12px system-ui, sans-serif";
	ctx.textAlign = "start";
	ctx.textBaseline = "middle";
	ctx.fillText(
		fitText(ctx, card.title, width - 28),
		x + 8,
		y + 12,
	);
	ctx.textBaseline = "alphabetic";

	const rowWidth = width - 16;
	const rowsStart = y + 26;
	const rowHeight = 30;

	for (let i = 0; i < card.players.length; i++) {
		const player = card.players[i];
		if (!player) continue;

		const slotKey = `${card.title}:${i}`;
		const slot = visibleSlots.find(
			(s) => s.teamIndex === cardIndex && s.playerIndex === i,
		);
		const isVisible = Boolean(slot);

		if (isVisible) {
			const progress = revealProgress[slotKey] ?? 1;
			drawPlayerRow(
				ctx,
				x + 8,
				rowsStart + i * rowHeight,
				rowWidth,
				rowHeight,
				player,
				ceiling,
				avatars,
				Math.min(1, progress),
				(1 - easeOutCubic(Math.min(1, progress))) * EVENT_DRAW_REVEAL_MOTION.y,
			);
		} else {
			ctx.fillStyle = VIDEO_COLOR.surfaceMuted;
			ctx.beginPath();
			ctx.roundRect(
				x + 8,
				rowsStart + i * rowHeight + 3,
				rowWidth,
				rowHeight - 6,
				6,
			);
			ctx.fill();
		}
	}

	const visibleCount = visibleSlots.filter(
		(s) => s.playerIndex < card.players.length,
	).length;
	if (visibleCount >= card.players.length && card.players.length > 0) {
		const label = eventTeamShareAverageLabel(
			card.players.map((p) => p.rating),
		);
		if (label) {
			ctx.fillStyle = titleColor;
			ctx.font = "600 11px system-ui, sans-serif";
			ctx.textAlign = "end";
			ctx.textBaseline = "middle";
			ctx.fillText(label, x + width - 8, y + height - 10);
			ctx.textAlign = "start";
			ctx.textBaseline = "alphabetic";
		}
	}
}

// Removida findCardIndex desnecessária
function findCardIndex(
	_card: EventTeamShareCard,
	_title: string,
): number {
	return 0;
}

async function loadAvatars(
	cards: readonly EventTeamShareCard[],
): Promise<ReadonlyMap<string, HTMLImageElement>> {
	const urls = [
		...new Set(
			cards.flatMap((card) =>
				card.players
					.map((p) => p.avatarUrl)
					.filter((url): url is string => Boolean(url)),
			),
		),
	];
	const loaded = await Promise.all(
		urls.map(async (url) => {
			const image = await loadAvatar(url);
			if (!image) return null;
			return [url, image] as const;
		}),
	);
	return new Map(
		loaded.filter((e): e is [string, HTMLImageElement] => e !== null),
	);
}

function computeVisibleSlots(
	cards: readonly EventTeamShareCard[],
	visibleCount: number,
): EventDrawRevealSlot[] {
	return eventDrawRevealRoundRobinSlots(cards).slice(
		0,
		Math.max(0, visibleCount),
	);
}

function computeRevealProgress(
	cards: readonly EventTeamShareCard[],
	visibleSlots: readonly EventDrawRevealSlot[],
	progressSec: number,
): Map<string, number> {
	const { introDurationSec, playerRevealSec, fps } = EVENT_DRAW_VIDEO_CONFIG;
	const progress = new Map<string, number>();

	for (let i = 0; i < visibleSlots.length; i++) {
		const slot = visibleSlots[i];
		if (!slot) continue;

		const card = cards[slot.teamIndex];
		if (!card) continue;
		const player = card.players[slot.playerIndex];
		if (!player) continue;

		const slotKey = `${card.title}:${slot.playerIndex}`;
		const revealStartSec =
			introDurationSec + i * playerRevealSec;
		const elapsed = progressSec - revealStartSec;
		const animDuration = EVENT_DRAW_REVEAL_MOTION.duration;
		const p = Math.max(0, Math.min(1, elapsed / animDuration));
		progress.set(slotKey, p);
	}

	return progress;
}

export async function prepareEventDrawAvatars(
	data: EventDrawRenderData,
): Promise<ReadonlyMap<string, HTMLImageElement>> {
	return loadAvatars(data.cards);
}

export function renderEventDrawFrame(
	ctx: CanvasRenderingContext2D,
	data: EventDrawRenderData,
	progressSec: number,
	avatars: ReadonlyMap<string, HTMLImageElement>,
): void {
	const { width, height, introDurationSec, playerRevealSec, outroDurationSec } =
		EVENT_DRAW_VIDEO_CONFIG;
	const totalPlayers = data.cards.reduce(
		(acc, c) => acc + c.players.length,
		0,
	);
	const totalRevealSec = totalPlayers * playerRevealSec;

	// Background (mesmo estilo do body: field com radial gradient pitch-soft)
	ctx.fillStyle = VIDEO_COLOR.field;
	ctx.fillRect(0, 0, width, height);

	const gradient = ctx.createRadialGradient(
		width / 2,
		-height * 0.2,
		0,
		width / 2,
		-height * 0.2,
		height * 0.8,
	);
	gradient.addColorStop(0, VIDEO_COLOR.pitchSoft);
	gradient.addColorStop(1, "transparent");
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, width, height);

	// Intro
	if (progressSec < introDurationSec) {
		const introP = progressSec / introDurationSec;
		const opacity = Math.min(1, introP * 2);

		ctx.save();
		ctx.globalAlpha = opacity;
		ctx.fillStyle = VIDEO_COLOR.fg;
		ctx.font = "700 26px system-ui, sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(data.championshipName, width / 2, height / 2 - 50);

		ctx.fillStyle = VIDEO_COLOR.fgMuted;
		ctx.font = "400 15px system-ui, sans-serif";
		ctx.fillText(data.eventDateLabel, width / 2, height / 2 - 18);

		ctx.fillStyle = VIDEO_COLOR.fg;
		ctx.font = "600 20px system-ui, sans-serif";
		ctx.fillText("Sorteio dos times", width / 2, height / 2 + 20);

		ctx.fillStyle = VIDEO_COLOR.fgSubtle;
		ctx.font = "400 12px system-ui, sans-serif";
		ctx.fillText(
			`${totalPlayers} jogadores \u00b7 ${data.cards.length} times`,
			width / 2,
			height / 2 + 50,
		);

		ctx.fillStyle = VIDEO_COLOR.accent;
		ctx.font = "600 11px system-ui, sans-serif";
		ctx.fillText("Sorteio auditavel", width / 2, height / 2 + 78);

		ctx.restore();
		ctx.textAlign = "start";
		ctx.textBaseline = "alphabetic";
		return;
	}

	// Header (igual ao componente real)
	ctx.fillStyle = VIDEO_COLOR.fgMuted;
	ctx.font = "500 13px system-ui, sans-serif";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(data.championshipName, width / 2, 24);

	ctx.fillStyle = VIDEO_COLOR.fgMuted;
	ctx.font = "400 11px system-ui, sans-serif";
	ctx.fillText(data.eventDateLabel, width / 2, 42);

	ctx.fillStyle = VIDEO_COLOR.fg;
	ctx.font = "600 18px system-ui, sans-serif";
	ctx.fillText("Sorteio dos times", width / 2, 64);
	ctx.textAlign = "start";
	ctx.textBaseline = "alphabetic";

	// Cards
	const isOutro =
		progressSec > introDurationSec + totalRevealSec;
	const visibleCount = isOutro
		? totalPlayers
		: Math.floor(
				(progressSec - introDurationSec) / playerRevealSec,
			);

	const visibleSlots = computeVisibleSlots(data.cards, visibleCount);
	const revealProgress = computeRevealProgress(
		data.cards,
		visibleSlots,
		progressSec,
	);

	const padding = 12;
	const gap = 8;
	const columns = data.cards.length <= 1 ? 1 : 2;
	const cardWidth =
		columns === 1
			? width - padding * 2
			: (width - padding * 2 - gap) / 2;

	const rowHeight = 30;
	const cardInnerPad = 8;
	const cardHeaderH = 26;
	const cardFooterH = 20;

	const cardHeights = data.cards.map((card) => {
		const players = card.players.length;
		return (
			cardInnerPad * 2 +
			cardHeaderH +
			players * rowHeight +
			cardFooterH
		);
	});

	const rowCount = Math.ceil(data.cards.length / columns);
	const startY = 84;
	let top = startY;

	for (let row = 0; row < rowCount; row++) {
		const start = row * columns;
		const rowCards = data.cards.slice(start, start + columns);
		const rowHeightMax = Math.max(
			...rowCards.map((_, i) => cardHeights[start + i] ?? 100),
		);

		for (const [col, card] of rowCards.entries()) {
			const cardIdx = start + col;
			const ch = cardHeights[cardIdx] ?? 100;
			const cardVisibleSlots = visibleSlots.filter(
				(s) => s.teamIndex === cardIdx,
			);

			drawCard(
				ctx,
				padding + col * (cardWidth + gap),
				top,
				cardWidth,
				ch,
				card,
				cardIdx,
				data.ceiling,
				avatars,
				cardVisibleSlots,
				revealProgress,
			);
		}
		top += rowHeightMax + gap;
	}

	// Outro
	if (isOutro) {
		const outroElapsed =
			progressSec - introDurationSec - totalRevealSec;
		const outroOpacity = Math.min(1, outroElapsed / 0.5);

		ctx.save();
		ctx.globalAlpha = outroOpacity;
		ctx.fillStyle = VIDEO_COLOR.accent;
		ctx.font = "700 15px system-ui, sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(
			"\u2713 Sorteio concluido e auditado",
			width / 2,
			height - 24,
		);
		ctx.restore();
		ctx.textAlign = "start";
		ctx.textBaseline = "alphabetic";
	}
}
