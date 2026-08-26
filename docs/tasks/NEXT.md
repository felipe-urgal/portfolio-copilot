# Próxima Atividade — Portfolio Engine: Portfolio agregado mínimo

**Status:** READY após merge de Asset e AssetClass.

## Objetivo

Criar a identidade e os invariantes mínimos de `Portfolio` sem antecipar holdings, transações, preços ou algoritmo de alocação. O agregado deve ser uma raiz estável para os próximos componentes do Portfolio Engine.

## Escopo

- `PortfolioId` interno e estável;
- `Portfolio` com identidade, nome e moeda de referência/consolidação;
- regras explícitas de criação e normalização;
- erros de domínio tipados;
- snapshot persistível mínimo quando houver decisão clara de contrato;
- testes unitários abrangentes;
- documentação das fronteiras do agregado e de sua relação futura com ledger/holdings.

## Fora de escopo

- usuário/autenticação/ownership;
- holdings e posições;
- transações e ledger;
- saldo de caixa;
- preço de mercado e FX;
- target allocation;
- allocation gap;
- algoritmo de aporte/rebalanceamento;
- banco e repositórios;
- API;
- UI;
- IA.

## Critérios de aceite

- identidade do portfolio não depende de nome, usuário ou infraestrutura;
- nome inválido é rejeitado na fronteira do domínio;
- moeda de referência reutiliza `CurrencyCode`;
- o agregado não guarda posições derivadas nem duplica responsabilidades do futuro transaction ledger;
- nenhum tipo depende de Next.js, banco ou fornecedor externo;
- `pnpm check` passa integralmente;
- decisões arquiteturais relevantes ficam registradas em documentação/ADR.

## Casos de teste mínimos

- criação de portfolio válido;
- ID vazio/inválido;
- nome vazio, somente espaços, excessivamente longo ou com caracteres de controle;
- moeda inválida;
- normalização de ID/nome/moeda quando aplicável;
- dois portfolios com mesmo nome permanecem entidades distintas por ID;
- fronteira pública do pacote exporta os novos tipos sem acoplamento à infraestrutura.
