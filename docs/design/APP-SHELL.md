# AppShell canônico

## Status

Implementação do R3 da iniciativa #69, issue #75.

O `AppShell` é a composição visual compartilhada das superfícies protegidas atuais do Portfolio Copilot. Ele deriva da direção do Protótipo 3 e usa os tokens/primitives definidos no R2.

## Ownership

- `apps/web/src/components/app-shell.tsx` — boundary estrutural, skip link, `main` e container de conteúdo;
- `apps/web/src/components/app-shell-navigation.tsx` — navegação e única ilha client necessária ao drawer responsivo;
- `apps/web/src/components/app-shell.module.css` — anatomy/layout do shell;
- `apps/web/src/components/ui/` — primitives fundamentais; o shell não recria Button, Container ou focus ring.

## Rotas reais

A navegação primária contém somente capacidades existentes:

- `/dashboard` — Dashboard;
- `/portfolio` — Carteira;
- `/onboarding` — Onboarding.

`/health` permanece como utility operacional e `/sign-out` como affordance da sessão autenticada. O shell não cria placeholders para Assistant, relatórios, teses ou qualquer outra capacidade futura.

O affordance de `/health` no shell é deliberadamente neutro. O AppShell não consulta liveness/readiness e, portanto, não pode exibir cor ou badge que implique `healthy` antes da navegação. O estado operacional real é apresentado somente dentro da rota `/health`, onde existe uma fonte concreta para essa afirmação.

## Desktop

A partir de 961px:

- sidebar persistente;
- brand no topo;
- navegação principal no corpo;
- utility de health e sessão no rodapé;
- conteúdo principal usa o `Container` wide canônico;
- active route usa texto, fundo/borda e `aria-current="page"`, sem depender apenas de cor.

Entre 961px e 1100px a sidebar reduz largura/padding sem comprimir a navegação em um padrão diferente.

## Tablet e mobile

Até 960px:

- a sidebar desktop deixa de participar do layout;
- header compacto expõe brand + botão Menu;
- Menu abre um drawer modal;
- o drawer contém a mesma navegação/utility/sessão do desktop;
- backdrop e layering usam o contrato de z-index do R2;
- conteúdo deixa de reservar largura para sidebar.

Até 520px o label visual do botão Menu é ocultado mantendo o texto acessível no DOM.

As translucências específicas do shell são compostas a partir dos semantic color tokens do R2 com `color-mix`; o componente não introduz uma paleta paralela de cores literais.

## Keyboard, foco e touch targets

O drawer mantém o seguinte lifecycle:

1. abrir move foco para `Fechar`;
2. `Tab` e `Shift+Tab` permanecem dentro do drawer;
3. `Escape`, `Fechar` e clique no backdrop fecham o drawer e devolvem foco ao trigger;
4. navegar por um link fecha o drawer sem deslocar foco de volta antes da troca de rota;
5. ao cruzar para viewport desktop, o drawer fecha sem restauração artificial de foco;
6. enquanto aberto, o scroll do `body` é bloqueado e restaurado no cleanup.

Os botões Menu/Fechar usam a primitive `Button`; ela aceita `ref` para suportar focus management sem styling paralelo.

A brand navegável também respeita `--touch-target-min` (44px) em desktop e mobile. O R9 consolidou esse contrato para que a redução visual do glyph no header estreito não reduza a área interativa do link para o Dashboard.

## Landmarks, nomes acessíveis e skip navigation

Cada `AppShell` fornece:

- skip link `Pular para o conteúdo`;
- navegação de produto/sidebar;
- `nav` com label `Navegação principal`;
- um único `main#main-content` focável programaticamente;
- drawer com `role="dialog"`, `aria-modal="true"` e título associado.

Features inseridas dentro do shell não devem criar outro `main` nem um segundo chrome de navegação.

O link de conta deriva seu nome acessível do próprio conteúdo visível (`displayName` + `Sair da sessão`) em vez de sobrescrevê-lo com `aria-label`. Assim, a ação que aparece na tela permanece literalmente no nome acessível e futuras mudanças de copy não criam uma segunda fonte de verdade para label-in-name.

## Boundary server/client e privacidade

`AppShell` pode receber a identidade autenticada no boundary server da rota, mas a ilha client `AppShellNavigation` recebe somente `displayName`. `subject`, email, avatar e demais detalhes da identidade não atravessam esse boundary apenas para renderizar a navegação.

Essa redução de payload mantém o drawer interativo sem serializar dados de sessão que a UI client não utiliza.

## Integração atual

- Dashboard: shell no boundary da rota; `DashboardOverview` contém somente conteúdo da feature;
- Carteira: shell no boundary da rota;
- Onboarding: shell no boundary da rota e remoção do chrome paralelo anterior; o formulário/progresso continuam funcionalmente intactos para o redesign completo do R5 (#77);
- Auth: permanece fora do shell, conforme a arquitetura focused-auth do R1; será redesenhada no R4 (#76).

## Regras para consumidores

- não criar nova navegação global dentro de features;
- não recriar Button, Container, focus ring ou feedback fundamental no CSS do shell/feature;
- não adicionar rota ao shell antes da capacidade real existir;
- não representar health/success/stale no shell sem uma fonte real que sustente esse estado;
- preferir o nome acessível nativo derivado da copy visível quando o controle já contém label suficiente; não criar `aria-label` redundante que possa divergir;
- domínio, auth, ownership e persistência não pertencem ao `AppShell`;
- context rail do futuro Copiloto só entra quando houver capacidade funcional correspondente;
- mudanças responsivas precisam preservar o mesmo modelo de informação, não criar uma navegação alternativa.

## Validação

O R3/R9 possui testes para:

- rotas reais e active route;
- ausência de rotas fictícias;
- utility de health visualmente neutra enquanto o shell não consulta estado operacional;
- skip link e landmarks;
- trigger mobile fechado por padrão;
- contexto de conta sem exposição do subject interno e com nome acessível derivado de `displayName` + `Sair da sessão` visíveis;
- contratos CSS de sidebar/drawer/reduced motion;
- touch target canônico da brand e dos controles de navegação mobile;
- onboarding sem shell paralelo.

O CI canônico continua responsável por format, lint, typecheck, migrations, fallback de `.env.local`, tests e build.
