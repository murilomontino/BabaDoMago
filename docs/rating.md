# Nota (rating) do jogador

Documentação do cálculo de nota do Baba do Mago: motivação, regras e exemplos.

A nota **não é Elo**. Não depende de gols, adversário nem K-factor. Depois de cada rodada encerrada, ela muda pelo **aproveitamento de pontos** daquele evento.

---

## Motivação

O baba precisa de uma nota que:

1. **Equilibre times no sorteio** — quem joga melhor sobe; quem rende menos desce, de forma previsível.
2. **Ignore placar e gols** — no baba o destaque individual (gol/assistência) não deve distorcer a força do time no sorteio.
3. **Trate empate com justiça** — quem empata mais do que perde não deve ser tratado igual a quem só empata “no meio” de muitas derrotas.
4. **Escale com a liga** — o tamanho do ajuste acompanha o teto do campeonato (o maior rating entre os jogadores, no mínimo 5).

Resultado: uma métrica única, a mesma no TypeScript e no Postgres, usada no preview da UI, no encerramento da rodada e no simulador da ficha do jogador.

---

## Conceitos

| Conceito | Significado |
| --- | --- |
| `rating` | Nota do jogador no campeonato (`championship_players.rating`) |
| `0` (sentinela) | Jogador ainda sem nota “oficial”. No sorteio/média vira a média dos presentes com nota; no banco continua `0` até a primeira semente |
| Teto (`ceiling`) | `max(maior rating do elenco, 5)`, limitado a 100 |
| Piso | `0.1` para quem já tem nota; `0` só como sentinela |
| Delta | Quanto a nota muda na rodada (ou a semente, na primeira vez) |
| MVP | `2%` da nota snapshot, ceil em 1 casa, mínimo `+0.1` |

Pontuação da rodada (como futebol):

| Resultado | Pontos |
| --- | --- |
| Vitória | 3 |
| Empate | 1, ou **1,5** se `empates > derrotas` |
| Derrota | 0 |

---

## Quando a nota **não** muda

- Menos de **3 jogos** na presença da rodada (`matches < 3`)
- Jogador **já ranqueado** (`rating ≠ 0`) com aproveitamento na **zona morta**: 45% a 55% inclusive

Nesses casos o delta da fórmula é `0` (o MVP ainda pode somar o bônus percentual se marcado).

---

## Fórmula (jogador já ranqueado)

```text
drawPoints = draws > losses ? 1.5 : 1
points     = 3 * wins + drawPoints * draws
rate       = points / (3 * matches)
delta      = round((rate - 0.5) * ceiling / 2, 1)
notaNova   = clamp(notaAtual + delta, 0.1 … 100)
```

- `rate = 0.5` → desempenho “esperado” → delta 0 (centro da zona morta).
- Acima de 55% sobe; abaixo de 45% desce.
- O teto amplifica o movimento: ligas com notas altas mudam mais.

### Empate 1 vs 1,5

- `empates > derrotas` → cada empate vale **1,5** (ex.: 3 empates e 0 derrotas).
- Caso contrário → empate vale **1** (ex.: 2 empates e 2 derrotas).

Isso evita punir quem “segura o resultado” mais do que perde.

---

## Nota inicial (sentinela `rating === 0`)

Na **primeira** rodada com 3+ jogos, a nota **passa a ser a semente**, não um delta incremental:

| Aproveitamento | Semente |
| --- | --- |
| abaixo de 45% | 2.7 |
| 45% a 55% (inclusive) | 3 |
| acima de 55% | 3.5 |

Valores absolutos, **sem** escalar pelo teto. O campo `rating_delta` da presença guarda essa semente.

Exceção: snapshot de presença com `rating = 0`, nota manual já preenchida no elenco e `rating_delta = 0` → **não** aplica semente de novo.

---

## MVP

Depois do delta (ou da semente), se o jogador for MVP da rodada:

```text
bonus        = max(0.1, ceil(rating * 0.02 * 10) / 10)
deltaEfetivo = delta + bonus
```

`rating` é o snapshot da presença (nota que o jogador já tinha). Sentinela `0` ainda ganha o piso `+0.1`.

Até 3 MVPs por rodada, escolhidos pelos melhores números.

