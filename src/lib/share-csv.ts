import { shareOrDownload } from "./share-file.ts";

export async function shareCsvText(
	fileName: string,
	csv: string,
	title: string,
): Promise<void> {
	const file = new File([csv], fileName, {
		type: "text/csv;charset=utf-8",
	});
	await shareOrDownload({
		files: [file],
		title,
		text: title,
	});
}

export function buildCsv(
	headers: readonly string[],
	rows: readonly (readonly string[])[],
): string {
	const lines = [headers, ...rows].map((cells) =>
		cells.map(escapeCsvCell).join(","),
	);
	return `${lines.join("\n")}\n`;
}

function escapeCsvCell(value: string): string {
	if (!/[",\n\r]/.test(value)) {
		return value;
	}

	return `"${value.replaceAll('"', '""')}"`;
}
