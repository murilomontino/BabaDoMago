import { ROUTES } from "../const/routes.ts";

export function isSafeInternalPath(path: string | undefined): path is string {
	if (!path) {
		return false;
	}

	if (!path.startsWith("/")) {
		return false;
	}

	if (path.startsWith("//") || path.includes("\\")) {
		return false;
	}

	return true;
}

export function safeInternalPathOrHome(path: string | undefined): string {
	if (isSafeInternalPath(path)) {
		return path;
	}

	return ROUTES.home;
}

function queryJoinSeparator(path: string): "?" | "&" {
	if (path.includes("?")) {
		return "&";
	}

	return "?";
}

export function withClaimQuery(
	path: string,
	claim: string | undefined,
): string {
	if (!claim) {
		return path;
	}

	return `${path}${queryJoinSeparator(path)}claim=${encodeURIComponent(claim)}`;
}
