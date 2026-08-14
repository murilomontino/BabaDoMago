import {
	shareFileDateStamp,
	shareFileSlug,
	sharePngFileName,
} from "./share-file-name.ts";

function check(actual: unknown, expected: unknown): void {
	if (actual !== expected) {
		throw new Error(`expected ${String(expected)}, got ${String(actual)}`);
	}
}

check(shareFileSlug("Baba do Mago"), "baba-do-mago");
check(shareFileSlug("João Ñoño"), "joao-nono");
check(shareFileSlug("Gols contra"), "gols-contra");
check(shareFileSlug("Assistências"), "assistencias");
check(shareFileSlug("Temporada 2026"), "temporada-2026");
check(shareFileSlug("  --  "), "");
check(shareFileDateStamp("2026-08-14T22:00:00.000Z"), "14-08-2026");
check(shareFileDateStamp(""), null);
check(shareFileDateStamp("nope"), null);
check(
	sharePngFileName(["times", "Baba do Mago", "14-08-2026", "14-08-2026"]),
	"times-baba-do-mago-14-08-2026-14-08-2026.png",
);
check(sharePngFileName(["times", "", null, undefined]), "times.png");
check(
	sharePngFileName(["perfil", "Baba", "Nena", "14-08-2026"]),
	"perfil-baba-nena-14-08-2026.png",
);
