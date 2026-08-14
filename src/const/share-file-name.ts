import { formatEventStartsAt } from "./championship-event.ts";

export const SHARE_FILE = {
	png: "png",
} as const;

export function shareFileSlug(value: string): string {
	return value
		.normalize("NFD")
		.replace(/\p{M}/gu, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export function shareFileDateStamp(iso: string): string | null {
	const parsed = new Date(iso);
	if (Number.isNaN(parsed.getTime())) {
		return null;
	}

	return formatEventStartsAt(iso).date.replaceAll("/", "-");
}

export function sharePngFileName(
	parts: readonly (string | null | undefined)[],
): string {
	const slugs = parts.flatMap((part) => {
		if (!part) {
			return [];
		}

		const slug = shareFileSlug(part);
		if (!slug) {
			return [];
		}

		return [slug];
	});

	return `${slugs.join("-")}.${SHARE_FILE.png}`;
}
