import type { ReactNode } from "react";
import { skeletonClassName } from "@/const/skeleton";

type SkeletonProps = {
	className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
	return <div className={skeletonClassName(className)} aria-hidden />;
}

type SkeletonRegionProps = {
	label: string;
	className?: string;
	children: ReactNode;
};

export function SkeletonRegion({
	label,
	className,
	children,
}: SkeletonRegionProps) {
	return (
		<div
			role="status"
			aria-busy="true"
			aria-label={label}
			className={className}
		>
			{children}
		</div>
	);
}
