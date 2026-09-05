const action = process.argv[2] ?? "status";

if (action === "status") {
  console.log("Produção habilitada em modo git-managed com promoção orquestrada pelo Dev Dashboard.");
  console.log("production.enabled=true");
  console.log("provider=vercel");
  console.log("branch=main");
  console.log("git.deploymentEnabled=false");
  console.log("promotion=provider-deploy");
  process.exitCode = 0;
} else if (action === "deploy") {
  console.error(
    "Deploy local não é suportado: a promoção é orquestrada pelo Dev Dashboard via provider-deploy; deployments Git automáticos da Vercel estão desabilitados neste repositório.",
  );
  process.exitCode = 2;
} else {
  console.error(`Ação de produção desconhecida: ${action}`);
  process.exitCode = 2;
}
