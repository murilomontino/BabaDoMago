import type { User } from "@supabase/supabase-js";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { ROUTES } from "@/const/routes";
import { isSafeInternalPath } from "@/lib/safe-path";
import { supabase } from "@/lib/supabase";
import { ensureCurrentUser } from "@/services/users";

type AuthContextValue = {
	user: User | null;
	isLoading: boolean;
	signInWithGoogle: (nextPath?: string) => Promise<void>;
	signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let isMounted = true;

		async function syncPlatformUser(nextUser: User | null) {
			if (!nextUser) {
				return;
			}

			await ensureCurrentUser(nextUser);
		}

		supabase.auth.getUser().then(async ({ data }) => {
			if (data.user) {
				try {
					await syncPlatformUser(data.user);
				} catch (error) {
					console.error(error);
				}
			}

			if (!isMounted) {
				return;
			}

			setUser(data.user);
			setIsLoading(false);
		});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			const nextUser = session?.user ?? null;
			setUser(nextUser);
			setIsLoading(false);

			if (event !== "SIGNED_IN" && event !== "USER_UPDATED") {
				return;
			}

			void syncPlatformUser(nextUser).catch((error) => {
				console.error(error);
			});
		});

		return () => {
			isMounted = false;
			subscription.unsubscribe();
		};
	}, []);

	const signInWithGoogle = useCallback(async (nextPath?: string) => {
		const path = isSafeInternalPath(nextPath) ? nextPath : ROUTES.home;
		const { error } = await supabase.auth.signInWithOAuth({
			provider: "google",
			options: {
				redirectTo: `${window.location.origin}${path}`,
			},
		});

		if (error) {
			throw error;
		}
	}, []);

	const signOut = useCallback(async () => {
		const { error } = await supabase.auth.signOut();

		if (error) {
			throw error;
		}
	}, []);

	const value = useMemo(
		() => ({
			user,
			isLoading,
			signInWithGoogle,
			signOut,
		}),
		[user, isLoading, signInWithGoogle, signOut],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	const context = useContext(AuthContext);

	if (!context) {
		throw new Error("useAuth must be used within AuthProvider");
	}

	return context;
}
