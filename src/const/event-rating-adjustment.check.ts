import {
	applyEventRatingDelta,
	EVENT_RATING_ADJUSTMENT,
	EVENT_RATING_DROP_SHARE,
	EVENT_RATING_INITIAL,
	eventRatingApplyDropShare,
	eventActivePlayerRating,
	eventRatingDelta,
	eventRatingDrawPoints,
	eventRatingDropShareExcludedPlayerIds,
	eventRatingInDeadZone,
	eventRatingPreview,
	eventRatingPreviewFrom,
	eventRatingRate,
	eventRatingTeamGoalShare,
	formatEventRating,
	playerEventRatingAfterSave,
	previewRatingTos,
	recomputePlayerEventRating,
} from "./event-rating-adjustment.ts";
import { PLAYER_RATING } from "./player-rating.ts";
import { rosterGoalInvolvement } from "./roster-stats.ts";

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
check(eventRatingRate(0, 0, 0, 0), 0, "rate zero matches");
check(eventRatingRate(4, 0, 2, 6), 12 / 18, "rate 4V/2D");
check(eventRatingInDeadZone(2, 0, 2, 4), true, "dead zone 50%");
check(eventRatingInDeadZone(4, 0, 2, 6), false, "not dead zone 66%");
check(eventRatingInDeadZone(1, 0, 0, 1), false, "below min matches");

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
check(highCeilingMvpPreview[0]?.to, 20.4, "mvp 2% da nota 20");

const seedMvpPreview = eventRatingPreview({
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
	mvpPlayerIds: [1],
});
check(
	seedMvpPreview[0]?.to,
	EVENT_RATING_INITIAL.high + 0.1,
	"sentinela mvp soma piso",
);

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

check(eventRatingPreviewFrom(4, 4.4), 4, "snapshot vence elenco");
check(eventRatingPreviewFrom(undefined, 4.4), 4.4, "sem snapshot usa elenco");
check(eventRatingPreviewFrom(undefined, undefined), 0, "sem nota vira sentinela");
check(eventRatingPreviewFrom(0, 3.5), 0, "sentinela da presenca fica 0");

check(eventActivePlayerRating(true, 4, 7), 7, "ativo goleiro");
check(eventActivePlayerRating(false, 4, 7), 4, "ativo linha");

const gkPreview = eventRatingPreview({
	attendance: [
		{
			player_id: 1,
			display_name: "Goleiro",
			wins: 3,
			draws: 0,
			losses: 0,
			matches: 3,
			is_goalkeeper: true,
			rating: 4,
			goalkeeper_rating: 0,
		},
		{
			player_id: 2,
			display_name: "Linha",
			wins: 0,
			draws: 0,
			losses: 3,
			matches: 3,
			is_goalkeeper: false,
			rating: 4,
			goalkeeper_rating: 9,
		},
	],
	players: [
		{
			id: 1,
			rating: 4,
			goalkeeper_rating: 0,
			nickname: "GK",
			display_name: "Goleiro",
		},
		{
			id: 2,
			rating: 4,
			goalkeeper_rating: 9,
			nickname: "Linha",
			display_name: "Linha",
		},
	],
	presentPlayerIds: null,
});
check(gkPreview[0]?.from, 0, "gk preview usa nota goleiro");
check(
	(gkPreview[0]?.to ?? 0) > 0,
	true,
	"gk sentinela recebe semente",
);
check(gkPreview[1]?.from, 4, "linha preview usa rating");
check(
	(gkPreview[1]?.to ?? 4) < 4,
	true,
	"linha cai sem tocar nota goleiro",
);

const alreadyEvolvedPreview = eventRatingPreview({
	attendance: [
		{
			player_id: 1,
			display_name: "Joao",
			wins: 4,
			draws: 0,
			losses: 2,
			matches: 6,
			rating: 4,
		},
	],
	players: [
		{
			id: 1,
			rating: 4.4,
			nickname: "Joao",
			display_name: "Joao Silva",
		},
	],
	presentPlayerIds: null,
});
check(alreadyEvolvedPreview[0]?.from, 4, "preview after end usa presenca");
check(alreadyEvolvedPreview[0]?.to, 4.4, "preview after end nao aplica de novo");

check(EVENT_RATING_DROP_SHARE.cap, 1, "drop share cap");
check(EVENT_RATING_DROP_SHARE.excludeTop, 10, "exclude top n");
check(EVENT_RATING_DROP_SHARE.minShare, 0.4, "min share");
check(eventRatingTeamGoalShare(4, 10), 0, "40% nao passa do minimo");
check(eventRatingTeamGoalShare(5, 10), 0.5, "50% passa do minimo");
check(eventRatingTeamGoalShare(0, 10), 0, "sem participacao");
check(eventRatingTeamGoalShare(4, 0), 0, "time zerado");
check(eventRatingTeamGoalShare(12, 10), 1, "share nao passa de 1");
check(eventRatingApplyDropShare(-0.6, 0.5), -0.3, "-0.6 * 0.5 = -0.3");
check(eventRatingApplyDropShare(-0.6, 0), -0.6, "share 0 nao muda");
check(eventRatingApplyDropShare(0.4, 0.5), 0.4, "delta positivo nao amortece");
check(eventRatingApplyDropShare(0, 0.5), 0, "delta zero nao amortece");

