import { redirect } from "@tanstack/react-router";
import { ROUTES } from "@/const/routes";
import { isSafeInternalPath } from "@/lib/safe-path";
import { supabase } from "@/lib/supabase";

export async function requireUser(): Promise<void> {
	// #region agent log
	fetch("http://127.0.0.1:7501/ingest/7aa36caa-8689-4af1-a425-f57dce975cbd", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Debug-Session-Id": "c0754f",
		},
		body: JSON.stringify({
			sessionId: "c0754f",
			runId: "pre-fix",
			hypothesisId: "B",
			location: "auth-route-guards.ts:requireUser",
			message: "requireUser start",
			data: { href: window.location.href },
			timestamp: Date.now(),
		}),
	}).catch(() => {});
	// #endregion
	const {
		data: { user },
	} = await supabase.auth.getUser();
	// #region agent log
	fetch("http://127.0.0.1:7501/ingest/7aa36caa-8689-4af1-a425-f57dce975cbd", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Debug-Session-Id": "c0754f",
		},
		body: JSON.stringify({
			sessionId: "c0754f",
			runId: "pre-fix",
			hypothesisId: "B",
			location: "auth-route-guards.ts:requireUser:end",
			message: "requireUser end",
			data: { hasUser: Boolean(user), href: window.location.href },
			timestamp: Date.now(),
		}),
	}).catch(() => {});
	// #endregion

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
