# R3 AppShell — notas de implementação

Este arquivo existe como registro curto do PR da #75. A especificação operacional canônica está em `docs/design/APP-SHELL.md`.

## Resultado

- um único AppShell para Dashboard, Carteira e Onboarding;
- sidebar persistente em desktop;
- header + drawer em tablet/mobile;
- rotas somente para capacidades reais;
- health como utility e sessão no rodapé;
- skip link e um único `main` por superfície protegida;
- focus trap, Escape, retorno ao trigger e bloqueio de scroll no drawer;
- onboarding sem shell visual paralelo;
- botões do drawer reutilizam `Button` do R2, incluindo `ref` para focus management;
- focused auth permanece fora do shell para o R4.

## Fora do R3

O R3 não redesenha o conteúdo interno de auth, onboarding, dashboard ou carteira. Essas migrações pertencem respectivamente a #76, #77, #78 e #79.
