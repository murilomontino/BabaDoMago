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
	withLabel:
		"h-11 w-auto gap-1.5 px-2.5 text-xs font-medium sm:h-9",
	expandOnMobile:
		"h-11 w-full min-w-0 justify-center gap-1.5 px-2 text-xs font-medium md:size-10 md:gap-0 md:p-0",
} as const;

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

export const PAGE_SHELL_CLASS = "mx-auto max-w-7xl px-4 py-8 sm:px-6";

export const CARD_CLASS =
	"rounded-xl border border-line bg-surface p-4 shadow-sm";

export const MODAL_CLASS =
	"w-full max-w-lg rounded-xl bg-surface p-4 shadow-lg";

export const CHIP_CLASS =
	"rounded bg-surface-muted px-1.5 py-0.5 text-xs font-medium tabular-nums text-fg-muted";

export const PLAYER_AVATAR_CLASS = "ml-2 size-10 shrink-0 md:ml-0 md:size-9";

export function buttonClassName(
	variant: ButtonVariant,
	className?: string,
): string {
	if (!className) {
		return BUTTON_CLASS[variant];
	}

	return `${BUTTON_CLASS[variant]} ${className}`;
}
