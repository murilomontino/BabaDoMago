import {
	applyEventRatingDelta,
	EVENT_RATING_ADJUSTMENT,
	EVENT_RATING_INITIAL,
	eventRatingDelta,
	eventRatingDrawPoints,
	eventRatingPreview,
	formatEventRating,
	playerEventRatingAfterSave,
	previewRatingTos,
	recomputePlayerEventRating,
} from "./event-rating-adjustment.ts";
import { PLAYER_RATING } from "./player-rating.ts";

function check(actual: unknown, expected: unknown, message: string): void {
	if (actual !== expected) {
		throw new Error(
			`${message}: expected ${String(expected)}, got ${String(actual)}`,
		);
	}
}

check(EVENT_RATING_ADJUSTMENT.scaleDivisor, 2, "scale divisor");
check(EVENT_RATING_ADJUSTMENT.minMatches, 3, "min matches");
check(EVENT_RATING_ADJUSTMENT.winPoints, 3, "win points");
check(EVENT_RATING_ADJUSTMENT.drawPoints, 1, "draw points");
check(EVENT_RATING_ADJUSTMENT.drawPointsBonus, 1.5, "draw points bonus");
check(eventRatingDrawPoints(3, 0), 1.5, "E > D usa 1.5");
check(eventRatingDrawPoints(2, 2), 1, "E = D usa 1");
check(eventRatingDrawPoints(1, 2), 1, "E < D usa 1");
check(EVENT_RATING_INITIAL.low, 2.7, "semente baixa");
check(EVENT_RATING_INITIAL.mid, 3, "semente media");
check(EVENT_RATING_INITIAL.high, 3.5, "semente alta");

check(eventRatingDelta(4, 0, 0, 6, 4, 5), 0.4, "teto 5 4V/6J");
check(eventRatingDelta(1, 0, 2, 3, 3.5, 5), -0.4, "teto 5 1V/3J");
check(eventRatingDelta(5, 0, 1, 6, 5, 5), 0.8, "teto 5 5V/6J");
check(applyEventRatingDelta(4, 0.4), 4.4, "teto 5 joao");
check(applyEventRatingDelta(3.5, -0.4), 3.1, "teto 5 pedro");
check(applyEventRatingDelta(5, 0.8), 5.8, "teto 5 ana passa teto");

check(eventRatingDelta(4, 0, 0, 6, 12, 23), 1.9, "teto 23 4V/6J");
check(eventRatingDelta(1, 0, 2, 3, 18, 23), -1.9, "teto 23 1V/3J");
check(eventRatingDelta(5, 0, 1, 6, 23, 23), 3.8, "teto 23 5V/6J");
check(applyEventRatingDelta(12, 1.9), 13.9, "teto 23 joao");
check(applyEventRatingDelta(18, -1.9), 16.1, "teto 23 pedro");
check(applyEventRatingDelta(23, 3.8), 26.8, "teto 23 ana passa teto");

check(eventRatingDelta(4, 0, 0, 6, 40, 75), 6.3, "teto 75 4V/6J");
check(eventRatingDelta(1, 0, 2, 3, 60, 75), -6.3, "teto 75 1V/3J");
check(eventRatingDelta(5, 0, 1, 6, 75, 75), 12.5, "teto 75 5V/6J");
check(applyEventRatingDelta(40, 6.3), 46.3, "teto 75 joao");
check(applyEventRatingDelta(60, -6.3), 53.7, "teto 75 pedro");
check(applyEventRatingDelta(75, 12.5), 87.5, "teto 75 ana passa teto");

check(eventRatingDelta(2, 0, 2, 4, 4, 5), 0, "zona morta 50%");
check(eventRatingDelta(3, 0, 3, 6, 4, 5), 0, "zona morta 50% 6 jogos");
check(eventRatingDelta(1, 0, 1, 2, 4, 5), 0, "abaixo do piso 2 jogos");
check(eventRatingDelta(1, 0, 0, 1, 4, 5), 0, "abaixo do piso 1 jogo");
check(
	eventRatingDelta(4, 0, 0, 6, PLAYER_RATING.default, 5),
	EVENT_RATING_INITIAL.high,
	"sentinela 4V/6J vira 3.5",
);
check(
	eventRatingDelta(1, 0, 2, 3, PLAYER_RATING.default, 5),
	EVENT_RATING_INITIAL.low,
	"sentinela 1V/3J vira 2.7",
);
check(
	eventRatingDelta(2, 0, 2, 4, PLAYER_RATING.default, 5),
	EVENT_RATING_INITIAL.mid,
	"sentinela zona morta vira 3",
);
check(
	eventRatingDelta(1, 0, 1, 2, PLAYER_RATING.default, 5),
	0,
	"sentinela abaixo do piso",
);
check(
	eventRatingDelta(2, 2, 0, 4, PLAYER_RATING.default, 5),
	EVENT_RATING_INITIAL.high,
	"sentinela 2V 2E 0D usa 1.5",
);
check(
	eventRatingDelta(0, 3, 0, 3, PLAYER_RATING.default, 5),
	EVENT_RATING_INITIAL.mid,
	"sentinela 3E 0D zona morta",
);
check(
	applyEventRatingDelta(PLAYER_RATING.default, EVENT_RATING_INITIAL.high),
	EVENT_RATING_INITIAL.high,
	"sentinela aplica 3.5",
);
check(eventRatingDelta(3, 0, 2, 5, 4, 5), 0.3, "60% teto 5");
check(eventRatingDelta(2, 0, 3, 5, 4, 5), -0.3, "40% teto 5");
check(eventRatingDelta(2, 2, 0, 4, 4, 5), 0.6, "2V 2E 0D sobe com 1.5");
check(eventRatingDelta(0, 3, 0, 3, 4, 5), 0, "3E 0D zona morta");
check(eventRatingDelta(0, 2, 2, 4, 4, 5), -0.8, "2E 2D ainda 1 ponto");
check(eventRatingDelta(4, 2, 0, 6, 4, 5), 0.8, "4V 2E 0D teto 5");
check(eventRatingDelta(2, 1, 1, 4, 4, 5), 0.2, "2V 1E 1D teto 5");

