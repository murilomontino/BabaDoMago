import { useSearch } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/button";
import { GoogleIcon } from "@/components/google-icon";
import { ROUTES } from "@/const/routes";
import { BUTTON_VARIANT, ERROR_CLASS } from "@/const/ui";
import { useAuth } from "@/contexts/auth";
import { isSafeInternalPath } from "@/lib/safe-path";

export function LoginPage() {
	const { signInWithGoogle } = useAuth();
	const search = useSearch({ from: "/login" });
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isSigningIn, setIsSigningIn] = useState(false);

	async function handleGoogleSignIn() {
		setErrorMessage(null);
		setIsSigningIn(true);

		const nextPath = isSafeInternalPath(search.redirect)
			? search.redirect
			: ROUTES.home;

		try {
			await signInWithGoogle(nextPath);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Falha ao entrar com Google";
			setErrorMessage(message);
			setIsSigningIn(false);
		}
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-pitch-soft to-stone-50 px-4">
			<section className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
				<p className="mb-2 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-pitch">
					<Trophy className="size-4" />
					Baba do Mago
				</p>
				<h1 className="mb-2 text-2xl font-semibold tracking-tight text-stone-900">
					Entrar na conta
				</h1>
				<p className="mb-8 text-stone-600">
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
