import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import "./index.css";
import { AppTooltip } from "./components/atoms/app-tooltip";
import { AppQueryClientProvider } from "./lib/query-client";
import { router } from "./router";
import { persistor, store } from "./store";

const root = document.getElementById("root");

if (!root) {
	throw new Error("Root element not found");
}

createRoot(root).render(
	<StrictMode>
		<Provider store={store}>
			<PersistGate persistor={persistor}>
				<AppQueryClientProvider>
					<RouterProvider router={router} />
					<AppTooltip />
				</AppQueryClientProvider>
			</PersistGate>
		</Provider>
	</StrictMode>,
);
