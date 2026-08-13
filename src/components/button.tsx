import type { ButtonHTMLAttributes } from "react";
import {
	BUTTON_VARIANT,
	type ButtonVariant,
	buttonClassName,
} from "@/const/ui";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: ButtonVariant;
};

export function Button({
	variant = BUTTON_VARIANT.primary,
	className,
	type = "button",
	children,
	...props
}: ButtonProps) {
	return (
		<button
			{...props}
			type={type}
			className={buttonClassName(variant, className)}
		>
			{children}
		</button>
	);
}
