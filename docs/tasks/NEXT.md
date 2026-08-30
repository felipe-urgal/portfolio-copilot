# Próxima Atividade — IA: ingestão segura de notícias, documentos e resultados

**Status:** READY

## Issue canônica

- #44 — `IA: ingestão segura de notícias, documentos e resultados`

## Objetivo

Criar uma pipeline segura para conteúdo textual externo usado pela futura camada de IA, preservando provenance e temporalidade e garantindo que texto ingerido seja sempre tratado como dado não confiável, nunca como instrução do sistema.

## Dependências concluídas após este PR

- #39 — Asset Master canônico e resolução de identidade;
- #40 — Market Data com provenance, freshness e quality gates;
- #41 — scoring/valuation determinístico com metodologias versionadas;
- #42 — Portfolio Fit e ranking explicável por carteira;
- #43 — InvestmentThesis versionada, eventos e timeline auditável.

## Escopo

- adapters para fontes permitidas;
- normalização de texto e metadata;
- provenance e `asOf`;
- deduplicação de notícias/eventos;
- classificação por ativo/tese/evento;
- separação rígida entre conteúdo externo e instruções;
- sanitização e limites de tamanho;
- proteção inicial contra prompt injection em conteúdo ingerido;
- armazenamento/auditoria dos documentos relevantes;
- testes com payloads adversariais;
- política de retenção e fontes permitidas.

## Fora de escopo

- permitir que conteúdo externo altere regras determinísticas do Portfolio/Investment Engine;
- usar texto ingerido como fato canônico sem validação/provenance;
- copiloto conversacional completo da #45;
- avaliação completa de factualidade/alucinação da #46;
- execução automática de ordens.

## Critérios de aceite

- conteúdo externo nunca redefine regras do sistema;
- toda saída derivada consegue apontar para suas fontes;
- duplicatas e conteúdo stale são identificáveis;
- falhas de parser/classificação não viram fatos silenciosamente;
- payloads adversariais possuem testes de regressão;
- `pnpm check` passa integralmente no head final.

## Referências canônicas

- issue #44;
- ADR-0026 — InvestmentThesis versionada e timeline auditável;
- `docs/INVESTMENT-THESIS-LIFECYCLE.md`;
- `docs/SECURITY.md`;
- `docs/ROADMAP.md` — Fase 7.
