import { redirect } from "@tanstack/react-router";
import { ROUTES } from "@/const/routes";
import { isSafeInternalPath } from "@/lib/safe-path";
import { supabase } from "@/lib/supabase";

export async function requireUser(): Promise<void> {
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (user) {
		return;
	}

	throw redirect({ to: ROUTES.login });
}

export async function requireGuest(nextPath?: string): Promise<void> {
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return;
	}

	if (isSafeInternalPath(nextPath)) {
		throw redirect({ href: nextPath });
	}

	throw redirect({ to: ROUTES.home });
}
