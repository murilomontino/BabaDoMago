export function handlerWhenAllowed<T>(
	allowed: unknown,
	handler: T,
): T | undefined {
	if (!allowed) {
		return undefined;
	}

	return handler;
}
