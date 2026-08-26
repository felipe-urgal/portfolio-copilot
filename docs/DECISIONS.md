# Registro de Decisões

Este arquivo resume decisões. Decisões arquiteturais importantes também ganham ADR dedicado.

| ID | Decisão | Status |
|---|---|---|
| D-001 | Produto nasce como copiloto, não corretora | Aceita |
| D-002 | MVP não executa ordens | Aceita |
| D-003 | Monólito modular antes de microserviços | Aceita |
| D-004 | Motor financeiro determinístico; IA assistiva | Aceita |
| D-005 | Quality, Opportunity e Portfolio Fit são separados | Aceita |
| D-006 | Rebalanceamento prioriza novos aportes | Aceita |
| D-007 | RecommendationSnapshot é imutável | Aceita |
| D-008 | Dados materiais precisam de provenance e `asOf` | Aceita |
| D-009 | PostgreSQL é direção inicial de persistência | Proposta, validar na fundação técnica |
| D-010 | Web/PWA é direção inicial de interface | Proposta, validar na fundação técnica |
| D-011 | Produto público exige Regulatory Gate | Aceita |
| D-012 | Sem microaportes artificiais: o motor pode concentrar o aporte do mês em menos destinos para corrigir gaps | Aceita |
| D-013 | Valores financeiros fundamentais usam representação decimal inteira; `Money` não usa float e quantidade/preço terão tipos próprios | Aceita — ADR-0005 |
| D-014 | `AssetId` é independente de ticker/provedor e classe econômica (`AssetClass`) é separada do veículo (`InstrumentType`) | Aceita — ADR-0006 |
| D-015 | `Portfolio` guarda somente identidade/configuração; posições e saldos serão projeções do transaction ledger | Aceita — ADR-0007 |
| D-016 | Transaction Ledger registra fatos imutáveis; direção vem do tipo e quantidade usa 12 casas exatas sem arredondamento silencioso | Aceita — ADR-0008 |
| D-017 | Posições abertas são projeções puras do ledger; venda acima da posição falha e fatos com timestamp igual preservam a ordem de entrada | Aceita — ADR-0009 |
| D-018 | `TargetAllocation` é política completa por `AssetClass`: buckets positivos, sem duplicidade e soma exata de 100% | Aceita — ADR-0010 |
| D-019 | `AllocationGap` usa valores atuais reconciliados e maiores restos para converter pesos em centavos sem perder a soma monetária | Aceita — ADR-0011 |
| D-020 | `ContributionAllocator` calcula necessidades sobre `portfolioValue + contribution` e distribui o aporte proporcionalmente por maiores restos, preservando sobra explícita | Aceita — ADR-0012 |
| D-021 | Política de aporte limita destinos por maior necessidade pós-aporte e elimina alocações abaixo de um mínimo monetário, redistribuindo por maiores restos | Aceita — ADR-0013 |
| D-022 | Restrições de execução do aporte usam `AssetId`, elegibilidade explícita e `AssetQuantity` mínima; bloqueios retornam valor para caixa sem redistribuir a decisão econômica | Aceita — ADR-0014 |
| D-023 | Limites de concentração por `AssetClass` usam `softMaxWeight` como alerta e `hardMaxWeight` como teto obrigatório; valor bloqueado retorna para a sobra sem redistribuição | Aceita — ADR-0015 |

## Como alterar uma decisão

1. não apagar o histórico;
2. registrar nova decisão e motivo;
3. quando arquitetural, criar/superseder ADR;
4. atualizar documentos e tarefas afetadas;
5. adicionar migração quando houver impacto de dados.
