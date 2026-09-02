import {
	EVENT_TEAM_POSITION_LABEL,
	eventTeamPlayerPosition,
} from "@/const/championship-event";
import {
	EVENT_DRAW_REVEAL_LABEL,
	EVENT_DRAW_REVEAL_MOTION,
	type EventDrawRevealSlot,
	eventDrawRevealRoundRobinSlots,
	eventDrawRevealSlotIsGoalkeeper,
} from "@/const/event-draw-reveal";
import {
	eventTeamColorFg,
	eventTeamColorPastel,
} from "@/const/event-team-color";
import {
	type EventTeamShareCard,
	eventTeamShareAverageLabel,
} from "@/const/event-team-share";
import {
	PLAYER_RATING,
	PLAYER_STAR_PATH,
	PLAYER_STARS,
	ratingToStarFill,
} from "@/const/player-rating";
import {
	EVENT_DRAW_VIDEO_CONFIG,
	eventDrawOutroStartSec,
	eventDrawTotalPlayers,
} from "@/lib/event-draw-video-timeline";
import { loadAvatar } from "@/lib/load-avatar";

export { EVENT_DRAW_VIDEO_CONFIG };

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

/** Metricas do card, espelhando o layout da tela (p-1.5, gap-2, min-h-7). */
const LAYOUT = {
	padding: 12,
	gap: 8,
	headerBottom: 84,
	cardPad: 8,
	cardHeader: 22,
	rowHeight: 30,
	footerHeight: 20,
	outroBarHeight: 34,
} as const;

function easeOutCubic(t: number): number {
	return 1 - (1 - t) ** 3;
}

function clamp01(value: number): number {
	return Math.max(0, Math.min(1, value));
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
	while (t.length > 0 && ctx.measureText(`${t}…`).width > maxWidth) {
		t = t.slice(0, -1);
	}
	return t ? `${t}…` : "…";
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
	ctx.rect(x, y, fill * size, size);
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
	player: EventTeamShareCard["players"][number],
	ceiling: number,
	avatars: ReadonlyMap<string, HTMLImageElement>,
	progress: number,
) {
	const eased = easeOutCubic(clamp01(progress));

	ctx.save();
	ctx.globalAlpha = clamp01(progress);
	ctx.translate(0, (1 - eased) * EVENT_DRAW_REVEAL_MOTION.y);

	const innerY = y + 3;
	const innerH = LAYOUT.rowHeight - 6;

	ctx.fillStyle = VIDEO_COLOR.surfaceMuted;
	ctx.beginPath();
	ctx.roundRect(x, innerY, width, innerH, 6);
	ctx.fill();

	const midY = innerY + innerH / 2;
	const padX = 6;

	const position = eventTeamPlayerPosition(
		eventDrawRevealSlotIsGoalkeeper(player.number),
	);
	const chipLabel = EVENT_TEAM_POSITION_LABEL[position];
	const chipX = x + padX;
	const chipW = 26;

	ctx.fillStyle = VIDEO_COLOR.surface;
	ctx.beginPath();
	ctx.roundRect(chipX, midY - 9, chipW, 18, 4);
	ctx.fill();
	ctx.fillStyle = VIDEO_COLOR.fgMuted;
	ctx.font = "500 10px system-ui, sans-serif";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(chipLabel, chipX + chipW / 2, midY);

	const avatarSize = 22;
	const avatarX = chipX + chipW + 6;
	drawAvatar(
		ctx,
		avatarX,
		midY - avatarSize / 2,
		avatarSize,
		player.name,
		player.avatarUrl ? avatars.get(player.avatarUrl) : undefined,
	);

	const starSize = 12;
	const starsWidth = starSize * PLAYER_RATING.starCount;
	const rightX = x + width - padX;
	const starsX = rightX - starsWidth;

	drawStars(ctx, starsX, midY - starSize / 2, starSize, player.rating, ceiling);

	const nameX = avatarX + avatarSize + 6;
	const nameMaxW = Math.max(0, starsX - 6 - nameX);
	ctx.fillStyle = VIDEO_COLOR.fg;
	ctx.font = "500 12px system-ui, sans-serif";
	ctx.textAlign = "start";
	ctx.textBaseline = "middle";
	ctx.fillText(fitText(ctx, player.name, nameMaxW), nameX, midY);

	ctx.textAlign = "start";
	ctx.textBaseline = "alphabetic";
	ctx.restore();
}

