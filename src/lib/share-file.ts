export type ShareOrDownloadInput = {
	files: readonly File[];
	title: string;
	text: string;
};

function isShareAbort(error: unknown): boolean {
	return error instanceof DOMException && error.name === "AbortError";
}

function canOpenShareSheet(): boolean {
	return typeof navigator.share === "function";
}

function isVideoFile(file: File): boolean {
	return file.type.startsWith("video/");
}

function filesIncludeVideo(files: readonly File[]): boolean {
	return files.some(isVideoFile);
}

function canShareFiles(files: readonly File[]): boolean {
	if (typeof navigator.canShare !== "function") {
		return true;
	}

	try {
		return navigator.canShare({ files: [...files] });
	} catch {
		return false;
	}
}

function sharePayload({ files, title, text }: ShareOrDownloadInput): ShareData {
	const list = [...files];
	if (filesIncludeVideo(files)) {
		return { files: list };
	}

	return { files: list, text, title };
}

function downloadFile(file: File) {
	const url = URL.createObjectURL(file);
	const link = document.createElement("a");
	link.href = url;
	link.download = file.name;
	link.rel = "noopener";
	document.body.append(link);
	link.click();
	link.remove();
	window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function downloadFiles(files: readonly File[]) {
	for (const file of files) {
		downloadFile(file);
	}
}

export async function shareOrDownload({
	files,
	title,
	text,
}: ShareOrDownloadInput): Promise<void> {
	if (files.length === 0) {
		return;
	}

	if (!canOpenShareSheet() || !canShareFiles(files)) {
		downloadFiles(files);
		return;
	}

	try {
		await navigator.share(sharePayload({ files, title, text }));
		return;
	} catch (error) {
		if (isShareAbort(error)) {
			return;
		}
	}

	if (filesIncludeVideo(files) || files.length > 1) {
		downloadFiles(files);
		return;
	}

	try {
		await navigator.share({
			text,
			title,
		});
	} catch (error) {
		if (isShareAbort(error)) {
			return;
		}

		downloadFiles(files);
	}
}
