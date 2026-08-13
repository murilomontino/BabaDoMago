import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import {
	applyThemeClass,
	nextThemeMode,
	parseThemeMode,
	resolveTheme,
	THEME_MODE,
	THEME_STORAGE_KEY,
	type ThemeMode,
} from "@/const/theme";

type ThemeContextValue = {
	mode: ThemeMode;
	cycleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): ThemeMode {
	if (typeof window === "undefined") {
		return THEME_MODE.system;
	}

	return parseThemeMode(window.localStorage.getItem(THEME_STORAGE_KEY));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [mode, setMode] = useState<ThemeMode>(readStoredTheme);

	useEffect(() => {
		const media = window.matchMedia("(prefers-color-scheme: dark)");

		function sync() {
			applyThemeClass(
				resolveTheme(mode, media.matches),
				document.documentElement,
			);
		}

		sync();
		window.localStorage.setItem(THEME_STORAGE_KEY, mode);

		if (mode !== THEME_MODE.system) {
			return;
		}

		media.addEventListener("change", sync);
		return () => media.removeEventListener("change", sync);
	}, [mode]);

	const cycleTheme = useCallback(() => {
		setMode((current) => nextThemeMode(current));
	}, []);

	const value = useMemo(
		() => ({
			mode,
			cycleTheme,
		}),
		[mode, cycleTheme],
	);

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
}

export function useTheme(): ThemeContextValue {
	const context = useContext(ThemeContext);

	if (!context) {
		throw new Error("useTheme must be used within ThemeProvider");
	}

	return context;
}
