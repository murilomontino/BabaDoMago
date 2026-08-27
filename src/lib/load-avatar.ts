export function loadAvatar(src: string): Promise<HTMLImageElement | null> {
	return new Promise((resolve) => {
		const image = new Image();
		image.crossOrigin = "anonymous";
		image.referrerPolicy = "no-referrer";
		image.addEventListener("load", () => resolve(image));
		image.addEventListener("error", () => resolve(null));
		image.src = src;
	});
}

export async function loadAvatarMap(
	urls: readonly (string | null)[],
): Promise<ReadonlyMap<string, HTMLImageElement>> {
	const unique = [...new Set(urls.filter((url) => url !== null))];
	const loaded = await Promise.all(
		unique.map(async (url) => {
			const image = await loadAvatar(url);
			if (!image) {
				return null;
			}

			return [url, image] as const;
		}),
	);

	return new Map(loaded.filter((entry) => entry !== null));
}
