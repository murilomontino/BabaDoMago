import { playDrawCompleteSound, playRevealSound } from "./event-draw-audio.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

// Garante que chamar as funcoes no ambiente Node (sem AudioContext) nao dispara excecoes
try {
	playRevealSound();
	playDrawCompleteSound();
	check(true, "funcoes de audio sao resilientes fora do browser");
} catch {
	check(false, "audio lancou excecao inesperada");
}

console.log("event-draw-audio ok");
