# Baba do Mago

SPA React (Vite + TypeScript) com TanStack Query, TanStack Router, Tailwind e Supabase.

## Setup

```bash
yarn
cp .env.example .env
yarn dev
```

Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no `.env`.

Não coloque `client_secret` do Google no front nem no `.env`. Client ID e Secret vão só no [Google provider do Dashboard](https://supabase.com/dashboard/project/sgbznwbgxrzrasrrvnuy/auth/providers?provider=Google).

## Auth Google (teste local)

Google Cloud → OAuth Web client:

- Authorized JavaScript origins: `http://localhost:5173` (não `http://localhost` sem porta)
- Authorized redirect URIs: `https://sgbznwbgxrzrasrrvnuy.supabase.co/auth/v1/callback`

Supabase → Authentication → URL Configuration:

- Site URL: `http://localhost:5173`
- Redirect URLs: `http://localhost:5173/**`

## SQL no Dashboard

Rode no SQL Editor, nesta ordem:

1. [`supabase/migrations/20260813120000_championships.sql`](supabase/migrations/20260813120000_championships.sql)
2. [`supabase/migrations/20260813140000_users.sql`](supabase/migrations/20260813140000_users.sql)
3. [`supabase/migrations/20260813150000_fix_championships_insert_rls.sql`](supabase/migrations/20260813150000_fix_championships_insert_rls.sql) — rode se o 1 já foi aplicado (corrige RLS no criar campeonato)
4. [`supabase/migrations/20260813160000_player_rating.sql`](supabase/migrations/20260813160000_player_rating.sql) — nota no jogador (rode se o 1 já foi aplicado)
5. [`supabase/migrations/20260813170000_player_rating_100.sql`](supabase/migrations/20260813170000_player_rating_100.sql) — nota 1–100; estrelas relativas ao teto do baba

O segundo cria `public.users` e vincula cada login Google (trigger + backfill). Sem ele o app não cadastra usuário na plataforma.

## Campeonatos

- `/` lista só os campeonatos que você criou ou entrou
- `/championships/new` cria (você entra como jogador)
- `/championships/:id` elenco, copiar convite, adicionar jogador sem conta; dono define nota 1–100; 5 estrelas = maior nota do baba
- `/join/:codigo` público: vê o elenco, Conectar no nome livre, Inscrever-me
