import {
	comparePlayersByVisibleName,
	confirmClaimPlayerMessage,
	PLAYER_KIND,
	PLAYER_KIND_LABEL,
	PLAYER_KIND_OPTIONS,
	PLAYER_LABEL,
	PLAYER_NICKNAME,
	isGoalkeeperKind,
	playerKindFromGoalkeeper,
	playerVisibleName,
} from "./player-name.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

check(PLAYER_NICKNAME.maxLength === 40, "nickname max");
check(PLAYER_LABEL.nickname === "Apelido", "nickname label");
check(
	PLAYER_LABEL.nicknamePlaceholder === "Apelido no baba",
	"nickname placeholder",
);
check(PLAYER_LABEL.eventStats === "Stats da rodada", "event stats label");
check(PLAYER_LABEL.player === "Jogador", "player label");
check(PLAYER_LABEL.goalkeeper === "Goleiro", "goalkeeper label");
check(
	PLAYER_KIND_LABEL[PLAYER_KIND.player] === PLAYER_LABEL.player,
	"player kind label",
);
check(
	PLAYER_KIND_LABEL[PLAYER_KIND.goalkeeper] === PLAYER_LABEL.goalkeeper,
	"goalkeeper kind label",
);
check(PLAYER_KIND_OPTIONS.join(",") === "player,goalkeeper", "kind options");
check(
	playerKindFromGoalkeeper(true) === PLAYER_KIND.goalkeeper,
	"kind from goalkeeper",
);
check(
	playerKindFromGoalkeeper(false) === PLAYER_KIND.player,
	"kind from player",
);
check(isGoalkeeperKind(PLAYER_KIND.goalkeeper), "goalkeeper kind");
check(!isGoalkeeperKind(PLAYER_KIND.player), "player kind");

check(
	playerVisibleName({ nickname: "Vitinho", display_name: "Murilo" }) ===
		"Vitinho",
	"nickname wins",
);
check(
	playerVisibleName({ nickname: "  Vitinho  ", display_name: "Murilo" }) ===
		"Vitinho",
	"nickname trims",
);
check(
	playerVisibleName({ nickname: null, display_name: "Murilo" }) === "Murilo",
	"null falls back",
);
check(
	playerVisibleName({ nickname: "   ", display_name: "Murilo" }) === "Murilo",
	"blank falls back",
);
check(
	playerVisibleName({ nickname: "", display_name: "Murilo" }) === "Murilo",
	"empty falls back",
);

check(
	confirmClaimPlayerMessage("Vitinho") === "Você é Vitinho?",
	"claim confirm message",
);

check(
	[
		{ nickname: "Zeca", display_name: "A" },
		{ nickname: null, display_name: "Ana" },
		{ nickname: "  bruno  ", display_name: "Carlos" },
	]
		.sort(comparePlayersByVisibleName)
		.map(playerVisibleName)
		.join(",") === "Ana,bruno,Zeca",
	"sorts by visible name",
);

console.log("player-name ok");
