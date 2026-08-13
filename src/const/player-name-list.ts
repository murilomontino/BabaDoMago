export const PLAYER_NAME_LIST = {
	placeholder:
		"Um nome por linha.\nCole a lista: números e emojis são ignorados.\nEx.: 1. Vitinho ✅",
} as const;

function cleanPlayerNameLine(line: string): string {
	return line
		.replace(/^\s*\d+\s*[.)-]\s*/u, "")
		.replace(/\p{Extended_Pictographic}|\p{Emoji_Modifier}/gu, "")
		.replace(/\u200B|\u200C|\u200D|\u2060|\uFEFF|\uFE0E|\uFE0F/gu, "")
		.trim();
}

export function parsePlayerNameList(raw: string): string[] {
	const names = raw
		.split(/\r?\n/)
		.map(cleanPlayerNameLine)
		.filter((name) => name.length > 0);

	return [...new Set(names)];
}
