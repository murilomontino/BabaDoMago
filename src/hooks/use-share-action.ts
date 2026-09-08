import { useCallback, useState } from "react";

export function useShareAction(failLabel: string) {
	const [isSharing, setIsSharing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const run = useCallback(
		async (fn: () => Promise<void>) => {
			setIsSharing(true);
			setError(null);
			try {
				await fn();
			} catch {
				setError(failLabel);
			} finally {
				setIsSharing(false);
			}
		},
		[failLabel],
	);

	return {
		isSharing,
		error,
		run,
	};
}
