import { useCallback, useState } from "react";

async function runBalanceShare(
	setSharing: (value: boolean) => void,
	setError: (value: string | null) => void,
	failLabel: string,
	fn: () => Promise<void>,
): Promise<void> {
	setSharing(true);
	setError(null);
	try {
		await fn();
	} catch {
		setError(failLabel);
	} finally {
		setSharing(false);
	}
}

export function useBalanceShare(failLabel: string) {
	const [isSharingBalance, setIsSharingBalance] = useState(false);
	const [isSharingBalanceCsv, setIsSharingBalanceCsv] = useState(false);
	const [balanceShareError, setBalanceShareError] = useState<string | null>(
		null,
	);

	const shareBalanceImage = useCallback(
		(fn: () => Promise<void>) =>
			runBalanceShare(
				setIsSharingBalance,
				setBalanceShareError,
				failLabel,
				fn,
			),
		[failLabel],
	);

	const shareBalanceCsv = useCallback(
		(fn: () => Promise<void>) =>
			runBalanceShare(
				setIsSharingBalanceCsv,
				setBalanceShareError,
				failLabel,
				fn,
			),
		[failLabel],
	);

	return {
		isSharingBalance,
		isSharingBalanceCsv,
		balanceShareError,
		shareBalanceImage,
		shareBalanceCsv,
	};
}
