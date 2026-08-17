import {
	DATA_TABLE_MOBILE_PRIMARY,
	DATA_TABLE_SORT,
	dataTableDefaultDesc,
	dataTableRowClickHandler,
	dataTableRowKeyDownHandler,
	dataTableSortDirectionLabel,
	mobileTableCellAbbr,
	splitMobileTableCells,
} from "./data-table.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

const cells = [
	{ column: { id: "present" } },
	{ column: { id: DATA_TABLE_MOBILE_PRIMARY.player } },
	{ column: { id: DATA_TABLE_MOBILE_PRIMARY.rating } },
	{ column: { id: "goals" } },
	{ column: { id: "actions" } },
];

const split = splitMobileTableCells(cells);
check(
	split.primary.map((cell) => cell.column.id).join(",") === "player,rating",
	"primary is player then rating",
);
check(
	split.stats.map((cell) => cell.column.id).join(",") === "present,goals",
	"stats keep visible order without primary or actions",
);
check(
	split.actions.map((cell) => cell.column.id).join(",") === "actions",
	"actions go last",
);

const missingRating = splitMobileTableCells([
	{ column: { id: "goals" } },
	{ column: { id: DATA_TABLE_MOBILE_PRIMARY.player } },
]);
check(
	missingRating.primary.map((cell) => cell.column.id).join(",") === "player",
	"primary skips missing rating",
);
check(
	missingRating.stats.map((cell) => cell.column.id).join(",") === "goals",
	"stats without player",
);
check(missingRating.actions.length === 0, "no actions when absent");

check(
	mobileTableCellAbbr("goals", [{ id: "goals", abbr: "G" }], "Gols") === "G",
	"abbr from legend",
);
check(
	mobileTableCellAbbr("actions", [], "Ações") === "Ações",
	"abbr falls back to title",
);
check(mobileTableCellAbbr("unknown", []) === "", "abbr empty without title");

check(DATA_TABLE_SORT.label === "Ordenar", "sort label");
check(DATA_TABLE_SORT.none === "Padrão", "sort none");
check(
	dataTableDefaultDesc(DATA_TABLE_MOBILE_PRIMARY.player) === false,
	"player sorts ascending",
);
check(dataTableDefaultDesc("goals") === true, "stats sort descending");
check(
	dataTableDefaultDesc(DATA_TABLE_MOBILE_PRIMARY.rating) === true,
	"rating sorts descending",
);

const clicked: string[] = [];
const click = dataTableRowClickHandler((row: string) => {
	clicked.push(row);
}, "a");
check(dataTableRowClickHandler(undefined, "a") === undefined, "no row handler");
click?.();
check(clicked.join(",") === "a", "row click fires");

const keys: string[] = [];
const keyDown = dataTableRowKeyDownHandler((row: string) => {
	keys.push(row);
}, "b");
keyDown?.({ key: "Tab", preventDefault: () => undefined });
check(keys.length === 0, "ignores other keys");
keyDown?.({ key: "Enter", preventDefault: () => undefined });
check(keys.join(",") === "b", "enter activates row");

check(dataTableSortDirectionLabel(true) === DATA_TABLE_SORT.desc, "desc label");
check(dataTableSortDirectionLabel(false) === DATA_TABLE_SORT.asc, "asc label");

console.log("data-table ok");
