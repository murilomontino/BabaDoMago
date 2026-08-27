import { AUDIT_LABEL } from "@/const/championship-audit";
import {
	eventTeamDrawCountLabel,
	formatEventStartsAt,
} from "@/const/championship-event";
import { ERROR_CLASS } from "@/const/ui";
import { useChampionshipEventDrawLogs } from "@/hooks/championships/use-championship-audit-logs";

type EventTeamDrawLogProps = {
	championshipId: number;
	eventId: number;
	showWhenEmpty?: boolean;
	compact?: boolean;
};

export function EventTeamDrawLog({
	championshipId,
	eventId,
	showWhenEmpty = false,
	compact = false,
}: EventTeamDrawLogProps) {
	const query = useChampionshipEventDrawLogs(championshipId, eventId);
	const rows = query.data ?? [];

	if (query.isError && compact) {
		return (
			<p className={`truncate text-center text-xs ${ERROR_CLASS}`}>
				{query.error.message}
			</p>
		);
	}

	if (query.isError) {
		return <p className={`mt-2 ${ERROR_CLASS}`}>{query.error.message}</p>;
	}

	if (rows.length === 0 && !showWhenEmpty) {
		return null;
	}

	if (compact) {
		return (
			<p className="truncate text-center text-xs font-medium text-fg">
				{eventTeamDrawCountLabel(rows.length)}
			</p>
		);
	}

	return (
		<div className="mt-2">
			<p className="text-xs font-medium text-fg">
				{eventTeamDrawCountLabel(rows.length)}
			</p>
			{rows.length > 0 && (
				<ul className="mt-1 space-y-0.5">
					{rows.map((row) => {
						const when = formatEventStartsAt(row.createdAt);
						const actor = row.actorDisplayName || AUDIT_LABEL.system;

						return (
							<li key={row.id} className="text-xs text-fg-muted">
								{actor} · {when.date} · {when.time}
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
