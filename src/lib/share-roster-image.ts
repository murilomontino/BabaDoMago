import {
	PLAYER_RATING,
	PLAYER_STAR_PATH,
	PLAYER_STARS,
	ratingToStarFill,
} from "@/const/player-rating";
import {
	ROSTER_SHARE,
	ROSTER_SHARE_COLOR,
	ROSTER_SHARE_LABEL,
	ROSTER_SHARE_STAT_COLUMNS,
	type RosterShareCard,
	type RosterSharePlayer,
	rosterShareFileName,
	rosterShareImageHeight,
	rosterShareLegendLines,
	rosterShareStarsWidth,
	rosterShareStatColumnWidth,
	rosterShareText,
} from "@/const/roster-share";
import { ROSTER_COLUMN, ROSTER_COLUMN_ABBR } from "@/const/roster-stats";
import { loadAvatar } from "@/lib/load-avatar";
import { shareOrDownload } from "@/lib/share-file";

const SHARE_SCALE = 2;
const STAR_VIEWBOX = 24;
const CORNER = 16;
const TEXT_GAP = 10;

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

async function loadAvatars(
	card: RosterShareCard,
): Promise<ReadonlyMap<string, HTMLImageElement>> {
	const urls = [
		...new Set(
			card.players.flatMap((player) => avatarUrlsToLoad(player.avatarUrl)),
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
					reject(new Error(ROSTER_SHARE_LABEL.shareFailed));
					return;
				}

				resolve(blob);
			}, ROSTER_SHARE.mimePng);
		} catch {
			reject(new Error(ROSTER_SHARE_LABEL.shareFailed));
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
	const size = ROSTER_SHARE.star;
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

	paint(ROSTER_SHARE_COLOR.starEmpty);
	context.save();
	context.beginPath();
	context.rect(
		x,
		y,
		(fill / PLAYER_RATING.starCount) * size * PLAYER_RATING.starCount,
		size,
	);
	context.clip();
	paint(ROSTER_SHARE_COLOR.starFill);
	context.restore();
}

function drawAvatar(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	name: string,
	image: HTMLImageElement | undefined,
) {
	const size = ROSTER_SHARE.avatar;
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

	context.fillStyle = ROSTER_SHARE_COLOR.avatar;
	context.fill();
	context.restore();
	context.fillStyle = ROSTER_SHARE_COLOR.fgMuted;
	context.font = "600 16px system-ui, sans-serif";
	context.textAlign = "center";
	context.textBaseline = "middle";
	context.fillText(name.charAt(0).toUpperCase() || "?", cx, cy);
	context.textAlign = "start";
	context.textBaseline = "alphabetic";
}

function rowBackground(index: number): string {
	if (index % 2 === 0) {
		return ROSTER_SHARE_COLOR.pitchSoft;
	}

	return ROSTER_SHARE_COLOR.surface;
}

function statsOriginX(): number {
	return (
		ROSTER_SHARE.playerColumnWidth +
		rosterShareStarsWidth() +
		ROSTER_SHARE.columnGap
	);
}

function drawStatCells(
	context: CanvasRenderingContext2D,
	originX: number,
	midY: number,
	values: readonly string[],
) {
	const statWidth = rosterShareStatColumnWidth();
	context.textAlign = "right";
	context.textBaseline = "middle";
	for (const [statIndex, value] of values.entries()) {
		const cellRight = originX + (statIndex + 1) * statWidth - 8;
		context.fillText(value, cellRight, midY);
	}
}

function drawTableHeader(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
) {
	const { tableHeaderHeight, playerColumnWidth } = ROSTER_SHARE;
	const midY = y + tableHeaderHeight / 2;
	const statsX = x + statsOriginX();

	context.fillStyle = ROSTER_SHARE_COLOR.surface;
	context.fillRect(x, y, width, tableHeaderHeight);

	context.fillStyle = ROSTER_SHARE_COLOR.fgMuted;
	context.font = "600 16px system-ui, sans-serif";
	context.textAlign = "start";
	context.textBaseline = "middle";
	context.fillText(ROSTER_COLUMN_ABBR[ROSTER_COLUMN.player], x, midY);
	context.fillText(
		ROSTER_COLUMN_ABBR[ROSTER_COLUMN.rating],
		x + playerColumnWidth,
		midY,
	);

	drawStatCells(
		context,
		statsX,
		midY,
		ROSTER_SHARE_STAT_COLUMNS.map((column) => ROSTER_COLUMN_ABBR[column]),
	);
}

