type MutationErrorResult = {
	isError: boolean;
	error: { message: string } | null;
};

type PendingMutation<T> = {
	isPending: boolean;
	variables?: T;
};

export function mutationErrorMessage(
	result: MutationErrorResult,
	hidden = false,
): string | null {
	if (hidden) {
		return null;
	}

	if (!result.isError) {
		return null;
	}

	if (!result.error) {
		return null;
	}

	return result.error.message;
}

export function prefixedErrorMessage(
	result: MutationErrorResult,
	prefix: string,
): string | null {
	const message = mutationErrorMessage(result);
	if (!message) {
		return null;
	}

	return `${prefix}: ${message}`;
}

export function caughtErrorMessage(error: unknown, fallback: string): string {
	if (error instanceof Error) {
		return error.message;
	}

	return fallback;
}

export function pendingMutationId<T>(mutation: PendingMutation<T>): T | null {
	if (!mutation.isPending) {
		return null;
	}

	if (mutation.variables === undefined) {
		return null;
	}

	return mutation.variables;
}
