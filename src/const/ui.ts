export const BUTTON_VARIANT = {
	primary: "primary",
	secondary: "secondary",
	danger: "danger",
	ghost: "ghost",
} as const;

export type ButtonVariant =
	(typeof BUTTON_VARIANT)[keyof typeof BUTTON_VARIANT];

const BUTTON_BASE =
	"inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50";

export const BUTTON_CLASS: Record<ButtonVariant, string> = {
	primary: `${BUTTON_BASE} bg-pitch text-white hover:bg-pitch-dark`,
	secondary: `${BUTTON_BASE} border border-line bg-surface text-fg hover:bg-surface-muted`,
	danger: `${BUTTON_BASE} border border-danger-fg/40 bg-surface text-danger-fg hover:bg-danger-soft`,
	ghost: `${BUTTON_BASE} text-fg-muted hover:bg-surface-muted`,
};

export const FIELD_CLASS =
	"h-9 w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-sm leading-5 text-fg placeholder:text-fg-subtle focus:border-pitch focus:outline-none focus:ring-2 focus:ring-pitch/20";

export const ERROR_CLASS = "text-sm text-danger";

export const PAGE_SHELL_CLASS = "mx-auto max-w-7xl px-4 py-8 sm:px-6";

export const CARD_CLASS =
	"rounded-xl border border-line bg-surface p-4 shadow-sm";

export const MODAL_CLASS =
	"w-full max-w-lg rounded-xl bg-surface p-4 shadow-lg";

export const CHIP_CLASS =
	"rounded bg-surface-muted px-1.5 py-0.5 text-xs font-medium tabular-nums text-fg-muted";

export function buttonClassName(
	variant: ButtonVariant,
	className?: string,
): string {
	if (!className) {
		return BUTTON_CLASS[variant];
	}

	return `${BUTTON_CLASS[variant]} ${className}`;
}
