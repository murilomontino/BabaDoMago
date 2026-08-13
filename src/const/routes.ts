export const ROUTES = {
	login: "/login",
	home: "/",
	championshipNew: "/championships/new",
	championship: "/championships/$championshipId",
	join: "/join/$inviteCode",
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
