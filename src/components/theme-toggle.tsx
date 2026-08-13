import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/button";
import { THEME_MODE, THEME_MODE_LABEL } from "@/const/theme";
import { BUTTON_VARIANT } from "@/const/ui";
import { useTheme } from "@/contexts/theme";

export function ThemeToggle() {
	const { mode, cycleTheme } = useTheme();

	return (
		<Button
			variant={BUTTON_VARIANT.ghost}
			onClick={cycleTheme}
			aria-label={THEME_MODE_LABEL[mode]}
			title={THEME_MODE_LABEL[mode]}
			className="px-2"
		>
			{mode === THEME_MODE.light && <Sun className="size-4" />}
			{mode === THEME_MODE.dark && <Moon className="size-4" />}
			{mode === THEME_MODE.system && <Monitor className="size-4" />}
		</Button>
	);
}
