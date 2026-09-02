/**
 * PRNG determinístico usado para reproducibilidade do sorteio de times.
 * Dada a mesma seed, mulberry32 devolve sempre a mesma sequencia,
 * o que permite reconstruir o sorteio exato para auditoria/video.
 */
export function mulberry32(seed: number): () => number {
	let state = seed | 0;
	return () => {
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * Gera uma seed 32-bit imprevisível para iniciar um novo sorteio.
 * Usa Web Crypto quando disponível; fallback para Math.random com aviso.
 */
export function createDrawSeed(): number {
	const g = globalThis as typeof globalThis & {
		crypto?: { getRandomValues?: (array: Uint32Array) => Uint32Array };
	};
	const cryptoObj = g.crypto;
	if (cryptoObj?.getRandomValues) {
		const buffer = new Uint32Array(1);
		cryptoObj.getRandomValues(buffer);
		return buffer[0] ?? 0;
	}
	console.warn(
		"createDrawSeed: crypto.getRandomValues indisponivel, usando Math.random",
	);
	return Math.floor(Math.random() * 0x1_0000_0000);
}
