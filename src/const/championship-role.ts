export const CHAMPIONSHIP_ROLE = {
	owner: "owner",
	captain: "captain",
	admin: "admin",
	member: "member",
} as const;

export type ChampionshipRole =
	(typeof CHAMPIONSHIP_ROLE)[keyof typeof CHAMPIONSHIP_ROLE];

export const ASSIGNABLE_CHAMPIONSHIP_ROLES = [
	CHAMPIONSHIP_ROLE.captain,
	CHAMPIONSHIP_ROLE.admin,
	CHAMPIONSHIP_ROLE.member,
] as const;

export type AssignableChampionshipRole =
	(typeof ASSIGNABLE_CHAMPIONSHIP_ROLES)[number];

export const CHAMPIONSHIP_ROLE_LABEL = {
	owner: "Dono",
	captain: "Capitão",
	admin: "Admin",
	member: "Normal",
} as const;

type ChampionshipPermissions = {
	deleteChampionship: boolean;
	setRoles: boolean;
	renameChampionship: boolean;
	updateRating: boolean;
	invite: boolean;
};

export function resolveChampionshipRole(
	createdBy: string,
	userId: string | null,
	storedRole: string,
): ChampionshipRole {
	if (!userId) {
		return CHAMPIONSHIP_ROLE.member;
	}

	if (userId === createdBy) {
		return CHAMPIONSHIP_ROLE.owner;
	}

	switch (storedRole) {
		case CHAMPIONSHIP_ROLE.captain:
		case CHAMPIONSHIP_ROLE.admin:
		case CHAMPIONSHIP_ROLE.member:
			return storedRole;
		default:
			return CHAMPIONSHIP_ROLE.member;
	}
}

export function championshipPermissions(
	role: ChampionshipRole,
): ChampionshipPermissions {
	switch (role) {
		case CHAMPIONSHIP_ROLE.owner:
			return {
				deleteChampionship: true,
				setRoles: true,
				renameChampionship: true,
				updateRating: true,
				invite: true,
			};
		case CHAMPIONSHIP_ROLE.captain:
			return {
				deleteChampionship: false,
				setRoles: false,
				renameChampionship: true,
				updateRating: true,
				invite: true,
			};
		case CHAMPIONSHIP_ROLE.admin:
			return {
				deleteChampionship: false,
				setRoles: false,
				renameChampionship: false,
				updateRating: true,
				invite: true,
			};
		case CHAMPIONSHIP_ROLE.member:
			return {
				deleteChampionship: false,
				setRoles: false,
				renameChampionship: false,
				updateRating: false,
				invite: false,
			};
		default: {
			const _exhaustive: never = role;
			return _exhaustive;
		}
	}
}

export function canDeleteChampionship(role: ChampionshipRole): boolean {
	return championshipPermissions(role).deleteChampionship;
}

export function canSetRoles(role: ChampionshipRole): boolean {
	return championshipPermissions(role).setRoles;
}

export function canRenameChampionship(role: ChampionshipRole): boolean {
	return championshipPermissions(role).renameChampionship;
}

export function canUpdateRating(role: ChampionshipRole): boolean {
	return championshipPermissions(role).updateRating;
}

export function canInvite(role: ChampionshipRole): boolean {
	return championshipPermissions(role).invite;
}
