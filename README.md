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

Rotas: `/login` pública. `/` e `/todos` exigem sessão.

## RLS (SQL Editor)

A UI privada não esconde `todos` da API `anon`. Para restringir leitura:

```sql
revoke select on public.todos from anon;
grant select on public.todos to authenticated;

drop policy if exists "public can read todos" on public.todos;

create policy "authenticated can read todos"
on public.todos
for select
to authenticated
using (true);
```
