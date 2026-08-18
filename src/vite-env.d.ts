/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
	readonly VITE_SUPABASE_URL: string;
	readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
	readonly VITE_MATCH_CLOCK_DEBUG?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

declare const __QUERY_CACHE_BUSTER__: string;
