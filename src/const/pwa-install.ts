export const PWA_INSTALL_STORAGE_KEY = "baba-pwa-install-dismissed";

export const PWA_INSTALL_LABEL = {
	title: "Instalar o Baba do Mago",
	hint: "Abre como app, sem a barra do navegador.",
	install: "Instalar",
	later: "Agora não",
	iosHint:
		"No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início.",
} as const;

export function isStandaloneDisplay(
	matchesStandalone: boolean,
	iosStandalone: boolean,
): boolean {
	return matchesStandalone || iosStandalone;
}

export function isIosSafari(
	userAgent: string,
	maxTouchPoints: number,
): boolean {
	const ios =
		/iPad|iPhone|iPod/i.test(userAgent) ||
		(/Macintosh/i.test(userAgent) && maxTouchPoints > 1);
	if (!ios) {
		return false;
	}

	return /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS/i.test(userAgent);
}

export function shouldShowPwaInstall(input: {
	dismissed: boolean;
	standalone: boolean;
	canPrompt: boolean;
	iosSafari: boolean;
}): boolean {
	if (input.dismissed || input.standalone) {
		return false;
	}

	return input.canPrompt || input.iosSafari;
}
