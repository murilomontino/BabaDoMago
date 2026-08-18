import {
	ariaHiddenWhenUnlabelled,
	BUTTON_CLASS,
	BUTTON_ICON_CLASS,
	BUTTON_VARIANT,
	buttonClassName,
	ICON_BUTTON_SIZE_CLASS,
	PLAYER_KIND_SELECT_CLASS,
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

console.log("ui ok");
