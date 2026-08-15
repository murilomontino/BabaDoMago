import {
	BUTTON_CLASS,
	BUTTON_ICON_CLASS,
	BUTTON_VARIANT,
	buttonClassName,
	ICON_BUTTON_SIZE_CLASS,
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

console.log("ui ok");
