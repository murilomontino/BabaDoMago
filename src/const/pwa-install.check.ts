import {
	isIosSafari,
	isStandaloneDisplay,
	PWA_INSTALL_LABEL,
	shouldShowPwaInstall,
} from "./pwa-install.ts";

function check(actual: unknown, expected: unknown, message: string): void {
	if (actual !== expected) {
		throw new Error(
			`${message}: expected ${String(expected)}, got ${String(actual)}`,
		);
	}
}

check(isStandaloneDisplay(true, false), true, "standalone media");
check(isStandaloneDisplay(false, true), true, "ios standalone");
check(isStandaloneDisplay(false, false), false, "browser tab");

check(
	isIosSafari(
		"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
		5,
	),
	true,
	"iphone safari",
);
check(
	isIosSafari(
		"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1",
		5,
	),
	false,
	"iphone chrome",
);
check(
	isIosSafari(
		"Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
		5,
	),
	false,
	"android chrome",
);

check(
	shouldShowPwaInstall({
		dismissed: true,
		standalone: false,
		canPrompt: true,
		iosSafari: true,
	}),
	false,
	"dismissed stays hidden",
);
check(
	shouldShowPwaInstall({
		dismissed: false,
		standalone: true,
		canPrompt: true,
		iosSafari: false,
	}),
	false,
	"installed stays hidden",
);
check(
	shouldShowPwaInstall({
		dismissed: false,
		standalone: false,
		canPrompt: true,
		iosSafari: false,
	}),
	true,
	"android prompt",
);
check(
	shouldShowPwaInstall({
		dismissed: false,
		standalone: false,
		canPrompt: false,
		iosSafari: true,
	}),
	true,
	"ios hint",
);
check(PWA_INSTALL_LABEL.install, "Instalar", "install label");

console.log("pwa-install ok");
