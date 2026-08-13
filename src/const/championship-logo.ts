export const CHAMPIONSHIP_LOGO = {
	bucket: "championship-logos",
	maxBytes: 1_048_576,
	mimePng: "image/png",
	mimeJpeg: "image/jpeg",
} as const;

export const CHAMPIONSHIP_LOGO_MIME = {
	[CHAMPIONSHIP_LOGO.mimePng]: "png",
	[CHAMPIONSHIP_LOGO.mimeJpeg]: "jpg",
} as const;

export type ChampionshipLogoMime = keyof typeof CHAMPIONSHIP_LOGO_MIME;

export function championshipLogoExtension(mime: string): string | null {
	if (mime === CHAMPIONSHIP_LOGO.mimePng) {
		return CHAMPIONSHIP_LOGO_MIME[CHAMPIONSHIP_LOGO.mimePng];
	}

	if (mime === CHAMPIONSHIP_LOGO.mimeJpeg) {
		return CHAMPIONSHIP_LOGO_MIME[CHAMPIONSHIP_LOGO.mimeJpeg];
	}

	return null;
}

export function championshipLogoObjectPath(
	championshipId: number,
	mime: string,
): string | null {
	const extension = championshipLogoExtension(mime);
	if (!extension) {
		return null;
	}

	return `${championshipId}/logo.${extension}`;
}

export function assertChampionshipLogoSource(file: File): void {
	if (!championshipLogoExtension(file.type)) {
		throw new Error("Use PNG ou JPEG");
	}
}

export function assertChampionshipLogoFile(file: File): void {
	assertChampionshipLogoSource(file);

	if (file.size > CHAMPIONSHIP_LOGO.maxBytes) {
		throw new Error("Logo deve ter no máximo 1 MB");
	}
}