Exemplos do bônus: `0.01 → 0.1`, `0.14 → 0.2`, nota `20 → +0.4`.

---

## Voto do elenco (overlay)

Dono, capitão e admin presentes podem dar like, dislike ou **manter** em quem está na presença da **mesma** rodada, **só depois de encerrar**. A tela mostra a nota atual do elenco. Voto secreto: ninguém vê a urna, só o próprio voto.

| Regra | Valor |
| --- | --- |
| Quórum | `championships.player_vote_quorum` (config do baba, default **3**, faixa 1–10) |
| Like no quórum | N+ likes (N = quórum), mais likes que dislikes **e** que maintains → **+0,5** e **fecha** |
| Dislike no quórum | N+ dislikes, mais dislikes que likes **e** que maintains → **−0,5** e **fecha** |
| Manter | conta na urna; bloqueia like/dislike se a contagem deles não supera maintains |
| Manter sozinho | **0**, voto **permanece aberto** |
| Sem voto em si | bloqueado |
| Encerrar votação | só o **dono**; trava novos votos na rodada (`player_votes_closed_at`) |
| 1 voto por admin por atleta | pode trocar ou limpar **só enquanto aberto** |

O campo `championship_event_attendance.vote_rating_delta` guarda o resultado (±0,5 ou 0). **Não** entra em `eventRatingDelta` / aproveitamento. Depois de ±0,5, novos votos nesse alvo são recusados (`vote closed`).

- Jogador já ranqueado (`rating ≠ 0`): aplica na hora no elenco.
- Sentinela (`rating = 0`): só guarda o overlay; aplica depois da semente no encerrar (`vote_rating_applied` evita aplicar duas vezes).

Fonte: [`src/const/event-player-vote.ts`](../src/const/event-player-vote.ts), RPC `vote_championship_event_player`.

---

## Exemplos

Números vindos dos checks (`event-rating-adjustment.check.ts`). Colunas **V / E / D / J** = vitórias, empates, derrotas, jogos.

### Conta completa (teto 5)

**João** já tem nota `4`. Na rodada: 4 vitórias, 0 empates, 2 derrotas (6 jogos).

```text
drawPoints = 1                    (E não > D)
points     = 3×4 + 1×0 = 12
rate       = 12 / (3×6) = 12/18 ≈ 66,7%
delta      = round((0,667 − 0,5) × 5 / 2, 1) = round(0,4167, 1) = 0,4
notaNova   = 4 + 0,4 = 4,4
```

**Pedro** nota `3,5`. Na rodada: 1 vitória, 2 derrotas (3 jogos).

```text
points = 3
rate   = 3 / 9 ≈ 33,3%
delta  = −0,4
nota   = 3,5 − 0,4 = 3,1
```

### Já ranqueado — teto 5

| Cenário | V / E / D / J | Pontos | rate | Delta | De → Para |
| --- | --- | --- | --- | --- | --- |
| Bom aproveitamento | 4 / 0 / 2 / 6 | 12 | 66,7% | +0,4 | 4 → **4,4** |
| Ruim | 1 / 0 / 2 / 3 | 3 | 33,3% | −0,4 | 3,5 → **3,1** |
| Destaque | 5 / 0 / 1 / 6 | 15 | 83,3% | +0,8 | 5 → **5,8** |
| 60% | 3 / 0 / 2 / 5 | 9 | 60% | +0,3 | 4 → **4,3** |
| 40% | 2 / 0 / 3 / 5 | 6 | 40% | −0,3 | 4 → **3,7** |
| Zona morta 50% | 2 / 0 / 2 / 4 | 6 | 50% | 0 | 4 → **4** |
| Menos de 3 jogos | 1 / 0 / 0 / 1 | 3 | — | 0 | 4 → **4** |

### Empate 1,5 vs 1 (teto 5, nota 4)

