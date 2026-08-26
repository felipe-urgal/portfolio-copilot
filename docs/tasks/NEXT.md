# Próxima Atividade — Portfolio Engine: tipos financeiros fundamentais

**Status:** READY após merge da fundação técnica.

## Objetivo

Criar os value objects e invariantes mínimos que permitirão representar dinheiro, percentuais e pesos de alocação sem erros de ponto flutuante ou estados inválidos.

## Escopo

- `Money` com moeda explícita e representação segura;
- `Percentage`;
- `AllocationWeight` restrito ao intervalo válido;
- operações mínimas de soma/subtração/comparação necessárias ao motor;
- política explícita de arredondamento;
- erros de domínio tipados;
- testes unitários abrangentes;
- property-based tests para invariantes quando a dependência escolhida for justificada;
- documentação das decisões de precisão/arredondamento.

## Fora de escopo

- Portfolio completo;
- holdings/transações;
- alocação por classes;
- algoritmo de aporte;
- banco;
- API;
- UI financeira;
- preço de mercado;
- IA.

## Critérios de aceite

- valores monetários persistíveis não dependem de `float` binário;
- moedas incompatíveis não podem ser somadas silenciosamente;
- pesos inválidos são rejeitados na fronteira do domínio;
- arredondamento tem comportamento determinístico e testado;
- nenhum tipo financeiro depende de Next.js ou infraestrutura;
- `pnpm check` passa integralmente;
- documentação e ADR são atualizados se a representação escolhida criar trade-off arquitetural.

## Casos de teste mínimos

- zero e valores positivos;
- valores negativos somente onde semanticamente permitido;
- moedas diferentes;
- percentuais 0%, 100% e fora da faixa;
- precisão e arredondamento em centavos;
- soma repetida sem drift de ponto flutuante.
