import {
	confirmClaimPlayerMessage,
	PLAYER_LABEL,
	PLAYER_NICKNAME,
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

console.log("player-name ok");
