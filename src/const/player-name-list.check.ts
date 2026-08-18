import {
	PLAYER_NAME_LIST,
	parsePlayerNameList,
	playerNameListInputValue,
} from "./player-name-list.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

const pasted = [
	"1. Vitinho ✅",
	"2. Murilo ✅",
	"3. Ivan ✅",
	"4. Alberto ✅",
	"5. Jadson ✅",
	"6. GBA✅",
	"7. Luis Otávio ✅",
	"8. Arthur ✅",
	"9. Antonio Vitor✅",
	"10. Hugo ✅",
	"11. Danrley ✅",
	"12. will ✅",
	"13. Gustavo Dourado ✅",
	"14. Joeliton (goleiro) ✅",
	"15. Gildeon",
	"16. Huston✅",
	"17. Eric ( Huston )✅",
	"18. Jay✅",
	"19. Jean (modo matador) ✅",
	"20. \u2060Jerferson✅",
].join("\n");

check(
	parsePlayerNameList(pasted).join("|") ===
		[
			"Vitinho",
			"Murilo",
			"Ivan",
			"Alberto",
			"Jadson",
			"GBA",
			"Luis Otávio",
			"Arthur",
			"Antonio Vitor",
			"Hugo",
			"Danrley",
			"will",
			"Gustavo Dourado",
			"Joeliton (goleiro)",
			"Gildeon",
			"Huston",
			"Eric ( Huston )",
			"Jay",
			"Jean (modo matador)",
			"Jerferson",
		].join("|"),
	"whatsapp numbered list",
);

check(
	PLAYER_NAME_LIST.placeholder.includes("Um nome por linha"),
	"placeholder hint",
);
check(
	PLAYER_NAME_LIST.inputPlaceholder === "Nome, ou cole a lista",
	"input placeholder",
);
check(PLAYER_NAME_LIST.separator === ", ", "list separator");

check(parsePlayerNameList("Vitinho").join("|") === "Vitinho", "single name");
check(parsePlayerNameList("  ").length === 0, "blank");
check(parsePlayerNameList("1. ✅").length === 0, "emoji only");
check(
	parsePlayerNameList("1) Vitinho\n2- Murilo").join("|") === "Vitinho|Murilo",
	"paren and dash prefixes",
);
check(
	parsePlayerNameList("1. Vitinho ✅\n2. Vitinho ✅").join("|") === "Vitinho",
	"dedupe paste",
);
check(
	parsePlayerNameList("1. Vitinho\r\n2. Murilo").join("|") === "Vitinho|Murilo",
	"crlf",
);
check(
	parsePlayerNameList("Vitinho, Murilo").join("|") === "Vitinho|Murilo",
	"comma list",
);
check(
	parsePlayerNameList("1. Vitinho ✅, 2. Murilo ✅").join("|") ===
		"Vitinho|Murilo",
	"comma numbered list",
);
check(
	playerNameListInputValue(pasted) ===
		parsePlayerNameList(pasted).join(PLAYER_NAME_LIST.separator),
	"paste into input keeps cleaned names",
);
check(
	playerNameListInputValue("1. Vitinho ✅") === "Vitinho",
	"paste numbered line cleans",
);
check(playerNameListInputValue("Vitinho") === "Vitinho", "paste plain name");

console.log("player-name-list ok");
