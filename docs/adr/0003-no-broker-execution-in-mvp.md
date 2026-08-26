# ADR 0003 — Sem Execução de Ordens no MVP

- Status: Aceita
- Data: 2026-08-26

## Contexto

Enviar ordens amplia drasticamente risco operacional, segurança, integração e questões regulatórias.

## Decisão

O MVP gera plano de aporte e explicação. O usuário executa a operação externamente e depois registra/importa a transação.

Não armazenar credenciais de corretora.

## Consequências

- superfície de ataque menor;
- produto pode validar metodologia antes de integração crítica;
- experiência possui uma etapa manual;
- futura execução exige projeto e gate próprios, não simples feature toggle.
