import { ScrollText } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { SectionCard } from "@/components/section-card";
import {
	AUDIT_ACTION_OPTIONS,
	AUDIT_LABEL,
	type AuditAction,
	auditActionLabel,
	formatAuditSnapshot,
	isAuditAction,
} from "@/const/championship-audit";
import { formatEventStartsAt } from "@/const/championship-event";
import { BUTTON_VARIANT, ERROR_CLASS, FIELD_CLASS } from "@/const/ui";
import {
	CHAMPIONSHIP_AUDIT_QUERY_KEY,
	useChampionshipAuditLogs,
} from "@/hooks/championships/use-championship-audit-logs";

type ChampionshipAuditLogProps = {
	championshipId: number;
};

export function ChampionshipAuditLog({
	championshipId,
}: ChampionshipAuditLogProps) {
	const [action, setAction] = useState<AuditAction | null>(null);
	const query = useChampionshipAuditLogs(championshipId, action);
	const rows = useMemo(
		() => query.data?.pages.flatMap((page) => page.rows) ?? [],
		[query.data],
	);

	return (
		<SectionCard
			title={AUDIT_LABEL.title}
			icon={<ScrollText className="size-4 text-pitch-fg" />}
			queryKey={CHAMPIONSHIP_AUDIT_QUERY_KEY}
			action={
				<label className="block min-w-40 text-xs font-medium text-fg-muted">
					{AUDIT_LABEL.action}
					<select
						value={action ?? ""}
						className={`mt-1 ${FIELD_CLASS}`}
						onChange={(event) => {
							const next = event.target.value;
							if (!next) {
								setAction(null);
								return;
							}

							if (!isAuditAction(next)) {
								return;
							}

							setAction(next);
						}}
					>
						{AUDIT_ACTION_OPTIONS.map((option) => (
							<option key={option.id ?? "all"} value={option.id ?? ""}>
								{option.label}
							</option>
						))}
					</select>
				</label>
			}
		>
			{query.isError && <p className={ERROR_CLASS}>{query.error.message}</p>}
			{!query.isError && rows.length === 0 && !query.isPending && (
				<EmptyState
					icon={<ScrollText className="size-10" />}
					title={AUDIT_LABEL.empty}
				/>
			)}
			{rows.length > 0 && (
				<ul className="space-y-2">
					{rows.map((row) => {
						const when = formatEventStartsAt(row.createdAt);
						const after = formatAuditSnapshot(row.afterData);
						const before = formatAuditSnapshot(row.beforeData);

						return (
							<li
								key={row.id}
								className="rounded-xl border border-line bg-surface px-4 py-3"
							>
								<p className="text-sm font-semibold text-fg">
									{auditActionLabel(row.action)}
								</p>
								<p className="mt-1 text-xs text-fg-muted">
									{row.actorDisplayName || AUDIT_LABEL.system} · {when.date} ·{" "}
									{when.time}
								</p>
								{after && <p className="mt-2 text-sm text-fg">{after}</p>}
								{before && !after && (
									<p className="mt-2 text-sm text-fg-muted">{before}</p>
								)}
							</li>
						);
					})}
				</ul>
			)}
			{query.hasNextPage && (
				<div className="mt-4 flex justify-end">
					<Button
						variant={BUTTON_VARIANT.secondary}
						disabled={query.isFetchingNextPage}
						onClick={() => {
							void query.fetchNextPage();
						}}
					>
						{AUDIT_LABEL.loadMore}
					</Button>
				</div>
			)}
		</SectionCard>
	);
}
