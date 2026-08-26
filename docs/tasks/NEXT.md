# Próxima Atividade — Produto MVP: dashboard base com estados honestos

**Status:** READY após merge do fluxo web de onboarding financeiro.

## Objetivo

Criar a primeira superfície de dashboard do MVP em `apps/web` como um shell de produto navegável e responsivo, apresentando somente informações que realmente existem no estado disponível e usando estados vazios explícitos para capacidades ainda não implementadas.

## Escopo

- criar rota/tela principal de dashboard no app web;
- estabelecer shell visual reutilizável para as próximas superfícies do MVP, sem transformar o onboarding em dashboard;
- apresentar claramente o estado de configuração disponível e os próximos passos do usuário;
- quando um dado de carteira, aporte, objetivo ou reserva ainda não estiver disponível, usar estado vazio/CTA explícito em vez de valor fictício;
- preparar regiões/componentes para resumo de carteira, aporte do mês e objetivos sem acoplar fórmulas financeiras à UI;
- manter navegação simples entre dashboard, onboarding e rotas já existentes;
- preservar acessibilidade, foco, semântica e responsividade desktop/mobile;
- adicionar testes para estrutura, estados vazios, navegação e copy crítica;
- reutilizar contratos/tipos existentes quando houver dado real; não criar um segundo modelo financeiro na camada web.

## Fora de escopo

- inventar patrimônio, rentabilidade, alocação, preço ou qualquer métrica demonstrativa como se fosse dado real;
- carteira/holdings completos;
- cadastro de transações;
- cálculo do aporte do mês;
- persistência de perfil ou carteira;
- autenticação/autorização;
- Market Data, preço, FX ou benchmarks;
- transformação automática de tolerância/horizonte em `TargetAllocation`;
- recomendação de ativos;
- suitability regulatório;
- IA.

## Critérios de aceite

- dashboard possui hierarquia clara e funciona como superfície principal do MVP;
- nenhum card ou métrica apresenta número financeiro inventado;
- dados indisponíveis aparecem como estados vazios acionáveis e semanticamente corretos;
- onboarding permanece acessível como ação/configuração, sem duplicar seu formulário dentro do dashboard;
- shell e componentes são reutilizáveis pelos próximos verticais de carteira/transações/aporte;
- layout funciona em desktop e mobile sem overflow ou conteúdo crítico cortado;
- navegação e controles principais possuem foco visível e labels adequados;
- testes cobrem estrutura do dashboard, estados vazios, navegação e ausência de métricas fake;
- nenhuma nova fórmula financeira, persistência, API ou integração externa é introduzida;
- `pnpm check` passa integralmente no head final validado.

## Referências canônicas

- `docs/ROADMAP.md` — Fase 3: onboarding financeiro básico -> dashboard -> carteira;
- `docs/PRODUCT.md` — jornada principal do produto;
- `docs/ARCHITECTURE.md` — separação entre domínio determinístico e camada de apresentação.