| Cenário | V / E / D / J | Pts/empate | Pontos | rate | Delta | De → Para |
| --- | --- | --- | --- | --- | --- | --- |
| Muitos empates, zero derrotas | 0 / 3 / 0 / 3 | **1,5** | 4,5 | 50% | 0 | 4 → **4** |
| Empates = derrotas | 0 / 2 / 2 / 4 | **1** | 2 | 16,7% | −0,8 | 4 → **3,2** |
| 2V 2E sem derrota | 2 / 2 / 0 / 4 | **1,5** | 9 | 75% | +0,6 | 4 → **4,6** |
| 2V 1E 1D | 2 / 1 / 1 / 4 | **1** | 7 | 58,3% | +0,2 | 4 → **4,2** |
| 4V 2E sem derrota | 4 / 2 / 0 / 6 | **1,5** | 15 | 83,3% | +0,8 | 4 → **4,8** |

Mesmo “2 empates”: se não há derrotas, o empate vale mais e o aproveitamento sobe; se empates = derrotas, vale 1 e a nota cai.

### Mesmo aproveitamento, tetos diferentes

4 vitórias em 6 jogos (`rate ≈ 66,7%`):

| Teto | Nota atual | Delta | Nota nova |
| --- | --- | --- | --- |
| 5 | 4 | +0,4 | **4,4** |
| 23 | 12 | +1,9 | **13,9** |
| 75 | 40 | +6,3 | **46,3** |

1 vitória em 3 jogos (`rate ≈ 33,3%`):

| Teto | Nota atual | Delta | Nota nova |
| --- | --- | --- | --- |
| 5 | 3,5 | −0,4 | **3,1** |
| 23 | 18 | −1,9 | **16,1** |
| 75 | 60 | −6,3 | **53,7** |

Liga madura (teto alto) move mais a nota pelo mesmo rendimento.

### Primeira nota (sentinela `0`)

Aqui o “delta” **é a semente** (vira a nota), sem somar à nota atual:

| Cenário | V / E / D / J | rate | Semente | Resultado |
| --- | --- | --- | --- | --- |
| Bom | 4 / 0 / 0 / 4 | 100% | 3,5 | **0 → 3,5** |
| Médio (zona) | 2 / 0 / 2 / 4 | 50% | 3 | **0 → 3** |
| Fraco | 1 / 0 / 2 / 3 | 33,3% | 2,7 | **0 → 2,7** |
| 3 empates (1,5 pts) | 0 / 3 / 0 / 3 | 50% | 3 | **0 → 3** |
| 2V 2E sem derrota | 2 / 2 / 0 / 4 | 75% | 3,5 | **0 → 3,5** |
| Só 2 jogos | 1 / 0 / 1 / 2 | — | — | **fica 0** |

### MVP

Zona morta (2V 2D), nota `4`, teto 5:

| | Delta | De → Para |
| --- | --- | --- |
| Sem MVP | 0 | 4 → 4 |
| Com MVP | +0,1 | 4 → **4,1** |

`4 × 2% = 0,08` arredonda para cima em `+0,1`. Nota `20` com MVP e 0 jogos: `+0,4` (`20 → 20,4`). Sentinela `0` com MVP: piso `+0,1`.

### Limites

| Situação | Resultado |
| --- | --- |
| Nota 99,5 + delta 1,3 | **100** (teto geral) |
| Nota 0,2 + delta −0,4 | **0,1** (piso) |
| Sentinela 0 + delta 0 | **0** (continua sentinela) |

---

## Evolução pós-rodada

A nota no elenco **só persiste no SQL**. Encerrar a rodada (`endEvent`) pinta `ended_at` na hora; o cliente **não** grava `championship_players.rating`. A fila de ops não entra em `busy`.

Pipeline:

1. Presença guarda snapshot `rating` (nota **antes** do evento).
2. Preview na UI: `eventRatingPreview` = aproveitamento + MVP (+ amortecimento de queda se a flag da liga estiver ligada). Snapshot vence o elenco.
3. Voto do elenco: overlay `vote_rating_delta` (±0,5). Ranqueado aplica na hora; sentinela espera a semente.
4. Encerrar: `adjust_championship_player_ratings_for_event` aplica delta, grava `rating_delta`, depois sincroniza voto pendente (`vote_rating_applied`).
5. Histórico: ficha (`playerProfileHistory`) e campeonato (`championshipRatingHistory`, título **Evolução da nota**).

Camadas na nota final (nessa ordem):

