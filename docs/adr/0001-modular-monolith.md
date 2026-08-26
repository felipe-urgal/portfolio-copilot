# ADR 0001 — Monólito Modular

- Status: Aceita
- Data: 2026-08-26

## Contexto

O produto terá múltiplos domínios, mas começa com uma equipe pequena e ainda está validando regras financeiras. Microserviços adicionariam deploys, rede, observabilidade e consistência distribuída sem benefício proporcional.

## Decisão

Começar como monólito modular com packages/módulos de domínio e dependências controladas.

## Consequências

Positivas:

- desenvolvimento e testes mais simples;
- transações locais;
- menor custo de operação;
- refactors de domínio mais baratos.

Negativas:

- disciplina arquitetural precisa ser aplicada no código;
- deploy inicial é conjunto.

## Gatilhos para reconsiderar

- carga/latência incompatível com escala vertical/horizontal do app;
- módulo com necessidade real de isolamento;
- ciclo de deploy independente necessário;
- equipe/ownership independente;
- requisito de segurança que justifique boundary físico.
