import type { ReactNode } from "react";
import { CARD_CLASS } from "@/const/ui";

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
		<section className={CARD_CLASS}>
			<div className="mb-4 flex items-center gap-2 text-fg">
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
