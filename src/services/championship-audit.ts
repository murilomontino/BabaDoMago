import {
	AUDIT_ACTION,
	AUDIT_ENTITY,
	AUDIT_PAGE_SIZE,
	type AuditAction,
	nextAuditCursor,
} from "@/const/championship-audit";
import { supabase } from "@/lib/supabase";
import {
	mapUnknownRows,
	optionalNumber,
	optionalRecord,
} from "@/lib/unknown-value";
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

	const rows = mapUnknownRows(data, asAuditLog);
	const nextCursor = nextAuditCursor(rows);

	return { rows, nextCursor };
}

export async function listChampionshipEventDrawLogs(
	championshipId: number,
	eventId: number,
): Promise<ChampionshipAuditLog[]> {
	const { data, error } = await supabase
		.from("championship_audit_logs")
		.select(
			"id, championship_id, actor_display_name, action, entity_type, entity_id, before_data, after_data, created_at",
		)
		.eq("championship_id", championshipId)
		.eq("action", AUDIT_ACTION.drawEventTeams)
		.eq("entity_type", AUDIT_ENTITY.event)
		.eq("entity_id", eventId)
		.order("id", { ascending: false });

	if (error) {
		throw error;
	}

	return mapUnknownRows(data, asAuditLog);
}
