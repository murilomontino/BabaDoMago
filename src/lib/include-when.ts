export function includeWhen<T>(condition: boolean, value: T): T[] {
	if (!condition) {
		return [];
	}

	return [value];
}

export function includeDefined<T>(value: T | null | undefined): T[] {
	if (value == null) {
		return [];
	}

	return [value];
}
