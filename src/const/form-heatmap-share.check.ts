import type { ChampionshipPlayer } from "../types/championship.ts";
import {
	FORM_HEATMAP_CELL,
	type FormHeatmapGrid,
} from "./championship-form-heatmap.ts";
import {
	FORM_HEATMAP_SHARE,
	FORM_HEATMAP_SHARE_LABEL,
	formHeatmapShareBarWidth,
	formHeatmapShareCard,
	formHeatmapShareColumnWidth,
	formHeatmapShareContext,
	formHeatmapShareDrawsCell,
	formHeatmapShareFileName,
	formHeatmapShareImageHeight,
	formHeatmapShareImageWidth,
	formHeatmapShareLegalName,
	formHeatmapShareText,
} from "./form-heatmap-share.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

function player(
	id: number,
	name: string,
	nickname: string | null = null,
): ChampionshipPlayer {
	return {
		id,
		championship_id: 1,
		user_id: null,
		display_name: name,
		nickname,
		nickname_tags: [],
		avatar_url: null,
		rating: 5,
		role: "player",
		is_goalkeeper: false,
		is_monthly: false,
		deleted_at: null,
		goals: 0,
		assists: 0,
		assisted_goals: 0,
		own_goals: 0,
		wins: 0,
		losses: 0,
		draws: 0,
		matches: 0,
		mvps: 0,
	};
}

const grid: FormHeatmapGrid = {
	columns: [
		{ eventId: 1, startsAt: "2026-08-12T22:00:00.000Z" },
		{ eventId: 2, startsAt: "2026-08-19T22:00:00.000Z" },
	],
	rows: [
		{
			player: player(1, "Gildevan Santos Coelho", "Gildevan"),
			aggregateRate: 0.8,
			matches: 6,
			cells: [
				{
					kind: FORM_HEATMAP_CELL.up,
					rate: 0.8,
					wins: 3,
					draws: 0,
					losses: 0,
					matches: 3,
				},
				{
					kind: FORM_HEATMAP_CELL.absent,
					rate: null,
					wins: 0,
					draws: 0,
					losses: 0,
					matches: 0,
				},
			],
		},
	],
	truncated: false,
};

const card = formHeatmapShareCard(
	grid,
	"Baba do Mago",
	"Últimas 5 · Mensalistas",
);
check(card.rows.length === 1, "one share row");
check(card.columns.length === 2, "two share columns");
check(card.columns[0]?.label === "12/08/2026", "full date label");
check(card.rows[0]?.name === "Gildevan", "visible name");
check(card.rows[0]?.legalName === "Gildevan Santos Coelho", "legal name");
check(
	formHeatmapShareLegalName(player(2, "Ana", null)) === null,
	"no legal when same",
);
check(formHeatmapShareDrawsCell(FORM_HEATMAP_CELL.up), "draws up");
check(!formHeatmapShareDrawsCell(FORM_HEATMAP_CELL.absent), "skips absent");
check(formHeatmapShareBarWidth(120) >= 48, "bar width");
check(
	formHeatmapShareContext(["Últimas 5", "Mensalistas"]) ===
		"Últimas 5 · Mensalistas",
	"share context",
);
check(
	formHeatmapShareText(card).includes("Heatmap de forma"),
	"share text title",
);
check(
	formHeatmapShareFileName({
		championshipName: "Baba do Mago",
		generatedAt: "2026-09-03T12:00:00.000Z",
	}).endsWith(".png"),
	"png file",
);
check(
	formHeatmapShareColumnWidth(5) >= FORM_HEATMAP_SHARE.columnMinWidth,
	"col width",
);
check(formHeatmapShareImageHeight(1) > FORM_HEATMAP_SHARE.headerHeight, "height");
check(formHeatmapShareImageWidth(5) >= FORM_HEATMAP_SHARE.width, "width");
check(FORM_HEATMAP_SHARE_LABEL.share === "Compartilhar", "share label");

console.log("form-heatmap-share.check.ts ok");
