const action = process.argv[2] ?? "status";

if (action === "status") {
  console.log("Produção habilitada em modo git-managed pela Vercel.");
  console.log("production.enabled=true");
  console.log("provider=vercel");
  console.log("branch=main");
  process.exitCode = 0;
} else if (action === "deploy") {
  console.error("Deploy local não é suportado: produção é git-managed pela Vercel.");
  console.error("Use merge/push em main e depois prod:verify.");
  process.exitCode = 2;
} else {
  console.error(`Ação de produção desconhecida: ${action}`);
  process.exitCode = 2;
}
