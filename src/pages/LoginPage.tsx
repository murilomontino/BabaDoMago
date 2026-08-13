import { useState } from "react";
import { GoogleIcon } from "@/components/google-icon";
import { useAuth } from "@/contexts/auth";

export function LoginPage() {
	const { signInWithGoogle } = useAuth();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isSigningIn, setIsSigningIn] = useState(false);

	async function handleGoogleSignIn() {
		setErrorMessage(null);
		setIsSigningIn(true);

		try {
			await signInWithGoogle();
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Falha ao entrar com Google";
			setErrorMessage(message);
			setIsSigningIn(false);
		}
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
			<section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
				<p className="mb-2 text-sm font-medium uppercase tracking-wide text-slate-500">
					Baba do Mago
				</p>
				<h1 className="mb-2 text-2xl font-semibold text-slate-900">
					Entrar na conta
				</h1>
				<p className="mb-8 text-slate-600">
					Use sua conta Google para acessar as tarefas.
				</p>
				<button
					type="button"
					onClick={handleGoogleSignIn}
					disabled={isSigningIn}
					className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
				>
					<GoogleIcon className="h-5 w-5" />
					Entrar com Google
				</button>
				{errorMessage && (
					<p className="mt-4 text-center text-sm text-red-600">
						{errorMessage}
					</p>
				)}
			</section>
		</main>
	);
}
