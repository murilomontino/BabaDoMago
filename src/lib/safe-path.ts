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

export function withClaimQuery(
	path: string,
	claim: string | undefined,
): string {
	if (!claim) {
		return path;
	}

	const separator = path.includes("?") ? "&" : "?";
	return `${path}${separator}claim=${encodeURIComponent(claim)}`;
}
