import { useRouterState } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { Button } from "@/components/button";
import { PWA_INSTALL_LABEL } from "@/const/pwa-install";
import { BUTTON_VARIANT, CARD_CLASS } from "@/const/ui";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export function PwaInstallBanner() {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const { visible, canPrompt, install, dismiss } = usePwaInstall();
	const playPage = pathname.endsWith("/play");

	if (!visible || playPage) {
		return null;
	}

	return (
		<div
			className={`fixed inset-x-4 z-50 mx-auto max-w-lg ${CARD_CLASS} bottom-[calc(1rem+env(safe-area-inset-bottom))]`}
			role="dialog"
			aria-label={PWA_INSTALL_LABEL.title}
		>
			<p className="font-semibold tracking-tight text-fg">
				{PWA_INSTALL_LABEL.title}
			</p>
			{canPrompt && (
				<p className="mt-1 text-sm text-fg-muted">{PWA_INSTALL_LABEL.hint}</p>
			)}
			{!canPrompt && (
				<p className="mt-1 text-sm text-fg-muted">
					{PWA_INSTALL_LABEL.iosHint}
				</p>
			)}
			<div className="mt-3 flex flex-wrap gap-2">
				{canPrompt && (
					<Button onClick={() => void install()}>
						<Download className="size-4" />
						{PWA_INSTALL_LABEL.install}
					</Button>
				)}
				<Button variant={BUTTON_VARIANT.ghost} onClick={dismiss}>
					{PWA_INSTALL_LABEL.later}
				</Button>
			</div>
		</div>
	);
}
