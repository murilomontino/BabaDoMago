import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const QUERY_CACHE_RELEASE = process.env.VITE_RELEASE ?? "2026-08-offline-v1";

export default defineConfig({
	define: {
		// Subir só quando o shape das query keys ou do payload persistido mudar.
		__QUERY_CACHE_BUSTER__: JSON.stringify(QUERY_CACHE_RELEASE),
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
				// O polyfill AAC (~1 MB) só é baixado por quem precisa dele
				// (Firefox), então fica fora do precache do service worker.
				globIgnores: ["**/mediabunny-aac-encoder-*.js"],
			},
			pwaAssets: {
				preset: "minimal-2023",
				image: "public/favicon.svg",
				injectThemeColor: false,
			},
		}),
	],
});
