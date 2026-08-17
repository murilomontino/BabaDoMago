import {
	eventTeamColorFg,
	eventTeamColorPastel,
} from "@/const/event-team-color";
import {
	EVENT_TEAM_SHARE,
	EVENT_TEAM_SHARE_COLOR,
	EVENT_TEAM_SHARE_LABEL,
	type EventTeamShareCard,
	eventTeamShareCardHeight,
	eventTeamShareCardWidth,
	eventTeamShareFileName,
	eventTeamShareImageHeight,
	eventTeamsShareText,
} from "@/const/event-team-share";
import {
	PLAYER_RATING,
	PLAYER_STAR_PATH,
	PLAYER_STARS,
	ratingToStarFill,
} from "@/const/player-rating";
import { shareOrDownload } from "@/lib/share-file";

const SHARE_SCALE = 2;
const STAR_VIEWBOX = 24;
const ROW_GAP = 8;
const TEXT_GAP = 10;
const NUMBER_WIDTH = 36;
const CORNER = 12;
const ROW_CORNER = 8;

function avatarUrlsToLoad(url: string | null | undefined): string[] {
	if (!url) {
		return [];
	}

	return [url];
}

function avatarFromLoaded(
	url: string | null | undefined,
	avatars: ReadonlyMap<string, HTMLImageElement>,
): HTMLImageElement | undefined {
	if (!url) {
		return undefined;
	}

	return avatars.get(url);
}

function loadAvatar(src: string): Promise<HTMLImageElement | null> {
	return new Promise((resolve) => {
		const image = new Image();
		image.crossOrigin = "anonymous";
		image.referrerPolicy = "no-referrer";
		image.addEventListener("load", () => resolve(image));
		image.addEventListener("error", () => resolve(null));
		image.src = src;
	});
}

async function loadAvatars(
	cards: readonly EventTeamShareCard[],
): Promise<ReadonlyMap<string, HTMLImageElement>> {
	const urls = [
		...new Set(
			cards.flatMap((card) =>
				card.players.flatMap((player) => avatarUrlsToLoad(player.avatarUrl)),
			),
		),
	];
	const loaded = await Promise.all(
		urls.map(async (url) => {
			const image = await loadAvatar(url);
			if (!image) {
				return null;
			}

			return [url, image] as const;
		}),
	);

	return new Map(loaded.filter((entry) => entry !== null));
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
	return new Promise((resolve, reject) => {
		try {
			canvas.toBlob((blob) => {
				if (!blob) {
					reject(new Error(EVENT_TEAM_SHARE_LABEL.shareFailed));
					return;
				}

				resolve(blob);
			}, EVENT_TEAM_SHARE.mimePng);
		} catch {
			reject(new Error(EVENT_TEAM_SHARE_LABEL.shareFailed));
		}
	});
}

function fitText(
	context: CanvasRenderingContext2D,
	text: string,
	maxWidth: number,
): string {
	if (context.measureText(text).width <= maxWidth) {
		return text;
	}

	let truncated = text;
	while (
		truncated.length > 0 &&
		context.measureText(`${truncated}…`).width > maxWidth
	) {
		truncated = truncated.slice(0, -1);
	}

	if (!truncated) {
		return "…";
	}

	return `${truncated}…`;
}

function drawStars(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	rating: number,
	ceiling: number,
) {
	const size = EVENT_TEAM_SHARE.star;
	const fill = ratingToStarFill(rating, ceiling);
	const path = new Path2D(PLAYER_STAR_PATH);
	const scale = size / STAR_VIEWBOX;

	function paint(color: string) {
		context.fillStyle = color;
		for (const star of PLAYER_STARS) {
			context.save();
			context.translate(x + star.index * size, y);
			context.scale(scale, scale);
			context.fill(path);
			context.restore();
		}
	}

	paint(EVENT_TEAM_SHARE_COLOR.starEmpty);
	context.save();
	context.beginPath();
	context.rect(
		x,
		y,
		(fill / PLAYER_RATING.starCount) * size * PLAYER_RATING.starCount,
		size,
	);
	context.clip();
	paint(EVENT_TEAM_SHARE_COLOR.starFill);
	context.restore();
}

