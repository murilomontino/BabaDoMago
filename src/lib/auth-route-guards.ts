import { redirect } from "@tanstack/react-router";
import { ROUTES } from "@/const/routes";
import { isSafeInternalPath } from "@/lib/safe-path";
import { supabase } from "@/lib/supabase";

export async function requireUser(): Promise<void> {
	const {
		data: { session },
	} = await supabase.auth.getSession();

	if (session) {
		return;
	}

	throw redirect({ to: ROUTES.login });
}

export async function requireGuest(nextPath?: string): Promise<void> {
	const {
		data: { session },
	} = await supabase.auth.getSession();

	if (!session) {
		return;
	}

	if (isSafeInternalPath(nextPath)) {
		throw redirect({ href: nextPath });
	}

	throw redirect({ to: ROUTES.home });
}