function drawPlayerRow(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	player: RosterSharePlayer,
	ceiling: number,
	avatars: ReadonlyMap<string, HTMLImageElement>,
	index: number,
) {
	const { rowHeight, avatar, playerColumnWidth, star } = ROSTER_SHARE;
	const midY = y + rowHeight / 2;
	const statsX = x + statsOriginX();

	context.fillStyle = rowBackground(index);
	context.fillRect(x, y, width, rowHeight);

	const avatarY = midY - avatar / 2;
	drawAvatar(
		context,
		x,
		avatarY,
		player.name,
		avatarFromLoaded(player.avatarUrl, avatars),
	);

	const nameX = x + avatar + TEXT_GAP;
	const nameMaxWidth = Math.max(0, playerColumnWidth - avatar - TEXT_GAP);
	context.fillStyle = ROSTER_SHARE_COLOR.fg;
	context.font = "600 20px system-ui, sans-serif";
	context.textAlign = "start";
	context.textBaseline = "middle";
	context.fillText(fitText(context, player.name, nameMaxWidth), nameX, midY);

	drawStars(
		context,
		x + playerColumnWidth,
		midY - star / 2,
		player.rating,
		ceiling,
	);

	context.fillStyle = ROSTER_SHARE_COLOR.fg;
	context.font = "600 18px system-ui, sans-serif";
	drawStatCells(
		context,
		statsX,
		midY,
		player.stats.map((stat) => stat.value),
	);

	context.textAlign = "start";
	context.textBaseline = "alphabetic";
}

async function renderRosterPng(
	card: RosterShareCard,
	ceiling: number,
): Promise<Blob> {
	const avatars = await loadAvatars(card);
	const legendLines = rosterShareLegendLines(card.legend);
	const width = ROSTER_SHARE.width;
	const height = rosterShareImageHeight(
		card.players.length,
		legendLines.length,
	);
	const canvas = document.createElement("canvas");
	canvas.width = width * SHARE_SCALE;
	canvas.height = height * SHARE_SCALE;
	const context = canvas.getContext("2d");
	if (!context) {
		throw new Error(ROSTER_SHARE_LABEL.shareFailed);
	}

	context.scale(SHARE_SCALE, SHARE_SCALE);
	context.fillStyle = ROSTER_SHARE_COLOR.field;
	context.fillRect(0, 0, width, height);

	const { padding, headerHeight, tableHeaderHeight, rowHeight, gap } =
		ROSTER_SHARE;
	const inner = width - padding * 2;

	context.fillStyle = ROSTER_SHARE_COLOR.surface;
	context.strokeStyle = ROSTER_SHARE_COLOR.line;
	context.lineWidth = 2;
	context.beginPath();
	context.roundRect(
		padding / 2,
		padding / 2,
		width - padding,
		height - padding,
		CORNER,
	);
	context.fill();
	context.stroke();

	let y = padding;
	context.fillStyle = ROSTER_SHARE_COLOR.pitch;
	context.font = "700 28px system-ui, sans-serif";
	context.textAlign = "start";
	context.textBaseline = "top";
	context.fillText(
		fitText(context, card.championshipName || ROSTER_SHARE.title, inner),
		padding,
		y,
	);
	context.fillStyle = ROSTER_SHARE_COLOR.fgMuted;
	context.font = "600 20px system-ui, sans-serif";
	context.fillText(card.title, padding, y + 36);
	y += headerHeight;

	const tableX = padding;
	drawTableHeader(context, tableX, y, inner);
	y += tableHeaderHeight;

	for (const [index, player] of card.players.entries()) {
		drawPlayerRow(
			context,
			tableX,
			y + index * rowHeight,
			inner,
			player,
			ceiling,
			avatars,
			index,
		);
	}

	y += card.players.length * rowHeight + gap;
	context.fillStyle = ROSTER_SHARE_COLOR.fgSubtle;
	context.font = "500 16px system-ui, sans-serif";
	context.textAlign = "start";
	context.textBaseline = "top";
	for (const [index, line] of legendLines.entries()) {
		context.fillText(
			fitText(context, line, inner),
			padding,
			y + index * ROSTER_SHARE.legendLineHeight,
		);
	}

	return canvasToPng(canvas);
}

export async function shareRosterImage(
	card: RosterShareCard,
	ceiling: number,
): Promise<void> {
	if (card.players.length === 0) {
		throw new Error(ROSTER_SHARE_LABEL.shareFailed);
	}

	const blob = await renderRosterPng(card, ceiling);
	const file = new File(
		[blob],
		rosterShareFileName({
			championshipName: card.championshipName,
			generatedAt: new Date().toISOString(),
		}),
		{ type: ROSTER_SHARE.mimePng },
	);
	await shareOrDownload({
		files: [file],
		text: rosterShareText(card),
		title: ROSTER_SHARE.title,
	});
}