function drawAvatar(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	name: string,
	image: HTMLImageElement | undefined,
) {
	const size = EVENT_TEAM_SHARE.avatar;
	const radius = size / 2;
	const cx = x + radius;
	const cy = y + radius;

	context.save();
	context.beginPath();
	context.arc(cx, cy, radius, 0, Math.PI * 2);
	context.closePath();
	context.clip();

	if (image) {
		context.drawImage(image, x, y, size, size);
		context.restore();
		return;
	}

	context.fillStyle = EVENT_TEAM_SHARE_COLOR.avatar;
	context.fill();
	context.restore();
	context.fillStyle = EVENT_TEAM_SHARE_COLOR.fgMuted;
	context.font = "600 20px system-ui, sans-serif";
	context.textAlign = "center";
	context.textBaseline = "middle";
	context.fillText(name.charAt(0).toUpperCase() || "?", cx, cy);
	context.textAlign = "start";
	context.textBaseline = "alphabetic";
}

function drawPlayerRow(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	player: EventTeamShareCard["players"][number],
	ceiling: number,
	avatars: ReadonlyMap<string, HTMLImageElement>,
) {
	const height = EVENT_TEAM_SHARE.rowHeight - ROW_GAP;
	const innerY = y + ROW_GAP / 2;

	context.fillStyle = EVENT_TEAM_SHARE_COLOR.surface;
	context.beginPath();
	context.roundRect(x, innerY, width, height, ROW_CORNER);
	context.fill();

	const midY = innerY + height / 2;
	const contentX = x + EVENT_TEAM_SHARE.cardPadding;
	context.fillStyle = EVENT_TEAM_SHARE_COLOR.fgMuted;
	context.font = "600 20px system-ui, sans-serif";
	context.textAlign = "center";
	context.textBaseline = "middle";
	context.fillText(String(player.number), contentX + NUMBER_WIDTH / 2, midY);

	const avatarX = contentX + NUMBER_WIDTH;
	const avatarY = midY - EVENT_TEAM_SHARE.avatar / 2;
	const avatar = avatarFromLoaded(player.avatarUrl, avatars);
	drawAvatar(context, avatarX, avatarY, player.name, avatar);

	const starsWidth = EVENT_TEAM_SHARE.star * PLAYER_RATING.starCount;
	const starsX = x + width - EVENT_TEAM_SHARE.cardPadding - starsWidth;
	drawStars(
		context,
		starsX,
		midY - EVENT_TEAM_SHARE.star / 2,
		player.rating,
		ceiling,
	);

	const nameX = avatarX + EVENT_TEAM_SHARE.avatar + TEXT_GAP;
	const nameMaxWidth = Math.max(0, starsX - TEXT_GAP - nameX);
	context.fillStyle = EVENT_TEAM_SHARE_COLOR.fg;
	context.font = "600 22px system-ui, sans-serif";
	context.textAlign = "start";
	context.textBaseline = "middle";
	context.fillText(fitText(context, player.name, nameMaxWidth), nameX, midY);
	context.textBaseline = "alphabetic";
}

