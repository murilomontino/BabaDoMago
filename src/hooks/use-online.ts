import { useEffect, useState } from "react";
import { isMatchClockOnline } from "@/const/championship-event-match";

export function useOnline(): boolean {
	const [online, setOnline] = useState(() =>
		isMatchClockOnline(globalThis.navigator?.onLine),
	);

	useEffect(() => {
		function sync() {
			setOnline(isMatchClockOnline(globalThis.navigator?.onLine));
		}

		window.addEventListener("online", sync);
		window.addEventListener("offline", sync);
		return () => {
			window.removeEventListener("online", sync);
			window.removeEventListener("offline", sync);
		};
	}, []);

	return online;
}
