# Exemplos — sem ternário direto

## Permissão → handler

```typescript
// ❌
onChangeRating={canUpdateRating ? onChangeRating : undefined}

// ✅
onChangeRating={handlerWhenAllowed(canUpdateRating, onChangeRating)}
```

## flatMap filtro

```typescript
// ❌
rsvps.flatMap((row) =>
  row.status === EVENT_RSVP_STATUS.going ? [row.player_id] : [],
);

// ✅
rsvps.flatMap((row) =>
  includeWhen(row.status === EVENT_RSVP_STATUS.going, row.player_id),
);
```

## Payload condicional

```typescript
// ❌
mvpPlayerIds: canSetMvp ? mvpPlayerIds : null,

// ✅
mvpPlayerIds: mvpPlayerIdsWhenAllowed(canSetMvp, mvpPlayerIds),
```

```typescript
export function mvpPlayerIdsWhenAllowed(
  canSetMvp: boolean,
  mvpPlayerIds: number[],
): number[] | null {
  if (!canSetMvp) {
    return null;
  }
  return mvpPlayerIds;
}
```

## Handler com closure

```typescript
// ❌
onTogglePresent: onSetPresent
  ? (checked) => { onSetPresent([player.id], checked); }
  : undefined,

// ✅
onTogglePresent: attendanceFlagHandler(onSetPresent, player.id),
```

```typescript
function attendanceFlagHandler(
  onSet: ((ids: readonly number[], checked: boolean) => void) | undefined,
  playerId: number,
): ((checked: boolean) => void) | undefined {
  if (!onSet) {
    return undefined;
  }
  return (checked) => {
    onSet([playerId], checked);
  };
}
```

## Data / RPC

```typescript
// ❌
const rows = Array.isArray(data) ? data.map(asAuditLog) : [];

// ✅
const rows = mapUnknownRows(data, asAuditLog);
```

## JSX — permitido

```tsx
{isEdit ? EVENT_ACTION.editTeam : EVENT_ACTION.addTeam}

className={`border-2 ${selected ? "border-current" : "border-black/20"}`}

{openMatch ? EVENT_ACTION.continueMatch : EVENT_ACTION.startMatch}
```

Preferir `{cond && <Comp />}` quando forem **dois componentes**, não dois textos.

## Anti-padrão

```typescript
// ❌ wrapper sem semântica
function when<T>(cond: boolean, a: T, b: T): T {
  return cond ? a : b;
}
```
