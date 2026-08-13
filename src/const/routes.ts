export const ROUTES = {
	login: "/login",
	home: "/",
	championshipNew: "/championships/new",
	championship: "/championships/$championshipId",
	championshipEvent: "/championships/$championshipId/events/$eventId",
	join: "/join/$inviteCode",
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
