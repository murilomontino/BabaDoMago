import {
	PLAYER_RATING,
	PLAYER_STAR_PATH,
	PLAYER_STARS,
	ratingToStarFill,
} from "@/const/player-rating";
import { PODIUM_STAND_HEIGHT } from "@/const/podium";
import {
	PODIUM_SHARE,
	PODIUM_SHARE_COLOR,
	PODIUM_SHARE_LABEL,
	PODIUM_SHARE_MEDAL,
	type PodiumShareCard,
	type PodiumShareFileParts,
	type PodiumSharePlace,
	podiumShareAllFileName,
	podiumShareAllText,
	podiumShareFileName,
	podiumSharePlacesInDisplayOrder,
} from "@/const/podium-share";
import { shareOrDownload, tryShareFiles } from "@/lib/share-file";

const SHARE_SCALE = 2;
const STAR_VIEWBOX = 24;
const PLAYER_BLOCK = 230;
const COLUMN_RADIUS = 16;

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
	cards: readonly PodiumShareCard[],
): Promise<ReadonlyMap<string, HTMLImageElement>> {
	const urls = [
		...new Set(
			cards.flatMap((card) =>
				card.places.flatMap((place) =>
					place.avatarUrl ? [place.avatarUrl] : [],
				),
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
					reject(new Error(PODIUM_SHARE_LABEL.shareFailed));
					return;
				}

				resolve(blob);
			}, PODIUM_SHARE.mimePng);
		} catch {
			reject(new Error(PODIUM_SHARE_LABEL.shareFailed));
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

function maxStandHeight(): number {
	return Math.max(
		PODIUM_STAND_HEIGHT[1],
		PODIUM_STAND_HEIGHT[2],
		PODIUM_STAND_HEIGHT[3],
	);
}

function podiumBodyHeight(): number {
	return PODIUM_SHARE.headerHeight + PLAYER_BLOCK + maxStandHeight();
}

function podiumImageHeight(cardCount: number): number {
	if (cardCount === 0) {
		return PODIUM_SHARE.padding * 2;
	}

	return (
		PODIUM_SHARE.padding * 2 +
		cardCount * podiumBodyHeight() +
		Math.max(0, cardCount - 1) * PODIUM_SHARE.gap
	);
}

function drawStars(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	rating: number,
	ceiling: number,
) {
	const size = PODIUM_SHARE.star;
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

	paint(PODIUM_SHARE_COLOR.starEmpty);
	context.save();
	context.beginPath();
	context.rect(
		x,
		y,
		(fill / PLAYER_RATING.starCount) * size * PLAYER_RATING.starCount,
		size,
	);
	context.clip();
	paint(PODIUM_SHARE_COLOR.starFill);
	context.restore();
}

function drawAvatar(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	name: string,
	image: HTMLImageElement | undefined,
) {
	const size = PODIUM_SHARE.avatar;
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

	context.fillStyle = PODIUM_SHARE_COLOR.avatar;
	context.fill();
	context.restore();
	context.fillStyle = PODIUM_SHARE_COLOR.fgMuted;
	context.font = "600 28px system-ui, sans-serif";
	context.textAlign = "center";
	context.textBaseline = "middle";
	context.fillText(name.charAt(0).toUpperCase() || "?", cx, cy);
}

function drawPlace(
	context: CanvasRenderingContext2D,
	columnX: number,
	columnWidth: number,
	baseline: number,
	place: PodiumSharePlace,
	ceiling: number,
	avatars: ReadonlyMap<string, HTMLImageElement>,
) {
	const standHeight = PODIUM_STAND_HEIGHT[place.place];
	const standY = baseline - standHeight;
	const avatarX = columnX + (columnWidth - PODIUM_SHARE.avatar) / 2;
	const blockBottom = standY - 16;
	const nameY = blockBottom - 92;
	const avatarY = nameY - 12 - PODIUM_SHARE.avatar;
	const avatar = place.avatarUrl ? avatars.get(place.avatarUrl) : undefined;

	drawAvatar(context, avatarX, avatarY, place.name, avatar);

	context.fillStyle = PODIUM_SHARE_COLOR.fg;
	context.font = "700 22px system-ui, sans-serif";
	context.textAlign = "center";
	context.textBaseline = "top";
	context.fillText(
		fitText(context, place.name, columnWidth - 12),
		columnX + columnWidth / 2,
		nameY,
	);

	const starsWidth = PODIUM_SHARE.star * PLAYER_RATING.starCount;
	drawStars(
		context,
		columnX + (columnWidth - starsWidth) / 2,
		nameY + 30,
		place.rating,
		ceiling,
	);

	context.fillStyle = PODIUM_SHARE_COLOR.pitch;
	context.font = "700 24px system-ui, sans-serif";
	context.fillText(place.value, columnX + columnWidth / 2, nameY + 58);

	context.fillStyle = PODIUM_SHARE_COLOR.pitchSoft;
	context.strokeStyle = PODIUM_SHARE_COLOR.line;
	context.lineWidth = 2;
	context.beginPath();
	context.roundRect(columnX, standY, columnWidth, standHeight, [
		COLUMN_RADIUS,
		COLUMN_RADIUS,
		0,
		0,
	]);
	context.fill();
	context.stroke();

	context.fillStyle = PODIUM_SHARE_MEDAL[place.place];
	context.font = "700 28px system-ui, sans-serif";
	context.textBaseline = "top";
	context.fillText(String(place.place), columnX + columnWidth / 2, standY + 12);
}

function drawPodiumCard(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	card: PodiumShareCard,
	ceiling: number,
	avatars: ReadonlyMap<string, HTMLImageElement>,
) {
	context.fillStyle = PODIUM_SHARE_COLOR.fg;
	context.font = "700 32px system-ui, sans-serif";
	context.textAlign = "center";
	context.textBaseline = "middle";
	context.fillText(
		fitText(context, card.title, width - PODIUM_SHARE.padding * 2),
		x + width / 2,
		y + PODIUM_SHARE.headerHeight / 2,
	);

	const places = podiumSharePlacesInDisplayOrder(card.places);
	const columnGap = PODIUM_SHARE.gap;
	const columnWidth =
		(width - PODIUM_SHARE.padding * 2 - columnGap * (places.length - 1)) /
		Math.max(places.length, 1);
	const baseline =
		y + PODIUM_SHARE.headerHeight + PLAYER_BLOCK + maxStandHeight();
	for (const [index, place] of places.entries()) {
		drawPlace(
			context,
			x + PODIUM_SHARE.padding + index * (columnWidth + columnGap),
			columnWidth,
			baseline,
			place,
			ceiling,
			avatars,
		);
	}
}

async function renderPodiumsPng(
	cards: readonly PodiumShareCard[],
	ceiling: number,
): Promise<Blob> {
	const avatars = await loadAvatars(cards);
	const width = PODIUM_SHARE.width;
	const height = podiumImageHeight(cards.length);
	const canvas = document.createElement("canvas");
	canvas.width = width * SHARE_SCALE;
	canvas.height = height * SHARE_SCALE;
	const context = canvas.getContext("2d");
	if (!context) {
		throw new Error(PODIUM_SHARE_LABEL.shareFailed);
	}

	context.scale(SHARE_SCALE, SHARE_SCALE);
	context.fillStyle = PODIUM_SHARE_COLOR.field;
	context.fillRect(0, 0, width, height);

	const body = podiumBodyHeight();
	for (const [index, card] of cards.entries()) {
		drawPodiumCard(
			context,
			0,
			PODIUM_SHARE.padding + index * (body + PODIUM_SHARE.gap),
			width,
			card,
			ceiling,
			avatars,
		);
	}

	return canvasToPng(canvas);
}

async function fileFromCard(
	card: PodiumShareCard,
	ceiling: number,
	parts: PodiumShareFileParts,
): Promise<File> {
	const blob = await renderPodiumsPng([card], ceiling);
	return new File([blob], podiumShareFileName(card.metric, parts), {
		type: PODIUM_SHARE.mimePng,
	});
}

export async function sharePodiumImages(
	cards: readonly PodiumShareCard[],
	ceiling: number,
	parts: PodiumShareFileParts,
): Promise<void> {
	if (cards.length === 0) {
		throw new Error(PODIUM_SHARE_LABEL.shareFailed);
	}

	const files = await Promise.all(
		cards.map((card) => fileFromCard(card, ceiling, parts)),
	);
	const text = podiumShareAllText(cards);
	const title = PODIUM_SHARE.title;

	if (files.length === 1) {
		await shareOrDownload({ files, text, title });
		return;
	}

	const many = await tryShareFiles({ files, text, title });
	if (many === "shared" || many === "aborted") {
		return;
	}

	const stacked = await renderPodiumsPng(cards, ceiling);
	await shareOrDownload({
		files: [
			new File([stacked], podiumShareAllFileName(parts), {
				type: PODIUM_SHARE.mimePng,
			}),
		],
		text,
		title,
	});
}
