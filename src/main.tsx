import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AppTooltip } from "./components/atoms/app-tooltip";
import { AppQueryClientProvider } from "./lib/query-client";
import { router } from "./router";

const root = document.getElementById("root");

if (!root) {
	throw new Error("Root element not found");
}

createRoot(root).render(
	<StrictMode>
		<AppQueryClientProvider>
			<RouterProvider router={router} />
			<AppTooltip />
		</AppQueryClientProvider>
	</StrictMode>,
);
