import { AUDIT_PAGE_SIZE, type AuditAction } from "@/const/championship-audit";
import { supabase } from "@/lib/supabase";
import { optionalNumber, optionalRecord } from "@/lib/unknown-value";
import type { ChampionshipAuditLog } from "@/types/championship-audit";

export type ChampionshipAuditPage = {
	rows: ChampionshipAuditLog[];
	nextCursor: number | null;
};

function asAuditLog(value: unknown): ChampionshipAuditLog {
	if (!value || typeof value !== "object") {
		throw new Error("audit log: invalid payload");
	}

	const row = value as Record<string, unknown>;
	if (typeof row.id !== "number" || typeof row.action !== "string") {
		throw new Error("audit log: invalid payload");
	}

	return {
		id: row.id,
		championshipId: Number(row.championship_id),
		actorDisplayName: String(row.actor_display_name ?? ""),
		action: row.action,
		entityType: String(row.entity_type ?? ""),
		entityId: optionalNumber(row.entity_id),
		beforeData: optionalRecord(row.before_data),
		afterData: optionalRecord(row.after_data),
		createdAt: String(row.created_at ?? ""),
	};
}

export async function listChampionshipAuditLogs(
	championshipId: number,
	action: AuditAction | null,
	cursor: number | null,
): Promise<ChampionshipAuditPage> {
	const { data, error } = await supabase.rpc("list_championship_audit_logs", {
		p_championship_id: championshipId,
		p_action: action,
		p_before_id: cursor,
		p_page_size: AUDIT_PAGE_SIZE,
	});

	if (error) {
		throw error;
	}

	const rows = Array.isArray(data) ? data.map(asAuditLog) : [];
	const last = rows[rows.length - 1];
	const nextCursor = rows.length === AUDIT_PAGE_SIZE && last ? last.id : null;

	return { rows, nextCursor };
}
