import {
	ariaHiddenWhenUnlabelled,
	BUTTON_CLASS,
	BUTTON_ICON_CLASS,
	BUTTON_VARIANT,
	buttonClassName,
	ICON_BUTTON_SIZE_CLASS,
	PAGE_SHELL_CLASS,
	PLAYER_KIND_SELECT_CLASS,
	SAFE_AREA_BANNER_CLASS,
	SAFE_AREA_CLASS,
	SAFE_AREA_FAB_CLASS,
} from "./ui.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

check(BUTTON_ICON_CLASS === "[&_svg]:size-5", "button icon size");
check(ICON_BUTTON_SIZE_CLASS.iconOnly.includes("size-10"), "icon hit size");
check(ICON_BUTTON_SIZE_CLASS.expandOnMobile.includes("h-11"), "expand height");
check(
	BUTTON_CLASS[BUTTON_VARIANT.primary].includes("min-h-11"),
	"button min height",
);
check(
	buttonClassName(BUTTON_VARIANT.primary).includes(BUTTON_ICON_CLASS),
	"button uses icon size",
);
check(ariaHiddenWhenUnlabelled(undefined) === true, "hidden without label");
check(ariaHiddenWhenUnlabelled("Gol") === undefined, "labelled stays visible");
check(PLAYER_KIND_SELECT_CLASS.on.includes("bg-pitch-soft"), "kind select on");
check(
	PLAYER_KIND_SELECT_CLASS.off.includes("bg-surface-muted"),
	"kind select off",
);
check(SAFE_AREA_CLASS.includes("safe-area-inset-bottom"), "safe area padding");
check(SAFE_AREA_CLASS.includes("max(1.25rem"), "safe area keeps padding");
check(SAFE_AREA_FAB_CLASS.includes("safe-area-inset-bottom"), "fab safe area");
check(PAGE_SHELL_CLASS.includes(SAFE_AREA_CLASS), "page shell safe area");
check(PAGE_SHELL_CLASS.includes("px-5"), "page shell mobile padding");
// pt/pr/pb/pl vencem py/px, então nenhum lado pode ficar com env() cru.
for (const side of ["pt", "pb", "pl", "pr"]) {
	check(
		!new RegExp(`\\b${side}-\\[env\\(`).test(SAFE_AREA_CLASS),
		`${side} needs a max() floor`,
	);
}
check(
	!PAGE_SHELL_CLASS.includes("py-"),
	"page shell vertical comes from safe area",
);
check(SAFE_AREA_BANNER_CLASS.includes("md:bottom-"), "banner clears the fab");

console.log("ui ok");
