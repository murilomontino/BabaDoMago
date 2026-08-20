export const BUTTON_VARIANT = {
	primary: "primary",
	secondary: "secondary",
	danger: "danger",
	ghost: "ghost",
} as const;

export type ButtonVariant =
	(typeof BUTTON_VARIANT)[keyof typeof BUTTON_VARIANT];

export const BUTTON_ICON_CLASS = "[&_svg]:size-5";

export const ICON_BUTTON_SIZE_CLASS = {
	iconOnly: "size-10 p-0",
	withLabel: "h-11 w-auto gap-1.5 px-2.5 text-xs font-medium sm:h-9",
	expandOnMobile:
		"h-11 w-full min-w-0 justify-center gap-1.5 px-2 text-xs font-medium md:size-10 md:gap-0 md:p-0",
} as const;

export const SECTION_ACTION_HEADER_CLASS =
	"mb-1 flex flex-col gap-2 md:flex-row md:items-center";

export const SECTION_ACTION_GROUP_CLASS =
	"grid w-full min-w-0 grid-cols-2 gap-1 [&>button]:min-w-0 [&>button]:w-full md:ml-auto md:flex md:w-auto md:[&>button]:w-auto";

const BUTTON_BASE = `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${BUTTON_ICON_CLASS}`;

export const BUTTON_CLASS: Record<ButtonVariant, string> = {
	primary: `${BUTTON_BASE} bg-pitch text-white hover:bg-pitch-dark`,
	secondary: `${BUTTON_BASE} border border-line bg-surface text-fg hover:bg-surface-muted`,
	danger: `${BUTTON_BASE} border border-danger-fg/40 bg-surface text-danger-fg hover:bg-danger-soft`,
	ghost: `${BUTTON_BASE} text-fg-muted hover:bg-surface-muted`,
};

export const FIELD_CLASS =
	"h-9 w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-sm leading-5 text-fg placeholder:text-fg-subtle focus:border-pitch focus:outline-none focus:ring-2 focus:ring-pitch/20";

export const STAT_FIELD_CLASS =
	"h-11 w-full rounded-xl border border-line bg-surface px-2 text-center text-base font-medium tabular-nums text-fg [appearance:textfield] focus:border-pitch focus:outline-none focus:ring-2 focus:ring-pitch/20 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export const ERROR_CLASS = "text-sm text-danger";

// Cada lado usa max() porque pt/pr/pb/pl vencem py/px na ordem do Tailwind:
// um env() cru zeraria o respiro nos aparelhos sem inset.
export const SAFE_AREA_CLASS =
	"pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))]";

export const SAFE_AREA_FAB_CLASS =
	"right-[max(1.25rem,env(safe-area-inset-right))] bottom-[calc(1.25rem+env(safe-area-inset-bottom))]";

// ponytail: o recuo abaixo de md é a altura do stack de SAFE_AREA_FAB_CLASS
// medida à mão. Se o FAB crescer, virar um layout com rodapé próprio.
export const SAFE_AREA_BANNER_CLASS =
	"bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-[calc(1.25rem+env(safe-area-inset-bottom))]";

export const PAGE_SHELL_CLASS = `mx-auto max-w-7xl px-5 sm:px-6 ${SAFE_AREA_CLASS}`;

export const CARD_CLASS =
	"rounded-xl border border-line bg-surface p-4 shadow-sm";

export const MODAL_CLASS =
	"w-full max-w-lg rounded-xl bg-surface p-4 shadow-lg";

export const CHIP_CLASS =
	"rounded bg-surface-muted px-1.5 py-0.5 text-xs font-medium tabular-nums text-fg-muted";

export const PLAYER_AVATAR_CLASS = "ml-2 size-10 shrink-0 md:ml-0 md:size-9";

const PLAYER_KIND_SELECT_BASE =
	"mt-1 h-6 cursor-pointer rounded-full border-0 px-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pitch/20";

export const PLAYER_KIND_SELECT_CLASS = {
	on: `${PLAYER_KIND_SELECT_BASE} bg-pitch-soft text-pitch-fg`,
	off: `${PLAYER_KIND_SELECT_BASE} bg-surface-muted text-fg-muted`,
} as const;

export function buttonClassName(
	variant: ButtonVariant,
	className?: string,
): string {
	if (!className) {
		return BUTTON_CLASS[variant];
	}

	return `${BUTTON_CLASS[variant]} ${className}`;
}

export function ariaHiddenWhenUnlabelled(
	ariaLabel: string | undefined,
): true | undefined {
	if (ariaLabel) {
		return undefined;
	}

	return true;
}
