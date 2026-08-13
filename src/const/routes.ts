export const ROUTES = {
	login: "/login",
	home: "/",
	championshipNew: "/championships/new",
	championship: "/championships/$championshipId",
	championshipEvent: "/championships/$championshipId/events/$eventId",
	championshipEventPlay: "/championships/$championshipId/events/$eventId/play",
	join: "/join/$inviteCode",
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