| Camada | Entra em `eventRatingDelta`? | Onde |
| --- | --- | --- |
| Aproveitamento / semente | sim | `rating_delta` |
| MVP (`2%`, mín. +0,1) | não; soma em cima | `rating_delta` (junto do delta) |
| Amortecimento de queda (flag) | não; só se delta &lt; 0 | `rating_delta` (reduz a queda) |
| Voto ±0,5 | não | `vote_rating_delta` |

### Amortecimento de queda por participação em gols

Flag da liga: `championships.rating_drop_goal_share` (padrão **desligada**). Configurações → “Amortecer queda por gols”.

Flag extra: `championships.rating_drop_share_exclude_top` (padrão **desligada**). Configurações → “Não proteger os 10 melhores”. Com as duas ligadas, os 10 com maior `championship_players.rating` (empate por `id`) **não** recebem o amortecimento.

Só age quando o delta líquido (aproveitamento + MVP) é **negativo**:

```text
share = (gols + assists do jogador) / (gols + assists do time do elenco)
se share ≤ 40% → sem amortecimento
delta = round(delta × (1 − share), 1)
```

- Participação no **próprio time** (`championship_event_team_players`).
- Sem time, time com 0 G+A, flag off, share ≤ 40%, ou top 10 com exclude on → `share = 0`.
- Só **acima de 40%** (`EVENT_RATING_DROP_SHARE.minShare`) entra no amortecimento.
- `share` clamp 0–1. Gol **não** sobe nota; só reduz perda.
- Ex.: queda −0,6 e 50% do G+A do time → −0,3.

Recompute de stats: `rating − old_delta + new_delta` com o **snapshot** da presença, não a nota atual do elenco.

---

## Onde vive no código

| Camada | Arquivo / função |
| --- | --- |
| TypeScript (fonte da UI) | [`src/const/event-rating-adjustment.ts`](../src/const/event-rating-adjustment.ts) — `eventRatingDelta`, `applyEventRatingDelta`, `eventRatingPreview`, `eventRatingApplyDropShare` |
| Checks | [`src/const/event-rating-adjustment.check.ts`](../src/const/event-rating-adjustment.check.ts) |
| Simulador (ficha do jogador) | [`src/const/player-rating-sim.ts`](../src/const/player-rating-sim.ts) — aba **Simulação** |
| Evolução no campeonato | [`src/const/championship-rating-history.ts`](../src/const/championship-rating-history.ts) |
| Evolução na ficha | [`src/const/player-profile.ts`](../src/const/player-profile.ts) — `playerProfileHistory` |
| Postgres | `public.championship_event_rating_delta`, `public.championship_player_rating_apply`, `public.championship_event_mvp_bonus`, `public.championship_event_rating_team_goal_share`, `public.championship_event_rating_apply_drop_share` |
| Persistência ao encerrar | `adjust_championship_player_ratings_for_event` |
| Flag da liga | `championships.rating_drop_goal_share`, `championships.rating_drop_share_exclude_top` |
| Voto do elenco | [`src/const/event-player-vote.ts`](../src/const/event-player-vote.ts), `vote_championship_event_player`, `vote_rating_delta` |
| Recálculo manual (script) | [`supabase/scripts/recompute_ratings_from_attendance.sql`](../supabase/scripts/recompute_ratings_from_attendance.sql) |

**SQL e TypeScript precisam ficar iguais.** Ao mudar a regra, atualize os dois lados e os checks.

A presença guarda `rating` (snapshot antes do evento) e `rating_delta`. Correção de stats refaz `rating − old_delta + new_delta` usando o snapshot, não a nota “atual” do elenco na fórmula do delta.

---

## O que **não** entra na nota

- Elo / confrontos 1x1
- Gols, assistências ou gol contra na **fórmula base** (contam em estatísticas e MVP; com a flag da liga, G+A do time só **amortece queda**)
- Força do adversário
- Duração ou placar da partida além do resultado V/E/D agregado na presença
- Voto like/dislike/manter (overlay em `vote_rating_delta`, fora do aproveitamento)

---

## Simulador

Na ficha do jogador (`/championships/:id/players/:playerId?tab=sim`):

1. Informe vitórias, empates e derrotas.
2. Jogos = V + E + D.
3. Veja de → para com o teto real da liga, piso, aproveitamento e avisos (zona morta, semente, menos de 3 jogos).

Não grava nada; só preview local com a mesma fórmula.