check(applyEventRatingDelta(99.5, 1.3), PLAYER_RATING.max, "clamp 100");
check(applyEventRatingDelta(0.2, -0.4), PLAYER_RATING.floor, "clamp piso 0.1");
check(applyEventRatingDelta(PLAYER_RATING.default, 0), 0, "sentinela fica 0");
check(
	eventRatingDelta(4, 0, 0, 6, 40, 150),
	eventRatingDelta(4, 0, 0, 6, 40, PLAYER_RATING.max),
	"teto da att nao passa de 100",
);
check(
	applyEventRatingDelta(98, eventRatingDelta(5, 0, 1, 6, 98, 150)),
	PLAYER_RATING.max,
	"nota nova nao passa de 100",
);
check(
	applyEventRatingDelta(0.3, eventRatingDelta(1, 0, 2, 3, 0.3, 75)),
	PLAYER_RATING.floor,
	"nota nova nao fica abaixo do piso",
);
check(
	eventRatingDelta(1, 0, 2, 3, 4, -10),
	eventRatingDelta(1, 0, 2, 3, 4, PLAYER_RATING.min),
	"teto da att nao fica negativo",
);

check(formatEventRating(4), "4.0", "format 4");
check(formatEventRating(4.4), "4.4", "format 4.4");

const preview = eventRatingPreview({
	attendance: [
		{
			player_id: 1,
			display_name: "Joao",
			wins: 4,
			draws: 0,
			losses: 0,
			matches: 6,
		},
		{
			player_id: 2,
			display_name: "Pedro",
			wins: 1,
			draws: 0,
			losses: 2,
			matches: 3,
		},
		{
			player_id: 3,
			display_name: "Ana",
			wins: 5,
			draws: 0,
			losses: 1,
			matches: 6,
		},
	],
	players: [
		{
			id: 1,
			rating: 4,
			nickname: "Joao",
			display_name: "Joao Silva",
		},
		{
			id: 2,
			rating: 3.5,
			nickname: null,
			display_name: "Pedro",
		},
		{
			id: 3,
			rating: 5,
			nickname: "Ana",
			display_name: "Ana",
		},
		{
			id: 4,
			rating: 2,
			nickname: null,
			display_name: "Fora",
		},
	],
	presentPlayerIds: null,
});

check(preview.length, 3, "preview so presentes");
check(preview[0]?.name, "Joao", "preview usa apelido");
check(preview[0]?.from, 4, "preview from joao");
check(preview[0]?.to, 4.4, "preview to joao");
check(preview[1]?.to, 3.1, "preview to pedro");
check(preview[2]?.to, 5.8, "preview to ana");
check(preview[0]?.isMvp, false, "preview without mvp");

const mvpPreview = eventRatingPreview({
	attendance: [
		{
			player_id: 1,
			display_name: "Joao",
			wins: 4,
			draws: 0,
			losses: 0,
			matches: 6,
		},
	],
	players: [
		{
			id: 1,
			rating: 4,
			nickname: "Joao",
			display_name: "Joao Silva",
		},
	],
	presentPlayerIds: null,
	mvpPlayerIds: [1],
});
check(mvpPreview[0]?.isMvp, true, "preview marks mvp");
check(mvpPreview[0]?.to, 4.5, "preview adds mvp bonus");

const highCeilingMvpPreview = eventRatingPreview({
	attendance: [
		{
			player_id: 1,
			display_name: "Joao",
			wins: 0,
			draws: 0,
			losses: 0,
			matches: 0,
		},
	],
	players: [
		{
			id: 1,
			rating: 20,
			nickname: "Joao",
			display_name: "Joao Silva",
		},
	],
	presentPlayerIds: null,
	mvpPlayerIds: [1],
});
check(highCeilingMvpPreview[0]?.to, 20.1, "mvp +0.1 no jogador");

const draftPreview = eventRatingPreview({
	attendance: [
		{
			player_id: 1,
			display_name: "Joao",
			wins: 4,
			draws: 0,
			losses: 0,
			matches: 6,
		},
	],
	players: [
		{
			id: 1,
			rating: 4,
			nickname: null,
			display_name: "Joao",
		},
		{
			id: 5,
			rating: 3,
			nickname: null,
			display_name: "Novo",
		},
	],
	presentPlayerIds: [5, 1],
});

