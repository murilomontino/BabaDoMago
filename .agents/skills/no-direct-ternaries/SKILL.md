---
name: no-direct-ternaries
description: Refatora ternários em funções nomeadas com early return. Use ao escrever ou revisar TypeScript/React, quando o usuário pedir para evitar ternários, ou ao encontrar `? :` fora de JSX visual.
---

# Sem ternários diretos

## Quando carregar

- novo código ou refactor em `src/**/*.{ts,tsx}`
- pedido explícito: "sem ternário", "função declarativa", "nomear o ramo"
- grep encontrou `? :` fora de className / label / variant JSX

## Fluxo

1. Separar **lógica** de **markup** (className, texto, variant → pode ficar ternário).
2. Procurar helper existente (`includeWhen`, `handlerWhenAllowed`, `mapUnknownRows`, etc.).
3. Se não couber, criar função com nome do **porquê** (`mvpPlayerIdsWhenAllowed`, `attendanceRowToggleHandler`).
4. Implementar com **early return**; sem ternário dentro do helper.
5. Colocar em `src/const/` (domínio) ou `src/lib/` (genérico). Sem `src/utils/`.
6. Lógica não trivial → `*.check.ts` com asserts mínimos.

## Mapa rápido

| Situação | Helper / padrão |
|---|---|
| `cond ? [x] : []` | `includeWhen(cond, x)` |
| valor opcional → array | `includeDefined(value)` |
| `canX ? fn : undefined` | `handlerWhenAllowed(canX, fn)` |
| `Array.isArray(x) ? x.map : []` | `mapUnknownRows(x, mapRow)` |
| handler de linha/checkbox | função local `attendanceFlagHandler(...)` |

## Nomear funções

Nome = intenção do ramo, não forma:

- ✅ `copyMatchLinkLabel`, `createEventDate`, `visibleChampionshipTab`
- ❌ `pick`, `getValue`, `resolve`

## Exemplos

Ver [examples.md](examples.md).

## Verificação

```bash
# lógica restante (ignorar className/label JSX manualmente)
rg '\? [^?\n<{][^:\n]*:' src --glob '*.{ts,tsx}'

yarn typecheck
node --experimental-strip-types src/lib/<modulo>.check.ts
```

Regra persistente: `.cursor/rules/no-direct-ternaries.mdc`
