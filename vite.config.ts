import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	define: {
		__QUERY_CACHE_BUSTER__: JSON.stringify(String(Date.now())),
	},
	server: {
		allowedHosts: [".ngrok-free.app"],
	},
	resolve: {
		alias: {
			"@": path.resolve(import.meta.dirname, "./src"),
		},
	},
	plugins: [
		tanstackRouter({
			target: "react",
			autoCodeSplitting: true,
		}),
		react(),
		tailwindcss(),
		VitePWA({
			registerType: "autoUpdate",
			includeAssets: ["favicon.svg", "icons.svg", "soms/*.mp3"],
			manifest: {
				name: "Baba do Mago",
				short_name: "Baba do Mago",
				lang: "pt-BR",
				start_url: "/",
				display: "standalone",
				theme_color: "#166534",
				background_color: "#fafaf9",
			},
			workbox: {
				navigateFallback: "index.html",
				globPatterns: ["**/*.{js,css,html,ico,png,svg,mp3,woff2,webmanifest}"],
			},
			pwaAssets: {
				preset: "minimal-2023",
				image: "public/favicon.svg",
				injectThemeColor: false,
			},
		}),
	],
});
