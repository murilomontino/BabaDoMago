export const CHAMPIONSHIP_QUOTA = {
	maxOwned: 3,
	exceededCode: "championship quota exceeded",
} as const;

export function ownedChampionshipCount(
	championships: readonly { created_by: string }[],
	userId: string,
): number {
	return championships.filter(
		(championship) => championship.created_by === userId,
	).length;
}

export function isChampionshipQuotaReached(ownedCount: number): boolean {
	return ownedCount >= CHAMPIONSHIP_QUOTA.maxOwned;
}

export function championshipQuotaErrorMessage(): string {
	return `Limite de ${CHAMPIONSHIP_QUOTA.maxOwned} campeonatos atingido`;
}

export function championshipQuotaHint(): string {
	return `Limite de ${CHAMPIONSHIP_QUOTA.maxOwned} campeonatos como dono. Exclua ou transfira um para criar outro.`;
}