const excludedTop = eventRatingDropShareExcludedPlayerIds(
	[
		{ id: 1, rating: 5 },
		{ id: 2, rating: 4.5 },
		{ id: 3, rating: 4 },
		{ id: 4, rating: 0 },
	],
	2,
);
check(excludedTop.has(1), true, "top 1 excluido");
check(excludedTop.has(2), true, "top 2 excluido");
check(excludedTop.has(3), false, "3o nao excluido");
check(excludedTop.has(4), false, "sentinela nao entra no top");
check(
	[...eventRatingDropShareExcludedPlayerIds(
		[
			{ id: 10, rating: 5 },
			{ id: 2, rating: 5 },
		],
		1,
	)][0],
	2,
	"empate de nota desempatado por id",
);

const dropSharePreview = eventRatingPreview({
	attendance: [
		{
			player_id: 1,
			display_name: "Joao",
			wins: 1,
			draws: 0,
			losses: 2,
			matches: 3,
			rating: 4,
			goals: 5,
			assists: 0,
		},
		{
			player_id: 2,
			display_name: "Pedro",
			wins: 1,
			draws: 0,
			losses: 2,
			matches: 3,
			rating: 4,
			goals: 5,
			assists: 0,
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
			rating: 4,
			nickname: "Pedro",
			display_name: "Pedro",
		},
	],
	presentPlayerIds: null,
	ratingDropGoalShare: true,
	teams: [
		{
			id: 10,
			color: "#ffffff",
			sort_order: 0,
			players: [{ player_id: 1 }, { player_id: 2 }],
		},
	],
});
check(eventRatingDelta(1, 0, 2, 3, 4, 5), -0.4, "queda base teto 5");
check(
	rosterGoalInvolvement(5, 0) / rosterGoalInvolvement(10, 0),
	0.5,
	"joao 50% do time",
);
check(dropSharePreview[0]?.to, 3.8, "preview com share 50% em -0.4");
check(
	eventRatingPreview({
		attendance: dropSharePreview.map((row) => ({
			player_id: row.playerId,
			display_name: row.name,
			wins: 1,
			draws: 0,
			losses: 2,
			matches: 3,
			rating: 4,
			goals: 5,
			assists: 0,
		})),
		players: [
			{
				id: 1,
				rating: 4,
				nickname: "Joao",
				display_name: "Joao Silva",
			},
			{
				id: 2,
				rating: 4,
				nickname: "Pedro",
				display_name: "Pedro",
			},
		],
		presentPlayerIds: null,
		ratingDropGoalShare: false,
		teams: [
			{
				id: 10,
				color: "#ffffff",
				sort_order: 0,
				players: [{ player_id: 1 }, { player_id: 2 }],
			},
		],
	})[0]?.to,
	3.6,
	"flag off nao amortece",
);

const excludeTopPreview = eventRatingPreview({
	attendance: [
		{
			player_id: 1,
			display_name: "Joao",
			wins: 1,
			draws: 0,
			losses: 2,
			matches: 3,
			rating: 5,
			goals: 4,
			assists: 0,
		},
		{
			player_id: 2,
			display_name: "Pedro",
			wins: 1,
			draws: 0,
			losses: 2,
			matches: 3,
			rating: 3,
			goals: 6,
			assists: 0,
		},
	],
	players: [
		{ id: 1, rating: 5, nickname: "Joao", display_name: "Joao" },
		{ id: 2, rating: 3, nickname: "Pedro", display_name: "Pedro" },
		{ id: 3, rating: 4.9, nickname: "A", display_name: "A" },
		{ id: 4, rating: 4.8, nickname: "B", display_name: "B" },
		{ id: 5, rating: 4.7, nickname: "C", display_name: "C" },
		{ id: 6, rating: 4.6, nickname: "D", display_name: "D" },
		{ id: 7, rating: 4.5, nickname: "E", display_name: "E" },
		{ id: 8, rating: 4.4, nickname: "F", display_name: "F" },
		{ id: 9, rating: 4.3, nickname: "G", display_name: "G" },
		{ id: 10, rating: 4.2, nickname: "H", display_name: "H" },
		{ id: 11, rating: 4.1, nickname: "I", display_name: "I" },
	],
	presentPlayerIds: null,
	ratingDropGoalShare: true,
	ratingDropShareExcludeTop: true,
	teams: [
		{
			id: 10,
			color: "#ffffff",
			sort_order: 0,
			players: [{ player_id: 1 }, { player_id: 2 }],
		},
	],
});
check(excludeTopPreview[0]?.to, 4.6, "top 1 nao amortece com exclude");
check(excludeTopPreview[1]?.to, 2.8, "fora do top ainda amortece");

console.log("event-rating-adjustment ok");