function cardHeight(revealedCount: number): number {
	return (
		LAYOUT.cardPad * 2 +
		LAYOUT.cardHeader +
		revealedCount * LAYOUT.rowHeight +
		LAYOUT.footerHeight
	);
}

type CardRender = {
	card: EventTeamShareCard;
	revealed: number;
	/** progresso de entrada 0..1 de cada linha revelada */
	rowProgress: number[];
	cardProgress: number;
};

function drawCard(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	entry: CardRender,
	ceiling: number,
	avatars: ReadonlyMap<string, HTMLImageElement>,
) {
	const { card, revealed, rowProgress, cardProgress } = entry;
	const height = cardHeight(revealed);
	const eased = easeOutCubic(clamp01(cardProgress));

	ctx.save();
	ctx.globalAlpha = clamp01(cardProgress);
	ctx.translate(0, (1 - eased) * EVENT_DRAW_REVEAL_MOTION.y);

	const bg = card.color
		? eventTeamColorPastel(card.color)
		: VIDEO_COLOR.surface;
	const fg = card.color ? eventTeamColorFg(bg) : VIDEO_COLOR.fg;

	ctx.fillStyle = bg;
	ctx.strokeStyle = VIDEO_COLOR.line;
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.roundRect(x, y, width, height, 8);
	ctx.fill();
	ctx.stroke();

	if (card.color) {
		ctx.fillStyle = card.color;
		ctx.strokeStyle = "rgba(0,0,0,0.25)";
		ctx.beginPath();
		ctx.arc(x + width - 14, y + 14, 6, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
	}

	ctx.fillStyle = fg;
	ctx.font = "500 12px system-ui, sans-serif";
	ctx.textAlign = "start";
	ctx.textBaseline = "middle";
	ctx.fillText(
		fitText(ctx, card.title, width - LAYOUT.cardPad * 2 - 20),
		x + LAYOUT.cardPad,
		y + LAYOUT.cardPad + 8,
	);
	ctx.textBaseline = "alphabetic";

	const rowWidth = width - LAYOUT.cardPad * 2;
	const rowsStart = y + LAYOUT.cardPad + LAYOUT.cardHeader;

	for (let i = 0; i < revealed; i++) {
		const player = card.players[i];
		if (!player) continue;
		drawPlayerRow(
			ctx,
			x + LAYOUT.cardPad,
			rowsStart + i * LAYOUT.rowHeight,
			rowWidth,
			player,
			ceiling,
			avatars,
			rowProgress[i] ?? 1,
		);
	}

	const label = eventTeamShareAverageLabel(
		card.players.slice(0, revealed).map((p) => p.rating),
	);
	if (label) {
		const average = label.split(" ").at(-1) ?? label;
		ctx.fillStyle = fg;
		ctx.font = "500 11px system-ui, sans-serif";
		ctx.textAlign = "end";
		ctx.textBaseline = "middle";
		ctx.fillText(
			average,
			x + width - LAYOUT.cardPad,
			y + height - LAYOUT.cardPad - 4,
		);
		ctx.textAlign = "start";
		ctx.textBaseline = "alphabetic";
	}

	ctx.restore();
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

export async function prepareEventDrawAvatars(
	data: EventDrawRenderData,
): Promise<ReadonlyMap<string, HTMLImageElement>> {
	return loadAvatars(data.cards);
}

/**
 * Estado de revelacao no instante `progressSec`, na mesma ordem round-robin
 * usada pela tela (um jogador por time, por rodada).
 */
function computeCardRenders(
	cards: readonly EventTeamShareCard[],
	progressSec: number,
): CardRender[] {
	const { introDurationSec, playerRevealSec } = EVENT_DRAW_VIDEO_CONFIG;
	const slots: readonly EventDrawRevealSlot[] =
		eventDrawRevealRoundRobinSlots(cards);

	const entries: CardRender[] = cards.map((card) => ({
		card,
		revealed: 0,
		rowProgress: [],
		cardProgress: 0,
	}));

	slots.forEach((slot, index) => {
		const startSec = introDurationSec + index * playerRevealSec;
		const progress = clamp01(
			(progressSec - startSec) / EVENT_DRAW_REVEAL_MOTION.duration,
		);
		if (progressSec < startSec) {
			return;
		}

		const entry = entries[slot.teamIndex];
		if (!entry) {
			return;
		}

		entry.revealed = Math.max(entry.revealed, slot.playerIndex + 1);
		entry.rowProgress[slot.playerIndex] = progress;
		entry.cardProgress = entry.cardProgress === 0 ? progress : 1;
	});

	return entries;
}

function drawHeader(
	ctx: CanvasRenderingContext2D,
	data: EventDrawRenderData,
	width: number,
) {
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	ctx.fillStyle = VIDEO_COLOR.fgMuted;
	ctx.font = "500 13px system-ui, sans-serif";
	ctx.fillText(data.championshipName, width / 2, 22);

	ctx.font = "400 11px system-ui, sans-serif";
	ctx.fillText(data.eventDateLabel, width / 2, 40);

	ctx.fillStyle = VIDEO_COLOR.fg;
	ctx.font = "600 20px system-ui, sans-serif";
	ctx.fillText(EVENT_DRAW_REVEAL_LABEL.title, width / 2, 64);

	ctx.textAlign = "start";
	ctx.textBaseline = "alphabetic";
}

function drawBackground(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
) {
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
	gradient.addColorStop(1, "rgba(236,253,245,0)");
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, width, height);
}

function drawIntro(
	ctx: CanvasRenderingContext2D,
	data: EventDrawRenderData,
	progressSec: number,
	width: number,
	height: number,
) {
	const { introDurationSec } = EVENT_DRAW_VIDEO_CONFIG;
	const totalPlayers = eventDrawTotalPlayers(data.cards);
	const introP = progressSec / introDurationSec;
	const opacity = Math.min(1, introP * 2);
	const rise = (1 - easeOutCubic(Math.min(1, introP * 1.6))) * 18;

	ctx.save();
	ctx.globalAlpha = opacity;
	ctx.translate(0, rise);
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	ctx.fillStyle = VIDEO_COLOR.fg;
	ctx.font = "700 26px system-ui, sans-serif";
	ctx.fillText(
		fitText(ctx, data.championshipName, width - 48),
		width / 2,
		height / 2 - 50,
	);

	ctx.fillStyle = VIDEO_COLOR.fgMuted;
	ctx.font = "400 15px system-ui, sans-serif";
	ctx.fillText(data.eventDateLabel, width / 2, height / 2 - 18);

	ctx.fillStyle = VIDEO_COLOR.fg;
	ctx.font = "600 20px system-ui, sans-serif";
	ctx.fillText(EVENT_DRAW_REVEAL_LABEL.title, width / 2, height / 2 + 20);

	ctx.fillStyle = VIDEO_COLOR.fgSubtle;
	ctx.font = "400 12px system-ui, sans-serif";
	ctx.fillText(
		`${totalPlayers} jogadores · ${data.cards.length} times`,
		width / 2,
		height / 2 + 50,
	);

	ctx.restore();
	ctx.textAlign = "start";
	ctx.textBaseline = "alphabetic";
}

function drawOutroBar(
	ctx: CanvasRenderingContext2D,
	data: EventDrawRenderData,
	progressSec: number,
	width: number,
	height: number,
) {
	const outroStart = eventDrawOutroStartSec(data.cards);
	if (progressSec < outroStart) {
		return;
	}

	const opacity = Math.min(1, (progressSec - outroStart) / 0.4);

	ctx.save();
	ctx.globalAlpha = opacity;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	ctx.fillStyle = VIDEO_COLOR.accent;
	ctx.font = "600 14px system-ui, sans-serif";
	ctx.fillText("✓ Sorteio concluído e auditado", width / 2, height - 30);

	ctx.fillStyle = VIDEO_COLOR.fgSubtle;
	ctx.font = "400 10px system-ui, sans-serif";
	ctx.fillText(
		`seed ${data.seed} · v${data.algorithmVersion} · ${data.inputHash.slice(0, 12)}`,
		width / 2,
		height - 14,
	);

	ctx.restore();
	ctx.textAlign = "start";
	ctx.textBaseline = "alphabetic";
}

/**
 * Escala do grid para que os cards completos caibam sempre na tela,
 * evitando que o video corte jogadores quando o time e grande.
 */
function gridScale(
	cards: readonly EventTeamShareCard[],
	height: number,
): number {
	const columns = cards.length <= 1 ? 1 : 2;
	const rowCount = Math.ceil(cards.length / columns);
	const rowHeights = Array.from({ length: rowCount }, (_, row) => {
		const slice = cards.slice(row * columns, row * columns + columns);
		return Math.max(...slice.map((card) => cardHeight(card.players.length)));
	});
	const content =
		rowHeights.reduce((sum, h) => sum + h, 0) +
		Math.max(0, rowHeights.length - 1) * LAYOUT.gap;
	const available =
		height - LAYOUT.headerBottom - LAYOUT.outroBarHeight - LAYOUT.padding;

	if (content <= available) {
		return 1;
	}

	return available / content;
}

export function renderEventDrawFrame(
	ctx: CanvasRenderingContext2D,
	data: EventDrawRenderData,
	progressSec: number,
	avatars: ReadonlyMap<string, HTMLImageElement>,
): void {
	const { width, height, introDurationSec } = EVENT_DRAW_VIDEO_CONFIG;

	drawBackground(ctx, width, height);

	if (progressSec < introDurationSec) {
		drawIntro(ctx, data, progressSec, width, height);
		return;
	}

	drawHeader(ctx, data, width);

	const entries = computeCardRenders(data.cards, progressSec);
	const columns = data.cards.length <= 1 ? 1 : 2;
	const cardWidth =
		columns === 1
			? width - LAYOUT.padding * 2
			: (width - LAYOUT.padding * 2 - LAYOUT.gap) / 2;
	const scale = gridScale(data.cards, height);

	ctx.save();
	ctx.translate(width / 2, LAYOUT.headerBottom);
	ctx.scale(scale, scale);
	ctx.translate(-width / 2, 0);

	let top = 0;
	const rowCount = Math.ceil(entries.length / columns);

	for (let row = 0; row < rowCount; row++) {
		const start = row * columns;
		const rowEntries = entries.slice(start, start + columns);

		for (const [col, entry] of rowEntries.entries()) {
			if (entry.revealed === 0) {
				continue;
			}
			drawCard(
				ctx,
				LAYOUT.padding + col * (cardWidth + LAYOUT.gap),
				top,
				cardWidth,
				entry,
				data.ceiling,
				avatars,
			);
		}

		// A altura da linha acompanha o card final, para o grid nao "pular"
		// a cada revelacao (mesma sensacao da tela, que ja reserva o espaco).
		const rowMax = Math.max(
			...rowEntries.map((entry) => cardHeight(entry.card.players.length)),
			0,
		);
		top += rowMax + LAYOUT.gap;
	}

	ctx.restore();

	drawOutroBar(ctx, data, progressSec, width, height);
}
