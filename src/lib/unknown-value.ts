export function optionalString(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}

	return value;
}

export function optionalNumber(value: unknown): number | null {
	if (typeof value !== "number") {
		return null;
	}

	return value;
}

export function optionalRecord(value: unknown): Record<string, unknown> | null {
	if (value === null || typeof value !== "object") {
		return null;
	}

	return value as Record<string, unknown>;
}
