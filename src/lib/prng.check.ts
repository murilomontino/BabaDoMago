import { createDrawSeed, mulberry32 } from "./prng.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

const a = mulberry32(123456);
const b = mulberry32(123456);
const seqA = Array.from({ length: 8 }, () => a());
const seqB = Array.from({ length: 8 }, () => b());
check(
	seqA.join(",") === seqB.join(","),
	"mesma seed deve produzir a mesma sequencia",
);

const c = mulberry32(999);
const seqC = Array.from({ length: 8 }, () => c());
check(
	seqA.join(",") !== seqC.join(","),
	"seeds distintas devem produzir sequencias distintas",
);

for (const value of seqA) {
	check(value >= 0 && value < 1, "valores devem ficar em [0, 1)");
}

const seed = createDrawSeed();
check(
	Number.isInteger(seed) && seed >= 0 && seed <= 0xffff_ffff,
	"createDrawSeed deve devolver inteiro 32-bit sem sinal",
);

console.log("prng ok");
