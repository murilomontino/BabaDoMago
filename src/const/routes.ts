export const ROUTES = {
	login: "/login",
	home: "/",
	championshipNew: "/championships/new",
	championship: "/championships/$championshipId",
	championshipPlayer: "/championships/$championshipId/players/$playerId",
	championshipEvent: "/championships/$championshipId/events/$eventId",
	championshipEventPlay: "/championships/$championshipId/events/$eventId/play",
	championshipEventDraw: "/championships/$championshipId/events/$eventId/draw",
	join: "/join/$inviteCode",
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
