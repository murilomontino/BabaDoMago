import { useCallback, useEffect, useState } from "react";
import {
	isIosSafari,
	isStandaloneDisplay,
	PWA_INSTALL_STORAGE_KEY,
	shouldPersistPwaDismissal,
	shouldShowPwaInstall,
} from "@/const/pwa-install";

function readDismissed(): boolean {
	if (typeof window === "undefined") {
		return false;
	}

	return window.localStorage.getItem(PWA_INSTALL_STORAGE_KEY) === "1";
}

function readStandalone(): boolean {
	if (typeof window === "undefined") {
		return false;
	}

	return isStandaloneDisplay(
		window.matchMedia("(display-mode: standalone)").matches,
		"standalone" in navigator &&
			(navigator as Navigator & { standalone?: boolean }).standalone === true,
	);
}

function readIosSafari(): boolean {
	if (typeof navigator === "undefined") {
		return false;
	}

	return isIosSafari(navigator.userAgent, navigator.maxTouchPoints);
}

export function usePwaInstall() {
	const [dismissed, setDismissed] = useState(readDismissed);
	const [promptEvent, setPromptEvent] =
		useState<BeforeInstallPromptEvent | null>(null);

	useEffect(() => {
		if (dismissed || readStandalone()) {
			return;
		}

		function onBeforeInstallPrompt(event: Event) {
			event.preventDefault();
			setPromptEvent(event as BeforeInstallPromptEvent);
		}

		function onInstalled() {
			setPromptEvent(null);
			window.localStorage.setItem(PWA_INSTALL_STORAGE_KEY, "1");
			setDismissed(true);
		}

		window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
		window.addEventListener("appinstalled", onInstalled);
		return () => {
			window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
			window.removeEventListener("appinstalled", onInstalled);
		};
	}, [dismissed]);

	const visible = shouldShowPwaInstall({
		dismissed,
		standalone: readStandalone(),
		canPrompt: promptEvent !== null,
		iosSafari: readIosSafari(),
	});

	const dismiss = useCallback(() => {
		window.localStorage.setItem(PWA_INSTALL_STORAGE_KEY, "1");
		setPromptEvent(null);
		setDismissed(true);
	}, []);

	const install = useCallback(async () => {
		if (!promptEvent) {
			return;
		}

		await promptEvent.prompt();
		const { outcome } = await promptEvent.userChoice;
		// O evento só serve para um prompt, então some da tela de qualquer forma.
		setPromptEvent(null);
		if (shouldPersistPwaDismissal(outcome)) {
			dismiss();
		}
	}, [dismiss, promptEvent]);

	return {
		visible,
		canPrompt: promptEvent !== null,
		install,
		dismiss,
	};
}
