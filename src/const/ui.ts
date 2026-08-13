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
	secondary: `${BUTTON_BASE} border border-stone-300 bg-white text-stone-800 hover:bg-stone-50`,
	danger: `${BUTTON_BASE} border border-red-300 bg-white text-red-700 hover:bg-red-50`,
	ghost: `${BUTTON_BASE} text-stone-700 hover:bg-stone-100`,
};

export const FIELD_CLASS =
	"w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-pitch focus:outline-none focus:ring-2 focus:ring-pitch/20";

export const ERROR_CLASS = "text-sm text-red-600";

export function buttonClassName(
	variant: ButtonVariant,
	className?: string,
): string {
	if (!className) {
		return BUTTON_CLASS[variant];
	}

	return `${BUTTON_CLASS[variant]} ${className}`;
}
