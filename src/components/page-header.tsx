import type { QueryKey } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { QueryRefreshButton } from "@/components/query-refresh";

type PageHeaderProps = {
	title: string;
	description?: string;
	action?: ReactNode;
	queryKey?: QueryKey;
};

export function PageHeader({
	title,
	description,
	action,
	queryKey,
}: PageHeaderProps) {
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
			{(queryKey || action) && (
				<div className="flex shrink-0 items-center gap-2">
					{queryKey && <QueryRefreshButton queryKey={queryKey} />}
					{action}
				</div>
			)}
		</div>
	);
}
