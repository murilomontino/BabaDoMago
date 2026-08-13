import type { ReactNode } from "react";

type EmptyStateProps = {
	icon: ReactNode;
	title: string;
	description?: string;
	action?: ReactNode;
};

export function EmptyState({
	icon,
	title,
	description,
	action,
}: EmptyStateProps) {
	return (
		<div className="flex flex-col items-center rounded-xl border border-dashed border-line bg-surface px-6 py-12 text-center">
			<div className="mb-3 text-pitch-fg">{icon}</div>
			<p className="font-semibold tracking-tight text-fg">{title}</p>
			{description && (
				<p className="mt-1 text-sm text-fg-muted">{description}</p>
			)}
			{action && <div className="mt-4">{action}</div>}
		</div>
	);
}
