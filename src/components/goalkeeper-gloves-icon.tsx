type GoalkeeperGlovesIconProps = {
	className?: string;
	"aria-label"?: string;
};

export function GoalkeeperGlovesIcon({
	className,
	"aria-label": ariaLabel,
}: GoalkeeperGlovesIconProps) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden={ariaLabel ? undefined : true}
			aria-label={ariaLabel}
			focusable="false"
		>
			<path d="M8 21h8v-4H8z" />
			<path d="M9 17V9a1.5 1.5 0 0 1 3 0v8" />
			<path d="M12 17V7.5a1.5 1.5 0 0 1 3 0V17" />
			<path d="M15 17v-7a1.5 1.5 0 0 1 3 0v7" />
			<path d="M8.5 16c-2.2-1-3.2-3.2-2-5.2 1.8.2 2.8 2.2 2.5 4.2" />
		</svg>
	);
}
