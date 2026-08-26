# Próxima Atividade — Fundação Técnica

**Status:** READY após merge da documentação de fundação.

## Objetivo

Criar o esqueleto técnico mínimo e profissional do Portfolio Copilot sem implementar ainda regras financeiras de produção.

## Contexto

A arquitetura e metodologia estão documentadas. O próximo passo é estabelecer uma base compilável, testável e segura sobre a qual o Portfolio Engine será construído.

## Escopo

- criar workspace/monorepo;
- criar `apps/web` como app web preparado para PWA futura;
- criar packages iniciais de domínio/shared;
- habilitar TypeScript strict;
- configurar lint e format;
- configurar framework de testes;
- adicionar scripts únicos de `lint`, `typecheck`, `test` e `build` na raiz;
- criar CI GitHub Actions executando os checks;
- criar `.env.example` sem segredos;
- criar `.gitignore` adequado;
- adicionar health page/rota mínima, sem dashboard de investimento;
- documentar como rodar localmente.

## Fora de escopo

- banco de dados;
- autenticação;
- Portfolio Engine;
- UI final;
- design system completo;
- API de preço;
- IA;
- deploy;
- recomendação financeira.

## Critérios de aceite

- clone limpo instala dependências com um único comando documentado;
- `lint` passa;
- `typecheck` passa;
- `test` passa;
- `build` passa;
- CI executa os mesmos checks;
- TypeScript está em modo strict;
- nenhum segredo commitado;
- estrutura respeita a decisão de monólito modular;
- README contém comandos locais atualizados.

## Testes esperados

- pelo menos um teste unitário simples no package de domínio/shared para validar a pipeline;
- pelo menos um smoke test apropriado para a aplicação, se o framework escolhido permitir sem complexidade excessiva.

## Segurança

- workflows com permissões mínimas;
- não imprimir environment em CI;
- dependências mínimas;
- nenhuma chave real em arquivos de exemplo.

## Entregáveis

- código base;
- CI;
- atualização do README;
- `DONE.md` e próximo `NEXT.md` preparados no final do PR.