check(draftPreview.length, 2, "preview segue rascunho");
check(draftPreview[0]?.playerId, 5, "rascunho primeiro");
check(draftPreview[0]?.to, 3, "rascunho sem stats nao muda");
check(draftPreview[1]?.to, 4.4, "rascunho joao sobe");

const seedPreview = eventRatingPreview({
	attendance: [
		{
			player_id: 1,
			display_name: "Novo",
			wins: 4,
			draws: 0,
			losses: 0,
			matches: 6,
		},
	],
	players: [
		{
			id: 1,
			rating: PLAYER_RATING.default,
			nickname: null,
			display_name: "Novo",
		},
	],
	presentPlayerIds: null,
});
check(seedPreview[0]?.from, 0, "preview sentinela from");
check(
	seedPreview[0]?.to,
	EVENT_RATING_INITIAL.high,
	"preview sentinela to 3.5",
);

check(
	recomputePlayerEventRating(40, 0, 4, 0, 0, 6, 75),
	46.3,
	"esquecido oldDelta 0",
);
check(
	recomputePlayerEventRating(46.3, 6.3, 4, 0, 0, 6, 75),
	46.3,
	"correcao mesmos stats",
);
check(
	recomputePlayerEventRating(46.3, 6.3, 1, 0, 2, 3, 75),
	46.3 - 6.3 + eventRatingDelta(1, 0, 2, 3, 46.3, 75),
	"correcao desfaz e aplica",
);
check(
	recomputePlayerEventRating(46.3, 6.3, 1, 0, 2, 3, 75),
	applyEventRatingDelta(46.3, -6.3 + eventRatingDelta(1, 0, 2, 3, 46.3, 75)),
	"correcao via apply",
);
check(
	playerEventRatingAfterSave({
		rating: 40,
		storedDelta: 0,
		oldWins: 0,
		oldDraws: 0,
		oldLosses: 0,
		oldMatches: 0,
		wins: 4,
		draws: 0,
		losses: 0,
		matches: 6,
		ceiling: 75,
	}),
	46.3,
	"esquecido aplica",
);
check(
	playerEventRatingAfterSave({
		rating: 46.3,
		storedDelta: 0,
		oldWins: 4,
		oldDraws: 0,
		oldLosses: 0,
		oldMatches: 6,
		wins: 5,
		draws: 0,
		losses: 0,
		matches: 6,
		ceiling: 75,
	}),
	46.3,
	"ja ranqueado congela",
);
check(
	playerEventRatingAfterSave({
		rating: 46.3,
		storedDelta: 6.3,
		oldWins: 4,
		oldDraws: 0,
		oldLosses: 0,
		oldMatches: 6,
		wins: 4,
		draws: 0,
		losses: 0,
		matches: 6,
		ceiling: 75,
	}),
	46.3,
	"delta gravado mesmos stats",
);
check(
	playerEventRatingAfterSave({
		rating: PLAYER_RATING.default,
		storedDelta: 0,
		oldWins: 0,
		oldDraws: 0,
		oldLosses: 0,
		oldMatches: 0,
		wins: 4,
		draws: 0,
		losses: 0,
		matches: 6,
		ceiling: 5,
	}),
	EVENT_RATING_INITIAL.high,
	"sentinela afterSave aplica semente",
);
check(
	playerEventRatingAfterSave({
		rating: PLAYER_RATING.default,
		storedDelta: 0,
		oldWins: 4,
		oldDraws: 0,
		oldLosses: 0,
		oldMatches: 6,
		wins: 1,
		draws: 0,
		losses: 2,
		matches: 3,
		ceiling: 5,
	}),
	EVENT_RATING_INITIAL.low,
	"sentinela afterSave nao congela",
);
check(
	playerEventRatingAfterSave({
		rating: EVENT_RATING_INITIAL.high,
		storedDelta: EVENT_RATING_INITIAL.high,
		oldWins: 4,
		oldDraws: 0,
		oldLosses: 0,
		oldMatches: 6,
		wins: 1,
		draws: 0,
		losses: 2,
		matches: 3,
		ceiling: 5,
		snapshotRating: PLAYER_RATING.default,
	}),
	EVENT_RATING_INITIAL.low,
	"sentinela afterSave usa snapshot",
);
check(
	recomputePlayerEventRating(
		EVENT_RATING_INITIAL.high,
		EVENT_RATING_INITIAL.high,
		1,
		0,
		2,
		3,
		5,
		PLAYER_RATING.default,
	),
	EVENT_RATING_INITIAL.low,
	"sentinela recompute troca faixa",
);
check(previewRatingTos(null).join(","), "", "null preview");
check(previewRatingTos(false).join(","), "", "no flow event");
check(
	previewRatingTos([
		{
			playerId: 1,
			name: "a",
			from: 3,
			to: 3.2,
			isMvp: false,
		},
	]).join(","),
	"3.2",
	"preview tos",
);

console.log("event-rating-adjustment ok");
