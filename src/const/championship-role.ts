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
	transferOwnership: boolean;
	unlinkPlayer: boolean;
	deactivatePlayer: boolean;
	reactivatePlayer: boolean;
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
				transferOwnership: true,
				unlinkPlayer: true,
				deactivatePlayer: true,
				reactivatePlayer: true,
			};
		case CHAMPIONSHIP_ROLE.captain:
			return {
				deleteChampionship: false,
				setRoles: false,
				renameChampionship: true,
				updateRating: true,
				invite: true,
				transferOwnership: false,
				unlinkPlayer: true,
				deactivatePlayer: true,
				reactivatePlayer: false,
			};
		case CHAMPIONSHIP_ROLE.admin:
			return {
				deleteChampionship: false,
				setRoles: false,
				renameChampionship: false,
				updateRating: true,
				invite: true,
				transferOwnership: false,
				unlinkPlayer: true,
				deactivatePlayer: true,
				reactivatePlayer: false,
			};
		case CHAMPIONSHIP_ROLE.member:
			return {
				deleteChampionship: false,
				setRoles: false,
				renameChampionship: false,
				updateRating: false,
				invite: false,
				transferOwnership: false,
				unlinkPlayer: false,
				deactivatePlayer: false,
				reactivatePlayer: false,
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

export function canTransferOwnership(role: ChampionshipRole): boolean {
	return championshipPermissions(role).transferOwnership;
}

export function canUnlinkPlayer(role: ChampionshipRole): boolean {
	return championshipPermissions(role).unlinkPlayer;
}

export function canDeactivatePlayer(role: ChampionshipRole): boolean {
	return championshipPermissions(role).deactivatePlayer;
}

export function canReactivatePlayer(role: ChampionshipRole): boolean {
	return championshipPermissions(role).reactivatePlayer;
}
