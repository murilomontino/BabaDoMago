import type { ReactNode } from "react";

type PageHeaderProps = {
	title: string;
	description?: string;
	action?: ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
	return (
		<div className="mb-6 flex items-start justify-between gap-4">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight text-fg">
					{title}
				</h1>
				{description && (
					<p className="mt-1 text-sm text-fg-muted">{description}</p>
				)}
			</div>
			{action}
		</div>
	);
}
