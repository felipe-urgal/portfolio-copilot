# Próxima Atividade — Portfolio Engine: Asset e AssetClass

**Status:** READY após merge dos tipos financeiros fundamentais.

## Objetivo

Criar a identidade mínima dos ativos que o Portfolio Engine usará sem acoplar o domínio a provedores de mercado, corretoras ou símbolos específicos de uma única bolsa.

## Escopo

- `AssetId` estável e independente de ticker/provedor;
- `AssetClass` explícita para as classes suportadas inicialmente;
- `Asset` com identidade, nome, classe e moeda de referência;
- identificadores de mercado opcionais e tipados quando necessários;
- regras para diferenciar identidade interna de ticker/símbolo negociado;
- invariantes e erros de domínio tipados;
- testes unitários abrangentes;
- documentação da taxonomia inicial e decisões de identidade.

## Fora de escopo

- preço de mercado;
- quantidade/posição;
- holdings;
- transações;
- Portfolio agregado;
- target allocation;
- APIs externas e adapters de market data;
- banco;
- UI;
- IA.

## Critérios de aceite

- identidade interna de um ativo não depende de ticker mutável;
- ativos de classes diferentes são representáveis sem campos artificiais obrigatórios;
- moeda de referência usa contrato compatível com os tipos financeiros já definidos;
- símbolos/identificadores externos não são tratados como chave primária do domínio;
- estados inválidos são rejeitados na criação;
- nenhum tipo depende de Next.js, banco ou fornecedor externo;
- `pnpm check` passa integralmente;
- decisões de taxonomia/identidade ficam registradas em documentação/ADR quando necessário.

## Casos de teste mínimos

- criação de ativo válido;
- ID vazio/inválido;
- nome vazio;
- classe inválida na fronteira;
- moeda inválida;
- ativo sem ticker quando a classe não exigir ticker;
- dois ativos com ticker semelhante continuam distintos por `AssetId`;
- normalização de identificadores externos quando houver regra explícita.
