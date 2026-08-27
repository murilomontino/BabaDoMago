import type { QueryKey } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { QueryRefresh, QueryRefreshButton } from "@/components/query-refresh";
import { CARD_CLASS } from "@/const/ui";

type SectionCardProps = {
	title: string;
	icon?: ReactNode;
	action?: ReactNode;
	queryKey?: QueryKey;
	children: ReactNode;
};

export function SectionCard({
	title,
	icon,
	action,
	queryKey,
	children,
}: SectionCardProps) {
	return (
		<section className={CARD_CLASS}>
			<div className="mb-4 flex items-center gap-2 text-fg">
				{icon}
				<h2 className="text-sm font-semibold tracking-tight">{title}</h2>
				{(queryKey || action) && (
					<div className="ml-auto flex items-center gap-2">
						{queryKey && <QueryRefreshButton queryKey={queryKey} />}
						{action}
					</div>
				)}
			</div>
			{queryKey && <QueryRefresh queryKey={queryKey}>{children}</QueryRefresh>}
			{!queryKey && children}
		</section>
	);
}
