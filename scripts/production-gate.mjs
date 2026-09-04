const action = process.argv[2] ?? "status";

if (action === "status") {
  console.log("Produção habilitada em modo git-managed pela Vercel.");
  console.log("production.enabled=true");
  console.log("provider=vercel");
  console.log("branch=main");
  process.exitCode = 0;
} else {
  console.error(`Ação de produção desconhecida: ${action}`);
  process.exitCode = 2;
}
