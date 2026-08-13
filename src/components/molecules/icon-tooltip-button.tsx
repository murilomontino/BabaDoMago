import type { ReactNode } from "react";
import { Button } from "@/components/button";
import { TOOLTIP_ID } from "@/const/tooltip";
import { BUTTON_VARIANT, type ButtonVariant } from "@/const/ui";

const ICON_TOOLTIP_BUTTON_CLASS = {
	primary: "px-2 !text-pitch-fg hover:!bg-pitch-soft",
	secondary: "px-2",
	danger: "px-2 !text-danger-fg hover:!bg-danger-soft",
	ghost: "px-2",
} as const;

type IconTooltipButtonProps = {
	label: string;
	icon: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	variant?: ButtonVariant;
	type?: "button" | "submit";
};

export function IconTooltipButton({
	label,
	icon,
	onClick,
	disabled,
	variant = BUTTON_VARIANT.secondary,
	type = "button",
}: IconTooltipButtonProps) {
	return (
		<span data-tooltip-id={TOOLTIP_ID} data-tooltip-content={label}>
			<Button
				type={type}
				variant={BUTTON_VARIANT.ghost}
				aria-label={label}
				onClick={onClick}
				disabled={disabled}
				className={ICON_TOOLTIP_BUTTON_CLASS[variant]}
			>
				{icon}
			</Button>
		</span>
	);
}
