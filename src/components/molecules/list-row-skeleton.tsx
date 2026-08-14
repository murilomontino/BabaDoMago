import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/atoms/skeleton";
import {
	LIST_ROW_SKELETON_VARIANT,
	type ListRowSkeletonVariant,
} from "@/const/skeleton";

type ListRowSkeletonProps = {
	variant?: ListRowSkeletonVariant;
};

export function ListRowSkeleton({
	variant = LIST_ROW_SKELETON_VARIANT.championship,
}: ListRowSkeletonProps) {
	switch (variant) {
		case LIST_ROW_SKELETON_VARIANT.championship:
			return (
				<li className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-sm">
					<Skeleton className="h-10 w-10 shrink-0 rounded-full" />
					<Skeleton className="h-5 w-40" />
					<ChevronRight className="ml-auto size-4 text-fg-subtle" />
				</li>
			);
		case LIST_ROW_SKELETON_VARIANT.event:
			return (
				<li className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-sm">
					<div className="min-w-0 flex-1">
						<Skeleton className="h-5 w-36" />
						<Skeleton className="mt-1 h-5 w-16 rounded" />
					</div>
					<span className="inline-flex items-center gap-1 text-sm font-medium text-fg-muted">
						Ver detalhes
						<ChevronRight className="size-4 text-fg-subtle" />
					</span>
				</li>
			);
		default: {
			const _exhaustive: never = variant;
			return _exhaustive;
		}
	}
}
