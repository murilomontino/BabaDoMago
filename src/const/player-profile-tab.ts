import { parseAsStringEnum } from "nuqs";

export const PLAYER_PROFILE_TAB = {
	profile: "profile",
	sim: "sim",
} as const;

export type PlayerProfileTab =
	(typeof PLAYER_PROFILE_TAB)[keyof typeof PLAYER_PROFILE_TAB];

export const PLAYER_PROFILE_TAB_LABEL = {
	profile: "Perfil",
	sim: "Simulação",
} as const;

export const PLAYER_PROFILE_TABS = [
	{
		id: PLAYER_PROFILE_TAB.profile,
		label: PLAYER_PROFILE_TAB_LABEL.profile,
	},
	{
		id: PLAYER_PROFILE_TAB.sim,
		label: PLAYER_PROFILE_TAB_LABEL.sim,
	},
] as const;

export const PLAYER_PROFILE_TAB_SEARCH_KEY = "tab" as const;

export const PLAYER_PROFILE_TAB_SEARCH = {
	tab: parseAsStringEnum<PlayerProfileTab>(Object.values(PLAYER_PROFILE_TAB)),
};
