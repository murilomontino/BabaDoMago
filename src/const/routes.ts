export const ROUTES = {
	login: "/login",
	home: "/",
	todos: "/todos",
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
