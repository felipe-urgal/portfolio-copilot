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
| D-014 | `AssetId` interno é estável e independente de ticker/provedor; `AssetClass` usa taxonomia econômica ampla | Aceita — ADR-0006 |

## Como alterar uma decisão

1. não apagar o histórico;
2. registrar nova decisão e motivo;
3. quando arquitetural, criar/superseder ADR;
4. atualizar documentos e tarefas afetadas;
5. adicionar migração quando houver impacto de dados.
