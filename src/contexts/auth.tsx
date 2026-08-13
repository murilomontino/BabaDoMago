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

		supabase.auth.getUser().then(({ data }) => {
			if (!isMounted) {
				return;
			}

			setUser(data.user);
			setIsLoading(false);
		});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
			setIsLoading(false);
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