function drawCard(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	card: EventTeamShareCard,
	ceiling: number,
	avatars: ReadonlyMap<string, HTMLImageElement>,
) {
	const background = card.color
		? eventTeamColorPastel(card.color)
		: EVENT_TEAM_SHARE_COLOR.surface;
	const titleColor = card.color
		? eventTeamColorFg(background)
		: EVENT_TEAM_SHARE_COLOR.fg;

	context.fillStyle = background;
	context.strokeStyle = EVENT_TEAM_SHARE_COLOR.line;
	context.lineWidth = 2;
	context.beginPath();
	context.roundRect(x, y, width, height, CORNER);
	context.fill();
	context.stroke();

	if (card.color) {
		context.fillStyle = card.color;
		context.beginPath();
		context.arc(
			x + width - EVENT_TEAM_SHARE.cardPadding - 8,
			y + EVENT_TEAM_SHARE.cardPadding + 16,
			8,
			0,
			Math.PI * 2,
		);
		context.fill();
	}

	context.fillStyle = titleColor;
	context.font = "700 24px system-ui, sans-serif";
	context.textAlign = "start";
	context.textBaseline = "middle";
	context.fillText(
		fitText(context, card.title, width - EVENT_TEAM_SHARE.cardPadding * 2 - 28),
		x + EVENT_TEAM_SHARE.cardPadding,
		y + EVENT_TEAM_SHARE.cardPadding + EVENT_TEAM_SHARE.headerHeight / 2,
	);
	context.textBaseline = "alphabetic";

	const rowWidth = width - EVENT_TEAM_SHARE.cardPadding * 2;
	const rowsStart =
		y + EVENT_TEAM_SHARE.cardPadding + EVENT_TEAM_SHARE.headerHeight;
	for (const [index, player] of card.players.entries()) {
		drawPlayerRow(
			context,
			x + EVENT_TEAM_SHARE.cardPadding,
			rowsStart + index * EVENT_TEAM_SHARE.rowHeight,
			rowWidth,
			player,
			ceiling,
			avatars,
		);
	}
}

async function renderEventTeamsPng(
	cards: readonly EventTeamShareCard[],
	ceiling: number,
): Promise<Blob> {
	const avatars = await loadAvatars(cards);
	const playerCounts = cards.map((card) => card.players.length);
	const width = EVENT_TEAM_SHARE.width;
	const height = eventTeamShareImageHeight(playerCounts);
	const cardWidth = eventTeamShareCardWidth();
	const canvas = document.createElement("canvas");
	canvas.width = width * SHARE_SCALE;
	canvas.height = height * SHARE_SCALE;
	const context = canvas.getContext("2d");
	if (!context) {
		throw new Error(EVENT_TEAM_SHARE_LABEL.shareFailed);
	}

	context.scale(SHARE_SCALE, SHARE_SCALE);
	context.fillStyle = EVENT_TEAM_SHARE_COLOR.field;
	context.fillRect(0, 0, width, height);

	const { columns, padding, gap } = EVENT_TEAM_SHARE;
	const rowCount = Math.ceil(cards.length / columns);
	let top = padding;
	for (const row of Array.from({ length: rowCount }, (_, index) => index)) {
		const start = row * columns;
		const rowCards = cards.slice(start, start + columns);
		const rowHeight = Math.max(
			...rowCards.map((card) => eventTeamShareCardHeight(card.players.length)),
		);
		for (const [column, card] of rowCards.entries()) {
			drawCard(
				context,
				padding + column * (cardWidth + gap),
				top,
				cardWidth,
				eventTeamShareCardHeight(card.players.length),
				card,
				ceiling,
				avatars,
			);
		}
		top += rowHeight + gap;
	}

	return canvasToPng(canvas);
}

export async function shareEventTeamsImage(
	cards: readonly EventTeamShareCard[],
	ceiling: number,
	{
		championshipName,
		startsAt,
	}: {
		championshipName: string;
		startsAt: string;
	},
): Promise<void> {
	if (cards.length === 0) {
		throw new Error(EVENT_TEAM_SHARE_LABEL.shareFailed);
	}

	const blob = await renderEventTeamsPng(cards, ceiling);
	const file = new File(
		[blob],
		eventTeamShareFileName({
			championshipName,
			startsAt,
			generatedAt: new Date().toISOString(),
		}),
		{ type: EVENT_TEAM_SHARE.mimePng },
	);
	await shareOrDownload({
		files: [file],
		text: eventTeamsShareText(cards, startsAt),
		title: EVENT_TEAM_SHARE.title,
	});
}
