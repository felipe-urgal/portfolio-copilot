# ADR 0002 — Motor Financeiro Determinístico

- Status: Aceita
- Data: 2026-08-26

## Contexto

O produto poderá usar IA para texto e pesquisa, mas cálculos de dinheiro, risco, alocação e recomendação precisam ser reproduzíveis, auditáveis e testáveis.

## Decisão

LLMs não serão a fonte autoritativa de cálculos nem de regras. Engines recebem inputs estruturados e retornam outputs determinísticos e versionados.

IA pode resumir, classificar, extrair eventos e explicar outputs já calculados.

## Consequências

- testes unitários e backtesting são possíveis;
- erros podem ser reproduzidos;
- metodologia pode ser auditada;
- prompts não se tornam regra de negócio oculta;
- desenvolvimento inicial é mais trabalhoso, porém mais seguro.
