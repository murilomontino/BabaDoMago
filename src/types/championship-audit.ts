export type ChampionshipAuditLog = {
	id: number;
	championshipId: number;
	actorDisplayName: string;
	action: string;
	entityType: string;
	entityId: number | null;
	beforeData: Record<string, unknown> | null;
	afterData: Record<string, unknown> | null;
	createdAt: string;
};
