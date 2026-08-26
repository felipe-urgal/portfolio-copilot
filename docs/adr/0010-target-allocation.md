# ADR-0010 — TargetAllocation como política completa por classe econômica

**Status:** Aceita  
**Data:** 2026-08-26

## Contexto

O Portfolio Engine já possui `PortfolioId`, taxonomia econômica por `AssetClass`, `AllocationWeight` com precisão decimal determinística e projeção de posições a partir do ledger. A próxima necessidade é representar a política de alocação-alvo da carteira sem misturar configuração com posição atual, preço, gap ou recomendação de aporte.

A metodologia financeira define pesos-alvo como configuração versionável da carteira e descreve a alocação inicialmente em termos de classes. A taxonomia atual possui classes econômicas (`CASH`, `FIXED_INCOME`, `EQUITY`, `REAL_ESTATE`, `COMMODITY`, `CRYPTO_ASSET`, `MULTI_ASSET`), enquanto `InstrumentType` representa somente o veículo de investimento e não deve ser usado para inventar uma taxonomia de exposição.

## Decisão

### Configuração separada do agregado Portfolio

`TargetAllocation` é uma configuração imutável vinculada explicitamente a um `PortfolioId`. Ela não é armazenada como campo mutável dentro de `Portfolio` e não contém posição atual, saldo, preço ou valor de mercado.

Essa separação preserva o agregado `Portfolio` mínimo e permite que a política seja versionada/persistida futuramente sem transformar estado derivado em fonte de verdade.

### Bucket inicial por AssetClass

Cada bucket possui somente:

- `AssetClass` como identidade econômica;
- `AllocationWeight` como peso-alvo.

Nesta etapa, não existe bucket por `AssetId`, ticker, `InstrumentType`, setor, país, moeda ou provedor.

A escolha por `AssetClass` reutiliza a taxonomia econômica que o domínio já possui. Ela é deliberadamente mais simples do que exemplos de política que distinguem, por exemplo, ações Brasil de exposição global. Quando geografia, fator ou outra dimensão econômica se tornar necessária, a taxonomia de bucket deve evoluir explicitamente; `InstrumentType` não será sobrecarregado para representar exposição.

### Política de soma

Uma `TargetAllocation` é uma política completa e deve somar exatamente `100.0000%`.

A soma utiliza a representação exata de `Percentage`/`AllocationWeight`; nenhum `number` binário participa do cálculo financeiro.

A classe `CASH` pode receber peso quando a política desejar manter caixa como alvo. Portanto, não é necessário permitir soma parcial para representar reserva de liquidez.

### Peso zero

Um bucket presente deve possuir peso estritamente maior que zero.

Uma classe ausente equivale a alvo de `0%`. `targetWeightFor` materializa essa semântica devolvendo `AllocationWeight.zero()` para classes ausentes.

Isso mantém o snapshot canônico sem buckets semanticamente vazios e evita duas representações equivalentes para a mesma política.

### Duplicidade

Só pode existir um bucket por `AssetClass`. Duplicidades são verificadas após a normalização da classe e falham com erro de domínio tipado.

### Ordem e snapshot

Buckets são armazenados e serializados em ordem lexical pelo código de `AssetClass`. A ordem recebida na criação não possui significado financeiro.

`TargetAllocationSnapshot` contém somente `portfolioId`, código da classe e peso percentual canônico. O round-trip passa pelas mesmas invariantes da criação.

## Consequências positivas

- política pertence inequivocamente a uma carteira;
- pesos mantêm quatro casas decimais exatas e soma determinística;
- configuração incompleta ou acima de 100% não entra silenciosamente no domínio;
- classes duplicadas e buckets zero são rejeitados explicitamente;
- ausência de classe possui semântica única de peso zero;
- snapshots são estáveis independentemente da ordem de entrada;
- não há dependência de preço, holdings, mercado ou dados externos;
- `AllocationGap` pode consumir um contrato de alvo completo sem decidir como a política é representada.

## Trade-offs

- o modelo inicial não distingue exposições mais finas dentro da mesma `AssetClass`, como geografia ou fator;
- qualquer futura taxonomia multidimensional exigirá decisão e migração explícitas em vez de reinterpretar classes existentes;
- exigir soma exata de 100% impede políticas parciais por design; cenários que precisem de política parcial deverão introduzir um contrato diferente, não enfraquecer silenciosamente esta invariante;
- persistência e versionamento histórico da política continuam fora desta etapa.
