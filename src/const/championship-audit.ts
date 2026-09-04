export const AUDIT_ACTION = {
	updatePlayerRating: "update_player_rating",
	updatePlayerGoalkeeperRating: "update_player_goalkeeper_rating",
	savePlayerEventStats: "save_player_event_stats",
	saveAttendanceStats: "save_attendance_stats",
	setEventMvps: "set_event_mvps",
	setPlayerRole: "set_player_role",
	mergePlayers: "merge_players",
	removePlayer: "remove_player",
	claimPlayer: "claim_player",
	unlinkPlayer: "unlink_player",
	transferOwner: "transfer_owner",
	updateEventConfig: "update_event_config",
	updateVisibility: "update_visibility",
	renameChampionship: "rename_championship",
	drawEventTeams: "draw_event_teams",
} as const;

export type AuditAction = (typeof AUDIT_ACTION)[keyof typeof AUDIT_ACTION];

export const AUDIT_ACTION_LABEL = {
	[AUDIT_ACTION.updatePlayerRating]: "Nota alterada",
	[AUDIT_ACTION.updatePlayerGoalkeeperRating]: "Nota goleiro alterada",
	[AUDIT_ACTION.savePlayerEventStats]: "Stats da rodada corrigidas",
	[AUDIT_ACTION.saveAttendanceStats]: "Stats da presença corrigidas",
	[AUDIT_ACTION.setEventMvps]: "MVP alterado",
	[AUDIT_ACTION.setPlayerRole]: "Papel alterado",
	[AUDIT_ACTION.mergePlayers]: "Jogadores mesclados",
	[AUDIT_ACTION.removePlayer]: "Jogador excluído",
	[AUDIT_ACTION.claimPlayer]: "Conta conectada",
	[AUDIT_ACTION.unlinkPlayer]: "Conta desconectada",
	[AUDIT_ACTION.transferOwner]: "Dono transferido",
	[AUDIT_ACTION.updateEventConfig]: "Configuração da rodada",
	[AUDIT_ACTION.updateVisibility]: "Visibilidade alterada",
	[AUDIT_ACTION.renameChampionship]: "Nome alterado",
	[AUDIT_ACTION.drawEventTeams]: "Times sorteados",
} as const;

export const AUDIT_ENTITY = {
	player: "player",
	event: "event",
	championship: "championship",
} as const;

export type AuditEntityType = (typeof AUDIT_ENTITY)[keyof typeof AUDIT_ENTITY];

export const AUDIT_LABEL = {
	title: "Auditoria",
	empty: "Nenhuma alteração registrada",
	action: "Ação",
	actor: "Quem",
	when: "Quando",
	allActions: "Todas as ações",
	loadMore: "Carregar mais",
	system: "Sistema",
} as const;

export const AUDIT_PAGE_SIZE = 30 as const;

export function nextAuditCursor(
	rows: readonly { id: number }[],
): number | null {
	if (rows.length !== AUDIT_PAGE_SIZE) {
		return null;
	}

	const last = rows[rows.length - 1];
	if (!last) {
		return null;
	}

	return last.id;
}

export const AUDIT_ACTION_OPTIONS = [
	{ id: null, label: AUDIT_LABEL.allActions },
	...Object.values(AUDIT_ACTION).map((id) => ({
		id,
		label: AUDIT_ACTION_LABEL[id],
	})),
] as const;

export function isAuditAction(value: string): value is AuditAction {
	return Object.values(AUDIT_ACTION).some((action) => action === value);
}

export function auditActionLabel(action: string): string {
	if (!isAuditAction(action)) {
		return action;
	}

	return AUDIT_ACTION_LABEL[action];
}

export function formatAuditSnapshot(value: unknown): string | null {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return null;
	}

	const entries = Object.entries(value as Record<string, unknown>).flatMap(
		([key, item]) => {
			if (item === null || item === undefined) {
				return [];
			}

			if (typeof item === "object") {
				return [];
			}

			return [`${key}: ${String(item)}`];
		},
	);
	if (entries.length === 0) {
		return null;
	}

	return entries.join(" · ");
}
