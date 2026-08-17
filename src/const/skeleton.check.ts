import { CHAMPIONSHIP_EVENT } from "./championship-event.ts";
import {
	LIST_ROW_SKELETON_VARIANT,
	SKELETON_LABEL,
	SKELETON_LIST_ROWS,
	SKELETON_TABLE_ROWS,
	SKELETON_TEAM_CARDS,
	SKELETON_TEAM_SLOTS,
	skeletonClassName,
	skeletonStatHeaders,
} from "./skeleton.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

check(SKELETON_LIST_ROWS.length === 4, "list rows");
check(SKELETON_TABLE_ROWS.length === 6, "table rows");
check(SKELETON_TEAM_CARDS.length === 3, "team cards");
check(
	SKELETON_TEAM_SLOTS.length === CHAMPIONSHIP_EVENT.playersPerTeamDefault,
	"team slots match default roster",
);
check(
	LIST_ROW_SKELETON_VARIANT.championship === "championship",
	"championship row variant",
);
check(LIST_ROW_SKELETON_VARIANT.event === "event", "event row variant");
check(SKELETON_LABEL.session === "Carregando sessão", "session label");
check(SKELETON_LABEL.championships === "Carregando campeonatos", "list label");
check(SKELETON_LABEL.championship === "Carregando campeonato", "detail label");
check(SKELETON_LABEL.events === "Carregando rodadas", "events label");
check(SKELETON_LABEL.event === "Carregando rodada", "event label");
check(SKELETON_LABEL.match === "Carregando partida", "match label");
check(SKELETON_LABEL.player === "Carregando perfil", "player label");
check(SKELETON_LABEL.chart === "Carregando gráfico", "chart label");
check(SKELETON_LABEL.podium === "Carregando pódio", "podium label");
check(SKELETON_LABEL.logoCrop === "Carregando recorte", "logo crop label");
check(skeletonClassName().includes("animate-pulse"), "pulse class");
check(skeletonClassName("h-8").includes("h-8"), "merges class");
check(
	skeletonStatHeaders(["a", "b", "c", "d"], true).join(",") === "c,d",
	"skip player columns",
);
check(
	skeletonStatHeaders(["a", "b", "c"], false).join(",") === "b,c",
	"skip name column",
);

console.log("skeleton ok");
