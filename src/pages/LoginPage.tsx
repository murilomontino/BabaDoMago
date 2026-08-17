import { useSearch } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/button";
import { GoogleIcon } from "@/components/google-icon";
import { ThemeToggle } from "@/components/theme-toggle";
import { BUTTON_VARIANT, ERROR_CLASS } from "@/const/ui";
import { useAuth } from "@/contexts/auth";
import { caughtErrorMessage } from "@/lib/error-message";
import { safeInternalPathOrHome } from "@/lib/safe-path";

export function LoginPage() {
	const { signInWithGoogle } = useAuth();
	const search = useSearch({ from: "/login" });
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isSigningIn, setIsSigningIn] = useState(false);

	async function handleGoogleSignIn() {
		setErrorMessage(null);
		setIsSigningIn(true);

		const nextPath = safeInternalPathOrHome(search.redirect);

		try {
			await signInWithGoogle(nextPath);
		} catch (error) {
			const message = caughtErrorMessage(error, "Falha ao entrar com Google");
			setErrorMessage(message);
			setIsSigningIn(false);
		}
	}

	return (
		<main className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-pitch-soft to-field px-4">
			<div className="absolute right-4 top-4">
				<ThemeToggle />
			</div>
			<section className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 shadow-sm">
				<p className="mb-2 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-pitch-fg">
					<Trophy className="size-4" />
					Baba do Mago
				</p>
				<h1 className="mb-2 text-2xl font-semibold tracking-tight text-fg">
					Entrar na conta
				</h1>
				<p className="mb-8 text-fg-muted">
					Use sua conta Google para acessar os campeonatos.
				</p>
				<Button
					variant={BUTTON_VARIANT.secondary}
					onClick={handleGoogleSignIn}
					disabled={isSigningIn}
					className="w-full py-3"
				>
					<GoogleIcon className="h-5 w-5" />
					Entrar com Google
				</Button>
				{errorMessage && (
					<p className={`mt-4 text-center ${ERROR_CLASS}`}>{errorMessage}</p>
				)}
			</section>
		</main>
	);
}
