# Próxima Atividade — IA: copiloto explicável sobre dados estruturados e recomendações

**Status:** READY

## Issue canônica

- #45 — `IA: copiloto explicável sobre dados estruturados e recomendações`

## Objetivo

Adicionar uma camada de IA assistiva capaz de explicar carteira, teses, eventos e recomendações usando somente contexto estruturado/autorizado e conteúdo externo que já tenha passado pela fronteira segura da #44, sem permitir que o modelo altere regras financeiras determinísticas.

## Dependências concluídas após este PR

- #37 — ownership/persistência server-side;
- #41 — Investment Engine determinístico;
- #42 — Portfolio Fit e ranking explicável;
- #43 — InvestmentThesis e timeline auditável;
- #44 — ingestão segura de conteúdo externo com provenance, quarantine e dedupe.

## Escopo

- contrato de contexto estruturado para o modelo;
- explicações naturais a partir de `RecommendationSnapshot`/reason codes;
- resumo de resultados e eventos com citações/provenance;
- perguntas sobre carteira usando somente dados autorizados do usuário;
- distinção explícita entre fatos, cálculo determinístico e texto gerado por IA;
- fallback quando contexto for insuficiente;
- limites para não inventar preço, valuation ou fato ausente;
- logging seguro sem conteúdo financeiro desnecessário;
- versionamento de prompts/configuração;
- testes de integração e snapshots de comportamento.

## Fora de escopo

- permitir que IA decida alocação ou altere resultado do motor financeiro;
- promover conteúdo externo diretamente a fato canônico;
- execução de ordens ou ações financeiras;
- suíte completa de prompt injection, factualidade e alucinação da #46.

## Critérios de aceite

- IA não decide alocação nem substitui o motor financeiro;
- toda explicação material aponta para dados/reason codes/provenance subjacentes;
- respostas reconhecem ausência de dados em vez de inventar fatos;
- conteúdo `QUARANTINED` da #44 não entra como contexto normal;
- contexto de um usuário nunca é exposto a outro;
- `pnpm check` passa integralmente no head final.

## Referências canônicas

- issue #45;
- ADR-0027 — ingestão segura de conteúdo externo;
- `docs/AI-CONTENT-INGESTION.md`;
- `docs/SECURITY.md`;
- `docs/ROADMAP.md` — Fase 7.
