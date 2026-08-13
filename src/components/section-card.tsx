import type { ReactNode } from "react";

type SectionCardProps = {
	title: string;
	icon?: ReactNode;
	action?: ReactNode;
	children: ReactNode;
};

export function SectionCard({
	title,
	icon,
	action,
	children,
}: SectionCardProps) {
	return (
		<section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
			<div className="mb-4 flex items-center gap-2 text-stone-800">
				{icon}
				<h2 className="text-sm font-semibold tracking-tight">{title}</h2>
				{action && (
					<div className="ml-auto flex items-center gap-2">{action}</div>
				)}
			</div>
			{children}
		</section>
	);
}
